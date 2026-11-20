import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
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

// Runtime media is tracked in Git; clean builds never require the local collection or TTS.
const { validateResources } = await import("./runtime-resources.mjs");
await validateResources();

const { validateCharacterResources } = await import("./character-resources.mjs");
await validateCharacterResources();
