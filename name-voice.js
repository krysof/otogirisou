"use strict";

(() => {
  const CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
  const GEC_VERSION = "1-143.0.3650.75";
  const CACHE_NAME = "otogirisou-name-voice-v1";
  const SOURCE_START_LEAD_SEC = 0.025;
  const EDGE_VOICES = Object.freeze({
    ja: "en-US-AvaMultilingualNeural",
    "zh-Hant": "zh-TW-HsiaoYuNeural",
    yue: "zh-HK-HiuMaanNeural",
    en: "en-US-AvaNeural",
    ko: "en-US-AvaMultilingualNeural",
    "zh-Hans": "zh-CN-XiaoyiNeural",
  });
  const LANGUAGE_TAGS = Object.freeze({
    ja: "ja-JP",
    "zh-Hant": "zh-TW",
    yue: "zh-HK",
    en: "en-US",
    ko: "ko-KR",
    "zh-Hans": "zh-CN",
  });
  const SYSTEM_VOICE_TIMEOUT_MS = 5000;

  const connectionId = () => {
    if (typeof crypto.randomUUID === "function")
      return crypto.randomUUID().replaceAll("-", "");
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map(value => value.toString(16).padStart(2, "0")).join("");
  };

  const timestamp = () => {
    const date = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const part = value => String(value).padStart(2, "0");
    return `${days[date.getUTCDay()]} ${months[date.getUTCMonth()]} ` +
      `${part(date.getUTCDate())} ${date.getUTCFullYear()} ` +
      `${part(date.getUTCHours())}:${part(date.getUTCMinutes())}:` +
      `${part(date.getUTCSeconds())} GMT+0000 (Coordinated Universal Time)`;
  };

  const gec = async () => {
    let ticks = Date.now() / 1000 + 11644473600;
    ticks -= ticks % 300;
    ticks *= 10000000;
    const input = new TextEncoder().encode(
      `${Math.round(ticks)}${CLIENT_TOKEN}`);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
    return [...digest].map(value => value.toString(16).padStart(2, "0"))
      .join("").toUpperCase();
  };

  const escapeXml = text => text.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]);

  const synthesizeEdge = async (text, voice) => {
    const url = "wss://speech.platform.bing.com/consumer/speech/" +
      "synthesize/readaloud/edge/v1" +
      `?TrustedClientToken=${CLIENT_TOKEN}` +
      `&ConnectionId=${connectionId()}` +
      `&Sec-MS-GEC=${await gec()}` +
      `&Sec-MS-GEC-Version=${encodeURIComponent(GEC_VERSION)}`;
    return new Promise((resolve, reject) => {
      const socket = new window.WebSocket(url);
      const chunks = [];
      let settled = false;
      const finish = (error = null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { socket.close(); } catch (_) {}
        if (error) reject(error);
        else if (!chunks.length) reject(new Error("Edge TTS returned no audio"));
        else resolve(new Blob(chunks, { type: "audio/mpeg" }));
      };
      const timer = setTimeout(() => finish(new Error("Edge TTS timed out")), 12000);
      socket.binaryType = "arraybuffer";
      socket.addEventListener("error", () =>
        finish(new Error("Edge TTS connection failed")));
      socket.addEventListener("close", () => {
        if (!settled) finish(chunks.length ? null : new Error("Edge TTS closed"));
      });
      socket.addEventListener("open", () => {
        const now = timestamp();
        socket.send(`X-Timestamp:${now}\r\n` +
          "Content-Type:application/json; charset=utf-8\r\n" +
          "Path:speech.config\r\n\r\n" +
          '{"context":{"synthesis":{"audio":{"metadataoptions":{' +
          '"sentenceBoundaryEnabled":"false",' +
          '"wordBoundaryEnabled":"false"},' +
          '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n');
        const ssml = "<speak version='1.0' " +
          "xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
          `<voice name='${voice}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>` +
          `${escapeXml(text)}</prosody></voice></speak>`;
        socket.send(`X-RequestId:${connectionId()}\r\n` +
          "Content-Type:application/ssml+xml\r\n" +
          `X-Timestamp:${now}Z\r\nPath:ssml\r\n\r\n${ssml}`);
      });
      socket.addEventListener("message", event => {
        if (typeof event.data === "string") {
          if (event.data.includes("Path:turn.end")) finish();
          return;
        }
        const bytes = new Uint8Array(event.data);
        if (bytes.length < 2) return;
        const headerLength = new DataView(bytes.buffer, bytes.byteOffset, 2)
          .getUint16(0, false);
        const bodyStart = 2 + headerLength;
        if (bodyStart > bytes.length) return;
        const header = new TextDecoder().decode(bytes.subarray(2, bodyStart));
        if (header.includes("Path:audio") &&
            header.includes("Content-Type:audio/mpeg") && bodyStart < bytes.length)
          chunks.push(bytes.slice(bodyStart));
      });
    });
  };

  window.createOtogirisouNameVoice = (build, getAudioContext) => {
    let language = "ja";
    let name = "";
    let revision = 0;
    let prepared = Promise.resolve(null);
    let activeSource = null;
    let activeResolve = null;
    let activeUtterance = null;
    const decoded = new Map();
    const edgeSupported = typeof window.WebSocket === "function";

    const cacheRequest = (selected, voice, value) => new Request(
      new URL(`__name_voice__/${encodeURIComponent(build)}/` +
        `${encodeURIComponent(selected)}/${encodeURIComponent(voice)}/` +
        `${encodeURIComponent(value)}.mp3`, document.baseURI));

    const prepare = () => {
      const selected = language;
      const value = name;
      const current = ++revision;
      if (!value || !edgeSupported) {
        prepared = Promise.resolve(null);
        return prepared;
      }
      const voice = EDGE_VOICES[selected] || EDGE_VOICES.en;
      prepared = (async () => {
        const request = cacheRequest(selected, voice, value);
        let response = null;
        if (window.caches) {
          const cache = await caches.open(CACHE_NAME);
          response = await cache.match(request);
          if (!response) {
            const blob = await synthesizeEdge(value, voice);
            response = new Response(blob, { headers: { "Content-Type": "audio/mpeg" } });
            await cache.put(request, response.clone());
          }
        }
        const blob = response ? await response.blob() : await synthesizeEdge(value, voice);
        if (current !== revision) return null;
        const key = `${selected}:${value}`;
        const audio = getAudioContext();
        if (!decoded.has(key))
          decoded.set(key, audio.decodeAudioData(await blob.arrayBuffer()));
        const buffer = await decoded.get(key);
        if (current !== revision) return null;
        return { audio, buffer };
      })().catch(error => {
        console.warn("Edge name voice unavailable; using system speech", error);
        return null;
      });
      return prepared;
    };

    const systemVoice = selected => {
      const tag = LANGUAGE_TAGS[selected] || LANGUAGE_TAGS.en;
      const voices = window.speechSynthesis?.getVoices?.() || [];
      return voices.find(voice => voice.lang === tag && /Microsoft/i.test(voice.name)) ||
        voices.find(voice => voice.lang === tag) ||
        voices.find(voice => voice.lang?.startsWith(tag.split("-")[0])) || null;
    };

    const playSystem = (selected, value) => new Promise(resolve => {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        resolve(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(value);
      utterance.lang = LANGUAGE_TAGS[selected] || LANGUAGE_TAGS.en;
      utterance.voice = systemVoice(selected);
      utterance.rate = 1;
      utterance.pitch = 1;
      let settled = false;
      const finish = result => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (activeUtterance === utterance) activeUtterance = null;
        activeResolve = null;
        resolve(result);
      };
      const timeout = setTimeout(() => {
        try { speechSynthesis.cancel(); } catch (_) {}
        finish(false);
      }, SYSTEM_VOICE_TIMEOUT_MS);
      utterance.onend = () => finish(true);
      utterance.onerror = () => finish(false);
      activeUtterance = utterance;
      activeResolve = () => finish(false);
      try { speechSynthesis.speak(utterance); }
      catch (_) { finish(false); }
    });

    const play = async () => {
      const selected = language;
      const value = name;
      const current = revision;
      if (!value) return true;
      const item = await prepared;
      if (current !== revision || selected !== language || value !== name) return false;
      if (!item) return playSystem(selected, value);
      const { audio, buffer } = item;
      if (audio.state && audio.state !== "running" && audio.resume)
        await audio.resume();
      if (current !== revision) return false;
      return new Promise(resolve => {
        const source = audio.createBufferSource();
        activeSource = source;
        source.buffer = buffer;
        source.connect(audio.destination);
        source.onended = () => {
          if (activeSource === source) activeSource = null;
          activeResolve = null;
          resolve(true);
        };
        activeResolve = resolve;
        const startAt = Number.isFinite(audio.currentTime)
          ? audio.currentTime + SOURCE_START_LEAD_SEC : 0;
        source.start(startAt);
      });
    };

    const stop = () => {
      ++revision;
      if (activeSource) {
        const source = activeSource;
        activeSource = null;
        source.onended = null;
        try { source.stop(); } catch (_) {}
      }
      if (activeUtterance && window.speechSynthesis) {
        activeUtterance = null;
        speechSynthesis.cancel();
      }
      activeResolve?.(false);
      activeResolve = null;
    };

    return {
      setLanguage(selected) {
        if (selected === language) return;
        stop();
        language = selected;
        void prepare();
      },
      setName(value) {
        const normalized = String(value || "").normalize("NFC").trim();
        if (normalized === name) return;
        stop();
        name = normalized;
        void prepare();
      },
      play,
      stop,
    };
  };
})();
