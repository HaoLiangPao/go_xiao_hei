import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { runtimePaths, digest, validateResources } from "../scripts/runtime-resources.mjs";
import { puzzleStories } from "../src/puzzleStories.js";
import { solarTerms } from "../src/solarTerms.js";
import { regionPieces, completedMemories } from "../src/gameplay.js";
import { levels } from "../src/geometry.js";

test("spring story regions unlock from their own actual area at all piece counts", () => {
  for (const term of solarTerms.slice(0, 6)) {
    const story = puzzleStories[term.id];
    assert.ok(story.memories.some((memory) => memory.id === story.goal));
    assert.equal(new Set(story.memories.map((memory) => memory.id)).size, 4);
    for (const { cols, rows } of Object.values(levels)) for (const memory of story.memories) {
      const ids = regionPieces(memory, cols, rows);
      assert.ok(ids.length > 0 && ids.length < cols * rows);
      assert.ok(completedMemories(new Set(ids), cols, rows, story.memories).includes(memory));
      assert.ok(!completedMemories(new Set(ids.slice(1)), cols, rows, story.memories).includes(memory));
    }
  }
});

test("tracked runtime media is complete and matches the current text and artwork", async () => {
  const manifest = await validateResources();
  assert.equal(manifest.files.filter((f) => f.kind === "art").length, 24);
  assert.equal(manifest.files.filter((f) => f.kind === "dialogue").length, 36);
  for (const term of solarTerms)
    assert.equal(manifest.files.find((f) => f.path === term.image).sha256, term.asset.sha256);
});

test("a missing, corrupted or stale resource fails the build instead of shipping silent audio", async () => {
  const dir = await mkdtemp(tmpdir() + "/xiaohei-resources-");
  try {
    const publicDirectory = pathToFileURL(dir + "/public/");
    const manifestFile = pathToFileURL(dir + "/manifest.json");
    const content = Buffer.from("synthetic resource fixture");
    const manifest = { version: 1, files: [] };
    for (const path of runtimePaths()) {
      const target = new URL(path.slice(1), publicDirectory);
      await mkdir(new URL("./", target), { recursive: true }); await writeFile(target, content);
      manifest.files.push({ path, bytes: content.length, sha256: digest(content) });
    }
    await writeFile(manifestFile, JSON.stringify(manifest));
    await validateResources({ publicDirectory, manifestFile });
    const audio = new URL(manifest.files.find((f) => f.path.endsWith(".mp3")).path.slice(1), publicDirectory);
    await writeFile(audio, "damaged audio");
    await assert.rejects(validateResources({ publicDirectory, manifestFile }), /校验失败/);
    await rm(audio);
    await assert.rejects(validateResources({ publicDirectory, manifestFile }), /运行资源缺失/);
    manifest.files.pop(); await writeFile(manifestFile, JSON.stringify(manifest));
    await assert.rejects(validateResources({ publicDirectory, manifestFile }), /数量或版本不匹配/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
