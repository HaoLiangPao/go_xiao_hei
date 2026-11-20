import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { characterRoute, filterCharacters } from "../src/characterModel.js";
import { validateCharacterResources } from "../scripts/character-resources.mjs";
import cast from "../src/character-cast.json" with { type: "json" };

test("hash routes handle direct links, malformed input and missing profiles without treating them as game actions", () => {
  assert.deepEqual(characterRoute(""), { kind: "game" });
  assert.deepEqual(characterRoute("#/characters"), { kind: "index" });
  assert.deepEqual(characterRoute("#/characters/wuxian"), {
    kind: "detail",
    id: "wuxian",
  });
  assert.deepEqual(characterRoute("#/characters/%E5%B0%8F%E9%BB%91"), {
    kind: "detail",
    id: "小黑",
  });
  assert.deepEqual(characterRoute("#/characters/%zz"), { kind: "missing" });
  assert.deepEqual(characterRoute("#/characters/wuxian/unknown"), {
    kind: "missing",
  });
});
test("the cast index supports aliases, work scopes and installed details without inventing unbuilt profiles", () => {
  const characters = [
    {
      id: "a",
      name: "小黑",
      aliases: ["小白的猫"],
      summary: "黑猫妖精",
      works: ["tv"],
    },
    {
      id: "b",
      name: "无限",
      aliases: ["Wuxian"],
      summary: "执行者",
      works: ["movie1"],
    },
  ];
  assert.deepEqual(
    filterCharacters(characters, { query: " 小白的猫 " }).map((c) => c.id),
    ["a"],
  );
  assert.deepEqual(
    filterCharacters(characters, { query: "ＷＵＸＩＡＮ" }).map((c) => c.id),
    ["b"],
  );
  assert.deepEqual(
    filterCharacters(characters, {
      work: "tv",
      readyOnly: true,
      profiles: { b: {} },
    }),
    [],
  );
  assert.equal(
    filterCharacters(characters, { readyOnly: true, profiles: { b: {} } })
      .length,
    1,
  );
});
test("cast records stay uniquely named and sourced; uncertain user spellings do not become fabricated profiles", () => {
  assert.equal(
    new Set(cast.characters.map((c) => c.id)).size,
    cast.characters.length,
  );
  assert.equal(
    new Set(cast.characters.map((c) => c.name)).size,
    cast.characters.length,
  );
  for (const c of cast.characters) {
    assert.ok(c.name && c.summary && c.works.length && c.sources.length);
    assert.ok(
      c.works.every((w) =>
        ["tv", "movie1", "movie2", "other", "unverified"].includes(w),
      ),
    );
    assert.ok(c.sources.every((url) => new URL(url).protocol === "https:"));
  }
});
test("tracked references are complete; one changed byte fails before publication", async () => {
  const result = await validateCharacterResources();
  assert.ok(result.profiles >= 1 && result.references >= 5);
  const temp = await mkdtemp(tmpdir() + "/xiaohei-character-check-");
  try {
    const directory = pathToFileURL(temp + "/profiles/");
    await mkdir(directory);
    // A copy of one real profile proves broken/corrupted media is rejected independently of app rendering.
    const { readdir } = await import("node:fs/promises");
    const names = await readdir(new URL("../src/characters/", import.meta.url));
    const sample = JSON.parse(
      await readFile(
        new URL(
          `../src/characters/${names.find((n) => n.endsWith(".json"))}`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
    sample.references[0].sha256 = "0".repeat(64);
    await writeFile(
      new URL(`${sample.id}.json`, directory),
      JSON.stringify(sample),
    );
    await assert.rejects(validateCharacterResources({ directory }), /校验失败/);
    sample.references[0].src = "/art/../../secret.png";
    await writeFile(
      new URL(`${sample.id}.json`, directory),
      JSON.stringify(sample),
    );
    await assert.rejects(
      validateCharacterResources({ directory }),
      /路径或资料无效/,
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
