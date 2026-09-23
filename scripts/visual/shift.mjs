// Find layout offsets between a reference and an app shot: for each horizontal
// band, search the (dx, dy) that best aligns app to ref. Bands whose best shift
// isn't (0,0) are real misalignments; residual mismatch at (0,0) is
// rasterization noise. Usage: node scripts/visual/shift.mjs <ref.png> <app.png> [band=24]
import fs from "node:fs";
import { PNG } from "pngjs";

const [refPath, appPath, bandArg = "24"] = process.argv.slice(2);
const A = PNG.sync.read(fs.readFileSync(refPath));
const B = PNG.sync.read(fs.readFileSync(appPath));
const W = Math.min(A.width, B.width);
const H = Math.min(A.height, B.height);
const BAND = Number(bandArg);
const R = 4;

const lum = (img, x, y) => {
  const i = (y * img.width + x) * 4;
  return img.data[i] * 0.3 + img.data[i + 1] * 0.59 + img.data[i + 2] * 0.11;
};
function cost(y0, y1, dx, dy) {
  let c = 0;
  for (let y = y0; y < y1; y++) {
    const yb = y + dy;
    if (yb < 0 || yb >= H) continue;
    for (let x = R; x < W - R; x += 1) {
      const d = Math.abs(lum(A, x, y) - lum(B, x + dx, yb));
      if (d > 24) c += d;
    }
  }
  return c;
}
const out = [];
for (let y0 = 0; y0 < H; y0 += BAND) {
  const y1 = Math.min(H, y0 + BAND);
  // skip empty bands (no ink in ref)
  let ink = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < W; x += 2) if (Math.abs(lum(A, x, y) - lum(A, 0, y0)) > 30) ink++;
  if (ink < 8) continue;
  const base = cost(y0, y1, 0, 0);
  let best = { dx: 0, dy: 0, c: base };
  for (let dy = -R; dy <= R; dy++)
    for (let dx = -R; dx <= R; dx++) {
      const c = cost(y0, y1, dx, dy);
      if (c < best.c * 0.8) best = { dx, dy, c };
    }
  if (best.dx !== 0 || best.dy !== 0 || base > 20000)
    out.push(`y ${String(y0).padStart(4)}–${String(y1).padEnd(4)} best shift dx=${best.dx} dy=${best.dy}  cost ${Math.round(base)} → ${Math.round(best.c)}`);
}
console.log(out.length ? out.join("\n") : "aligned (no band improves with a shift)");
