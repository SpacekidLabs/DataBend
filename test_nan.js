const buffer = new Float32Array(100);
buffer.fill(1);
const sr = 44100;
const startIdx = 0;
const endIdx = 100;
const inLen = 20 / sr; // 20 frames
const outLen = 20 / sr; // 20 frames
const inType = "tape";
const outType = "tape";

const fadeFramesIn = Math.floor(inLen * sr);
for (let i = 0; i < fadeFramesIn && (startIdx + i) < buffer.length; i++) {
  const p = (fadeFramesIn / 2) + (i * i) / (2 * fadeFramesIn);
  const readIdx = startIdx + p;
  const idx0 = Math.floor(readIdx);
  const idx1 = Math.min(idx0 + 1, buffer.length - 1);
  const frac = readIdx - idx0;
  const val = buffer[idx0] * (1 - frac) + buffer[idx1] * frac;
  console.log(`idx0: ${idx0}, idx1: ${idx1}, val: ${val}`);
}
