const buffer = new Float32Array(100);
for(let i=0; i<100; i++) buffer[i] = i; // linear ramp
const sr = 100;
const startIdx = 0;
const endIdx = 100;
const inLen = 10 / sr; // 10 frames
const outLen = 10 / sr; // 10 frames

function apply(buffer, startIdx, endIdx, inLen, outLen, inType, outType, sr) {
    const fadeFramesIn = Math.floor(inLen * sr);
    const fadeFramesOut = Math.floor(outLen * sr);

    if (fadeFramesIn > 0) {
      for (let i = 0; i < fadeFramesIn && (startIdx + i) < buffer.length; i++) {
        const tPos = i / (fadeFramesIn || 1);
        if (inType === "tape") {
          const p = (fadeFramesIn / 2) + (i * i) / (2 * fadeFramesIn);
          const readIdx = startIdx + p;
          const idx0 = Math.max(0, Math.min(buffer.length - 1, Math.floor(readIdx)));
          const idx1 = Math.max(0, Math.min(buffer.length - 1, idx0 + 1));
          const frac = readIdx - idx0;
          const val = buffer[idx0] * (1 - frac) + buffer[idx1] * frac;
          buffer[startIdx + i] = val;
        }
      }
    }

    if (fadeFramesOut > 0) {
      const fadeStartIdx = endIdx - fadeFramesOut;
      for (let i = fadeFramesOut - 1; i >= 0; i--) {
        if (outType === "tape") {
          const p = i - (i * i) / (2 * fadeFramesOut);
          const readIdx = fadeStartIdx + p;
          const idx0 = Math.max(0, Math.min(buffer.length - 1, Math.floor(readIdx)));
          const idx1 = Math.max(0, Math.min(buffer.length - 1, idx0 + 1));
          const frac = readIdx - idx0;
          const val = buffer[idx0] * (1 - frac) + buffer[idx1] * frac;
          buffer[fadeStartIdx + i] = val;
        }
      }
    }
}
apply(buffer, startIdx, endIdx, inLen, outLen, "tape", "tape", sr);
console.log(buffer.slice(0, 15));
console.log(buffer.slice(85, 100));
