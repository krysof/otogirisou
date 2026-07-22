"use strict";

(() => {
  const HEADER_BYTES = 16;
  const RECORD_BYTES = 20;
  const MAX_ENCODED_SHARDS = 8;
  const MAX_DECODED_SHARDS = 3;
  const SOURCE_START_LEAD_SEC = 0.025;
  const NAME_VOICE_TIMEOUT_MS = 6000;

  window.createOtogirisouVoicePlayer = (build, getAudioContext,
                                        onComplete = () => {}) => {
    const indexes = new Map();
    const shards = new Map();
    const decodedShards = new Map();
    const queue = [];
    let language = "ja";
    let generation = 0;
    let draining = false;
    let activeSource = null;
    let activeResolve = null;
    let activeCompletionToken = null;
    let gainNode = null;
    let enabled = true;
    const nameVoice = typeof window.createOtogirisouNameVoice === "function"
      ? window.createOtogirisouNameVoice(build, getAudioContext) : null;

    const loadIndex = async (selected) => {
      if (!indexes.has(selected)) {
        const request = (async () => {
          const response = await fetch(
              `assets/voices/${selected}/index.bin?v=${encodeURIComponent(build)}`);
          if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`${selected} voice index failed: HTTP ${response.status}`);
          }
          const bytes = await response.arrayBuffer();
          const view = new DataView(bytes);
          const version = view.getUint16(4, true);
          if (bytes.byteLength < HEADER_BYTES || view.getUint32(0, false) !== 0x4f544756 ||
              (version !== 1 && version !== 2) ||
              view.getUint16(6, true) !== RECORD_BYTES)
            throw new Error(`${selected} voice index header is invalid`);
          const count = view.getUint32(8, true);
          const shardCount = view.getUint32(12, true);
          if (HEADER_BYTES + count * RECORD_BYTES !== bytes.byteLength)
            throw new Error(`${selected} voice index size is invalid`);
          const records = new Map();
          for (let index = 0; index < count; ++index) {
            const at = HEADER_BYTES + index * RECORD_BYTES;
            const startBit = view.getUint32(at, true);
            const shard = view.getUint32(at + 4, true);
            const offset = view.getUint32(at + 8, true);
            const length = view.getUint32(at + 12, true);
            if (shard >= shardCount || !length || records.has(startBit))
              throw new Error(`${selected} voice record ${index} is invalid`);
            records.set(startBit, { shard, offset, length, timed: version === 2 });
          }
          return { records, shardCount };
        })().catch(error => {
          indexes.delete(selected);
          throw error;
        });
        indexes.set(selected, request);
      }
      return indexes.get(selected);
    };

    const loadShard = async (selected, record) => {
      const key = `${selected}/${record.shard}`;
      if (shards.has(key)) {
        const cached = shards.get(key);
        shards.delete(key);
        shards.set(key, cached);
      }
      if (!shards.has(key)) {
        const request = (async () => {
          const name = `pack-${String(record.shard).padStart(3, "0")}.bin`;
          const response = await fetch(
              `assets/voices/${selected}/${name}?v=${encodeURIComponent(build)}`);
          if (!response.ok)
            throw new Error(`${selected} voice shard failed: HTTP ${response.status}`);
          return response.arrayBuffer();
        })().catch(error => {
          shards.delete(key);
          throw error;
        });
        while (shards.size >= MAX_ENCODED_SHARDS)
          shards.delete(shards.keys().next().value);
        shards.set(key, request);
      }
      const shard = await shards.get(key);
      return { key, shard };
    };

    const loadClip = async (selected, record) => {
      const { shard } = await loadShard(selected, record);
      if (record.offset > shard.byteLength ||
          record.length > shard.byteLength - record.offset)
        throw new Error(`${selected} voice clip is outside its shard`);
      return shard.slice(record.offset, record.offset + record.length);
    };

    const loadBuffer = async (selected, record, audio) => {
      if (record.timed) {
        const { key, shard } = await loadShard(selected, record);
        if (decodedShards.has(key)) {
          const cached = decodedShards.get(key);
          decodedShards.delete(key);
          decodedShards.set(key, cached);
        }
        if (!decodedShards.has(key)) {
          const decoding = audio.decodeAudioData(shard.slice(0)).catch(error => {
            decodedShards.delete(key);
            throw error;
          });
          while (decodedShards.size >= MAX_DECODED_SHARDS)
            decodedShards.delete(decodedShards.keys().next().value);
          decodedShards.set(key, decoding);
        }
        return decodedShards.get(key);
      }
      return audio.decodeAudioData(await loadClip(selected, record));
    };

    const playName = async () => {
      if (!nameVoice) return true;
      let timer = null;
      try {
        return await Promise.race([
          nameVoice.play(),
          new Promise(resolve => {
            timer = setTimeout(() => {
              nameVoice.stop();
              resolve(false);
            }, NAME_VOICE_TIMEOUT_MS);
          }),
        ]);
      } catch (error) {
        console.warn("name voice playback failed", error);
        nameVoice.stop();
        return false;
      } finally {
        if (timer !== null) clearTimeout(timer);
      }
    };

    const drain = async () => {
      if (draining) return;
      draining = true;
      while (queue.length) {
        const item = queue.shift();
        if (!enabled) {
          if (item.completionToken !== null && item.completionToken !== undefined)
            onComplete(item.completionToken);
          continue;
        }
        if (item.generation !== generation || item.language !== language) continue;
        try {
          if (item.name) {
            activeCompletionToken = item.completionToken;
            await playName();
            activeCompletionToken = null;
            if (item.generation === generation)
              onComplete(item.completionToken);
            continue;
          }
          const index = await loadIndex(item.language);
          const record = index?.records.get(item.startBit);
          if (!record || item.generation !== generation) {
            if (index && item.startBit !== 0xFFFFFFFF &&
                item.generation === generation)
              onComplete(item.completionToken);
            continue;
          }
          const audio = getAudioContext();
          if (audio.state && audio.state !== "running" && audio.resume)
            await audio.resume();
          const buffer = await loadBuffer(item.language, record, audio);
          if (item.generation !== generation) continue;
          if (!gainNode) {
            gainNode = audio.createGain();
            gainNode.gain.value = 1;
            gainNode.connect(audio.destination);
          }
          let completed = false;
          activeCompletionToken = item.completionToken;
          await new Promise((resolve) => {
            const source = audio.createBufferSource();
            activeSource = source;
            source.buffer = buffer;
            source.connect(gainNode);
            source.onended = () => {
              completed = true;
              if (activeSource === source) activeSource = null;
              activeCompletionToken = null;
              activeResolve = null;
              resolve();
            };
            activeResolve = resolve;
            const startAt = Number.isFinite(audio.currentTime)
              ? audio.currentTime + SOURCE_START_LEAD_SEC : 0;
            if (record.timed) {
              const offset = record.offset + record.length * item.rangeStart;
              const duration = record.length *
                  (item.rangeEnd - item.rangeStart);
              source.start(startAt, offset / 1000, duration / 1000);
            } else if (item.rangeStart !== 0 || item.rangeEnd !== 1) {
              source.start(startAt, buffer.duration * item.rangeStart,
                           buffer.duration * (item.rangeEnd - item.rangeStart));
            } else {
              source.start(startAt);
            }
          });
          activeCompletionToken = null;
          if (completed && item.generation === generation)
            onComplete(item.completionToken);
        } catch (error) {
          activeCompletionToken = null;
          console.warn("voice playback failed", error);
        }
      }
      draining = false;
    };

    const stop = () => {
      ++generation;
      queue.length = 0;
      activeCompletionToken = null;
      nameVoice?.stop();
      if (activeSource) {
        const source = activeSource;
        activeSource = null;
        source.onended = null;
        try { source.stop(); } catch (_) {}
        activeResolve?.();
        activeResolve = null;
      }
    };

    const setEnabled = (value) => {
      const next = Boolean(value);
      if (next === enabled) return;
      if (next) {
        enabled = true;
        return;
      }
      enabled = false;
      ++generation;
      nameVoice?.stop();
      const activeToken = activeCompletionToken;
      activeCompletionToken = null;
      if (activeToken !== null && activeToken !== undefined)
        onComplete(activeToken);
      for (const item of queue) {
        if (item.completionToken !== null && item.completionToken !== undefined)
          onComplete(item.completionToken);
      }
      queue.length = 0;
      if (activeSource) {
        const source = activeSource;
        activeSource = null;
        source.onended = null;
        try { source.stop(); } catch (_) {}
        activeResolve?.();
        activeResolve = null;
      }
    };

    const preload = (startBit) => {
      if (!enabled) return;
      const selected = language;
      const current = generation;
      void loadIndex(selected).then(index => {
        const record = index?.records.get(startBit);
        if (!record || selected !== language || current !== generation) return null;
        return loadBuffer(selected, record, getAudioContext());
      }).catch(error => console.warn("voice preload failed", error));
    };

    return {
      setLanguage(selected) {
        if (selected !== language) {
          stop();
          language = selected;
          nameVoice?.setLanguage(selected);
        }
        void loadIndex(selected).then(index => {
          if (selected !== language || !index) return;
          const firstStart = index.records.keys().next().value;
          if (firstStart !== undefined) preload(firstStart);
        }).catch(error => console.warn("voice pack unavailable", error));
      },
      setName(value) {
        nameVoice?.setName(value);
      },
      setEnabled,
      preload,
      enqueue(startBit, rangeStart = 0, rangeEnd = 1,
              completionToken = startBit) {
        const from = Math.max(0, Math.min(1, Number(rangeStart)));
        const to = Math.max(from, Math.min(1, Number(rangeEnd)));
        if (to <= from) return;
        queue.push({
          startBit, rangeStart: from, rangeEnd: to, completionToken,
          language, generation,
        });
        void drain();
      },
      enqueueName(completionToken) {
        queue.push({
          name: true, completionToken, language, generation,
        });
        void drain();
      },
      stop,
    };
  };
})();
