const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, ".."),
  shots = path.join(root, "../docs/screenshots/puzzle-2d");
fs.mkdirSync(shots, { recursive: true });
(async () => {
  await import(path.join(root, "scripts/prepare-public.mjs"));
  const server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/vite/bin/vite.js"),
      "--port",
      "5174",
      "--strictPort",
    ],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
  );
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error("server startup timeout")),
        15000,
      );
      server.stdout.on("data", (b) => {
        if (b.toString().includes("Local:")) {
          clearTimeout(timer);
          resolve();
        }
      });
      server.stderr.on("data", (b) => {
        if (b.toString().includes("Error:")) {
          clearTimeout(timer);
          reject(Error(b.toString()));
        }
      });
      server.on("exit", (code) => {
        clearTimeout(timer);
        reject(Error("server exit " + code));
      });
    });
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
      args: ["--no-sandbox", "--no-proxy-server"],
    });
    const page = await browser.newPage({
        viewport: { width: 1360, height: 940 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:5174/");
    await page.locator("[data-piece]").first().waitFor();
    const count = () => page.locator("#count").innerText();
    const waitCount = async (n, total) =>
      page.waitForFunction(
        ([n, total]) =>
          document.querySelector("#count").textContent === `${n} / ${total}`,
        [n, total],
      );
    async function settings() {
      await page.getByRole("button", { name: "游戏设置", exact: true }).click();
    }
    async function mode(level, shape, reset = true) {
      await settings();
      await page.getByLabel("难度", { exact: true }).selectOption(level);
      await page.getByLabel("形状", { exact: true }).selectOption(shape);
      await page
        .getByRole("button", {
          name: reset ? "重新开始这一局" : "回到春天",
          exact: true,
        })
        .click();
    }
    async function showPiece(id) {
      for (let i = 0; i < 20; i++) {
        if (await page.locator(`[data-piece="${id}"]`).count())
          return page.locator(`[data-piece="${id}"]`);
        const next = page.getByRole("button", {
          name: "下一页碎片",
          exact: true,
        });
        if (await next.isEnabled()) await next.click();
        else {
          const prev = page.getByRole("button", {
            name: "上一页碎片",
            exact: true,
          });
          while (await prev.isEnabled()) await prev.click();
        }
      }
      throw Error(`piece ${id} not found`);
    }
    async function target(id, cols, rows) {
      const r = await page.locator(".board").boundingBox();
      return {
        x: r.x + (((id % cols) + 0.5) * r.width) / cols,
        y: r.y + ((Math.floor(id / cols) + 0.5) * r.height) / rows,
      };
    }
    async function clickPlace(id) {
      const piece = await showPiece(id);
      await piece.click();
      await page.locator(`[data-slot="${id}"]`).click();
    }
    // Preserve existing v1 saves and restore the selected difficulty.
    await mode("easy", "classic");
    await clickPlace(0);
    await waitCount(1, 12);
    await page.reload();
    await waitCount(1, 12);
    assert.equal(
      await page
        .getByRole("button", { name: "开启声音", exact: true })
        .getAttribute("aria-pressed"),
      "false",
    );
    await mode("easy", "classic");
    // A short click lifts/selects; a wrong placement or a cancelled drag does not paint.
    await (await showPiece(0)).click();
    await page.locator('[data-slot="1"]').click();
    assert.equal(await count(), "0 / 12");
    let source = await (await showPiece(0)).boundingBox(),
      dest = await target(0, 3, 4);
    await page.mouse.move(
      source.x + source.width / 2,
      source.y + source.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(dest.x + 100, dest.y + 90, { steps: 6 });
    assert.equal(await page.locator('[data-floating="0"]').count(), 1);
    await page.screenshot({
      path: path.join(shots, "desktop-floating.png"),
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    assert.equal(await count(), "0 / 12");
    assert.equal(await page.locator("[data-floating]").count(), 0);
    source = await (await showPiece(0)).boundingBox();
    await page.mouse.move(
      source.x + source.width / 2,
      source.y + source.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(dest.x + 100, dest.y + 80, { steps: 6 });
    await page.mouse.move(dest.x + 8, dest.y, { steps: 6 });
    await waitCount(1, 12); // Magnet commits before the mouse is released.
    await page.mouse.up();
    assert.equal(await page.locator("[data-floating]").count(), 0);
    await page.screenshot({
      path: path.join(shots, "desktop-game.png"),
      fullPage: true,
    });
    // Release away from the correct target returns to the tray without saving.
    source = await (await showPiece(1)).boundingBox();
    await page.mouse.move(
      source.x + source.width / 2,
      source.y + source.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(60, 850, { steps: 5 });
    await page.mouse.up();
    await page.locator("[data-floating]").waitFor({ state: "detached" });
    assert.equal(await count(), "1 / 12");
    console.log(
      "PASS lift, floating preview, cancellation, automatic magnetic snap and invalid return",
    );
    if (process.env.BROWSER_SCOPE !== "focused")
      for (const level of ["easy", "medium", "hard"])
        for (const shape of ["flat", "classic", "organic"]) {
          await mode(level, shape);
          const total = { easy: 12, medium: 24, hard: 48 }[level];
          await page.getByRole("button", { name: "提示", exact: true }).click();
          assert.equal(await page.locator(".slot.hint").count(), 1);
          await page.getByRole("button", { name: "参考", exact: true }).click();
          assert.equal(await page.locator("[data-slot]").count(), 0);
          assert.ok(await page.locator("[data-piece]").first().isDisabled());
          await page.getByRole("button", { name: "参考", exact: true }).click();
          for (let id = 0; id < total; id++) await clickPlace(id);
          await waitCount(total, total);
          assert.equal(await page.locator(".memory-chip.unlocked").count(), 4);
          assert.equal(await page.locator("[data-piece]").count(), 0);
          await page.reload();
          await waitCount(total, total);
          assert.equal(await page.locator(".memory-chip.unlocked").count(), 4);
          assert.equal(
            await page.locator(".dialogue").getAttribute("data-cue"),
            "opening",
          );
          console.log(
            `PASS ${level}/${shape}: all pieces, paging, reference, four story regions and reload`,
          );
        }
    // Region events are based on their image area, not total-piece milestones.
    await mode("easy", "classic");
    const grassIds = await import(path.join(root, "src/gameplay.js")).then(
      (m) =>
        m.regionPieces(
          m.memories.find((x) => x.id === "grass"),
          3,
          4,
        ),
    );
    for (const id of grassIds) await clickPlace(id);
    assert.equal(await page.locator('[data-memory="grass"]').isEnabled(), true);
    assert.equal(
      await page.locator('[data-memory="wuxian"]').isDisabled(),
      true,
    );
    assert.equal(await page.locator(".grass-sway").count(), 1);
    for (
      let i = 0;
      i < 6 &&
      (await page.locator(".dialogue").getAttribute("data-cue")) !== "grass";
      i++
    )
      await page
        .getByRole("button", { name: "下一句字幕", exact: true })
        .click();
    assert.equal(
      await page.locator(".dialogue").getAttribute("data-cue"),
      "grass",
    );
    await page.waitForFunction(
      () =>
        document.querySelector(".dialogue-copy p[aria-hidden]").textContent
          .length > 2,
    );
    await page.screenshot({
      path: path.join(shots, "region-subtitles.png"),
      fullPage: true,
    });
    // Keyboard fallback after paging, without a drag or a hidden implementation hook.
    const p0 = await showPiece(0);
    await p0.focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-slot="0"]').focus();
    await page.keyboard.press("Enter");
    await waitCount(grassIds.length + 1, 12);
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(viewport);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      for (const selector of [".board", ".tray", ".dialogue"]) {
        const r = await page.locator(selector).boundingBox();
        assert.ok(
          r.y >= 0 && r.y + r.height <= viewport.height,
          `${selector} fits ${viewport.width}x${viewport.height}`,
        );
      }
      await page.screenshot({
        path: path.join(shots, `game-${viewport.width}x${viewport.height}.png`),
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "放大", exact: true }).click();
    assert.equal(
      await page
        .locator(".board-scroller")
        .evaluate((el) => el.scrollHeight > el.clientHeight),
      true,
    );
    await page.getByRole("button", { name: "缩小", exact: true }).click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page
      .getByRole("button", { name: "叶尖水珠，已解锁，点击回听", exact: true })
      .click();
    // Genuine Chromium touch input exercises pointer capture and the finger offset.
    const touch = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const tp = await touch.newPage();
    await tp.goto("http://127.0.0.1:5174/");
    await tp.locator("[data-piece]").first().waitFor();
    const cd = await touch.newCDPSession(tp);
    const touchSource = await tp.locator("[data-piece]").first().boundingBox(),
      touchId = Number(
        await tp.locator("[data-piece]").first().getAttribute("data-piece"),
      ),
      br = await tp.locator(".board").boundingBox();
    const tx = br.x + (((touchId % 3) + 0.5) * br.width) / 3,
      ty = br.y + ((Math.floor(touchId / 3) + 0.5) * br.height) / 4;
    await cd.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        {
          x: touchSource.x + touchSource.width / 2,
          y: touchSource.y + touchSource.height / 2,
        },
      ],
    });
    await cd.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: tx + 75, y: ty + 90 }],
    });
    await tp.screenshot({
      path: path.join(shots, "mobile-touch-floating.png"),
      fullPage: true,
    });
    await cd.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    assert.equal(await tp.locator("#count").innerText(), "0 / 12");
    assert.equal(await tp.locator("[data-floating]").count(), 0);
    await cd.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        {
          x: touchSource.x + touchSource.width / 2,
          y: touchSource.y + touchSource.height / 2,
        },
      ],
    });
    await cd.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: tx, y: ty + 46 }],
    });
    await tp.waitForFunction(
      () => document.querySelector("#count").textContent === "1 / 12",
    );
    await cd.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await touch.close();
    const blocked = await browser.newContext();
    await blocked.addInitScript(() =>
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("blocked");
        },
      }),
    );
    const bp = await blocked.newPage();
    await bp.goto("http://127.0.0.1:5174/");
    const bid = await bp
      .locator("[data-piece]")
      .first()
      .getAttribute("data-piece");
    await bp.locator(`[data-piece="${bid}"]`).click();
    await bp.locator(`[data-slot="${bid}"]`).click();
    assert.equal(await bp.locator("#count").innerText(), "1 / 12");
    assert.ok(
      (await bp.locator(".interaction-message").innerText()).includes(
        "无法保存",
      ),
    );
    await blocked.close();
    // Instrument browser audio scheduling without relying on OS speakers or voice packs.
    const ac = await browser.newContext();
    await ac.addInitScript(() => {
      window.__soundEvents = 0;
      window.__spoken = [];
      window.__mix = [];
      window.__loopPeaks = [];
      let gains = 0;
      localStorage.setItem(
        "shiguang-react-v1-easy-classic",
        JSON.stringify(
          Array.from({ length: 12 }, (_, i) => i).filter((i) => i !== 2),
        ),
      );
      window.AudioContext = class {
        state = "running";
        currentTime = 0;
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
        createBuffer(_channels, length) {
          const samples = new Float32Array(length);
          return {
            getChannelData() {
              return samples;
            },
          };
        }
        createBufferSource() {
          return {
            connect(node) {
              return node;
            },
            start() {
              const samples = this.buffer.getChannelData(0);
              window.__loopPeaks.push(
                samples.reduce(
                  (peak, sample) => Math.max(peak, Math.abs(sample)),
                  0,
                ),
              );
            },
          };
        }
        createOscillator() {
          return {
            frequency: { value: 0 },
            connect() {},
            start() {
              window.__soundEvents++;
            },
            stop() {},
          };
        }
        createGain() {
          const index = gains++;
          return {
            gain: {
              setTargetAtTime(value) {
                window.__mix[index] = value;
              },
              setValueAtTime() {},
              linearRampToValueAtTime() {},
              exponentialRampToValueAtTime() {},
            },
            connect() {},
          };
        }
      };
      window.SpeechSynthesisUtterance = class {
        constructor(text) {
          this.text = text;
        }
      };
      Object.defineProperty(window, "speechSynthesis", {
        value: {
          getVoices() {
            return [
              { lang: "zh-CN", name: "试音一" },
              { lang: "zh-CN", name: "试音二" },
            ];
          },
          speak(item) {
            window.__spoken.push(item.text);
            window.__lastUtterance = item;
          },
          cancel() {},
        },
      });
    });
    const ap = await ac.newPage();
    await ap.goto("http://127.0.0.1:5174/");
    await ap.locator('[data-memory="grass"]').click();
    assert.equal(await ap.evaluate(() => window.__soundEvents), 0);
    await ap.getByRole("button", { name: "开启声音", exact: true }).click();
    await ap.waitForFunction(
      () => window.__mix[0] > 0 && window.__mix[1] === 0 && window.__mix[2] > 0,
    );
    const peaks = await ap.evaluate(() => window.__loopPeaks);
    assert.equal(peaks.length, 3);
    assert.ok(peaks.every((peak) => peak > 0 && peak <= 1));
    await ap.locator('[data-piece="2"]').click();
    await ap.locator('[data-slot="2"]').click();
    await ap.waitForFunction(
      () => window.__mix[1] > 0 && window.__mix[0] < 0.29,
    );
    await ap.getByRole("button", { name: "游戏设置", exact: true }).click();
    await ap.getByLabel("背景音乐", { exact: false }).uncheck();
    await ap.waitForFunction(
      () => window.__mix[2] === 0 && window.__mix[1] > 0,
    );
    await ap.getByLabel("对白朗读", { exact: false }).check();
    await ap.getByRole("button", { name: "回到春天", exact: true }).click();
    await ap.locator('[data-memory="grass"]').click();
    for (
      let i = 0;
      i < 4 &&
      !(await ap.locator(".dialogue").getAttribute("data-cue")).startsWith(
        "grass-replay",
      );
      i++
    )
      await ap.getByRole("button", { name: "下一句字幕", exact: true }).click();
    assert.ok(await ap.evaluate(() => window.__soundEvents > 0));
    assert.ok(
      (await ap.evaluate(() => window.__spoken)).some((text) =>
        text.includes("让它在叶子上"),
      ),
    );
    const xiaohei = await ap.evaluate(() => ({
      pitch: window.__lastUtterance.pitch,
      voice: window.__lastUtterance.voice.name,
    }));
    await ap.locator('[data-memory="umbrella"]').click();
    await ap.waitForFunction(() =>
      window.__lastUtterance.text.includes("靠近一点"),
    );
    const wuxian = await ap.evaluate(() => ({
      pitch: window.__lastUtterance.pitch,
      voice: window.__lastUtterance.voice.name,
    }));
    assert.ok(xiaohei.pitch > wuxian.pitch && xiaohei.voice !== wuxian.voice);
    await ap.evaluate(() =>
      window.__lastUtterance.onerror({ error: "interrupted" }),
    );
    await ap.getByRole("button", { name: "游戏设置", exact: true }).click();
    assert.ok(
      !(await ap.locator(".settings-content").innerText()).includes(
        "系统朗读未能播放",
      ),
    );
    await ap.getByRole("button", { name: "回到春天", exact: true }).click();
    await ap.getByRole("button", { name: "关闭声音", exact: true }).click();
    await ap.waitForFunction(() =>
      window.__mix.slice(0, 3).every((level) => level === 0),
    );
    const soundCount = await ap.evaluate(() => window.__soundEvents);
    await ap.locator('[data-memory="grass"]').click();
    assert.equal(await ap.evaluate(() => window.__soundEvents), soundCount);
    await ap.getByRole("button", { name: "开启声音", exact: true }).click();
    await ap.evaluate(() => {
      window.speechSynthesis.getVoices = () => [];
    });
    await ap.locator('[data-memory="grass"]').click();
    await ap.getByRole("button", { name: "游戏设置", exact: true }).click();
    assert.ok(
      (await ap.locator(".settings-content").innerText()).includes(
        "未找到中文系统语音",
      ),
    );
    await ac.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS spatial subtitle/grass cue, keyboard, 3 viewport layouts, zoom, reduced motion, real touch pointer input, blocked storage, opt-in audio/voice scheduling and missing Chinese voice fallback",
    );
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
