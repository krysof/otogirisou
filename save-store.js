"use strict";

(() => {
  const DATABASE_NAME = "otogirisou-wasm-saves-v1";
  const STORE_NAME = "slots";
  const SLOT_COUNT = 100;

  const requestResult = request => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("save database request failed"));
  });

  class OtogirisouSaveStore {
    constructor(indexedDB = window.indexedDB) {
      if (!indexedDB) throw new Error("IndexedDB is unavailable");
      this.indexedDB = indexedDB;
      this.databasePromise = null;
    }

    open() {
      if (!this.databasePromise) {
        this.databasePromise = new Promise((resolve, reject) => {
          const request = this.indexedDB.open(DATABASE_NAME, 1);
          request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME))
              request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(
              request.error || new Error("save database could not be opened"));
          request.onblocked = () => reject(new Error("save database upgrade was blocked"));
        });
      }
      return this.databasePromise;
    }

    validate(slot) {
      if (!Number.isInteger(slot) || slot < 1 || slot > SLOT_COUNT)
        throw new RangeError(`save slot must be between 1 and ${SLOT_COUNT}`);
    }

    id(slot) {
      this.validate(slot);
      return slot;
    }

    async get(slot) {
      const database = await this.open();
      const transaction = database.transaction(STORE_NAME, "readonly");
      return requestResult(transaction.objectStore(STORE_NAME).get(this.id(slot)));
    }

    async list() {
      const database = await this.open();
      const transaction = database.transaction(STORE_NAME, "readonly");
      const records = await requestResult(transaction.objectStore(STORE_NAME).getAll());
      return records
        .filter(record => Number.isInteger(record.slot) &&
            record.slot >= 1 && record.slot <= SLOT_COUNT)
        .sort((left, right) => left.slot - right.slot);
    }

    async put(record) {
      if (!record || typeof record !== "object")
        throw new TypeError("save record is required");
      this.validate(record.slot);
      if (typeof record.language !== "string" || record.language.length === 0)
        throw new TypeError("save language is required");
      if (!(record.data instanceof ArrayBuffer) && !ArrayBuffer.isView(record.data))
        throw new TypeError("save record data must be binary");
      const data = record.data instanceof ArrayBuffer
        ? record.data.slice(0)
        : record.data.buffer.slice(
            record.data.byteOffset, record.data.byteOffset + record.data.byteLength);
      const stored = {
        ...record,
        id: this.id(record.slot),
        data,
      };
      const database = await this.open();
      const transaction = database.transaction(STORE_NAME, "readwrite");
      await requestResult(transaction.objectStore(STORE_NAME).put(stored));
      return stored;
    }
  }

  window.OTOGIRISOU_SAVE_SLOT_COUNT = SLOT_COUNT;
  window.OtogirisouSaveStore = OtogirisouSaveStore;
  window.createOtogirisouSaveStore = indexedDB =>
    new OtogirisouSaveStore(indexedDB || window.indexedDB);
})();
