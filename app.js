"use strict";

(() => {
  const GAME_VERSION = document.querySelector('meta[name="game-version"]')?.content || "dev";
  const TRANSLATION_PREVIEW =
    document.querySelector('meta[name="translation-preview"]')?.content === "true";
  const BUILD = GAME_VERSION;
  const LEGACY_SAVE_KEY = "otogirisou-wasm-save-v3";
  const SAVE_MIGRATION_KEY = "otogirisou-wasm-save-slots-migrated-v1";
  const PROGRESS_KEY = "otogirisou-wasm-progress-v1";
  const HISTORY_KEY = "otogirisou-wasm-history-v1";
  const LANGUAGE_KEY = "otogirisou-language-v1";
  const VOICE_LANGUAGE_KEY = "otogirisou-voice-language-v1";
  const MUSIC_ENABLED_KEY = "otogirisou-music-enabled-v1";
  const VOICE_ENABLED_KEY = "otogirisou-voice-enabled-v1";
  const LANGUAGE_CODES = Object.freeze([
    "auto", "ja", "zh-Hant", "yue", "en", "ko", "zh-Hans",
  ]);
  const AUTO_LABELS = Object.freeze({
    ja: "自動", "zh-Hant": "自動", yue: "自動",
    en: "Auto", ko: "자동", "zh-Hans": "自动",
  });
  const LANGUAGE_NAMES = Object.freeze({
    ja: "日本語", "zh-Hant": "繁體中文", yue: "粵語",
    en: "English", ko: "한국어", "zh-Hans": "简体中文",
  });
  const LANGUAGE_CONTROL_UI = Object.freeze({
    ja: { text: "字幕", voice: "音声" },
    "zh-Hant": { text: "字幕", voice: "語音" },
    yue: { text: "字幕", voice: "語音" },
    en: { text: "Text", voice: "Voice" },
    ko: { text: "자막", voice: "음성" },
    "zh-Hans": { text: "字幕", voice: "语音" },
  });
  const LOADING_LABELS = Object.freeze({
    ja: "読み込み中", "zh-Hant": "載入中", yue: "載入中",
    en: "Loading", ko: "불러오는 중", "zh-Hans": "加载中",
  });
  const AUDIO_UI = Object.freeze({
    ja: { music: "音楽", voice: "音声", on: "オン", off: "オフ" },
    "zh-Hant": { music: "音樂", voice: "語音", on: "開", off: "關" },
    yue: { music: "音樂", voice: "語音", on: "開", off: "關" },
    en: { music: "Music", voice: "Voice", on: "On", off: "Off" },
    ko: { music: "음악", voice: "음성", on: "켜짐", off: "꺼짐" },
    "zh-Hans": { music: "音乐", voice: "语音", on: "开", off: "关" },
  });
  const NAME_UI = Object.freeze({
    ja: { title: "名前", cancel: "取消", confirm: "決定", empty: "名前を入力してください", long: "名前は6文字までです", unsupported: "この文字は使用できません" },
    "zh-Hant": { title: "輸入名字", cancel: "取消", confirm: "確定", empty: "請輸入名字", long: "名字最多6個字", unsupported: "目前字庫不支援其中一個字" },
    yue: { title: "輸入名字", cancel: "取消", confirm: "確定", empty: "請輸入名字", long: "名字最多6個字", unsupported: "目前字庫唔支援其中一個字" },
    en: { title: "Enter name", cancel: "Cancel", confirm: "OK", empty: "Enter a name", long: "Names can contain up to 6 characters", unsupported: "One of these characters is not available in this font" },
    ko: { title: "이름 입력", cancel: "취소", confirm: "확인", empty: "이름을 입력하세요", long: "이름은 6자까지 입력할 수 있습니다", unsupported: "글꼴에서 지원하지 않는 문자가 있습니다" },
    "zh-Hans": { title: "输入名字", cancel: "取消", confirm: "确定", empty: "请输入名字", long: "名字最多6个字", unsupported: "当前字库不支持其中一个字" },
  });
  const SAVE_UI = Object.freeze({
    ja: { load: "ロード", save: "セーブ", cancel: "取消", confirm: "決定", loadTitle: "ロード", saveTitle: "セーブ", summary: "100スロット · {used}件保存済み", slot: "スロット {slot}", empty: "空き", savedAt: "保存 {time}", timeUnknown: "保存日時不明", loadConfirmTitle: "ロードしますか？", loadConfirm: "スロット {slot} の進行状況をロードします。現在の進行状況は失われます。", saveConfirmTitle: "セーブしますか？", saveConfirm: "現在の進行状況をスロット {slot} に保存します。", overwriteTitle: "上書きしますか？", overwrite: "スロット {slot} のデータを上書きします。", close: "戻る", saved: "スロット {slot} に保存しました", loaded: "スロット {slot} をロードしました", storyOnly: "ストーリー中のみセーブできます", failed: "セーブデータを利用できません", invalid: "このセーブデータは読み込めません" },
    "zh-Hant": { load: "讀檔", save: "存檔", cancel: "取消", confirm: "確定", loadTitle: "讀取存檔", saveTitle: "儲存進度", summary: "100 個存檔位 · 已使用 {used} 個", slot: "存檔 {slot}", empty: "空白存檔位", savedAt: "儲存於 {time}", timeUnknown: "存檔時間不明", loadConfirmTitle: "讀取這個存檔？", loadConfirm: "將讀取存檔 {slot}，目前進度會消失。", saveConfirmTitle: "儲存目前進度？", saveConfirm: "將目前進度儲存至存檔 {slot}。", overwriteTitle: "覆蓋存檔？", overwrite: "將覆蓋存檔 {slot} 的現有進度。", close: "返回", saved: "已儲存至存檔 {slot}", loaded: "已讀取存檔 {slot}", storyOnly: "只能在故事進行中存檔", failed: "無法使用存檔資料庫", invalid: "無法讀取這個存檔" },
    yue: { load: "讀檔", save: "存檔", cancel: "取消", confirm: "確定", loadTitle: "讀取存檔", saveTitle: "儲存進度", summary: "100 個存檔位 · 已用 {used} 個", slot: "存檔 {slot}", empty: "空白存檔位", savedAt: "儲存於 {time}", timeUnknown: "存檔時間不明", loadConfirmTitle: "讀呢個存檔？", loadConfirm: "會讀取存檔 {slot}，而家嘅進度會消失。", saveConfirmTitle: "儲存目前進度？", saveConfirm: "會將目前進度儲存去存檔 {slot}。", overwriteTitle: "覆蓋存檔？", overwrite: "會覆蓋存檔 {slot} 嘅現有進度。", close: "返回", saved: "已儲存去存檔 {slot}", loaded: "已讀取存檔 {slot}", storyOnly: "只可以喺故事進行期間存檔", failed: "用唔到存檔資料庫", invalid: "讀唔到呢個存檔" },
    en: { load: "Load", save: "Save", cancel: "Cancel", confirm: "Confirm", loadTitle: "Load game", saveTitle: "Save game", summary: "100 slots · {used} used", slot: "Slot {slot}", empty: "Empty slot", savedAt: "Saved {time}", timeUnknown: "Save time unknown", loadConfirmTitle: "Load this save?", loadConfirm: "Slot {slot} will be loaded. Current progress will be lost.", saveConfirmTitle: "Save current progress?", saveConfirm: "Current progress will be saved to slot {slot}.", overwriteTitle: "Overwrite save?", overwrite: "The existing data in slot {slot} will be replaced.", close: "Back", saved: "Saved to slot {slot}", loaded: "Loaded slot {slot}", storyOnly: "You can only save during the story", failed: "Save storage is unavailable", invalid: "This save could not be loaded" },
    ko: { load: "불러오기", save: "저장", cancel: "취소", confirm: "확인", loadTitle: "불러오기", saveTitle: "저장", summary: "슬롯 100개 · {used}개 사용", slot: "슬롯 {slot}", empty: "빈 슬롯", savedAt: "저장 {time}", timeUnknown: "저장 시간 알 수 없음", loadConfirmTitle: "이 저장을 불러올까요?", loadConfirm: "슬롯 {slot}을 불러옵니다. 현재 진행은 사라집니다.", saveConfirmTitle: "현재 진행을 저장할까요?", saveConfirm: "현재 진행을 슬롯 {slot}에 저장합니다.", overwriteTitle: "덮어쓸까요?", overwrite: "슬롯 {slot}의 기존 데이터를 덮어씁니다.", close: "돌아가기", saved: "슬롯 {slot}에 저장했습니다", loaded: "슬롯 {slot}을 불러왔습니다", storyOnly: "이야기 진행 중에만 저장할 수 있습니다", failed: "저장소를 사용할 수 없습니다", invalid: "이 저장 데이터를 불러올 수 없습니다" },
    "zh-Hans": { load: "读档", save: "存档", cancel: "取消", confirm: "确定", loadTitle: "读取存档", saveTitle: "保存进度", summary: "100 个存档位 · 已使用 {used} 个", slot: "存档 {slot}", empty: "空白存档位", savedAt: "保存于 {time}", timeUnknown: "存档时间未知", loadConfirmTitle: "确认读取存档？", loadConfirm: "将读取存档 {slot}，当前进度会丢失。", saveConfirmTitle: "确认保存进度？", saveConfirm: "将当前进度保存到存档 {slot}。", overwriteTitle: "覆盖存档？", overwrite: "将覆盖存档 {slot} 的现有进度。", close: "返回", saved: "已保存至存档 {slot}", loaded: "已读取存档 {slot}", storyOnly: "只能在故事进行中存档", failed: "无法使用存档数据库", invalid: "无法读取这个存档" },
  });
  const RESOURCE_BINS = Object.freeze([
    // Load the very large graphics container last so the WASM vector grows
    // once instead of temporarily requiring two graphics-sized allocations.
    "system.bin", "scenario.bin", "font.bin", "audio.bin",
    "video.bin", "speech.bin", "graphics.bin",
  ]);
  const INPUT = Object.freeze({
    a: 1 << 0, b: 1 << 1, x: 1 << 2, y: 1 << 3,
    l: 1 << 4, r: 1 << 5, select: 1 << 6, start: 1 << 7,
    up: 1 << 8, down: 1 << 9, left: 1 << 10, right: 1 << 11,
    confirm: (1 << 0) | (1 << 7),
    cancel: (1 << 1) | (1 << 6),
  });
  const KEY_INPUT = new Map([
    ["ArrowUp", INPUT.up], ["ArrowDown", INPUT.down],
    ["ArrowLeft", INPUT.left], ["ArrowRight", INPUT.right],
    ["KeyZ", INPUT.cancel], ["KeyX", INPUT.confirm],
    ["Enter", INPUT.confirm], ["Space", INPUT.confirm],
  ]);

  const status = document.querySelector("#status");
  const canvas = document.querySelector("#screen");
  const textCanvas = document.querySelector("#text-screen");
  const endingVideo = document.querySelector("#ending-video");
  const launchConfirm = document.querySelector("#launch-confirm");
  const launchButton = document.querySelector("#launch-button");
  const launchPreview = document.querySelector("#launch-preview");
  const languagePicker = document.querySelector("#language-picker");
  const languageButton = document.querySelector("#language-button");
  const languageButtonLabel = document.querySelector("#language-button-label");
  const languageMenu = document.querySelector("#language-menu");
  const autoLanguageLabel = document.querySelector("#auto-language-label");
  const voiceLanguagePicker = document.querySelector("#voice-language-picker");
  const voiceLanguageButton = document.querySelector("#voice-language-button");
  const voiceLanguageButtonLabel = document.querySelector("#voice-language-button-label");
  const voiceLanguageMenu = document.querySelector("#voice-language-menu");
  const voiceAutoLanguageLabel = document.querySelector("#voice-auto-language-label");
  const musicToggle = document.querySelector("#music-toggle");
  const voiceToggle = document.querySelector("#voice-toggle");
  const musicToggleLabel = document.querySelector("#music-toggle-label");
  const voiceToggleLabel = document.querySelector("#voice-toggle-label");
  const languageOptions = [...document.querySelectorAll("[data-language]")];
  const voiceLanguageOptions = [
    ...document.querySelectorAll("[data-voice-language]"),
  ];
  const nameInputOverlay = document.querySelector("#name-input-overlay");
  const nameInputForm = document.querySelector("#name-input-form");
  const nameInputTitle = document.querySelector("#name-input-title");
  const nameInput = document.querySelector("#name-input");
  const nameInputError = document.querySelector("#name-input-error");
  const nameInputCancel = document.querySelector("#name-input-cancel");
  const nameInputConfirm = document.querySelector("#name-input-confirm");
  const loadButton = document.querySelector("#load-button");
  const saveButton = document.querySelector("#save-button");
  const cancelButtonLabel = document.querySelector("#cancel-button-label");
  const confirmButtonLabel = document.querySelector("#confirm-button-label");
  const saveOverlay = document.querySelector("#save-overlay");
  const saveDialogTitle = document.querySelector("#save-dialog-title");
  const saveDialogSummary = document.querySelector("#save-dialog-summary");
  const saveDialogClose = document.querySelector("#save-dialog-close");
  const saveDialogMessage = document.querySelector("#save-dialog-message");
  const saveSlotList = document.querySelector("#save-slot-list");
  const overwriteConfirm = document.querySelector("#overwrite-confirm");
  const overwriteTitle = document.querySelector("#overwrite-title");
  const overwriteMessage = document.querySelector("#overwrite-message");
  const overwriteCancel = document.querySelector("#overwrite-cancel");
  const overwriteConfirmButton = document.querySelector("#overwrite-confirm-button");
  const inputButtons = [...document.querySelectorAll("[data-input]")];
  let context = null;
  let hdRenderer = null;
  let hdTextRenderer = null;
  const pointerInputs = new Map();
  const keyboardInputs = new Set();
  let keyboardMask = 0;
  let pointerMask = 0;
  let latchedMask = 0;
  let activeModule = null;
  let audioContext = null;
  let nativeAudioSink = null;
  let nativeAudioSinkPromise = null;
  let nativeAudioCopyPointer = 0;
  let voicePlayer = null;
  const pendingSpeechSegments = [];
  let speechRevision = 0;
  let nextSpeechPageToken = 0;
  let activeSpeechPageToken = null;
  let pendingVoiceAdvance = null;
  let paintedSpeechPageKey = null;
  let queuedSpeechPageKey = null;
  let endingStarted = false;
  let endingMovieUrls = new Map();
  const localeBytesCache = new Map();
  let languageSwitchSerial = 0;
  let launchConfirmed = false;
  let wakeLock = null;
  let wakeLockPending = false;
  let nameInputSceneSeen = false;
  let runtimeLanguage = "ja";
  let saveDialogMode = null;
  let saveDialogRecords = new Map();
  let saveDialogSerial = 0;
  let pendingOverwriteSlot = 0;
  let pendingSaveAction = null;
  let savePreviewUrls = [];
  let saveStoreReady = false;
  let captureGamePreview = async () => null;
  let saveStore = null;
  if (typeof window.createOtogirisouSaveStore === "function") {
    try { saveStore = window.createOtogirisouSaveStore(); }
    catch (error) { console.warn("save database is unavailable", error); }
  }
  let resolveLaunch = null;
  const launchPromise = new Promise((resolve) => { resolveLaunch = resolve; });
  launchPreview.textContent = TRANSLATION_PREVIEW
    ? "TRANSLATION PREVIEW · 未完成处显示日文" : "";
  launchPreview.hidden = !TRANSLATION_PREVIEW;
  loadButton.disabled = true;
  saveButton.disabled = true;

  const syncVisualViewport = () => {
    const viewport = window.visualViewport;
    const width = viewport?.width || window.innerWidth;
    const height = viewport?.height || window.innerHeight;
    const left = viewport?.offsetLeft || 0;
    const top = viewport?.offsetTop || 0;
    const style = document.documentElement.style;
    if (!style?.setProperty) return;
    style.setProperty("--otg-viewport-width", `${width}px`);
    style.setProperty("--otg-viewport-height", `${height}px`);
    style.setProperty("--otg-viewport-center-x", `${left + width / 2}px`);
    style.setProperty("--otg-viewport-center-y", `${top + height / 2}px`);
  };
  syncVisualViewport();
  window.addEventListener("resize", syncVisualViewport);
  window.addEventListener("orientationchange", syncVisualViewport);
  window.visualViewport?.addEventListener("resize", syncVisualViewport);
  window.visualViewport?.addEventListener("scroll", syncVisualViewport);

  const normalizeBrowserLanguage = (language) => {
    const value = String(language || "").replace(/_/g, "-");
    const lower = value.toLowerCase();
    if (lower === "yue" || lower.startsWith("yue-") ||
        lower === "zh-hk" || lower.startsWith("zh-hk-") ||
        lower === "zh-mo" || lower.startsWith("zh-mo-"))
      return "yue";
    if (lower === "zh-hant" || lower.startsWith("zh-hant-") ||
        lower === "zh-tw" || lower.startsWith("zh-tw-"))
      return "zh-Hant";
    if (lower === "zh" || lower.startsWith("zh-hans") ||
        lower.startsWith("zh-cn") || lower.startsWith("zh-sg"))
      return "zh-Hans";
    if (lower === "ja" || lower.startsWith("ja-")) return "ja";
    if (lower === "ko" || lower.startsWith("ko-")) return "ko";
    if (lower === "en" || lower.startsWith("en-")) return "en";
    return null;
  };

  const detectLanguage = () => {
    const reported = window.navigator?.languages?.length
      ? window.navigator.languages
      : [window.navigator?.language];
    for (const language of reported) {
      const matched = normalizeBrowserLanguage(language);
      if (matched) return matched;
    }
    return "en";
  };

  const storedLanguage = localStorage.getItem(LANGUAGE_KEY);
  let languageSelection = LANGUAGE_CODES.includes(storedLanguage)
    ? storedLanguage : "auto";
  let effectiveLanguage = languageSelection === "auto"
    ? detectLanguage() : languageSelection;
  const storedVoiceLanguage = localStorage.getItem(VOICE_LANGUAGE_KEY);
  let voiceLanguageSelection = LANGUAGE_CODES.includes(storedVoiceLanguage)
    ? storedVoiceLanguage : languageSelection;
  let effectiveVoiceLanguage = voiceLanguageSelection === "auto"
    ? detectLanguage() : voiceLanguageSelection;
  let musicEnabled = localStorage.getItem(MUSIC_ENABLED_KEY) !== "0";
  let voiceEnabled = localStorage.getItem(VOICE_ENABLED_KEY) !== "0";

  const closeLanguageMenu = (restoreFocus = false) => {
    if (languageMenu.hidden) return;
    languageMenu.hidden = true;
    languagePicker.classList.remove("open");
    languageButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) languageButton.focus({ preventScroll: true });
  };

  const closeVoiceLanguageMenu = (restoreFocus = false) => {
    if (voiceLanguageMenu.hidden) return;
    voiceLanguageMenu.hidden = true;
    voiceLanguagePicker.classList.remove("open");
    voiceLanguageButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) voiceLanguageButton.focus({ preventScroll: true });
  };

  const languageMenuOpen = () =>
    !languageMenu.hidden || !voiceLanguageMenu.hidden;

  const applyAudioUI = () => {
    if (!musicToggle || !voiceToggle) return;
    const copy = AUDIO_UI[effectiveLanguage] || AUDIO_UI.en;
    const update = (button, label, name, enabled) => {
      const state = enabled ? copy.on : copy.off;
      button.setAttribute("aria-checked", String(enabled));
      button.setAttribute("aria-pressed", String(enabled));
      button.dataset.enabled = String(enabled);
      const title = `${name}: ${state}`;
      button.setAttribute("aria-label", title);
      button.title = title;
      if (label) label.textContent = title;
    };
    update(musicToggle, musicToggleLabel, copy.music, musicEnabled);
    update(voiceToggle, voiceToggleLabel, copy.voice, voiceEnabled);
  };

  const applyLanguageUI = () => {
    effectiveLanguage = languageSelection === "auto"
      ? detectLanguage() : languageSelection;
    effectiveVoiceLanguage = voiceLanguageSelection === "auto"
      ? detectLanguage() : voiceLanguageSelection;
    document.documentElement.lang = effectiveLanguage;
    autoLanguageLabel.textContent = AUTO_LABELS[effectiveLanguage];
    voiceAutoLanguageLabel.textContent = AUTO_LABELS[effectiveLanguage];
    const controls = LANGUAGE_CONTROL_UI[effectiveLanguage] || LANGUAGE_CONTROL_UI.en;
    const selectedName = languageSelection === "auto"
      ? `${AUTO_LABELS[effectiveLanguage]} (${LANGUAGE_NAMES[effectiveLanguage]})`
      : LANGUAGE_NAMES[effectiveLanguage];
    const textTitle = `${controls.text}: ${selectedName}`;
    languageButton.setAttribute("aria-label", textTitle);
    languageButton.title = textTitle;
    languageButtonLabel.textContent = textTitle;
    for (const option of languageOptions)
      option.setAttribute("aria-checked", String(option.dataset.language === languageSelection));
    const selectedVoiceName = voiceLanguageSelection === "auto"
      ? `${AUTO_LABELS[effectiveLanguage]} (${LANGUAGE_NAMES[effectiveVoiceLanguage]})`
      : LANGUAGE_NAMES[effectiveVoiceLanguage];
    const voiceTitle = `${controls.voice}: ${selectedVoiceName}`;
    voiceLanguageButton.setAttribute("aria-label", voiceTitle);
    voiceLanguageButton.title = voiceTitle;
    voiceLanguageButtonLabel.textContent = voiceTitle;
    for (const option of voiceLanguageOptions)
      option.setAttribute("aria-checked", String(
          option.dataset.voiceLanguage === voiceLanguageSelection));
    const copy = NAME_UI[effectiveLanguage];
    nameInputTitle.textContent = copy.title;
    nameInputCancel.textContent = copy.cancel;
    nameInputConfirm.textContent = copy.confirm;
    const saveCopy = SAVE_UI[effectiveLanguage] || SAVE_UI.en;
    loadButton.textContent = saveCopy.load;
    saveButton.textContent = saveCopy.save;
    cancelButtonLabel.textContent = saveCopy.cancel;
    confirmButtonLabel.textContent = saveCopy.confirm;
    saveDialogClose.textContent = saveCopy.close;
    saveDialogClose.setAttribute("aria-label", saveCopy.close);
    saveDialogClose.title = saveCopy.close;
    overwriteCancel.textContent = saveCopy.cancel;
    overwriteConfirmButton.textContent = saveCopy.confirm;
    overwriteTitle.textContent = saveCopy.overwriteTitle;
    if (saveDialogMode)
      saveDialogTitle.textContent = saveDialogMode === "load"
        ? saveCopy.loadTitle : saveCopy.saveTitle;
    applyAudioUI();
  };

  const fetchLocaleBytes = async (language) => {
    if (language === "ja") return null;
    if (!localeBytesCache.has(language)) {
      localeBytesCache.set(language, (async () => {
        const response = await fetch(
            `assets/locales/${language}/locale.bin?v=${BUILD}`,
            { cache: "no-cache" });
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`${language} locale request failed: HTTP ${response.status}`);
        }
        return new Uint8Array(await response.arrayBuffer());
      })());
    }
    return localeBytesCache.get(language);
  };

  const switchRuntimeLanguage = async () => {
    if (!activeModule) return;
    cancelCurrentSpeech();
    const serial = ++languageSwitchSerial;
    const requested = effectiveLanguage;
    status.textContent = `${LANGUAGE_NAMES[requested]} loading...`;
    status.classList.remove("quiet", "error");
    try {
      const data = await fetchLocaleBytes(requested);
      if (serial !== languageSwitchSerial) return;
      let pointer = 0;
      if (data) {
        pointer = activeModule._malloc(data.byteLength);
        activeModule.HEAPU8.set(data, pointer);
      }
      const result = activeModule._otg_set_locale_data(pointer, data?.byteLength || 0);
      if (pointer) activeModule._free(pointer);
      if (result !== 0)
        throw new Error(`${requested} locale validation failed (${result})`);
      runtimeLanguage = data || requested === "ja" ? requested : "ja";
      voicePlayer?.setName(currentPlayerName(activeModule));
      if (typeof window.createOtogirisouTextRenderer === "function" && textCanvas) {
        const renderer = await window.createOtogirisouTextRenderer(
            textCanvas, runtimeLanguage, BUILD);
        if (serial !== languageSwitchSerial) {
          renderer.clear();
          return;
        }
        hdTextRenderer?.clear?.();
        hdTextRenderer = renderer;
      }
      nameInput.lang = runtimeLanguage;
      status.textContent = LANGUAGE_NAMES[runtimeLanguage];
      window.setTimeout(() => status.classList.add("quiet"), 1200);
    } catch (error) {
      console.warn("language switch failed", error);
      status.textContent = String(error?.message || error);
      status.classList.add("error");
    }
  };

  const selectLanguage = (selection) => {
    if (!LANGUAGE_CODES.includes(selection)) return;
    languageSelection = selection;
    localStorage.setItem(LANGUAGE_KEY, selection);
    applyLanguageUI();
    closeLanguageMenu(true);
    void switchRuntimeLanguage();
  };

  const selectVoiceLanguage = (selection) => {
    if (!LANGUAGE_CODES.includes(selection)) return;
    const previousLanguage = effectiveVoiceLanguage;
    voiceLanguageSelection = selection;
    localStorage.setItem(VOICE_LANGUAGE_KEY, selection);
    applyLanguageUI();
    closeVoiceLanguageMenu(true);
    if (effectiveVoiceLanguage === previousLanguage) return;
    voicePlayer?.setLanguage(effectiveVoiceLanguage);
    voicePlayer?.setName(currentPlayerName(activeModule));
    for (const segment of pendingSpeechSegments)
      segment.playedEnd = segment.glyphStart;
    ++speechRevision;
    activeSpeechPageToken = null;
    pendingVoiceAdvance = null;
    paintedSpeechPageKey = null;
    queuedSpeechPageKey = null;
  };

  languageButton.addEventListener("click", (event) => {
    event.preventDefault();
    const opening = languageMenu.hidden;
    closeVoiceLanguageMenu();
    languageMenu.hidden = !opening;
    languagePicker.classList.toggle("open", opening);
    languageButton.setAttribute("aria-expanded", String(opening));
    if (opening) {
      const selected = languageOptions.find(option =>
        option.dataset.language === languageSelection);
      selected?.focus({ preventScroll: true });
    }
  });
  for (const option of languageOptions) {
    option.addEventListener("click", () => selectLanguage(option.dataset.language));
  }
  voiceLanguageButton.addEventListener("click", (event) => {
    event.preventDefault();
    const opening = voiceLanguageMenu.hidden;
    closeLanguageMenu();
    voiceLanguageMenu.hidden = !opening;
    voiceLanguagePicker.classList.toggle("open", opening);
    voiceLanguageButton.setAttribute("aria-expanded", String(opening));
    if (opening) {
      const selected = voiceLanguageOptions.find(option =>
        option.dataset.voiceLanguage === voiceLanguageSelection);
      selected?.focus({ preventScroll: true });
    }
  });
  for (const option of voiceLanguageOptions) {
    option.addEventListener("click", () =>
      selectVoiceLanguage(option.dataset.voiceLanguage));
  }
  musicToggle?.addEventListener("click", () => {
    musicEnabled = !musicEnabled;
    localStorage.setItem(MUSIC_ENABLED_KEY, musicEnabled ? "1" : "0");
    activeModule?._otg_set_music_enabled?.(musicEnabled ? 1 : 0);
    applyAudioUI();
  });
  voiceToggle?.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    localStorage.setItem(VOICE_ENABLED_KEY, voiceEnabled ? "1" : "0");
    voicePlayer?.setEnabled?.(voiceEnabled);
    applyAudioUI();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!languageMenu.hidden && !languagePicker.contains(event.target))
      closeLanguageMenu();
    if (!voiceLanguageMenu.hidden && !voiceLanguagePicker.contains(event.target))
      closeVoiceLanguageMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (!saveOverlay.hidden) {
      if (event.key === "Escape" || event.code === "KeyZ") {
        event.preventDefault();
        if (!overwriteConfirm.hidden) closeOverwrite();
        else closeSaveDialog();
      } else if (event.code === "KeyX" &&
                 document.activeElement instanceof HTMLElement) {
        event.preventDefault();
        document.activeElement.click();
      } else if (overwriteConfirm.hidden &&
                 ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
                  "Home", "End"].includes(event.key)) {
        const count = window.OTOGIRISOU_SAVE_SLOT_COUNT || 100;
        const current = Number.parseInt(document.activeElement?.dataset?.slot || "1", 10);
        let next = current;
        if (event.key === "Home") next = 1;
        else if (event.key === "End") next = count;
        else next += ["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1;
        next = Math.max(1, Math.min(count, next));
        const direction = next < current ? -1 : 1;
        let target = saveSlotList.querySelector(`[data-slot="${next}"]`);
        while (target?.disabled && next > 1 && next < count) {
          next += direction;
          target = saveSlotList.querySelector(`[data-slot="${next}"]`);
        }
        if (target && !target.disabled) {
          event.preventDefault();
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: "nearest" });
        }
      }
      return;
    }
    if (!languageMenuOpen()) return;
    const activeMenuIsVoice = !voiceLanguageMenu.hidden;
    const activeOptions = activeMenuIsVoice
      ? voiceLanguageOptions : languageOptions;
    if (event.key === "Escape") {
      event.preventDefault();
      if (activeMenuIsVoice) closeVoiceLanguageMenu(true);
      else closeLanguageMenu(true);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const current = activeOptions.indexOf(document.activeElement);
    const delta = event.key === "ArrowDown" ? 1 : -1;
    const next = (current + delta + activeOptions.length) % activeOptions.length;
    activeOptions[next].focus({ preventScroll: true });
  });
  applyLanguageUI();

  const hideNameInput = () => {
    nameInputOverlay.hidden = true;
    nameInputError.hidden = true;
    nameInputError.textContent = "";
  };

  const showNameInput = () => {
    keyboardInputs.clear();
    pointerInputs.clear();
    keyboardMask = pointerMask = latchedMask = 0;
    refreshButtons();
    nameInput.value = "";
    nameInput.lang = runtimeLanguage;
    nameInputError.hidden = true;
    nameInputOverlay.hidden = false;
    window.setTimeout(() => nameInput.focus({ preventScroll: true }), 0);
  };

  const syncNameInput = (module) => {
    const isNameScene = module._otg_scene() === 2;
    if (!isNameScene) {
      nameInputSceneSeen = false;
      hideNameInput();
      return;
    }
    if (runtimeLanguage === "ja" ||
        module._otg_native_name_input_available?.() !== 1)
      return;
    if (!nameInputSceneSeen) {
      nameInputSceneSeen = true;
      showNameInput();
    }
  };

  const currentPlayerName = module => {
    if (!module?._otg_name_length || !module._otg_name_codepoint) return "";
    return Array.from({ length: module._otg_name_length() }, (_, index) =>
      String.fromCodePoint(module._otg_name_codepoint(index))).join("");
  };

  nameInputForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void enableAudio();
    if (!activeModule) return;
    const copy = NAME_UI[runtimeLanguage] || NAME_UI.en;
    const value = nameInput.value.normalize("NFC").trim();
    const characters = Array.from(value);
    if (characters.length === 0 || characters.length > 6) {
      nameInputError.textContent = characters.length === 0 ? copy.empty : copy.long;
      nameInputError.hidden = false;
      return;
    }
    const codepoints = Uint32Array.from(characters, character => character.codePointAt(0));
    const pointer = activeModule._malloc(codepoints.byteLength);
    activeModule.HEAPU8.set(new Uint8Array(codepoints.buffer), pointer);
    const result = activeModule._otg_set_name_utf32(pointer, codepoints.length);
    activeModule._free(pointer);
    if (result !== 0) {
      nameInputError.textContent = copy.unsupported;
      nameInputError.hidden = false;
      return;
    }
    voicePlayer?.setName(value);
    hideNameInput();
  });

  nameInputCancel.addEventListener("click", () => {
    activeModule?._otg_cancel_name_input?.();
    hideNameInput();
  });

  const ensureAudioContext = () => {
    if (!audioContext)
      audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
    return audioContext;
  };

  const createNativeAudioSink = async () => {
    const audio = ensureAudioContext();
    if (audio.audioWorklet && window.AudioWorkletNode) {
      await audio.audioWorklet.addModule(`audio-worklet.js?v=${BUILD}`);
      const node = new window.AudioWorkletNode(audio, "otogirisou-pcm", {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      node.connect(audio.destination);
      return {
        push(pcm) {
          node.port.postMessage({ type: "pcm", buffer: pcm.buffer }, [pcm.buffer]);
        },
        reset() { node.port.postMessage({ type: "reset" }); },
      };
    }

    // AudioWorklet is present on current mobile browsers.  Keep a native
    // AudioBuffer fallback for older WebKit instead of silently losing sound.
    let nextTime = 0;
    const sources = new Set();
    return {
      push(pcm) {
        const frames = pcm.length >> 1;
        if (!frames) return;
        const buffer = audio.createBuffer(2, frames, 32040);
        const left = buffer.getChannelData(0);
        const right = buffer.getChannelData(1);
        for (let frame = 0; frame < frames; ++frame) {
          left[frame] = pcm[frame * 2];
          right[frame] = pcm[frame * 2 + 1];
        }
        const sourceNode = audio.createBufferSource();
        sourceNode.buffer = buffer;
        sourceNode.connect(audio.destination);
        nextTime = Math.max(nextTime, audio.currentTime + 0.012);
        sourceNode.start(nextTime);
        nextTime += frames / 32040;
        sources.add(sourceNode);
        sourceNode.onended = () => sources.delete(sourceNode);
      },
      reset() {
        nextTime = 0;
        for (const sourceNode of sources) {
          try { sourceNode.stop(); } catch (_) {}
        }
        sources.clear();
      },
    };
  };

  const ensureNativeAudioSink = () => {
    if (!nativeAudioSinkPromise) {
      nativeAudioSinkPromise = createNativeAudioSink().then(sink => {
        nativeAudioSink = sink;
        return sink;
      }).catch(error => {
        console.warn("native PCM output unavailable", error);
        nativeAudioSink = null;
        return null;
      });
    }
    return nativeAudioSinkPromise;
  };

  const enableAudio = async () => {
    ensureAudioContext();
    void ensureNativeAudioSink();
    await audioContext.resume();
    if (!endingVideo.hidden && endingVideo.paused) {
      try { await endingVideo.play(); } catch (_) { /* next gesture retries */ }
    }
  };

  const requestWakeLock = async () => {
    if (!launchConfirmed || document.visibilityState === "hidden" ||
        wakeLock || wakeLockPending || !window.navigator?.wakeLock?.request)
      return;
    wakeLockPending = true;
    try {
      const lock = await window.navigator.wakeLock.request("screen");
      wakeLock = lock;
      lock.addEventListener?.("release", () => {
        if (wakeLock === lock) wakeLock = null;
      });
    } catch (error) {
      console.warn("screen wake lock unavailable", error);
    } finally {
      wakeLockPending = false;
    }
  };

  const confirmLaunch = () => {
    if (launchConfirmed) return;
    launchConfirmed = true;
    launchConfirm.setAttribute("aria-busy", "true");
    launchButton.disabled = true;
    launchButton.classList.add("loading");
    launchButton.setAttribute("aria-label", LOADING_LABELS[effectiveLanguage]);
    keyboardInputs.clear();
    pointerInputs.clear();
    keyboardMask = pointerMask = latchedMask = 0;
    status.textContent = `VERSION ${GAME_VERSION} · Loading WebAssembly…`;
    void enableAudio();
    void requestWakeLock();
    resolveLaunch();
  };

  launchButton.addEventListener("click", confirmLaunch);
  launchButton.focus({ preventScroll: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void requestWakeLock();
  });
  for (const eventName of ["gesturestart", "gesturechange", "gestureend"])
    document.addEventListener(eventName, event => event.preventDefault(),
                              { passive: false });

  const cancelCurrentSpeech = (preserveUnseen = false) => {
    if (preserveUnseen && activeModule) {
      const visibleCount = activeModule._otg_story_visible_count?.() ?? Infinity;
      for (let index = pendingSpeechSegments.length - 1; index >= 0; --index) {
        if (pendingSpeechSegments[index].glyphStart < visibleCount)
          pendingSpeechSegments.splice(index, 1);
      }
    } else {
      pendingSpeechSegments.length = 0;
    }
    ++speechRevision;
    activeSpeechPageToken = null;
    pendingVoiceAdvance = null;
    paintedSpeechPageKey = null;
    queuedSpeechPageKey = null;
    voicePlayer?.stop();
  };

  const stopAllAudio = () => {
    activeModule?._otg_native_audio_stop_all?.();
    if (nativeAudioSink) nativeAudioSink.reset();
    cancelCurrentSpeech();
  };

  const legacySaveStorageKey = language => language === "ja"
    ? LEGACY_SAVE_KEY : `${LEGACY_SAVE_KEY}-${language}`;

  const pumpNativeAudio = (module) => {
    if (!nativeAudioSink || !module || !module._otg_native_audio_available)
      return;
    const chunkFrames = 2048;
    if (!nativeAudioCopyPointer)
      nativeAudioCopyPointer = module._malloc(chunkFrames * 2 * 4);
    for (;;) {
      const available = module._otg_native_audio_available();
      if (available <= 0) break;
      const requested = Math.min(available, chunkFrames);
      const copied = module._otg_native_audio_copy(
          nativeAudioCopyPointer, requested);
      if (copied <= 0) break;
      const pcm = module.HEAPF32.slice(
          nativeAudioCopyPointer / 4,
          nativeAudioCopyPointer / 4 + copied * 2);
      nativeAudioSink.push(pcm);
    }
  };

  const processAudioEvents = (module) => {
    const count = module._otg_audio_event_count();
    // All commands were already executed by the C++ SPC700 adapter.  Browser
    // code only discards the diagnostic mirror and forwards generated PCM.
    if (count) module._otg_audio_events_clear();
  };

  const processSpeechEvents = (module) => {
    const count = module._otg_speech_event_count?.() || 0;
    for (let index = 0; index < count; ++index) {
      const startBit = module._otg_speech_event_start_bit(index);
      const glyphStart = module._otg_speech_event_glyph_start?.(index) ?? -1;
      const glyphEnd = module._otg_speech_event_glyph_end?.(index) ?? -1;
      const kind = module._otg_speech_event_kind?.(index) ?? 0;
      if (startBit !== 0xFFFFFFFF && glyphStart >= 0 && glyphEnd > glyphStart) {
        pendingVoiceAdvance = null;
        pendingSpeechSegments.push({
          startBit, glyphStart, glyphEnd, kind, playedEnd: glyphStart,
        });
        if (kind !== 1) voicePlayer?.preload?.(startBit);
        ++speechRevision;
        paintedSpeechPageKey = null;
        queuedSpeechPageKey = null;
      }
    }
    if (count) module._otg_speech_events_clear();
  };

  const startPaintedSpeech = (module) => {
    if (!pendingSpeechSegments.length) return;
    if (module._otg_scene() !== 3 || module._otg_story_choice?.()) {
      paintedSpeechPageKey = null;
      return;
    }
    const pageStart = module._otg_story_page_start?.() ?? 0;
    const pageEnd = module._otg_story_page_end?.() ?? 0;
    if (!module._otg_story_waiting?.() || pageEnd <= pageStart ||
        module._otg_story_visible_count?.() < pageEnd) {
      paintedSpeechPageKey = null;
      return;
    }
    const pageKey = `${pageStart}:${pageEnd}:${speechRevision}`;
    if (paintedSpeechPageKey !== pageKey) {
      paintedSpeechPageKey = pageKey;
      return;
    }
    if (queuedSpeechPageKey === pageKey) return;

    const chunks = [];
    for (const segment of pendingSpeechSegments) {
      const start = Math.max(segment.playedEnd, segment.glyphStart, pageStart);
      const end = Math.min(segment.glyphEnd, pageEnd);
      if (end <= start) continue;
      if (segment.kind === 1 && end < segment.glyphEnd) continue;
      const length = segment.glyphEnd - segment.glyphStart;
      chunks.push({
        name: segment.kind === 1,
        startBit: segment.startBit,
        rangeStart: (start - segment.glyphStart) / length,
        rangeEnd: (end - segment.glyphStart) / length,
      });
      segment.playedEnd = end;
    }

    const token = ++nextSpeechPageToken;
    activeSpeechPageToken = token;
    queuedSpeechPageKey = pageKey;
    if (!chunks.length) {
      // A newly appended segment may start on the following soft page. The
      // current page contains only text that was already read.
      pendingVoiceAdvance = token;
      return;
    }
    chunks.forEach((chunk, index) => {
      const completionToken = index + 1 === chunks.length ? token : null;
      if (chunk.name) voicePlayer?.enqueueName(completionToken);
      else voicePlayer?.enqueue(
          chunk.startBit, chunk.rangeStart, chunk.rangeEnd, completionToken);
    });
  };

  const discardCompletedSpeech = () => {
    for (let index = pendingSpeechSegments.length - 1; index >= 0; --index)
      if (pendingSpeechSegments[index].playedEnd >=
          pendingSpeechSegments[index].glyphEnd)
        pendingSpeechSegments.splice(index, 1);
  };

  const queueVoiceAdvance = (module) => {
    if (pendingVoiceAdvance === null) return;
    if (pendingVoiceAdvance !== activeSpeechPageToken ||
        module._otg_scene() !== 3) {
      pendingVoiceAdvance = null;
      return;
    }
    if (module._otg_story_choice?.() || module._otg_choice_ready?.()) {
      discardCompletedSpeech();
      activeSpeechPageToken = null;
      pendingVoiceAdvance = null;
      return;
    }
    if (!module._otg_story_waiting?.() || !nameInputOverlay.hidden ||
        languageMenuOpen() || !saveOverlay.hidden)
      return;
    latchedMask |= INPUT.confirm;
    discardCompletedSpeech();
    ++speechRevision;
    activeSpeechPageToken = null;
    pendingVoiceAdvance = null;
    paintedSpeechPageKey = null;
    queuedSpeechPageKey = null;
  };

  const startEnding = async (module, movieId) => {
    if (endingStarted || !movieId) return;
    const size = module._otg_ending_video_size();
    if (size <= 0) return;
    const pointer = module._malloc(size);
    const copied = module._otg_ending_video_copy(pointer, size);
    if (copied !== size) {
      module._free(pointer);
      throw new Error(`ending video ${movieId} copy failed (${copied})`);
    }
    const bytes = module.HEAPU8.slice(pointer, pointer + size);
    module._free(pointer);
    endingStarted = true;
    try { saveHistory(activeModule); } catch (error) { console.warn("history save failed", error); }
    let url = endingMovieUrls.get(movieId);
    if (!url) {
      url = URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }));
      endingMovieUrls.set(movieId, url);
    }
    endingVideo.src = url;
    endingVideo.hidden = false;
    endingVideo.currentTime = 0;
    endingVideo.muted = true;
    endingVideo.volume = 0;
    endingVideo.onended = () => {
      // The final 終 screen is an endless animation in the original. Replay
      // only the captured tail rather than restarting the credits.
      endingVideo.currentTime = Math.max(0, endingVideo.duration - 16.5);
      void endingVideo.play();
    };
    try {
      await endingVideo.play();
    } catch (_) {
      status.textContent = "Press A to play the ending";
      status.classList.remove("quiet", "error");
    }
  };

  const serializeGame = module => {
    if (!module || module._otg_scene() !== 3) return null;
    const size = module._otg_save_size();
    const pointer = module._malloc(size);
    const written = module._otg_save(pointer, size);
    if (written !== size) {
      module._free(pointer);
      return null;
    }
    const bytes = module.HEAPU8.slice(pointer, pointer + size);
    module._free(pointer);
    return bytes;
  };

  const saveHistory = (module) => {
    if (!module) return false;
    const size = module._otg_history_size();
    const pointer = module._malloc(size);
    const written = module._otg_history_copy(pointer, size);
    if (written !== size) {
      module._free(pointer);
      return false;
    }
    const bytes = module.HEAPU8.slice(pointer, pointer + size);
    module._free(pointer);
    localStorage.setItem(HISTORY_KEY, btoa(String.fromCharCode(...bytes)));
    return true;
  };

  const loadHistory = (module) => {
    const encoded = localStorage.getItem(HISTORY_KEY);
    if (!encoded) return false;
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    if (bytes.length !== module._otg_history_size()) return false;
    const pointer = module._malloc(bytes.length);
    module.HEAPU8.set(bytes, pointer);
    const result = module._otg_history_load(pointer, bytes.length);
    module._free(pointer);
    return result === 0;
  };

  const loadGameBytes = (module, storedData) => {
    if (!module || !storedData) return false;
    const bytes = storedData instanceof Uint8Array
      ? storedData : new Uint8Array(storedData);
    const pointer = module._malloc(bytes.length);
    module.HEAPU8.set(bytes, pointer);
    const result = module._otg_load_save(pointer, bytes.length);
    module._free(pointer);
    if (result === 0) {
      stopAllAudio();
      loadHistory(module);
      const progress = Number.parseInt(localStorage.getItem(PROGRESS_KEY) || "0", 10);
      module._otg_set_progress_flags(Number.isFinite(progress) ? progress : 0);
    }
    return result === 0;
  };

  const saveCopy = () => SAVE_UI[effectiveLanguage] || SAVE_UI.en;
  const formatCopy = (text, values) => text.replace(
      /\{([a-z]+)\}/gi, (_, key) => String(values[key] ?? ""));
  const formatSaveTime = timestamp => {
    if (!Number.isFinite(timestamp) || timestamp <= 0)
      return saveCopy().timeUnknown;
    return new Intl.DateTimeFormat(effectiveLanguage, {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(new Date(timestamp));
  };

  const showToast = (message, error = false) => {
    status.textContent = message;
    status.classList.remove("quiet", "error");
    if (error) status.classList.add("error");
    else window.setTimeout(() => status.classList.add("quiet"), 1600);
  };

  const clearSavePreviewUrls = () => {
    for (const url of savePreviewUrls) URL.revokeObjectURL(url);
    savePreviewUrls = [];
  };

  const showSaveDialogMessage = message => {
    saveDialogMessage.textContent = message;
    saveDialogMessage.hidden = !message;
  };

  const clearGameInputs = () => {
    pointerInputs.clear();
    keyboardInputs.clear();
    keyboardMask = pointerMask = latchedMask = 0;
    refreshButtons();
  };

  const renderSaveSlots = records => {
    clearSavePreviewUrls();
    saveDialogRecords = new Map(records.map(record => [record.slot, record]));
    saveSlotList.replaceChildren();
    const copy = saveCopy();
    const count = window.OTOGIRISOU_SAVE_SLOT_COUNT || 100;
    saveDialogSummary.textContent = formatCopy(copy.summary, { used: records.length });
    for (let slot = 1; slot <= count; ++slot) {
      const record = saveDialogRecords.get(slot);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `save-slot${record ? "" : " save-slot-empty"}`;
      button.dataset.slot = String(slot);
      button.setAttribute("role", "listitem");
      button.disabled = saveDialogMode === "load" && !record;

      const preview = document.createElement("span");
      preview.className = "save-slot-preview";
      if (record?.preview instanceof Blob) {
        const image = document.createElement("img");
        const url = URL.createObjectURL(record.preview);
        savePreviewUrls.push(url);
        image.src = url;
        image.alt = "";
        preview.append(image);
      } else {
        preview.textContent = "--";
      }

      const copyBlock = document.createElement("span");
      copyBlock.className = "save-slot-copy";
      const name = document.createElement("span");
      name.className = "save-slot-name";
      name.textContent = formatCopy(copy.slot, { slot });
      const time = document.createElement(record?.savedAt ? "time" : "span");
      time.className = "save-slot-time";
      if (record?.savedAt) time.dateTime = new Date(record.savedAt).toISOString();
      time.textContent = record?.savedAt
        ? formatCopy(copy.savedAt, { time: formatSaveTime(record.savedAt) })
        : record ? copy.timeUnknown : copy.empty;
      copyBlock.append(name, time);
      button.append(preview, copyBlock);
      button.addEventListener("click", () => {
        if (saveDialogMode === "load") requestLoad(record);
        else if (record) requestOverwrite(slot);
        else requestSave(slot);
      });
      saveSlotList.append(button);
    }
    const preferred = saveDialogMode === "load"
      ? saveSlotList.querySelector(".save-slot:not(:disabled)")
      : saveSlotList.querySelector(".save-slot-empty") || saveSlotList.firstElementChild;
    preferred?.focus({ preventScroll: true });
  };

  const closeOverwrite = (restoreFocus = true) => {
    if (overwriteConfirm.hidden) return;
    const slot = pendingSaveAction?.slot || pendingOverwriteSlot;
    pendingSaveAction = null;
    pendingOverwriteSlot = 0;
    overwriteConfirm.hidden = true;
    if (restoreFocus)
      saveSlotList.querySelector(`[data-slot="${slot}"]`)?.focus({ preventScroll: true });
  };

  const requestOverwrite = slot => {
    pendingOverwriteSlot = slot;
    pendingSaveAction = { type: "save", slot };
    const copy = saveCopy();
    overwriteTitle.textContent = copy.overwriteTitle;
    overwriteMessage.textContent = formatCopy(copy.overwrite, { slot });
    overwriteConfirm.hidden = false;
    overwriteCancel.focus({ preventScroll: true });
  };

  const requestSave = slot => {
    pendingOverwriteSlot = slot;
    pendingSaveAction = { type: "save", slot };
    const copy = saveCopy();
    overwriteTitle.textContent = copy.saveConfirmTitle;
    overwriteMessage.textContent = formatCopy(copy.saveConfirm, { slot });
    overwriteConfirm.hidden = false;
    overwriteCancel.focus({ preventScroll: true });
  };

  const requestLoad = record => {
    if (!record) return;
    pendingOverwriteSlot = record.slot;
    pendingSaveAction = { type: "load", record, slot: record.slot };
    const copy = saveCopy();
    overwriteTitle.textContent = copy.loadConfirmTitle;
    overwriteMessage.textContent = formatCopy(copy.loadConfirm, { slot: record.slot });
    overwriteConfirm.hidden = false;
    overwriteCancel.focus({ preventScroll: true });
  };

  const closeSaveDialog = (restoreFocus = true) => {
    if (saveOverlay.hidden) return;
    const mode = saveDialogMode;
    ++saveDialogSerial;
    closeOverwrite(false);
    clearSavePreviewUrls();
    saveDialogMode = null;
    saveDialogRecords.clear();
    saveOverlay.hidden = true;
    showSaveDialogMessage("");
    if (restoreFocus)
      (mode === "load" ? loadButton : saveButton).focus({ preventScroll: true });
  };

  const openSaveDialog = async mode => {
    const copy = saveCopy();
    if (!saveStoreReady || !saveStore) {
      showToast(copy.failed, true);
      return;
    }
    if (mode === "save" && (!activeModule || activeModule._otg_scene() !== 3)) {
      showToast(copy.storyOnly, true);
      return;
    }
    closeLanguageMenu();
    closeVoiceLanguageMenu();
    hideNameInput();
    clearGameInputs();
    saveDialogMode = mode;
    saveDialogTitle.textContent = mode === "load" ? copy.loadTitle : copy.saveTitle;
    saveDialogSummary.textContent = formatCopy(copy.summary, { used: "..." });
    saveSlotList.replaceChildren();
    saveSlotList.setAttribute("aria-busy", "true");
    showSaveDialogMessage("");
    saveOverlay.hidden = false;
    saveDialogClose.focus({ preventScroll: true });
    const serial = ++saveDialogSerial;
    try {
      const records = await saveStore.list();
      if (serial !== saveDialogSerial || saveOverlay.hidden) return;
      renderSaveSlots(records);
    } catch (error) {
      console.warn("save slots unavailable", error);
      if (serial === saveDialogSerial) showSaveDialogMessage(copy.failed);
    } finally {
      if (serial === saveDialogSerial) saveSlotList.removeAttribute("aria-busy");
    }
  };

  const performSave = async slot => {
    const copy = saveCopy();
    if (!activeModule || activeModule._otg_scene() !== 3) {
      showSaveDialogMessage(copy.storyOnly);
      return;
    }
    closeOverwrite(false);
    saveSlotList.setAttribute("aria-busy", "true");
    try {
      const data = serializeGame(activeModule);
      if (!data) throw new Error("game state serialization failed");
      const preview = await captureGamePreview();
      await saveStore.put({
        language: runtimeLanguage,
        slot,
        savedAt: Date.now(),
        gameVersion: GAME_VERSION,
        data,
        preview,
      });
      try { saveHistory(activeModule); }
      catch (error) { console.warn("history save failed", error); }
      void window.navigator?.storage?.persist?.();
      closeSaveDialog(false);
      showToast(formatCopy(copy.saved, { slot }));
    } catch (error) {
      console.warn("manual save failed", error);
      showSaveDialogMessage(copy.failed);
      saveSlotList.removeAttribute("aria-busy");
    }
  };

  const resetEndingPlayback = () => {
    if (!endingStarted) return;
    endingVideo.pause();
    endingVideo.hidden = true;
    endingVideo.removeAttribute("src");
    endingVideo.load();
    endingStarted = false;
  };

  const performLoad = async record => {
    if (!record) return;
    const copy = saveCopy();
    saveSlotList.setAttribute("aria-busy", "true");
    try {
      if (!loadGameBytes(activeModule, record.data)) {
        showSaveDialogMessage(copy.invalid);
        saveSlotList.removeAttribute("aria-busy");
        return;
      }
      voicePlayer?.setName(currentPlayerName(activeModule));
      resetEndingPlayback();
      activeModule._otg_native_audio_clear();
      nameInputSceneSeen = false;
      hideNameInput();
      clearGameInputs();
      closeSaveDialog(false);
      showToast(formatCopy(copy.loaded, { slot: record.slot }));
    } catch (error) {
      console.warn("manual load failed", error);
      showSaveDialogMessage(copy.invalid);
      saveSlotList.removeAttribute("aria-busy");
    }
  };

  const migrateLegacySaves = async () => {
    if (!saveStore || localStorage.getItem(SAVE_MIGRATION_KEY) === "1") return;
    const languages = ["ja", ...LANGUAGE_CODES.filter(
      code => code !== "auto" && code !== "ja")];
    const records = await saveStore.list();
    const occupied = new Set(records.map(record => record.slot));
    const migratedKeys = new Set(records.map(record => record.legacyKey).filter(Boolean));
    for (const language of languages) {
      try {
        const legacyKey = legacySaveStorageKey(language);
        const encoded = localStorage.getItem(legacyKey);
        if (!encoded || migratedKeys.has(legacyKey)) continue;
        let slot = 1;
        while (slot <= 100 && occupied.has(slot)) ++slot;
        if (slot > 100) break;
        const binary = atob(encoded);
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
        await saveStore.put({
          language,
          slot,
          savedAt: null,
          gameVersion: "legacy",
          legacyKey,
          data: bytes,
          preview: null,
        });
        occupied.add(slot);
        migratedKeys.add(legacyKey);
      } catch (error) {
        console.warn(`legacy ${language} save migration failed`, error);
      }
    }
    localStorage.setItem(SAVE_MIGRATION_KEY, "1");
  };

  loadButton.addEventListener("click", () => void openSaveDialog("load"));
  saveButton.addEventListener("click", () => void openSaveDialog("save"));
  saveDialogClose.addEventListener("click", () => closeSaveDialog());
  saveOverlay.addEventListener("pointerdown", event => {
    if (event.target === saveOverlay) closeSaveDialog();
  });
  overwriteCancel.addEventListener("click", () => closeOverwrite());
  overwriteConfirmButton.addEventListener("click", () => {
    const action = pendingSaveAction;
    closeOverwrite(false);
    if (action?.type === "load") void performLoad(action.record);
    else if (action?.type === "save" && action.slot)
      void performSave(action.slot);
  });
  window.addEventListener("pagehide", () => {
    try { void wakeLock?.release?.(); } catch (_) {}
    wakeLock = null;
    try { saveHistory(activeModule); } catch (error) { console.warn("history save failed", error); }
  });

  const refreshButtons = () => {
    const mask = keyboardMask | pointerMask;
    for (const button of inputButtons) {
      const bit = INPUT[button.dataset.input];
      button.classList.toggle("pressed", (mask & bit) !== 0);
      button.setAttribute("aria-pressed", String((mask & bit) !== 0));
    }
  };

  const rebuildPointerMask = () => {
    pointerMask = 0;
    for (const bit of pointerInputs.values()) pointerMask |= bit;
    refreshButtons();
  };

  for (const button of inputButtons) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      void enableAudio();
      button.setPointerCapture(event.pointerId);
      const bit = INPUT[button.dataset.input];
      if (!launchConfirmed && (bit & (INPUT.a | INPUT.b | INPUT.start)) !== 0) {
        confirmLaunch();
        return;
      }
      cancelCurrentSpeech(true);
      pointerInputs.set(event.pointerId, bit);
      latchedMask |= bit;
      rebuildPointerMask();
    });
    const release = (event) => {
      pointerInputs.delete(event.pointerId);
      rebuildPointerMask();
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  window.addEventListener("keydown", (event) => {
    if (!nameInputOverlay.hidden || languageMenuOpen() || !saveOverlay.hidden) return;
    const bit = KEY_INPUT.get(event.code);
    if (bit === undefined) return;
    event.preventDefault();
    if (!launchConfirmed && (bit & (INPUT.a | INPUT.b | INPUT.start)) !== 0) {
      confirmLaunch();
      return;
    }
    void enableAudio();
    if (!keyboardInputs.has(event.code)) {
      cancelCurrentSpeech(true);
      latchedMask |= bit;
    }
    keyboardInputs.add(event.code);
    keyboardMask |= bit;
    refreshButtons();
  });
  window.addEventListener("keyup", (event) => {
    if (!nameInputOverlay.hidden || languageMenuOpen() || !saveOverlay.hidden) return;
    const bit = KEY_INPUT.get(event.code);
    if (bit === undefined) return;
    event.preventDefault();
    keyboardInputs.delete(event.code);
    keyboardMask = 0;
    for (const code of keyboardInputs) keyboardMask |= KEY_INPUT.get(code) || 0;
    refreshButtons();
  });
  window.addEventListener("blur", () => {
    pointerInputs.clear();
    keyboardInputs.clear();
    keyboardMask = pointerMask = 0;
    refreshButtons();
  });

  (async () => {
    try {
      await launchPromise;
      const module = await OtogirisouModule({
        locateFile: (name) => `${name}?v=${BUILD}`,
      });
      module._otg_data_reset();
      let localeLoaded = effectiveLanguage === "ja";
      for (const name of RESOURCE_BINS) {
        const response = await fetch(`assets/${name}?v=${BUILD}`, {
          cache: "no-cache",
        });
        if (!response.ok)
          throw new Error(`${name} request failed: HTTP ${response.status}`);
        const data = new Uint8Array(await response.arrayBuffer());
        const dataPointer = module._malloc(data.byteLength);
        module.HEAPU8.set(data, dataPointer);
        const loadResult = module._otg_load_data_part(dataPointer, data.byteLength);
        module._free(dataPointer);
        if (loadResult !== 0)
          throw new Error(`${name} validation failed (${loadResult})`);
      }
      if (effectiveLanguage !== "ja") {
        const data = await fetchLocaleBytes(effectiveLanguage);
        if (data) {
          const pointer = module._malloc(data.byteLength);
          module.HEAPU8.set(data, pointer);
          const result = module._otg_load_data_part(pointer, data.byteLength);
          module._free(pointer);
          if (result !== 0)
            throw new Error(`${effectiveLanguage} locale validation failed (${result})`);
          localeLoaded = true;
        }
      }
      const finalizeResult = module._otg_finalize_data();
      if (finalizeResult !== 0)
        throw new Error(`BIN finalization failed (${finalizeResult})`);
      const storedProgress = Number.parseInt(localStorage.getItem(PROGRESS_KEY) || "0", 10);
      module._otg_set_progress_flags(Number.isFinite(storedProgress) ? storedProgress : 0);
      try { loadHistory(module); } catch (error) { console.warn("history load failed", error); }
      activeModule = module;
      module._otg_set_music_enabled?.(musicEnabled ? 1 : 0);
      runtimeLanguage = localeLoaded &&
          module._otg_native_name_input_available?.() === 1
        ? effectiveLanguage : "ja";
      if (saveStore) {
        try {
          await saveStore.open();
          await migrateLegacySaves();
          saveStoreReady = true;
          loadButton.disabled = false;
        } catch (error) {
          console.warn("save database initialization failed", error);
        }
      }
      if (typeof window.createOtogirisouVoicePlayer === "function") {
        voicePlayer = window.createOtogirisouVoicePlayer(
            BUILD, ensureAudioContext, token => {
              if (token === activeSpeechPageToken)
                pendingVoiceAdvance = token;
            });
        voicePlayer.setLanguage(effectiveVoiceLanguage);
        voicePlayer.setName(currentPlayerName(module));
        voicePlayer.setEnabled?.(voiceEnabled);
      }
      if (typeof window.createOtogirisouTextRenderer === "function" &&
          module._otg_render_hd_background && textCanvas) {
        try {
          hdTextRenderer = await window.createOtogirisouTextRenderer(
              textCanvas, runtimeLanguage, BUILD);
        } catch (error) {
          console.warn("native HD text unavailable; using bitmap text", error);
          textCanvas.hidden = true;
        }
      }
      await ensureNativeAudioSink();
      // Loading can produce queued silence before the sink exists. Start the
      // live stream at the first fixed simulation tick instead of replaying it.
      module._otg_native_audio_clear();

      const width = module._otg_width();
      const height = module._otg_height();
      const frameBytes = width * height * 4;
      const framePointer = module._malloc(frameBytes);
      const previewSource = document.createElement("canvas");
      previewSource.width = width;
      previewSource.height = height;
      const previewSourceContext = previewSource.getContext("2d", { alpha: false });
      const previewSourceImage = previewSourceContext?.createImageData(width, height) || null;
      captureGamePreview = async () => {
        if (!previewSourceContext || !previewSourceImage) return null;
        const preview = document.createElement("canvas");
        preview.width = width;
        preview.height = height;
        const previewContext = preview.getContext("2d", { alpha: false });
        if (!previewContext) return null;
        previewContext.imageSmoothingEnabled = true;
        if (!endingVideo.hidden && endingVideo.readyState >= 2) {
          previewContext.drawImage(endingVideo, 0, 0, width, height);
        } else {
          const frame = module.HEAPU8.subarray(framePointer, framePointer + frameBytes);
          previewSourceImage.data.set(frame);
          previewSourceContext.putImageData(previewSourceImage, 0, 0);
          previewContext.drawImage(previewSource, 0, 0, width, height);
          if (hdTextRenderer && !textCanvas.hidden)
            previewContext.drawImage(textCanvas, 0, 0, width, height);
        }
        const encode = (type, quality) => new Promise(resolve =>
          preview.toBlob(resolve, type, quality));
        return await encode("image/webp", .8) || await encode("image/png");
      };
      let image = null;
      if (typeof window.createOtogirisouHDRenderer === "function") {
        try {
          hdRenderer = window.createOtogirisouHDRenderer(canvas, width, height);
        } catch (error) {
          console.warn("HD renderer unavailable", error);
        }
      }
      if (!hdRenderer) {
        canvas.width = width;
        canvas.height = height;
        context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("no supported canvas renderer");
        context.imageSmoothingEnabled = false;
        image = context.createImageData(width, height);
        canvas.dataset.renderer = "canvas-2d";
        canvas.dataset.sourceSize = `${width}x${height}`;
        canvas.dataset.outputSize = `${width}x${height}`;
      }
      const localeStatus = effectiveLanguage !== "ja" && !localeLoaded
        ? ` · ${LANGUAGE_NAMES[effectiveLanguage]} pack unavailable; using 日本語`
        : "";
      const previewStatus = TRANSLATION_PREVIEW ? " · translation preview" : "";
      status.textContent = `${module._otg_entry_count()} BIN arrays · CRC verified${previewStatus}${localeStatus}`;
      window.setTimeout(() => status.classList.add("quiet"), 2800);
      let frameCounter = 0;
      let progressFlags = module._otg_progress_flags();
      let historyRevision = module._otg_history_revision();
      const simulationFrameMs = 1000 / 60;
      let previousTimestamp = null;
      let simulationAccumulator = simulationFrameMs;

      const render = (timestamp) => {
        if (previousTimestamp === null) previousTimestamp = timestamp;
        else {
          simulationAccumulator += Math.max(
              0, Math.min(250, timestamp - previousTimestamp));
          previousTimestamp = timestamp;
        }
        let simulationSteps = 0;
        while (simulationAccumulator >= simulationFrameMs &&
               simulationSteps < 8) {
          queueVoiceAdvance(module);
          const input = keyboardMask | pointerMask | latchedMask;
          module._otg_tick(input);
          syncNameInput(module);
          const updatedProgress = module._otg_progress_flags();
          if (updatedProgress !== progressFlags) {
            progressFlags = updatedProgress;
            localStorage.setItem(PROGRESS_KEY, String(progressFlags));
          }
          processAudioEvents(module);
          processSpeechEvents(module);
          pumpNativeAudio(module);
          latchedMask = 0;
          ++frameCounter;
          if (frameCounter % 180 === 0 &&
              module._otg_history_revision() !== historyRevision) {
            historyRevision = module._otg_history_revision();
            try { saveHistory(module); }
            catch (error) { console.warn("history save failed", error); }
          }
          simulationAccumulator -= simulationFrameMs;
          ++simulationSteps;
        }
        // A background tab must not replay minutes of game logic and audio.
        if (simulationSteps === 8 && simulationAccumulator >= simulationFrameMs)
          simulationAccumulator = 0;
        if (endingStarted && module._otg_scene() !== 3) {
          resetEndingPlayback();
          if (nativeAudioSink) nativeAudioSink.reset();
        }
        saveButton.disabled = !saveStoreReady || module._otg_scene() !== 3;
        latchedMask = 0;
        if (hdTextRenderer)
          module._otg_render_hd_background(framePointer, frameBytes);
        else
          module._otg_render(framePointer, frameBytes);
        const frame = module.HEAPU8.subarray(framePointer, framePointer + frameBytes);
        if (hdRenderer) hdRenderer.render(frame);
        else {
          image.data.set(frame);
          context.putImageData(image, 0, 0);
        }
        if (hdTextRenderer) hdTextRenderer.render(module);
        startPaintedSpeech(module);
        if (!launchConfirm.hidden) {
          launchConfirm.hidden = true;
          launchConfirm.removeAttribute("aria-busy");
        }
        const ending = module._otg_ending_video_id();
        if (!endingStarted && ending)
          void startEnding(module, ending);
        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);
    } catch (error) {
      console.error(error);
      status.textContent = `Startup error: ${error.message}`;
      status.classList.add("error");
    }
  })();
})();
