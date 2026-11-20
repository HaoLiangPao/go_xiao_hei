import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { puzzleStories } from "../src/puzzleStories.js";
import { solarTerms } from "../src/solarTerms.js";
import { dialogueCues, dialogueCuesForSeason, voiceProfiles, recordedClip } from "../src/dialogueClips.js";
import { regionPieces, completedMemories } from "../src/gameplay.js";
import { levels } from "../src/geometry.js";
import { readResourceManifest } from "../scripts/runtime-resources.mjs";

test("every installed season has six image-grounded stories and 36 distinct recordings", () => {
  for (const season of ["spring", "summer", "autumn", "winter"]) {
    const terms = solarTerms.filter((term) => term.season === season);
    const installed = terms.filter((term) => puzzleStories[term.id]);
    assert.ok(installed.length === 0 || installed.length === 6);
    const cues = dialogueCuesForSeason(season);
    assert.equal(cues.length, installed.length * 6);
    assert.equal(new Set(cues.map(recordedClip)).size, cues.length);
    for (const term of installed) {
      const story = puzzleStories[term.id];
      assert.equal(story.memories.length, 4);
      assert.ok(story.memories.some((memory) => memory.id === story.goal));
      for (const memory of story.memories) {
        assert.ok(memory.bounds.every((value) => value >= 0 && value <= 1));
        for (const {cols, rows} of Object.values(levels)) {
          const ids = regionPieces(memory, cols, rows);
          assert.ok(ids.length > 0 && ids.length < cols * rows, `${term.id}/${memory.id}/${cols}x${rows}`);
          assert.ok(completedMemories(new Set(ids), cols, rows, story.memories).includes(memory));
          assert.ok(!completedMemories(new Set(ids.slice(1)), cols, rows, story.memories).includes(memory));
        }
      }
      for (const cue of [story.opening, ...story.memories, story.ending]) {
        assert.ok(voiceProfiles[cue.speaker]); assert.ok(recordedClip(cue));
      }
    }
  }
  assert.equal(new Set(dialogueCues.map(recordedClip)).size, dialogueCues.length);
});

test("a season pack extends the base manifest without rewriting base artwork or spring audio", async () => {
  const directory = await mkdtemp(tmpdir() + "/xiaohei-season-manifest-");
  try {
    const manifestFile = pathToFileURL(directory + "/manifest.json");
    const packs = pathToFileURL(directory + "/resources/");
    await mkdir(packs);
    await writeFile(manifestFile, JSON.stringify({version:1,files:[{path:"/base.mp3"}]}));
    await writeFile(new URL("summer.json",packs), JSON.stringify({version:1,files:[{path:"/summer.mp3"}]}));
    assert.deepEqual((await readResourceManifest(manifestFile)).files.map((f)=>f.path),["/base.mp3","/summer.mp3"]);
    await writeFile(new URL("summer.json",packs), JSON.stringify({version:2,files:[]}));
    await assert.rejects(readResourceManifest(manifestFile),/资源分清单版本错误/);
  } finally {await rm(directory,{recursive:true,force:true});}
});
