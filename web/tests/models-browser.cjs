const { spawn } = require("node:child_process");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, ".."),
  origin = "http://127.0.0.1:5226";
const shots = path.join(root, "../docs/screenshots/model-lab");
(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/vite/bin/vite.js"),
      "preview",
      "--port",
      "5226",
      "--strictPort",
    ],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
  );
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error("preview timeout")), 15000);
      server.stdout.on("data", (d) => {
        if (d.toString().includes("Local:")) {
          clearTimeout(timer);
          resolve();
        }
      });
      server.stderr.on("data", (d) => {
        clearTimeout(timer);
        reject(Error(d));
      });
      server.on("exit", () => reject(Error("preview exited")));
    });
    const launch = {
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/google-chrome",
      args: [
        "--no-sandbox",
        "--no-proxy-server",
        "--enable-unsafe-swiftshader",
      ],
    };
    browser = await chromium.launch(launch);
    const { puzzleSaveKey } = await import(
      path.join(root, "src/journeyModel.js")
    );
    const saveKey = puzzleSaveKey("rain", "guided", "easy", "classic");
    for (const [label, width, height, touch] of [
      ["desktop", 1360, 940, false],
      ["mobile", 390, 844, true],
      ["small", 320, 568, true],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        hasTouch: touch,
        isMobile: touch,
      });
      await context.addInitScript(
        ({ origin, saveKey }) => {
          if (location.origin !== origin) return;
          if (!localStorage.getItem("model-fixture")) {
            localStorage.setItem("model-fixture", "1");
            localStorage.setItem(
              "shiguang-mode",
              JSON.stringify({
                picture: "rain",
                board: "guided",
                level: "easy",
                shape: "classic",
                magnet: true,
              }),
            );
            localStorage.setItem(saveKey, "[0,2,4]");
          }
        },
        { origin, saveKey },
      );
      const page = await context.newPage(),
        errors = [],
        outside = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await context.route("**/*", (r) => {
        if (
          r
            .request()
            .url()
            .startsWith(origin + "/")
        )
          return r.continue();
        outside.push(r.request().url());
        return r.abort();
      });
      const tap = (el) => (touch ? el.tap() : el.click()),
        canvas = page.locator("canvas");
      const ready = () =>
        page.waitForFunction(
          () => document.querySelector("canvas")?.dataset.ready === "true",
        );
      const noOverflow = async () =>
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      const shot = async (name, el) => {
        if (el) await el.evaluate((e) => e.scrollIntoView({ block: "start" }));
        if (label !== "small")
          await page.screenshot({
            path: path.join(shots, `${label}-${name}.png`),
          });
      };
      await page.goto(origin);
      await page.waitForFunction(
        () => document.querySelector("#count")?.textContent === "3 / 12",
      );
      await tap(page.getByRole("link", { name: "角色小工坊", exact: true }));
      await ready();
      await noOverflow();
      await shot("xiaohei");
      const initial = await canvas.screenshot();
      await tap(page.getByRole("button", { name: "侧面", exact: true }));
      assert.notDeepEqual(await canvas.screenshot(), initial);
      await shot("side", page.locator(".stage-panel"));
      await tap(page.getByRole("button", { name: "背面", exact: true }));
      await shot("back", page.locator(".stage-panel"));
      await tap(page.getByRole("button", { name: "正面", exact: true }));
      await canvas.scrollIntoViewIfNeeded();
      const before = await canvas.screenshot(),
        box = await canvas.boundingBox(),
        cx = box.x + box.width / 2,
        cy = box.y + box.height / 2;
      if (touch) {
        const cdp = await context.newCDPSession(page);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: cx - 35, y: cy, id: 1 }],
        });
        for (let i = 1; i <= 5; i++)
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x: cx - 35 + i * 14, y: cy, id: 1 }],
          });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        assert.notDeepEqual(await canvas.screenshot(), before);
        const prePinch = await canvas.screenshot();
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [
            { x: cx - 25, y: cy, id: 1 },
            { x: cx + 25, y: cy, id: 2 },
          ],
        });
        for (let i = 1; i <= 4; i++)
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [
              { x: cx - 25 - i * 7, y: cy, id: 1 },
              { x: cx + 25 + i * 7, y: cy, id: 2 },
            ],
          });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        assert.notDeepEqual(await canvas.screenshot(), prePinch);
        await cdp.detach();
      } else {
        await page.mouse.move(cx - 40, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 80, cy, { steps: 8 });
        await page.mouse.up();
        assert.notDeepEqual(await canvas.screenshot(), before);
        await canvas.focus();
        const preKey = await canvas.screenshot();
        await page.keyboard.press("ArrowLeft");
        assert.notDeepEqual(await canvas.screenshot(), preKey);
        await page.keyboard.press("Home");
      }
      await tap(page.getByRole("button", { name: "正面", exact: true }));
      for (const name of ["眨眨眼", "跳一下"]) {
        const paintedFrames = await page.evaluate(async (name) => {
          const canvas = document.querySelector("canvas");
          const frames = new Set([canvas.toDataURL()]);
          [...document.querySelectorAll("button")]
            .find((b) => b.textContent === name)
            .click();
          const deadline = performance.now() + 2500;
          while (
            canvas.dataset.action !== "idle" &&
            performance.now() < deadline
          ) {
            await new Promise(requestAnimationFrame);
            frames.add(canvas.toDataURL());
          }
          if (canvas.dataset.action !== "idle") throw Error("动作没有结束");
          return frames.size;
        }, name);
        assert.ok(
          paintedFrames > 2,
          `${name} must change rendered geometry over multiple frames`,
        );
      }
      await tap(page.getByRole("button", { name: "黑咻", exact: true }));
      await page.waitForFunction(
        () => document.querySelector("#stage").dataset.character === "heixiu",
      );
      await shot("heixiu", page.locator(".stage-panel"));
      await shot("controls", page.locator("aside"));
      const downloadEvent = page.waitForEvent("download");
      await tap(page.getByRole("link", { name: "下载黑咻模型", exact: true }));
      const download = await downloadEvent;
      const temp = await download.path();
      assert.equal(fs.readFileSync(temp).length, 28380);
      await tap(page.getByRole("button", { name: "猫形小黑", exact: true }));
      const catEvent = page.waitForEvent("download");
      await tap(
        page.getByRole("link", { name: "下载猫形小黑模型", exact: true }),
      );
      assert.equal(
        fs.readFileSync(await (await catEvent).path()).length,
        38320,
      );
      await page.reload();
      await ready();
      assert.equal(
        await page.locator("#stage").getAttribute("data-character"),
        "xiaohei",
      );
      await noOverflow();
      await tap(page.getByRole("link", { name: "四时拾光", exact: true }));
      await page.waitForFunction(
        () => document.querySelector("#count")?.textContent === "3 / 12",
      );
      assert.equal(
        await page.evaluate((key) => localStorage.getItem(key), saveKey),
        "[0,2,4]",
      );
      assert.deepEqual(errors, []);
      assert.deepEqual(outside, []);
      console.log(
        `PASS ${label}: real WebGL, orbit, ${touch ? "one-finger rotate + two-finger pinch" : "mouse + keyboard"}, actions, switch, both GLB downloads, no overflow, save preserved`,
      );
      await context.close();
    }
    const offline = await browser.newContext(),
      p = await offline.newPage(),
      outside = [];
    await offline.route("**/*", (r) => {
      if (r.request().url().startsWith("file:")) return r.continue();
      outside.push(r.request().url());
      return r.abort();
    });
    await p.goto(
      pathToFileURL(path.join(root, "public/models/index.html")).href,
    );
    await p.waitForFunction(
      () => document.querySelector("canvas")?.dataset.ready === "true",
    );
    await p.screenshot({ path: path.join(shots, "offline-file.png") });
    assert.deepEqual(outside, []);
    await offline.close();
    console.log("PASS file:// offline without build or external requests");
    const reduced = await browser.newContext({ reducedMotion: "reduce" }),
      rp = await reduced.newPage();
    await rp.goto(origin + "/models/");
    await rp.waitForFunction(
      () => document.querySelector("canvas")?.dataset.ready === "true",
    );
    await rp.getByRole("button", { name: "跳一下", exact: true }).click();
    assert.ok((await rp.locator("#status").textContent()).includes("略过"));
    await reduced.close();
    console.log("PASS reduced motion");
    const fallbackBrowser = await chromium.launch({
      ...launch,
      args: [...launch.args, "--disable-webgl"],
    });
    try {
      const p = await fallbackBrowser.newPage();
      await p.goto(origin + "/models/");
      await p.locator("#fallback").waitFor({ state: "visible" });
      assert.equal(
        await p
          .getByRole("button", { name: "跳一下", exact: true })
          .isDisabled(),
        true,
      );
      await p.getByRole("button", { name: "黑咻", exact: true }).click();
      assert.equal(
        await p.locator("#download").getAttribute("href"),
        "./heixiu.glb",
      );
      await p.screenshot({ path: path.join(shots, "webgl-unavailable.png") });
      console.log(
        "PASS WebGL unavailable fallback still offers both model downloads",
      );
    } finally {
      await fallbackBrowser.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
