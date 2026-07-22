"use strict";

(() => {
  const OUTPUT_SCALE = 5;

  const vertexSource = `#version 300 es
layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform vec2 uTextureSize;

out vec2 vTexCoord;
out vec4 vT1;
out vec4 vT2;
out vec4 vT3;
out vec4 vT4;
out vec4 vT5;
out vec4 vT6;
out vec4 vT7;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  float dx = 1.0 / uTextureSize.x;
  float dy = 1.0 / uTextureSize.y;
  vTexCoord = aTexCoord;
  vT1 = aTexCoord.xxxy + vec4(-dx, 0.0, dx, -2.0 * dy);
  vT2 = aTexCoord.xxxy + vec4(-dx, 0.0, dx,        -dy);
  vT3 = aTexCoord.xxxy + vec4(-dx, 0.0, dx,         0.0);
  vT4 = aTexCoord.xxxy + vec4(-dx, 0.0, dx,          dy);
  vT5 = aTexCoord.xxxy + vec4(-dx, 0.0, dx,  2.0 * dy);
  vT6 = aTexCoord.xyyy + vec4(-2.0 * dx, -dy, 0.0, dy);
  vT7 = aTexCoord.xyyy + vec4( 2.0 * dx, -dy, 0.0, dy);
}`;

  // Adapted from Hyllian's xBR-lv2 shader. The full license is included in
  // THIRD_PARTY_NOTICES.txt.
  const fragmentSource = `#version 300 es
precision highp float;

uniform sampler2D uFrame;

in vec2 vTexCoord;
in vec4 vT1;
in vec4 vT2;
in vec4 vT3;
in vec4 vT4;
in vec4 vT5;
in vec4 vT6;
in vec4 vT7;

out vec4 outColor;

const float XBR_SCALE = 5.0;
const float LV2_COEFFICIENT = 2.0;
const vec3 RGB_WEIGHT = vec3(14.352, 28.176, 5.472);
const vec4 DELTA = vec4(1.0 / XBR_SCALE);
const vec4 DELTA_L = vec4(0.5 / XBR_SCALE, 1.0 / XBR_SCALE,
                          0.5 / XBR_SCALE, 1.0 / XBR_SCALE);
const vec4 DELTA_U = DELTA_L.yxwz;
const vec4 AO = vec4(1.0, -1.0, -1.0, 1.0);
const vec4 BO = vec4(1.0, 1.0, -1.0, -1.0);
const vec4 CO = vec4(1.5, 0.5, -0.5, 0.5);
const vec4 AX = vec4(1.0, -1.0, -1.0, 1.0);
const vec4 BX = vec4(0.5, 2.0, -0.5, -2.0);
const vec4 CX = vec4(1.0, 1.0, -0.5, 0.0);
const vec4 AY = vec4(1.0, -1.0, -1.0, 1.0);
const vec4 BY = vec4(2.0, 0.5, -2.0, -0.5);
const vec4 CY = vec4(2.0, 0.0, -1.0, 0.5);
const vec4 CI = vec4(0.25);

vec4 difference(vec4 a, vec4 b) {
  return abs(a - b);
}

vec4 differs(vec4 a, vec4 b) {
  return vec4(notEqual(a, b));
}

vec4 equalsThreshold(vec4 a, vec4 b) {
  return step(difference(a, b), vec4(15.0));
}

vec4 notEqualsThreshold(vec4 a, vec4 b) {
  return vec4(1.0) - equalsThreshold(a, b);
}

vec4 weightedDistance(vec4 a, vec4 b, vec4 c, vec4 d,
                      vec4 e, vec4 f, vec4 g, vec4 h) {
  return difference(a, b) + difference(a, c) +
         difference(d, e) + difference(d, f) +
         4.0 * difference(g, h);
}

float colorDifference(vec3 a, vec3 b) {
  vec3 value = abs(a - b);
  return value.r + value.g + value.b;
}

void main() {
  vec2 fp = fract(vTexCoord * vec2(textureSize(uFrame, 0)));

  vec3 a1 = texture(uFrame, vT1.xw).rgb;
  vec3 b1 = texture(uFrame, vT1.yw).rgb;
  vec3 c1 = texture(uFrame, vT1.zw).rgb;
  vec3 a  = texture(uFrame, vT2.xw).rgb;
  vec3 b  = texture(uFrame, vT2.yw).rgb;
  vec3 c  = texture(uFrame, vT2.zw).rgb;
  vec3 d0 = texture(uFrame, vT3.xw).rgb;
  vec3 e0 = texture(uFrame, vT3.yw).rgb;
  vec3 f0 = texture(uFrame, vT3.zw).rgb;
  vec3 g  = texture(uFrame, vT4.xw).rgb;
  vec3 h  = texture(uFrame, vT4.yw).rgb;
  vec3 i  = texture(uFrame, vT4.zw).rgb;
  vec3 g5 = texture(uFrame, vT5.xw).rgb;
  vec3 h5c = texture(uFrame, vT5.yw).rgb;
  vec3 i5c = texture(uFrame, vT5.zw).rgb;
  vec3 a0 = texture(uFrame, vT6.xy).rgb;
  vec3 dOuter = texture(uFrame, vT6.xz).rgb;
  vec3 g0 = texture(uFrame, vT6.xw).rgb;
  vec3 c4 = texture(uFrame, vT7.xy).rgb;
  vec3 fOuter = texture(uFrame, vT7.xz).rgb;
  vec3 i4c = texture(uFrame, vT7.xw).rgb;

  vec4 bv = vec4(dot(b, RGB_WEIGHT), dot(d0, RGB_WEIGHT),
                 dot(h, RGB_WEIGHT), dot(f0, RGB_WEIGHT));
  vec4 cv = vec4(dot(c, RGB_WEIGHT), dot(a, RGB_WEIGHT),
                 dot(g, RGB_WEIGHT), dot(i, RGB_WEIGHT));
  vec4 dv = bv.yzwx;
  vec4 ev = vec4(dot(e0, RGB_WEIGHT));
  vec4 fv = bv.wxyz;
  vec4 gv = cv.zwxy;
  vec4 hv = bv.zwxy;
  vec4 iv = cv.wxyz;
  vec4 i4 = vec4(dot(i4c, RGB_WEIGHT), dot(c1, RGB_WEIGHT),
                 dot(a0, RGB_WEIGHT), dot(g5, RGB_WEIGHT));
  vec4 i5 = vec4(dot(i5c, RGB_WEIGHT), dot(c4, RGB_WEIGHT),
                 dot(a1, RGB_WEIGHT), dot(g0, RGB_WEIGHT));
  vec4 h5 = vec4(dot(h5c, RGB_WEIGHT), dot(fOuter, RGB_WEIGHT),
                 dot(b1, RGB_WEIGHT), dot(dOuter, RGB_WEIGHT));
  vec4 f4 = h5.yzwx;

  vec4 fx = AO * fp.y + BO * fp.x;
  vec4 fxLower = AX * fp.y + BX * fp.x;
  vec4 fxUpper = AY * fp.y + BY * fp.x;

  vec4 level0 = differs(ev, fv) * differs(ev, hv);
  vec4 level1 = level0 * (
      notEqualsThreshold(fv, bv) * notEqualsThreshold(fv, cv) +
      notEqualsThreshold(hv, dv) * notEqualsThreshold(hv, gv) +
      equalsThreshold(ev, iv) *
          (notEqualsThreshold(fv, f4) * notEqualsThreshold(fv, i4) +
           notEqualsThreshold(hv, h5) * notEqualsThreshold(hv, i5)) +
      equalsThreshold(ev, gv) + equalsThreshold(ev, cv));
  vec4 level2Lower = differs(ev, gv) * differs(dv, gv);
  vec4 level2Upper = differs(ev, cv) * differs(bv, cv);

  vec4 fx45i = clamp((fx + DELTA - CO - CI) / (2.0 * DELTA), 0.0, 1.0);
  vec4 fx45 = clamp((fx + DELTA - CO) / (2.0 * DELTA), 0.0, 1.0);
  vec4 fx30 = clamp((fxLower + DELTA_L - CX) / (2.0 * DELTA_L), 0.0, 1.0);
  vec4 fx60 = clamp((fxUpper + DELTA_U - CY) / (2.0 * DELTA_U), 0.0, 1.0);

  vec4 distance1 = weightedDistance(ev, cv, gv, iv, h5, f4, hv, fv);
  vec4 distance2 = weightedDistance(hv, dv, i5, fv, i4, bv, ev, iv);
  vec4 interpolate = step(distance1, distance2) * level0;
  vec4 edge = step(distance1 + vec4(0.1), distance2) *
              step(vec4(0.5), level1);
  vec4 lowerEdge = step(LV2_COEFFICIENT * difference(fv, gv),
                        difference(hv, cv)) * level2Lower * edge;
  vec4 upperEdge = step(LV2_COEFFICIENT * difference(hv, cv),
                        difference(fv, gv)) * level2Upper * edge;

  fx45 *= edge;
  fx30 *= lowerEdge;
  fx60 *= upperEdge;
  fx45i *= interpolate;

  vec4 pixelChoice = step(difference(ev, fv), difference(ev, hv));
  vec4 blend = max(max(fx30, fx60), max(fx45, fx45i));
  vec3 result1 = mix(mix(e0, mix(h, f0, pixelChoice.x), blend.x),
                     mix(b, d0, pixelChoice.z), blend.z);
  vec3 result2 = mix(mix(e0, mix(f0, b, pixelChoice.y), blend.y),
                     mix(d0, h, pixelChoice.w), blend.w);
  vec3 result = mix(result1, result2,
                    step(colorDifference(e0, result1),
                         colorDifference(e0, result2)));
  outColor = vec4(result, 1.0);
}`;

  const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || "unknown shader error";
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  };

  const createProgram = (gl) => {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || "unknown link error";
      gl.deleteProgram(program);
      throw new Error(message);
    }
    return program;
  };

  window.createOtogirisouHDRenderer = (canvas, width, height) => {
    canvas.width = width * OUTPUT_SCALE;
    canvas.height = height * OUTPUT_SCALE;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) return null;

    const program = createProgram(gl);
    const vertices = new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
       1,  1, 1, 0,
    ]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, "uFrame"), 0);
    gl.uniform2f(gl.getUniformLocation(program, "uTextureSize"), width, height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    canvas.dataset.renderer = "xbr-lv2-5x";
    canvas.dataset.sourceSize = `${width}x${height}`;
    canvas.dataset.outputSize = `${canvas.width}x${canvas.height}`;

    return {
      render(frame) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height,
                         gl.RGBA, gl.UNSIGNED_BYTE, frame);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  };
})();
