// Capture reference screenshots from the design prototype in docs/.
// Usage: node scripts/visual/proto-shots.mjs <outDir> [filter]
import path from "node:path";
import fs from "node:fs";
import { chromium } from "playwright";
import { serveDir } from "./serve.mjs";

const ROOT = path.resolve("docs");
const OUT = path.resolve(process.argv[2] ?? "shots/proto");
const FILTER = process.argv[3] ?? "";
const PORT = 4390;

const bell = { svg: 'svg path[d^="M8 1.5a4.2"]' };
const APP = "Tally Prototype.dc.html";
const OB = "Tally Onboarding.dc.html";

// [board, variant label, scenario name, actions]
const desktopApp = [
  ["ledger", []],
  ["team", [{ text: "Team" }]],
  ["team-rolemenu", [{ text: "Team" }, { text: "MANAGER", nth: 0 }]],
  ["export", [{ text: "Export" }]],
  ["palette", [{ text: "⌘K" }]],
  ["log", [{ text: "Log holiday work" }]],
  ["log-attached", [{ text: "Log holiday work" }, { text: "Tap to attach your proof image" }]],
  ["leave", [{ text: "⌘K" }, { text: "File a leave" }]],
  ["proof", [{ text: "shift_0831.jpg", partial: true }]],
  ["invite", [{ text: "Team" }, { text: "＋ Invite" }]],
  ["notif", [bell]],
];
const mobileApp = [
  ["ledger", []],
  ["team", [{ svg: 'svg circle[cx="5.5"]' }]],
  ["export", [{ svg: 'svg path[d^="M8 2v7"]' }]],
  ["palette", [{ text: "＋" }]],
  ["log", [{ text: "Log →" }]],
  ["leave", [{ text: "＋" }, { text: "File a leave" }]],
  ["proof", [{ text: "shift_0831.jpg", partial: true }]],
  ["invite", [{ svg: 'svg circle[cx="5.5"]' }, { text: "＋ INVITE" }]],
  ["notif", [bell]],
];
const onboarding = [
  ["login", []],
  ["start", [{ text: "Continue with Google", partial: true }]],
  ["setup", [{ text: "Continue with Google", partial: true }, { text: "Start my own space" }]],
  ["setup-join", [{ text: "Continue with Google", partial: true }, { text: "Join Bluefin Studio" }]],
  ["invite", [{ text: "Continue with Google", partial: true }, { text: "Start my own space" }, { text: "Continue →" }]],
];

const SCENARIOS = [];
for (const [label, slug] of [
  ["Desktop dark", "desktop-dark"],
  ["Desktop light", "desktop-light"],
]) for (const [n, a] of desktopApp) SCENARIOS.push([APP, label, `${slug}/${n}`, a]);
for (const [label, slug] of [
  ["Mobile dark", "mobile-dark"],
  ["Mobile light", "mobile-light"],
]) for (const [n, a] of mobileApp) SCENARIOS.push([APP, label, `${slug}/${n}`, a]);
for (const [label, slug] of [
  ["Onboarding desktop dark", "desktop-dark"],
  ["Onboarding desktop light", "desktop-light"],
  ["Onboarding mobile dark", "mobile-dark"],
  ["Onboarding mobile light", "mobile-light"],
]) for (const [n, a] of onboarding) SCENARIOS.push([OB, label, `${slug}/onboarding-${n}`, a]);

async function run(browser, [board, label, name, actions]) {
  const page = await browser.newPage({ viewport: { width: 1900, height: 2400 } });
  await page.goto(`http://localhost:${PORT}/${encodeURIComponent(board)}`);
  // Board artifact: each frame sits under an 11px label with a 16.5px line box,
  // putting the whole design on a half-pixel (y=71.5) so text snaps a row lower
  // than borders. Pin the label to 16px so frames start on whole pixels, like
  // the real app does.
  // Also hide the other variants, so frames in the board's second row don't
  // inherit a fractional origin from the first row's content height.
  await page.addStyleTag({
    content:
      "[data-screen-label] > span { line-height: 16px !important; }" +
      `[data-screen-label]:not([data-screen-label="${label}"]) { display: none !important; }`,
  });
  const variant = page.locator(`[data-screen-label="${label}"]`);
  await variant.getByText("TALLY", { exact: true }).first().waitFor({ timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  for (const act of actions) {
    const target = act.svg
      ? variant.locator(act.svg).first()
      : act.nth !== undefined
        ? variant.getByText(act.text, { exact: !act.partial }).nth(act.nth)
        : variant.getByText(act.text, { exact: !act.partial }).first();
    await target.click({ force: !!act.svg });
    await page.waitForTimeout(250);
  }
  await page.mouse.move(0, 0);
  await page.waitForTimeout(150);

  const frame = variant.locator(":scope > div").first();
  const box = await frame.boundingBox();
  const file = path.join(OUT, `${name}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({
    path: file,
    clip: { x: box.x + 1, y: box.y + 1, width: box.width - 2, height: box.height - 2 },
  });
  // The frame's exact (often fractional) content height — the PNG truncates it.
  fs.writeFileSync(file.replace(/\.png$/, ".json"), JSON.stringify({ height: box.height - 2 }));
  await page.close();
  return `${name} ${Math.round(box.width - 2)}x${Math.round(box.height - 2)}`;
}

const server = await serveDir(ROOT, PORT);
const browser = await chromium.launch();
const todo = SCENARIOS.filter((s) => s[2].includes(FILTER));
const results = [];
for (let i = 0; i < todo.length; i += 6) {
  const batch = await Promise.allSettled(todo.slice(i, i + 6).map((s) => run(browser, s)));
  batch.forEach((r, j) =>
    results.push(r.status === "fulfilled" ? r.value : `FAIL ${todo[i + j][2]}: ${r.reason?.message?.split("\n")[0]}`),
  );
}
await browser.close();
server.close();
console.log(results.join("\n"));
