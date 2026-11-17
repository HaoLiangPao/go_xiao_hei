const { spawn } = require("node:child_process");
const path = require("node:path");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "..");
const screenshots = path.join(root, "../docs/screenshots");
fs.mkdirSync(screenshots, { recursive: true });
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
        viewport: { width: 1280, height: 1000 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:5174/");
    await page.locator('[data-piece="0"]').waitFor();
    const select = async (label, value) =>
      page.getByLabel(label, { exact: true }).selectOption(value);
    for (const level of ["easy", "medium", "hard"])
      for (const shape of ["flat", "classic", "organic"]) {
        await select("难度", level);
        await select("形状", shape);
        await page
          .getByRole("button", { name: "重新开始", exact: true })
          .click();
        const total = { easy: 12, medium: 24, hard: 48 }[level];
        assert.equal(await page.locator("[data-slot]").count(), total);
        await page.locator('[data-piece="0"]').click();
        await page.locator('[data-slot="1"]').click();
        assert.equal(await page.locator("#count").innerText(), `0 / ${total}`);
        await page.locator('[data-slot="0"]').click();
        assert.equal(await page.locator("#count").innerText(), `1 / ${total}`);
        await page.reload();
        await page.locator("[data-piece]").first().waitFor();
        // App starts on easy/flat; selecting the tested combination restores its own save.
        await select("难度", level);
        await select("形状", shape);
        assert.equal(await page.locator("#count").innerText(), `1 / ${total}`);
        await page
          .getByRole("button", { name: "给我一点提示", exact: true })
          .click();
        assert.equal(await page.locator(".slot.hint").count(), 1);
        await page
          .getByRole("button", { name: "看看原图", exact: true })
          .click();
        assert.equal(await page.locator("[data-slot]").count(), 0);
        await page
          .getByRole("button", { name: "收起原图", exact: true })
          .click();
        for (let i = 1; i < total; i++) {
          await page.locator(`[data-piece="${i}"]`).click();
          await page.locator(`[data-slot="${i}"]`).click();
        }
        assert.equal(
          await page.locator("#count").innerText(),
          `${total} / ${total}`,
        );
        assert.ok(
          await page
            .getByRole("heading", { name: "春天已经在这里了", exact: true })
            .count(),
        );
        console.log(
          `PASS ${level}/${shape}: wrong placement, save, hint, preview, completion`,
        );
      }
    await select("难度", "medium");
    await select("形状", "organic");
    await page.getByRole("button", { name: "重新开始", exact: true }).click();
    await page
      .locator('[data-piece="0"]')
      .dragTo(page.locator('[data-slot="0"]'));
    assert.equal(await page.locator("#count").innerText(), "1 / 24");
    await page.locator('[data-piece="1"]').focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-slot="1"]').focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#count").innerText(), "2 / 24");
    await page.screenshot({
      path: path.join(screenshots, "puzzle-organic-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: path.join(screenshots, "puzzle-organic-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1280, height: 1000 });
    await select("难度", "easy");
    await select("形状", "classic");
    await page.getByRole("button", { name: "重新开始", exact: true }).click();
    await page.screenshot({
      path: path.join(screenshots, "puzzle-classic-desktop.png"),
      fullPage: true,
    });
    await page.goto("http://127.0.0.1:5174/prototype/index.html");
    await page.locator('[data-region="roof"]').click();
    assert.ok(
      await page
        .locator("#color-popover")
        .getAttribute("class")
        .then((x) => x.includes("is-open")),
    );
    await page.locator('[data-control="color-rain"]').hover();
    await page.screenshot({
      path: path.join(screenshots, "color-hover-preview.png"),
      fullPage: true,
    });
    const coloring = require(
      path.join(root, "../tests/browser-playthrough.js"),
    );
    await coloring(page, screenshots);
    const touch = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const tp = await touch.newPage();
    await tp.goto("http://127.0.0.1:5174/");
    await tp.locator('[data-piece="0"]').tap();
    await tp.locator('[data-slot="0"]').tap();
    assert.equal(await tp.locator("#count").innerText(), "1 / 12");
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
    await bp.locator('[data-piece="0"]').click();
    await bp.locator('[data-slot="0"]').click();
    assert.equal(await bp.locator("#count").innerText(), "1 / 12");
    assert.ok((await bp.locator(".message").innerText()).includes("无法保存"));
    await blocked.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS mobile overflow, retained coloring and no runtime errors",
    );
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
