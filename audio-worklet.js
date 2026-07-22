"use strict";

// 32.04-kHz interleaved stereo sink for the portable C++ audio core.  Web
// Audio runs this processor on the device clock, commonly 44.1 or 48 kHz.
class OtogirisouPcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunks = [];
    this.offset = 0;
    this.buffered = 0;
    this.started = false;
    this.phase = 0;
    this.current = [0, 0];
    this.next = [0, 0];
    this.port.onmessage = (event) => {
      if (event.data.type === "reset") {
        this.chunks = [];
        this.offset = 0;
        this.buffered = 0;
        this.started = false;
        this.phase = 0;
      } else if (event.data.type === "pcm") {
        const pcm = new Float32Array(event.data.buffer);
        if (pcm.length >= 2) {
          this.chunks.push(pcm);
          this.buffered += pcm.length >> 1;
        }
      }
    };
  }

  pull() {
    while (this.chunks.length) {
      const chunk = this.chunks[0];
      if (this.offset + 1 < chunk.length) {
        const value = [chunk[this.offset], chunk[this.offset + 1]];
        this.offset += 2;
        --this.buffered;
        if (this.offset >= chunk.length) {
          this.chunks.shift();
          this.offset = 0;
        }
        return value;
      }
      this.chunks.shift();
      this.offset = 0;
    }
    return null;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    const left = output[0];
    const right = output[1] || output[0];
    // Start after 1.5 input frames have arrived. Because the main thread sends
    // 534-frame chunks, this creates one 16.7-ms safety frame rather than the
    // old multi-hundred-millisecond first-use delay.
    if (!this.started && this.buffered >= 801) {
      this.current = this.pull();
      this.next = this.pull();
      this.started = !!this.current && !!this.next;
      this.phase = 0;
    }
    const nominal = 32040 / sampleRate;
    // rAF can be 59.94/60/120 Hz while the audio clock is independent. A tiny
    // bounded occupancy correction prevents periodic starvation clicks.
    const correction = Math.max(-0.0025, Math.min(0.0025,
        (this.buffered - 801) / 801 * 0.0015));
    const step = nominal * (1 + correction);
    for (let index = 0; index < left.length; ++index) {
      if (!this.started) {
        left[index] = right[index] = 0;
        continue;
      }
      left[index] = this.current[0] +
          (this.next[0] - this.current[0]) * this.phase;
      right[index] = this.current[1] +
          (this.next[1] - this.current[1]) * this.phase;
      this.phase += step;
      while (this.phase >= 1 && this.started) {
        this.current = this.next;
        this.next = this.pull();
        this.phase -= 1;
        if (!this.next) this.started = false;
      }
    }
    return true;
  }
}

registerProcessor("otogirisou-pcm", OtogirisouPcmProcessor);
