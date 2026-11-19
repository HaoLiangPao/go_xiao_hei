const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const shots = path.join(root, "../docs/screenshots/chinese-dialogue");
const origin = "http://127.0.0.1:5186";

(async () => {
  await import(path.join(root, "scripts/prepare-public.mjs"));
  assert.equal(fs.readdirSync(path.join(root, "public/audio/dialogue")).length, 6,
    "先运行 npm run audio:generate；本检查使用真实 MP3，不使用音频替身。");
  fs.mkdirSync(shots, { recursive: true });
  const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"),
    "--port", "5186", "--strictPort"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error("server startup timeout")), 15000);
      server.stdout.on("data", (data) => {
        if (data.toString().includes("Local:")) { clearTimeout(timer); resolve(); }
      });
      server.stderr.on("data", (data) => { clearTimeout(timer); reject(Error(data.toString())); });
      server.on("exit", (code) => { clearTimeout(timer); reject(Error(`server exit ${code}`)); });
    });
    browser = await chromium.launch({ headless: true,
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
      args: ["--no-sandbox", "--no-proxy-server"] });
    for (const [label, width, height, touch] of [
      ["desktop", 1360, 940, false], ["mobile", 390, 844, true],
      ["mobile-small", 375, 667, true], ["mobile-narrow", 320, 568, true],
    ]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
      const errors = [], outside = [];
      await context.route("**/*", (route) => {
        const url = route.request().url();
        if (url.startsWith(origin + "/")) return route.continue();
        outside.push(url);
        return route.abort();
      });
      await context.addInitScript(() => {
        // The MP3 player is native. Only remove OS speech to reproduce the user's problem.
        Object.defineProperty(window, "speechSynthesis", { value: { getVoices: () => [], cancel() {} } });
        window.__clips = [];
        const NativeAudio = window.Audio;
        window.Audio = function (source) {
          const audio = new NativeAudio(source);
          audio.addEventListener("ended", () => { audio.__completed = true; });
          window.__clips.push(audio);
          return audio;
        };
        localStorage.setItem("shiguang-react-v1-easy-classic", JSON.stringify(Array.from({ length: 12 }, (_, i) => i)));
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(origin);
      const click = async (locator) => touch ? locator.tap() : locator.click();
      await click(page.getByRole("button", { name: "游戏设置", exact: true }));
      assert.equal(await page.getByRole("button", { name: "试听无限", exact: true }).isDisabled(), true);
      await click(page.getByLabel("游戏声音", { exact: true }));
      await click(page.getByRole("button", { name: "试听无限", exact: true }));
      await page.waitForFunction(() => window.__clips.at(-1)?.currentTime > 0.1);
      assert.match(await page.locator(".settings-note[role=status]").innerText(), /普通中文合成配音/);
      await click(page.getByRole("button", { name: "试听小黑", exact: true }));
      await page.waitForFunction(() => window.__clips.at(-1)?.currentTime > 0.1);
      assert.equal(await page.evaluate(() => window.__clips.at(-2).paused), true);
      await page.screenshot({ path: path.join(shots, `${label}.png`), fullPage: true });
      const layout = await page.evaluate(() => {
        const dialog = document.querySelector(".settings-dialog");
        const buttons = [...document.querySelectorAll(".voice-preview-buttons button")];
        const rect = dialog.getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth > innerWidth,
          dialogInside: rect.left >= 0 && rect.right <= innerWidth,
          tapTargets: buttons.every((button) => button.getBoundingClientRect().height >= 44) };
      });
      assert.deepEqual(layout, { overflow: false, dialogInside: true, tapTargets: true });
      await click(page.getByRole("button", { name: "停止", exact: true }));
      assert.equal(await page.evaluate(() => window.__clips.at(-1).paused), true);
      await click(page.getByRole("button", { name: "试听无限", exact: true }));
      await page.waitForFunction(() => window.__clips.at(-1)?.__completed, null, { timeout: 12000 });
      // Native recording also plays through a completed memory's replay action.
      await page.getByLabel("对白朗读", { exact: false }).check();
      await click(page.getByRole("button", { name: "回到春天", exact: true }));
      await click(page.locator('[data-memory="umbrella"]'));
      await page.waitForFunction(() => window.__clips.at(-1)?.currentTime > 0.1 && !window.__clips.at(-1).paused);
      await click(page.getByRole("button", { name: "关闭声音", exact: true }));
      assert.equal(await page.evaluate(() => window.__clips.at(-1).paused), true);
      assert.deepEqual(errors, []);
      assert.deepEqual(outside, []);
      console.log(`PASS ${label} ${width}×${height}: native MP3 decode/play/end, preview switch/stop, no Chinese OS voice, replay/mute, layout, ${touch ? "touch tap" : "mouse"}, no external requests`);
      await context.close();
    }
  } finally { await browser?.close(); server.kill(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
