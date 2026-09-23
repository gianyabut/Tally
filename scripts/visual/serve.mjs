// Tiny static file server for the design prototype in docs/ (the prototype
// runtime fetches sibling .dc.html files, so file:// won't work).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

export function serveDir(root, port) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    // The design-system bundle the prototype links isn't in docs/ — serve the
    // emulation of its reset instead (see ds-bundle-emulation.css).
    if (urlPath.startsWith("/_ds/")) {
      res.writeHead(200, { "Content-Type": TYPES[".css"] });
      fs.createReadStream(new URL("./ds-bundle-emulation.css", import.meta.url)).pipe(res);
      return;
    }
    const file = path.join(root, urlPath);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}
