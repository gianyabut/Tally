// Capture the app's /preview screens at the exact size of each prototype
// reference, performing the same interactions.
// Usage: node scripts/visual/app-shots.mjs <refDir> <outDir> [filter]
import path from "node:path";
import fs from "node:fs";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const REF = path.resolve(process.argv[2]);
const OUT = path.resolve(process.argv[3]);
const FILTER = process.argv[4] ?? "";
const BASE = process.env.APP_URL ?? "http://localhost:3000";

// A tiny image to "attach" as a proof.
const PROOF = path.join(OUT, "_fixtures", "proof_1130.png");
fs.mkdirSync(path.dirname(PROOF), { recursive: true });
const img = new PNG({ width: 8, height: 8 });
img.data.fill(200);
fs.writeFileSync(PROOF, PNG.sync.write(img));

const bell = { role: "Notifications" };
const common = {
  ledger: ["/preview/ledger", []],
  team: ["/preview/team", []],
  export: ["/preview/export", []],
  proof: ["/preview/ledger", [{ text: "shift_0831.jpg", partial: true }]],
  notif: ["/preview/ledger", [bell]],
  "onboarding-login": ["/login", []],
  "onboarding-start": ["/preview/onboarding", []],
  "onboarding-setup": ["/preview/onboarding", [{ text: "Start my own space" }]],
  "onboarding-setup-join": ["/preview/onboarding", [{ text: "Join Bluefin Studio" }]],
  "onboarding-invite": ["/preview/onboarding", [{ text: "Start my own space" }, { text: "Continue →" }]],
};
const desktop = {
  ...common,
  "team-rolemenu": ["/preview/team", [{ text: "MANAGER" }]],
  palette: ["/preview/ledger", [{ text: "⌘K" }]],
  log: ["/preview/ledger", [{ text: "Log holiday work" }]],
  "log-attached": ["/preview/ledger", [{ text: "Log holiday work" }, { upload: "Tap to attach your proof image" }]],
  leave: ["/preview/ledger", [{ text: "⌘K" }, { text: "File a leave" }]],
  invite: ["/preview/team", [{ text: "＋ Invite" }]],
};
const mobile = {
  ...common,
  palette: ["/preview/ledger", [{ text: "＋" }]],
  log: ["/preview/ledger", [{ text: "Log →" }]],
  leave: ["/preview/ledger", [{ text: "＋" }, { text: "File a leave" }]],
  invite: ["/preview/team", [{ text: "＋ INVITE" }]],
};

const jobs = [];
for (const variant of fs.readdirSync(REF)) {
  const [device, theme] = variant.split("-");
  const table = device === "desktop" ? desktop : mobile;
  for (const file of fs.readdirSync(path.join(REF, variant))) {
    if (!file.endsWith(".png")) continue;
    const name = file.replace(/\.png$/, "");
    if (!table[name]) continue;
    const id = `${variant}/${name}`;
    if (!id.includes(FILTER)) continue;
    const ref = PNG.sync.read(fs.readFileSync(path.join(REF, variant, file)));
    // The board renders the mobile app at width:390px inside a 390px border-box
    // frame (388px content), clipping its right 2px — so render at 390, crop to 388.
    const renderWidth = device === "mobile" ? 390 : ref.width;
    // Render at the design's exact content height (rounded), not the PNG's
    // truncated height, so bottom-anchored UI lands on the same pixel row.
    const meta = path.join(REF, variant, `${name}.json`);
    const renderHeight = fs.existsSync(meta)
      ? Math.round(JSON.parse(fs.readFileSync(meta, "utf8")).height)
      : ref.height;
    jobs.push({ id, theme, size: { width: ref.width, height: ref.height }, renderWidth, renderHeight, spec: table[name] });
  }
}

async function run(browser, job) {
  const ctx = await browser.newContext({ viewport: { width: job.renderWidth, height: job.renderHeight } });
  await ctx.addInitScript((t) => localStorage.setItem("tally-theme", t), job.theme);
  const page = await ctx.newPage();
  const [url, actions] = job.spec;
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  // Hide the Next.js dev-tools badge.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  for (const act of actions) {
    if (act.role) {
      await page.getByRole("button", { name: act.role }).filter({ visible: true }).first().click();
    } else if (act.upload) {
      const chooser = page.waitForEvent("filechooser");
      await page.getByText(act.upload).filter({ visible: true }).first().click();
      await (await chooser).setFiles(PROOF);
    } else {
      await page.getByText(act.text, { exact: !act.partial }).filter({ visible: true }).first().click();
    }
    await page.waitForTimeout(250);
  }
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  const file = path.join(OUT, `${job.id}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, clip: { x: 0, y: 0, ...job.size } });
  await ctx.close();
  return job.id;
}

const browser = await chromium.launch();
const results = [];
for (let i = 0; i < jobs.length; i += 4) {
  const batch = await Promise.allSettled(jobs.slice(i, i + 4).map((j) => run(browser, j)));
  batch.forEach((r, k) =>
    results.push(r.status === "fulfilled" ? `ok   ${r.value}` : `FAIL ${jobs[i + k].id}: ${r.reason?.message?.split("\n")[0]}`),
  );
}
await browser.close();
console.log(results.join("\n"));
