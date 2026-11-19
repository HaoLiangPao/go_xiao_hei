import { copyFile, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const source = fileURLToPath(new URL("../../prototype/", import.meta.url));
const target = fileURLToPath(new URL("../public/prototype/", import.meta.url));
await mkdir(target, { recursive: true });
for (const name of [
  "index.html",
  "scene-data.js",
  "scene-model.js",
  "scene.js",
  "scene.css",
])
  await copyFile(source + name, target + name);
const index = target + "index.html";
await writeFile(
  index,
  (await readFile(index, "utf8")).replace('href="puzzle.html"', 'href="/"').replace('href="../web/public/art/rain-2020.jpg"', 'href="/art/rain-2020.jpg"'),
);

// Generated audio stays local; only copy clips matching the current text/profile.
const { dialogueCues, clipFilename } = await import("../src/dialogueClips.js");
const audioSource = new URL("../../generated-audio/dialogue/", import.meta.url);
const audioTarget = new URL("../public/audio/dialogue/", import.meta.url);
await rm(audioTarget, { recursive: true, force: true });
await mkdir(audioTarget, { recursive: true });
let copied = 0;
for (const cue of dialogueCues) {
  const filename = clipFilename(cue);
  try {
    await copyFile(new URL(filename, audioSource), new URL(filename, audioTarget));
    copied++;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
console.log(`中文配音：${copied}/${dialogueCues.length} 段；缺失时使用设备中文语音或字幕。`);
