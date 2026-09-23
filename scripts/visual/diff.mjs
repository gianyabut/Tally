// Pixel-diff app screenshots against prototype references.
// Usage: node scripts/visual/diff.mjs <refDir> <appDir> <diffDir> [filter]
import path from "node:path";
import fs from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [REF, APP, DIFF] = process.argv.slice(2, 5).map((p) => path.resolve(p));
const FILTER = process.argv[5] ?? "";
const rows = [];

for (const variant of fs.readdirSync(APP)) {
  if (variant.startsWith("_")) continue;
  for (const file of fs.readdirSync(path.join(APP, variant))) {
    if (!file.endsWith(".png")) continue;
    const id = `${variant}/${file.replace(/\.png$/, "")}`;
    if (!id.includes(FILTER)) continue;
    const a = PNG.sync.read(fs.readFileSync(path.join(REF, variant, file)));
    const b = PNG.sync.read(fs.readFileSync(path.join(APP, variant, file)));
    const w = Math.min(a.width, b.width);
    const h = Math.min(a.height, b.height);
    const ca = new PNG({ width: w, height: h });
    const cb = new PNG({ width: w, height: h });
    PNG.bitblt(a, ca, 0, 0, w, h, 0, 0);
    PNG.bitblt(b, cb, 0, 0, w, h, 0, 0);
    const d = new PNG({ width: w, height: h });
    const n = pixelmatch(ca.data, cb.data, d.data, w, h, { threshold: 0.1 });
    const out = path.join(DIFF, variant, file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, PNG.sync.write(d));
    rows.push({ id, pct: (100 * n) / (w * h), n, size: `${b.width}x${b.height}` });
  }
}
rows.sort((x, y) => y.pct - x.pct);
for (const r of rows) console.log(`${r.pct.toFixed(3).padStart(7)}%  ${String(r.n).padStart(7)}px  ${r.id}`);
