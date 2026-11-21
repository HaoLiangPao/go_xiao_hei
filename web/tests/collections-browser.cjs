const { spawn } = require("node:child_process");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, ".."),
  id = process.env.COLLECTION;
if (!/^[a-z0-9-]+$/.test(id || "")) throw Error("Set COLLECTION");
const pack = JSON.parse(
  fs.readFileSync(path.join(root, `src/collections/${id}.json`)),
);
const port = Number(process.env.PORT || 5220),
  origin = `http://127.0.0.1:${port}`;
const shots =
  process.env.SCREENSHOT_DIR ||
  path.join(root, `../docs/screenshots/collection-${id}`);
(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/vite/bin/vite.js"),
      "preview",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
  );
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error("startup timeout")), 15000);
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
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/google-chrome",
      args: ["--no-sandbox", "--no-proxy-server"],
    });
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
      await context.addInitScript((appOrigin) => {
        if (location.origin !== appOrigin) return;
        if (!localStorage.getItem("collection-fixture")) {
          localStorage.setItem("collection-fixture", "1");
          localStorage.setItem(
            "shiguang-solar-journey-v1",
            '{"version":1,"completed":["startSpring"]}',
          );
        }
      }, origin);
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
      const tap = (el) => (touch ? el.tap() : el.click());
      const shot = async (name, el) => {
        if (el) await el.evaluate((e) => e.scrollIntoView({ block: "start" }));
        if (label !== "small")
          await page.screenshot({
            path: path.join(shots, `${label}-${name}.png`),
          });
      };
      const overflow = async () =>
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      await page.goto(origin + "/#/characters");
      await page
        .getByRole("heading", { name: "在故事里认识他们", exact: true })
        .waitFor();
      await shot("index");
      await tap(
        page.locator(
          `.collection-picker a[href="#/characters/collection/${id}"]`,
        ),
      );
      await page
        .getByRole("heading", { name: pack.title, exact: true })
        .waitFor();
      assert.equal(
        await page.locator(".work-character").count(),
        pack.characters.length,
      );
      await overflow();
      await shot("journey");
      const stored = await page.evaluate(() =>
        localStorage.getItem("shiguang-solar-journey-v1"),
      );
      assert.equal(await page.locator("iframe").count(), 0);
      const input = page.getByRole("searchbox");
      await input.fill("不存在的测试人物");
      assert.equal(await page.locator(".work-character").count(), 0);
      await input.fill(pack.characters[0].name);
      assert.ok((await page.locator(".work-character").count()) >= 1);
      await shot("search", page.locator(".collection-search"));
      await input.fill("");
      const ending = page.locator(".work-character details.character-ending");
      if (await ending.count()) {
        assert.equal(await ending.first().getAttribute("open"), null);
        await tap(ending.first().locator("summary"));
        assert.notEqual(await ending.first().getAttribute("open"), null);
        await shot("story", ending.first());
        await tap(ending.first().locator("summary"));
      } else await shot("story", page.locator(".work-character").first());
      const images = page.locator(".collection-images img");
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((e) => e.decode());
      }
      if (await images.count())
        await shot("references", images.first().locator(".."));
      await overflow();
      await shot("voices", page.locator(".character-film-voices"));
      const externals = await page
        .locator('.work-detail a[target="_blank"]')
        .evaluateAll((a) => a.map((e) => e.getAttribute("href")));
      assert.ok(
        externals.every((u) => u.startsWith("https:") || u.startsWith("/art/")),
      );
      assert.deepEqual(outside, []);
      const player = page
        .getByRole("button", { name: /展开官方播放器/ })
        .first();
      if (await player.count()) {
        await tap(player);
        const iframe = page.locator("iframe");
        assert.equal(await iframe.count(), 1);
        assert.ok(
          (await iframe.getAttribute("src")).startsWith(
            "https://www.youtube-nocookie.com/embed/",
          ),
        );
        await tap(page.getByRole("button", { name: /收起播放器/ }));
        assert.equal(await page.locator("iframe").count(), 0);
      }
      await page.reload();
      await page
        .getByRole("heading", { name: pack.title, exact: true })
        .waitFor();
      assert.equal(await page.locator("iframe").count(), 0);
      assert.equal(
        await page.evaluate(() =>
          localStorage.getItem("shiguang-solar-journey-v1"),
        ),
        stored,
      );
      assert.deepEqual(errors, []);
      await page.goto(origin + "/#/characters/collection/not-installed");
      await page
        .getByRole("heading", { name: "这份人物档案还没整理好" })
        .waitFor();
      await page.goto(origin);
      await page.locator("#count").waitFor();
      await overflow();
      console.log(
        `PASS ${id}/${label}: ${pack.characters.length} sourced records, search, spoilers, ${await images.count().catch(() => 0)} local images, direct route/reload, deferred player, save preserved, no overflow/errors`,
      );
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
