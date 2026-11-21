const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const id = process.env.CHARACTER;
if (!/^[a-z0-9-]+$/.test(id || ""))
  throw Error("Set CHARACTER to an installed profile ID");
const root = path.resolve(__dirname, ".."),
  profile = JSON.parse(
    fs.readFileSync(path.join(root, `src/characters/${id}.json`)),
  ),
  cast = JSON.parse(
    fs.readFileSync(path.join(root, "src/character-cast.json")),
  );
const port = Number(process.env.PORT || 5217),
  origin = `http://127.0.0.1:${port}`;
const shots =
  process.env.SCREENSHOT_DIR ||
  path.join(root, `../docs/screenshots/character-${id}`);
(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const { puzzleSaveKey } = await import(
    path.join(root, "src/journeyModel.js")
  );
  const saveKey = puzzleSaveKey("rain", "guided", "easy", "classic");
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
  let browser, page;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error("preview startup timeout")),
        15000,
      );
      server.stdout.on("data", (d) => {
        if (d.toString().includes("Local:")) {
          clearTimeout(timer);
          resolve();
        }
      });
      server.stderr.on("data", (d) => {
        clearTimeout(timer);
        reject(Error(d.toString()));
      });
      server.on("exit", (code) => {
        clearTimeout(timer);
        reject(Error(`preview exited ${code}`));
      });
    });
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/google-chrome",
      args: ["--no-sandbox", "--no-proxy-server"],
    });
    for (const [label, width, height, touch] of [
      ["desktop", 1360, 940, false],
      ["mobile", 390, 844, true],
      ["mobile-small", 320, 568, true],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        hasTouch: touch,
        isMobile: touch,
      });
      await context.addInitScript(
        ({ saveKey }) => {
          if (!localStorage.getItem("shiguang-mode")) {
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
            localStorage.setItem(
              "shiguang-solar-journey-v1",
              JSON.stringify({ version: 1, completed: ["startSpring"] }),
            );
            localStorage.setItem(saveKey, "[0,2,4]");
          }
        },
        { saveKey },
      );
      page = await context.newPage();
      const errors = [],
        outside = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await context.route("**/*", (route) => {
        if (
          route
            .request()
            .url()
            .startsWith(origin + "/")
        )
          return route.continue();
        outside.push(route.request().url());
        return route.abort();
      });
      const activate = (locator) => (touch ? locator.tap() : locator.click());
      const screenshot = async (name) => {
        if (label !== "mobile-small")
          await page.screenshot({
            path: path.join(shots, `${label}-${name}.png`),
            fullPage: false,
          });
      };
      const noOverflow = async () =>
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      await page.goto(origin);
      await page.waitForFunction(
        () => document.querySelector("#count")?.textContent === "3 / 12",
      );
      await page.waitForFunction(
        () => document.querySelector("[data-piece]")?.disabled === false,
      );
      await page.waitForFunction(() =>
        document.querySelector(".dialogue-copy .caret-hidden"),
      );
      await screenshot("game-entry");
      const stored = await page.evaluate(
        (saveKey) => ({
          pieces: localStorage.getItem(saveKey),
          journey: localStorage.getItem("shiguang-solar-journey-v1"),
        }),
        saveKey,
      );
      await activate(
        page.getByRole("link", { name: "打开人物资料库", exact: true }),
      );
      await page
        .getByRole("heading", { name: "在故事里认识他们", exact: true })
        .waitFor();
      await noOverflow();
      assert.equal(
        await page.locator(".cast-table tbody tr").count(),
        cast.characters.length,
      );
      await screenshot("index");
      await page.getByLabel("找一位角色", { exact: true }).fill("鹿野");
      assert.equal(await page.locator(".cast-table tbody tr").count(), 1);
      await page
        .getByRole("heading", { name: "角色索引", exact: true })
        .evaluate((el) => el.scrollIntoView({ block: "start" }));
      await screenshot("search");
      await page
        .getByLabel("找一位角色", { exact: true })
        .fill("不存在的测试角色");
      assert.equal(await page.locator(".cast-table tbody tr").count(), 0);
      await page
        .getByText("暂时没有匹配人物。试试别名，或把作品选回“全部作品”。", {
          exact: true,
        })
        .waitFor();
      await page.getByLabel("找一位角色", { exact: true }).fill("");
      await page
        .getByLabel("核对状态", { exact: true })
        .selectOption("official");
      assert.equal(
        await page.locator(".cast-table tbody tr").count(),
        cast.characters.filter((c) => c.status === "confirmed").length,
      );
      await page.getByLabel("核对状态", { exact: true }).selectOption("all");
      await page.getByLabel("只看已有详情", { exact: true }).check();
      assert.ok((await page.locator(".cast-table tbody tr").count()) >= 1);
      await page.getByLabel("只看已有详情", { exact: true }).uncheck();
      await activate(
        page.locator(`.featured-character[href="#/characters/${id}"]`),
      );
      await page
        .getByRole("heading", { name: profile.name, exact: true })
        .waitFor();
      await page.goto(`${origin}/#/characters/${id}`);
      await page
        .getByRole("heading", { name: profile.name, exact: true })
        .waitFor();
      await page
        .locator(".character-hero-art img")
        .evaluate((img) => img.decode());
      await noOverflow();
      await screenshot("profile");
      await page
        .locator(".character-notes-grid")
        .evaluate((el) => el.scrollIntoView({ block: "start" }));
      await screenshot("facts");
      await page.locator(".character-gallery-jump").scrollIntoViewIfNeeded();
      await activate(
        page.getByRole("link", { name: "看 5 张参考图", exact: true }),
      );
      for (const image of await page
        .locator(".character-reference img")
        .all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((img) => img.decode());
      }
      assert.equal(await page.locator(".character-reference").count(), 5);
      assert.ok(
        await page
          .locator(".character-reference img")
          .evaluateAll((images) =>
            images.every((img) => img.complete && img.naturalWidth > 0),
          ),
      );
      for (const figure of await page.locator(".character-reference").all())
        assert.ok(
          (
            await figure
              .getByRole("link", { name: "原始出处", exact: true })
              .getAttribute("href")
          ).startsWith("https://"),
        );
      await page
        .getByRole("heading", { name: "造型参考图册", exact: true })
        .evaluate((el) => el.scrollIntoView({ block: "start" }));
      await noOverflow();
      await screenshot("gallery");
      const open = page.getByRole("button", {
        name: `放大参考图：${profile.references[0].title}`,
        exact: true,
      });
      await activate(open);
      await page.getByRole("dialog").waitFor({ state: "visible" });
      await page
        .getByRole("dialog")
        .locator("img")
        .evaluate((img) => img.decode());
      await screenshot("zoom");
      for (let index = 1; index < 5; index++) {
        await activate(
          page.getByRole("button", { name: "下一张", exact: true }),
        );
        await page
          .getByRole("dialog")
          .getByRole("heading", {
            name: profile.references[index].title,
            exact: true,
          })
          .waitFor();
        await page
          .getByRole("dialog")
          .locator("img")
          .evaluate((img) => img.decode());
      }
      assert.equal(
        await page
          .getByRole("button", { name: "下一张", exact: true })
          .isDisabled(),
        true,
      );
      if (touch)
        await activate(
          page.getByRole("button", { name: "关闭参考图", exact: true }),
        );
      else await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert.equal(
        await open.evaluate((el) => el === document.activeElement),
        true,
      );
      await page.reload();
      await page
        .getByRole("heading", { name: profile.name, exact: true })
        .waitFor();
      await page.goto(`${origin}/#/characters/unknown`);
      await page
        .getByRole("heading", { name: "这份人物档案还没整理好", exact: true })
        .waitFor();
      await noOverflow();
      await activate(
        page.getByRole("link", { name: "回到人物索引", exact: true }),
      );
      await activate(page.getByRole("link", { name: "回到拼图", exact: true }));
      await page.waitForFunction(
        () => document.querySelector("#count")?.textContent === "3 / 12",
      );
      const after = await page.evaluate(
        (saveKey) => ({
          pieces: localStorage.getItem(saveKey),
          journey: localStorage.getItem("shiguang-solar-journey-v1"),
        }),
        saveKey,
      );
      assert.deepEqual(after, stored);
      assert.deepEqual(errors, []);
      assert.deepEqual(outside, []);
      console.log(
        `PASS ${id}/${label}: game entry, cast search/empty/status filters, direct detail/refresh, five local images, viewer navigation/close/focus, unknown route, unchanged puzzle+journey saves, no overflow/external requests/page errors`,
      );
      await context.close();
    }
  } catch (error) {
    if (page && !page.isClosed())
      await page.screenshot({
        path: `/tmp/character-${id}-failure.png`,
        fullPage: true,
      });
    throw error;
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
