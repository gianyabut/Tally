// Crop the same region from a reference and an app shot, stack them (ref on
// top, app below, diff last) and upscale — for eyeballing sub-pixel shifts.
// Usage: node scripts/visual/zoom.mjs <ref.png> <app.png> <out.png> x y w h [scale]
import fs from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [refPath, appPath, out, x, y, w, h, s = "4"] = process.argv.slice(2);
const [X, Y, W, H, S] = [x, y, w, h, s].map(Number);
const load = (p) => PNG.sync.read(fs.readFileSync(p));
const crop = (img) => {
  const c = new PNG({ width: W, height: H });
  PNG.bitblt(img, c, X, Y, Math.min(W, img.width - X), Math.min(H, img.height - Y), 0, 0);
  return c;
};
const a = crop(load(refPath));
const b = crop(load(appPath));
const d = new PNG({ width: W, height: H });
pixelmatch(a.data, b.data, d.data, W, H, { threshold: 0.1 });

const outImg = new PNG({ width: W * S, height: H * S * 3 + 2 * S });
outImg.data.fill(255);
[a, b, d].forEach((img, k) => {
  for (let yy = 0; yy < H * S; yy++)
    for (let xx = 0; xx < W * S; xx++) {
      const si = ((Math.floor(yy / S)) * W + Math.floor(xx / S)) * 4;
      const di = ((yy + k * (H * S + S)) * outImg.width + xx) * 4;
      for (let c = 0; c < 4; c++) outImg.data[di + c] = img.data[si + c];
    }
});
fs.writeFileSync(out, PNG.sync.write(outImg));
