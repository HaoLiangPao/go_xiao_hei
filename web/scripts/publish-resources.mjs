// Maintainer-only publication step. Normal dev/build uses tracked public files.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { solarTerms } from "../src/solarTerms.js";
import { dialogueCuesForSeason, clipFilename, voiceProfiles } from "../src/dialogueClips.js";
import { digest, validateResources } from "./runtime-resources.mjs";
const collection = process.env.XIAOHEI_COLLECTION_DIR || fileURLToPath(new URL("../../luoxiaohei_collection/", import.meta.url));
const publicDirectory = new URL("../public/", import.meta.url);
const seasonArgument = process.argv.indexOf("--season");
const season = seasonArgument < 0 ? "spring" : process.argv[seasonArgument + 1];
if (!["spring", "summer", "autumn", "winter"].includes(season)) throw new Error("--season 需要 spring、summer、autumn 或 winter。");
const cues = dialogueCuesForSeason(season);
if (!cues.length) throw new Error(`该季节尚未接入区域剧情：${season}`);
const files = [];
async function publish(path, bytes, metadata) {
  const destination = new URL(path.slice(1), publicDirectory);
  await mkdir(new URL("./", destination), { recursive: true });
  await writeFile(destination, bytes);
  files.push({ path, bytes: bytes.length, sha256: digest(bytes), ...metadata });
}
for (const term of season === "spring" ? solarTerms : []) {
  let bytes;
  try { bytes = await readFile(new URL(term.image.slice(1), publicDirectory)); }
  catch (error) { if (error.code !== "ENOENT") throw error; bytes = await readFile(collection + "/" + term.asset.relativePath); }
  if (digest(bytes) !== term.asset.sha256) throw new Error(`原图校验失败：${term.asset.catalogId}`);
  await publish(term.image, bytes, { kind: "art", term: term.id, catalogId: term.asset.catalogId });
}
for (const cue of cues) {
  const filename = clipFilename(cue);
  const bytes = await readFile(new URL(`../../generated-audio/dialogue/${filename}`, import.meta.url));
  await publish(`/audio/dialogue/${filename}`, bytes, {
    kind: "dialogue", cue: cue.id, speaker: cue.speaker, text: cue.text,
    synthesis: { provider: "Microsoft Edge online TTS via edge-tts", ...voiceProfiles[cue.speaker] },
  });
}
const manifestFile = new URL(season === "spring" ? "../resources-manifest.json" : `../resources/${season}.json`, import.meta.url);
await mkdir(new URL("./", manifestFile), { recursive: true });
await writeFile(manifestFile, JSON.stringify({ version: 1, files }, null, 2) + "\n");
await validateResources();
console.log("仅发布当前图集和台词清单内的资源；请审阅 public/ 与对应资源清单 后提交。");
