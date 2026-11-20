// Maintainer-only publication step. Normal dev/build uses tracked public files.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { solarTerms } from "../src/solarTerms.js";
import { dialogueCues, clipFilename, voiceProfiles } from "../src/dialogueClips.js";
import { digest, validateResources } from "./runtime-resources.mjs";
const collection = process.env.XIAOHEI_COLLECTION_DIR || fileURLToPath(new URL("../../luoxiaohei_collection/", import.meta.url));
const publicDirectory = new URL("../public/", import.meta.url);
const files = [];
async function publish(path, bytes, metadata) {
  const destination = new URL(path.slice(1), publicDirectory);
  await mkdir(new URL("./", destination), { recursive: true });
  await writeFile(destination, bytes);
  files.push({ path, bytes: bytes.length, sha256: digest(bytes), ...metadata });
}
for (const term of solarTerms) {
  let bytes;
  try { bytes = await readFile(new URL(term.image.slice(1), publicDirectory)); }
  catch (error) { if (error.code !== "ENOENT") throw error; bytes = await readFile(collection + "/" + term.asset.relativePath); }
  if (digest(bytes) !== term.asset.sha256) throw new Error(`原图校验失败：${term.asset.catalogId}`);
  await publish(term.image, bytes, { kind: "art", term: term.id, catalogId: term.asset.catalogId });
}
for (const cue of dialogueCues) {
  const filename = clipFilename(cue);
  const bytes = await readFile(new URL(`../../generated-audio/dialogue/${filename}`, import.meta.url));
  await publish(`/audio/dialogue/${filename}`, bytes, {
    kind: "dialogue", cue: cue.id, speaker: cue.speaker, text: cue.text,
    synthesis: { provider: "Microsoft Edge online TTS via edge-tts", ...voiceProfiles[cue.speaker] },
  });
}
await writeFile(new URL("../resources-manifest.json", import.meta.url), JSON.stringify({ version: 1, files }, null, 2) + "\n");
await validateResources();
console.log("仅发布当前图集和台词清单内的资源；请审阅 public/ 与 resources-manifest.json 后提交。");
