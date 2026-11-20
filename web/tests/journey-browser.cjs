const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, ".."), origin = "http://127.0.0.1:5190";
const shots = path.join(root, "../docs/screenshots/solar-journey");

(async () => {
  await import(path.join(root, "scripts/prepare-public.mjs"));
  const { solarTerms } = await import(path.join(root, "src/solarTerms.js"));
  assert.ok(solarTerms.every((term) => fs.existsSync(path.join(root, "public", term.image))), "先准备本地二十四节气图片");
  fs.mkdirSync(shots, { recursive: true });
  const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "--port", "5190", "--strictPort"],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let browser, activePage;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error("server timeout")), 15000);
      server.stdout.on("data", (data) => { if (data.toString().includes("Local:")) { clearTimeout(timer); resolve(); } });
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
      if (process.env.JOURNEY_SCOPE && process.env.JOURNEY_SCOPE !== label) continue;
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
      const page = await context.newPage(), errors = [], outside = [];
      activePage = page;
      page.on("pageerror", (error) => errors.push(error.message));
      await context.route("**/*", (route) => {
        const url = route.request().url();
        if (url.startsWith(origin + "/")) return route.continue();
        outside.push(url); return route.abort();
      });
      const activate = (locator) => touch ? locator.tap() : locator.click();
      const count = (n) => page.waitForFunction((n) => document.querySelector("#count").textContent === `${n} / 12`, n);
      const lights = (n) => page.waitForFunction((n) => JSON.parse(localStorage.getItem("shiguang-solar-journey-v1")).completed.length === n, n);
      async function seasonBar(id) {
        const term = solarTerms.find((item) => item.id === id);
        assert.equal(await page.locator(".year-progress").getAttribute("data-current-season"), term.season);
        assert.deepEqual(await page.locator("[data-progress-term]").evaluateAll((nodes) => nodes.map((n) => n.dataset.progressTerm)), solarTerms.filter((item) => item.season === term.season).map((item) => item.id));
        assert.equal(await page.locator(".year-dots i").count(), 6);
      }
      const open = () => activate(page.getByRole("button", { name: /^选择节气，已点亮/ }));
      async function finishPuzzle(from = 0) {
        for (let i = from; i < 12; i++) {
          const piece = page.locator("[data-piece]").first();
          const id = await piece.getAttribute("data-piece");
          await page.waitForFunction(() => !document.querySelector("[data-piece]")?.disabled);
          if (touch) {
            await piece.tap();
            await page.locator(`[data-slot="${id}"]`).tap();
          } else {
            await piece.press("Enter");
            await page.locator(`[data-slot="${id}"]`).press("Enter");
          }
          await count(i + 1);
        }
      }
      await page.goto(origin);
      assert.equal(await page.locator(".game-title > span").innerText(), "立春");
      await seasonBar("startSpring");
      await page.screenshot({ path: path.join(shots, `${label}-game-spring.png`), fullPage: true });
      await open();
      assert.equal(await page.locator("[data-term]").count(), 24);
      // All thumbnails must really load. Scroll lazy images into the dialog viewport.
      for (const season of ["spring", "summer", "autumn", "winter"]) {
        const ids = solarTerms.filter((term) => term.season === season).map((term) => term.id);
        await page.locator(`[data-term="${ids[0]}"]`).scrollIntoViewIfNeeded();
        await page.waitForFunction((ids) => ids.every((id) => {
          const image = document.querySelector(`[data-term="${id}"] img`);
          return image?.complete && image.naturalWidth > 0;
        }), ids);
      }
      await page.locator('[data-term="startSpring"]').scrollIntoViewIfNeeded();
      const flow = await page.locator('.season-track').first().evaluate((track) => {
        const nodes = [...track.querySelectorAll('.term-node')].map((n) => n.getBoundingClientRect());
        const turn = getComputedStyle(track.querySelector('.term-link-turn'));
        return { forward: nodes[0].x < nodes[1].x && nodes[1].x < nodes[2].x,
          folded: nodes[2].y < nodes[3].y && Math.abs(nodes[2].x - nodes[3].x) < 1 && nodes[3].x > nodes[4].x && nodes[4].x > nodes[5].x,
          allOneRow: nodes.every((n) => Math.abs(n.y - nodes[0].y) < 1),
          turnLine: parseFloat(turn.height) >= 124 && turn.borderRightWidth === '1px' };
      });
      assert.equal(flow.forward, true);
      if (touch) { assert.equal(flow.folded, true); assert.equal(flow.turnLine, true); }
      else assert.equal(flow.allOneRow, true);
      assert.equal(await page.locator('[data-status="locked"]').count(), 23);
      assert.equal(await page.locator('[data-term="rain"]').isDisabled(), true);
      await page.screenshot({ path: path.join(shots, `${label}-start.png`), fullPage: true });
      await activate(page.locator('[data-term="startSpring"]'));
      await page.waitForFunction(() => !document.querySelector("[data-piece]")?.disabled);
      const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth,
        boardInside: document.querySelector(".board").getBoundingClientRect().bottom <= innerHeight,
        trayInside: document.querySelector(".tray").getBoundingClientRect().bottom <= innerHeight,
        boardUnclipped: document.querySelector(".board").getBoundingClientRect().bottom <= document.querySelector(".board-scroller").getBoundingClientRect().bottom + 1 }));
      assert.deepEqual(layout, { overflow: false, boardInside: true, trayInside: true, boardUnclipped: true });
      if (touch) {
        const piece = page.locator("[data-piece]").first(), id = Number(await piece.getAttribute("data-piece"));
        const source = await piece.boundingBox(), board = await page.locator(".board").boundingBox();
        const cdp = await context.newCDPSession(page);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: source.x + source.width / 2, y: source.y + source.height / 2 }] });
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{
          x: board.x + ((id % 3 + .5) * board.width) / 3,
          y: board.y + ((Math.floor(id / 3) + .5) * board.height) / 4 + 46 }] });
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await count(1);
        await lights(0);
        await finishPuzzle(1);
      } else await finishPuzzle();
      await lights(1);
      assert.equal(await page.locator(".year-dots .lit").count(), 1);
      await page.screenshot({ path: path.join(shots, `${label}-first-light.png`), fullPage: true });
      await open();
      assert.equal(await page.locator('[data-term="startSpring"]').getAttribute("data-status"), "complete");
      assert.equal(await page.locator('[data-term="rain"]').getAttribute("data-status"), "available");
      assert.equal(await page.locator('[data-term="insects"]').getAttribute("data-status"), "locked");
      await page.screenshot({ path: path.join(shots, `${label}-journey.png`), fullPage: true });
      if (touch) {
        await page.locator('[data-term="majorCold"]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(shots, `${label}-journey-winter.png`), fullPage: true });
      }
      await activate(page.locator('[data-term="rain"]'));
      assert.equal(await page.locator(".game-title > span").innerText(), "雨水");
      await count(0);
      if (label === "desktop") {
        for (let index = 1; index < 24; index++) {
          await finishPuzzle();
          await lights(index + 1);
          if ((index + 1) % 6 === 0) console.log(`PASS desktop journey: ${index + 1}/24 completed with real keyboard input`);
          if (index < 23) {
            await page.getByRole("button", { name: `下一节气 · ${solarTerms[index + 1].title}`, exact: true }).click();
            assert.equal(await page.locator(".game-title > span").innerText(), solarTerms[index + 1].title);
            await count(0);
            await seasonBar(solarTerms[index + 1].id);
            if (index === 5) await page.screenshot({ path: path.join(shots, "desktop-game-summer.png"), fullPage: true });
          }
        }
        await page.reload(); await lights(24); await open();
        assert.equal(await page.locator('[data-status="complete"]').count(), 24);
        await page.screenshot({ path: path.join(shots, "desktop-year-complete.png"), fullPage: true });
      } else {
        await page.reload(); await lights(1); await open();
        assert.equal(await page.locator('[data-term="rain"]').isDisabled(), false);
      }
      assert.deepEqual(errors, []); assert.deepEqual(outside, []);
      console.log(`PASS ${label}: 24 nodes/4 seasons, genuine ${touch ? "touch drag/taps" : "keyboard"} completion, one light/next unlock, refresh, layout, ${label === "desktop" ? "all 24 puzzles completed" : "phone navigation"}, no external requests`);
      await context.close();
    }
    // A persisted completed-spring fixture verifies switching to summer on phones.
    const summerContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await summerContext.addInitScript((ids) => {
      localStorage.setItem("shiguang-solar-journey-v1", JSON.stringify({ version: 1, completed: ids }));
      localStorage.setItem("shiguang-mode", JSON.stringify({ picture: "startSummer", level: "easy", shape: "classic", board: "guided" }));
    }, solarTerms.slice(0, 6).map((term) => term.id));
    const sp = await summerContext.newPage(); await sp.goto(origin);
    assert.equal(await sp.locator(".year-progress").getAttribute("data-current-season"), "summer");
    assert.equal(await sp.locator(".year-dots i").count(), 6);
    assert.equal(await sp.locator(".year-dots .lit").count(), 0);
    assert.match(await sp.locator(".year-progress").innerText(), /全年 6 \/ 24/);
    await sp.waitForFunction(() => !document.querySelector("[data-piece]")?.disabled);
    await sp.screenshot({ path: path.join(shots, "mobile-game-summer.png"), fullPage: true });
    await summerContext.close();
    console.log("PASS current-season-only six nodes; persisted spring completion switches to summer with independent season/year totals");
    const legacy = await browser.newContext();
    await legacy.addInitScript(() => {
      localStorage.setItem("shiguang-mode", JSON.stringify({ level: "medium", shape: "organic", picture: "equinox", board: "blank" }));
      localStorage.setItem("shiguang-puzzle-equinox-blank-medium-organic", "[0,4]");
      localStorage.setItem("shiguang-react-v1-easy-classic", JSON.stringify(Array.from({ length: 12 }, (_, i) => i)));
    });
    const lp = await legacy.newPage(); await lp.goto(origin);
    assert.equal(await lp.locator("#count").innerText(), "2 / 24");
    await lp.getByRole("button", { name: /^选择节气，已点亮/ }).click();
    assert.equal(await lp.locator('[data-term="rain"]').getAttribute("data-status"), "complete");
    assert.equal(await lp.locator('[data-term="equinox"]').getAttribute("data-status"), "available");
    assert.equal(await lp.locator('[data-term="startSpring"]').getAttribute("data-status"), "available");
    assert.equal(await lp.evaluate(() => localStorage.getItem("shiguang-puzzle-equinox-blank-medium-organic")), "[0,4]");
    await legacy.close();
    const missing = await browser.newContext();
    await missing.route("**/art/solar/startSpring.jpg", (route) => route.abort());
    const mp = await missing.newPage(); await mp.goto(origin);
    await mp.getByRole("alert").waitFor();
    assert.equal(await mp.locator("[data-piece]").first().isDisabled(), true);
    assert.equal(await mp.locator("#count").innerText(), "0 / 12");
    assert.deepEqual(await mp.evaluate(() => JSON.parse(localStorage.getItem("shiguang-solar-journey-v1")).completed), []);
    await mp.getByRole("button", { name: /^选择节气，已点亮/ }).click();
    await mp.locator('[data-term="startSpring"] .term-image-missing').waitFor();
    assert.match(await mp.locator('[data-term="startSpring"]').innerText(), /图片未载入/);
    assert.equal(await mp.locator('[data-term="rain"]').getAttribute("data-status"), "locked");
    await missing.close();
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }));
    const bp = await blocked.newPage(); await bp.goto(origin);
    await bp.getByRole("button", { name: /^选择节气，已点亮/ }).click();
    await bp.getByRole("status").filter({ hasText: "暂时无法保存旅程" }).waitFor();
    assert.equal(await bp.locator('[data-term="startSpring"]').isDisabled(), false);
    await blocked.close();
    console.log("PASS legacy three-picture save readback, missing-image guard, blocked storage");
  } catch (error) {
    if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: "/tmp/xiaohei-journey-failure.png", fullPage: true });
    throw error;
  } finally { await browser?.close(); server.kill(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
