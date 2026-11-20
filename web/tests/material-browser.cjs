const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, ".."), origin = "http://127.0.0.1:5189";
const shots = path.join(root, "../docs/screenshots/cardboard-puzzle");

(async () => {
  await import(path.join(root, "scripts/prepare-public.mjs"));
  fs.mkdirSync(shots, { recursive: true });
  const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"),
    "--port", "5189", "--strictPort"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let browser, activePage;
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
    for (const [label, width, height, touch, reduced] of [
      ["desktop", 1360, 940, false, false], ["mobile", 390, 844, true, false],
      ["mobile-small", 375, 667, true, false], ["mobile-narrow", 320, 568, true, false],
      ["reduced", 390, 844, true, true],
    ]) {
      if (process.env.MATERIAL_SCOPE && process.env.MATERIAL_SCOPE !== label) continue;
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch,
        isMobile: touch, reducedMotion: reduced ? "reduce" : "no-preference" });
      await context.addInitScript(() => {
        if (!localStorage.getItem("shiguang-react-v1-easy-classic"))
          localStorage.setItem("shiguang-react-v1-easy-classic", "[0]");
      });
      const page = await context.newPage(), errors = [];
      activePage = page;
      page.on("pageerror", (error) => errors.push(error.message));
      const activate = async (locator) => touch ? locator.tap() : locator.click();
      const counter = (expected) => page.waitForFunction((n) =>
        document.querySelector("#count").textContent === `${n} / 12`, expected);
      async function surface(value) {
        await activate(page.getByRole("button", { name: "游戏设置", exact: true }));
        await page.getByLabel("拼图质感", { exact: true }).selectOption(value);
        await activate(page.getByRole("button", { name: "回到春天", exact: true }));
      }
      await page.goto(origin);
      await counter(1);
      assert.equal(await page.locator(".game-shell").getAttribute("data-material"), "light");
      const before = await page.locator(".board").boundingBox();
      await surface("cardboard");
      await counter(1);
      assert.equal(await page.locator(".board").evaluate((board) => getComputedStyle(board).backgroundColor), "rgb(185, 193, 171)", "纸板样式必须在普通与减少动态模式下均生效");
      assert.equal(await page.locator(".piece-well").count(), 11);
      assert.equal(await page.locator('[data-slot="0"] .material-piece').count(), 1);
      const after = await page.locator(".board").boundingBox();
      assert.ok(Math.abs(before.width - after.width) < 1 && Math.abs(before.height - after.height) < 1);
      await page.reload();
      await counter(1);
      assert.equal(await page.locator(".game-shell").getAttribute("data-material"), "cardboard");
      const keyboardId = await page.locator("[data-piece]").first().getAttribute("data-piece");
      await page.locator(`[data-piece="${keyboardId}"]`).press("Enter");
      await page.locator(`[data-slot="${keyboardId}"]`).press("Enter");
      await counter(2);
      const piece = page.locator("[data-piece]").first();
      const id = Number(await piece.getAttribute("data-piece"));
      const cdp = touch ? await context.newCDPSession(page) : null;
      async function start() {
        const source = await piece.boundingBox();
        const sx = source.x + source.width / 2, sy = source.y + source.height / 2;
        if (touch) await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: sx, y: sy }] });
        else { await page.mouse.move(sx, sy); await page.mouse.down(); }
        await page.locator(".floating-piece.phase-held").waitFor();
      }
      async function moveToTarget() {
        const board = await page.locator(".board").boundingBox();
        const x = board.x + ((id % 3 + .5) * board.width) / 3;
        const y = board.y + ((Math.floor(id / 3) + .5) * board.height) / 4;
        if (touch) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + 46 }] });
        else await page.mouse.move(x, y);
      }
      await start();
      assert.equal(await page.locator(".floating-piece .cardboard-side").count(), 1);
      if (!reduced) await page.screenshot({ path: path.join(shots, `${label}-held.png`), fullPage: true });
      await moveToTarget();
      if (!reduced) {
        await page.locator(".floating-piece.phase-press").waitFor();
        assert.equal(await page.locator("#count").innerText(), "2 / 12");
        if (touch) {
          // A seated piece must stay unsaved while the finger is still down.
          await page.waitForTimeout(240);
          assert.equal(await page.locator("#count").innerText(), "2 / 12");
          await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
        }
        else { await page.keyboard.press("Escape"); await page.mouse.up(); }
        await page.locator(".floating-piece").waitFor({ state: "detached" });
        // Wait past the actual seating deadline to catch an uncanceled save.
        await page.waitForTimeout(450);
        await counter(2);
        assert.equal(await page.evaluate((id) => JSON.parse(localStorage.getItem("shiguang-react-v1-easy-classic")).includes(id), id), false);
        await start();
        await moveToTarget();
        await page.locator(".floating-piece.phase-press").waitFor();
      }
      if (touch) {
        assert.equal(await page.locator("#count").innerText(), "2 / 12");
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      }
      await counter(3);
      if (!touch) await page.mouse.up();
      assert.equal(await page.locator(`[data-slot="${id}"] .piece-well`).count(), 0);
      assert.equal(await page.locator(`[data-slot="${id}"] .material-piece`).count(), 1);
      if (reduced) {
        assert.equal(await page.locator(`[data-slot="${id}"]`).evaluate((el) => getComputedStyle(el).animationName), "none");
        await page.getByRole("button", { name: "开启声音", exact: true }).tap();
        assert.equal(await page.getByRole("button", { name: "关闭声音", exact: true }).count(), 1, "触摸与兼容 click 不应重复切换声音");
        await page.getByRole("button", { name: "关闭声音", exact: true }).tap();
        assert.equal(await page.getByRole("button", { name: "开启声音", exact: true }).count(), 1);
      } else {
        await page.screenshot({ path: path.join(shots, `${label}-seated.png`), fullPage: true });
      }
      const saved = await page.evaluate(() => localStorage.getItem("shiguang-react-v1-easy-classic"));
      await surface("light");
      assert.equal(await page.locator(".piece-well, .material-piece, .cardboard-side").count(), 0);
      assert.equal(await page.evaluate(() => localStorage.getItem("shiguang-react-v1-easy-classic")), saved);
      await surface("cardboard");
      const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth,
        boardInside: document.querySelector(".board").getBoundingClientRect().bottom <= innerHeight }));
      assert.deepEqual(layout, { overflow: false, boardInside: true });
      await page.reload();
      await counter(3);
      if (label === "desktop") {
        for (const level of ["easy", "medium", "hard"]) for (const shape of ["flat", "classic", "organic"]) {
          await activate(page.getByRole("button", { name: "游戏设置", exact: true }));
          await page.getByLabel("难度", { exact: true }).selectOption(level);
          await page.getByLabel("形状", { exact: true }).selectOption(shape);
          await activate(page.getByRole("button", { name: "回到春天", exact: true }));
          const button = page.locator("[data-piece]").first();
          const slot = await button.getAttribute("data-piece");
          await button.press("Enter");
          await page.locator(`[data-slot="${slot}"]`).press("Enter");
          assert.equal(await page.locator(`[data-slot="${slot}"] .material-piece`).count(), 1);
        }
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${label}: material toggle/persistence, old save preservation, keyboard, ${touch ? "real touch events" : "mouse drag"}, ${reduced ? "reduced motion" : "press phase/cancel without save"}, seating and layout`);
      await context.close();
    }
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }));
    const page = await blocked.newPage();
    await page.goto(origin);
    await page.getByRole("button", { name: "游戏设置", exact: true }).click();
    await page.getByLabel("拼图质感", { exact: true }).selectOption("cardboard");
    await page.getByRole("button", { name: "回到春天", exact: true }).click();
    assert.equal(await page.locator(".game-shell").getAttribute("data-material"), "cardboard");
    console.log("PASS blocked preference storage: material still switches in memory");
    await blocked.close();
  } catch (error) {
    if (activePage && !activePage.isClosed()) {
      await activePage.screenshot({ path: "/tmp/xiaohei-material-failure.png", fullPage: true });
    }
    throw error;
  } finally { await browser?.close(); server.kill(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
