"use strict";

(() => {
  // At 1080p the original 8:7 game image occupies 1234x1080 pixels. Render
  // glyphs once at that native resolution; CSS scales the completed layer to
  // the actual stage size together with the background.
  const WIDTH = 1234;
  const HEIGHT = 1080;
  const SOURCE_WIDTH = 1280;
  const SOURCE_HEIGHT = 1120;
  const X_COORDINATE_SCALE = WIDTH / SOURCE_WIDTH;
  const Y_COORDINATE_SCALE = HEIGHT / SOURCE_HEIGHT;
  const FONT_SIZE = 63;
  const LINE_HEIGHT = 25 * 5 * Y_COORDINATE_SCALE;
  const MARKER_WIDTH = 34;
  const MARKER_HEIGHT = 42;
  const LOCALE_FONT_SIZES = Object.freeze({
    ja: 63,
    "zh-Hant": 63,
    yue: 63,
    en: 53,
    ko: 58,
    "zh-Hans": 58,
  });
  const FONT_FILES = Object.freeze({
    ja: "ja.woff2",
    "zh-Hant": "zh-Hant.woff2",
    yue: "yue.woff2",
    en: "en.woff2",
    ko: "ko.woff2",
    "zh-Hans": "zh-Hans.woff2",
  });
  const FALLBACKS = Object.freeze({
    ja: '"Hiragino Sans", "Yu Gothic", sans-serif',
    "zh-Hant": '"PingFang TC", "Microsoft JhengHei", sans-serif',
    yue: '"PingFang TC", "Microsoft JhengHei", sans-serif',
    en: 'Arial, sans-serif',
    ko: '"Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    "zh-Hans": '"PingFang SC", "Microsoft YaHei", sans-serif',
  });

  const loadFont = async (language, build) => {
    const file = FONT_FILES[language];
    if (!file || !window.FontFace || !document.fonts)
      throw new Error(`native font loading is unavailable for ${language}`);
    const family = `OtogirisouHD-${language.replace(/[^A-Za-z0-9]/g, "")}`;
    const face = new FontFace(
        family, `url("assets/fonts/${file}?v=${encodeURIComponent(build)}")`,
        { style: "normal", weight: "400", display: "block" });
    await face.load();
    document.fonts.add(face);
    return `"${family}", ${FALLBACKS[language]}`;
  };

  const drawMarker = (context, x, bottom) => {
    const top = bottom - 51;
    const middle = top + MARKER_HEIGHT / 2;
    context.save();
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x + MARKER_WIDTH, middle);
    context.lineTo(x, top + MARKER_HEIGHT);
    context.closePath();
    context.shadowColor = "#181818";
    context.shadowOffsetX = 5;
    context.shadowOffsetY = 5;
    context.fillStyle = "#deded5";
    context.fill();
    context.restore();
  };

  window.createOtogirisouTextRenderer = async (canvas, language, build) => {
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("transparent text canvas is unavailable");
    const japaneseFont = await loadFont("ja", build);
    const localeFont = language === "ja"
      ? japaneseFont : await loadFont(language, build);
    const localeFontSize = LOCALE_FONT_SIZES[language] || FONT_SIZE;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.hidden = false;
    canvas.dataset.renderer = "native-font-1080p";
    canvas.dataset.outputSize = `${WIDTH}x${HEIGHT}`;
    context.textAlign = "left";
    context.textBaseline = "bottom";
    context.fontKerning = "none";

    return {
      render(module) {
        context.clearRect(0, 0, WIDTH, HEIGHT);
        const count = module._otg_hd_text_count();
        let selectedFont = -1;
        let lastGlyphRight = 12 * 5 * X_COORDINATE_SCALE;
        let lastGlyphBottom = 29 * 5 * Y_COORDINATE_SCALE;
        for (let index = 0; index < count; ++index) {
          const codepoint = module._otg_hd_text_codepoint(index);
          const x = module._otg_hd_text_x(index) * X_COORDINATE_SCALE;
          const bottom = module._otg_hd_text_bottom(index) * Y_COORDINATE_SCALE;
          const font = module._otg_hd_text_font(index);
          const style = module._otg_hd_text_style(index);
          if (style === 2) {
            let markerX = lastGlyphRight + 12;
            let markerBottom = lastGlyphBottom;
            if (markerX + MARKER_WIDTH + 5 > WIDTH) {
              markerX = 12 * 5 * X_COORDINATE_SCALE;
              markerBottom = Math.min(HEIGHT - 5, markerBottom + LINE_HEIGHT);
            }
            drawMarker(context, markerX, markerBottom);
            continue;
          }
          if (style === 3) {
            drawMarker(context, x, bottom);
            continue;
          }
          if (!codepoint || x < 0 || bottom < 0) continue;
          if (font !== selectedFont) {
            selectedFont = font;
            const size = font ? localeFontSize : FONT_SIZE;
            context.font = `400 ${size}px ${font ? localeFont : japaneseFont}`;
          }
          const character = String.fromCodePoint(codepoint);
          const glyphWidth = context.measureText(character).width;
          if (style === 1) {
            context.fillStyle = "#181818";
            context.fillText(character, x, bottom);
          } else {
            context.fillStyle = "#181818";
            context.fillText(character, x + 5, bottom + 5);
            context.fillStyle = "#deded5";
            context.fillText(character, x, bottom);
          }
          lastGlyphRight = x + glyphWidth;
          lastGlyphBottom = bottom;
        }
      },
      clear() { context.clearRect(0, 0, WIDTH, HEIGHT); },
    };
  };
})();
