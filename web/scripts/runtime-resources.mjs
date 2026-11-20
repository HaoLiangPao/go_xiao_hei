import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { solarTerms } from "../src/solarTerms.js";
import { dialogueCues, clipFilename } from "../src/dialogueClips.js";

export const runtimePaths = () => [
  ...solarTerms.map((term) => term.image),
  ...dialogueCues.map((cue) => `/audio/dialogue/${clipFilename(cue)}`),
];
export const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Independent seasonal packs keep parallel content PRs from overwriting one manifest.
export async function readResourceManifest(manifestFile = new URL("../resources-manifest.json", import.meta.url)) {
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  if (manifest.version !== 1 || !Array.isArray(manifest.files))
    throw new Error("资源清单数量或版本不匹配，请审核后运行 npm run resources:publish。");
  const directory = new URL("./resources/", manifestFile);
  let names;
  try { names = await readdir(directory); }
  catch (error) { if (error.code !== "ENOENT") throw error; names = []; }
  for (const name of names.filter((name) => name.endsWith(".json")).sort()) {
    const pack = JSON.parse(await readFile(new URL(name, directory), "utf8"));
    if (pack.version !== 1 || !Array.isArray(pack.files)) throw new Error(`资源分清单版本错误：${name}`);
    manifest.files.push(...pack.files);
  }
  return manifest;
}

export async function validateResources({
  publicDirectory = new URL("../public/", import.meta.url),
  manifestFile = new URL("../resources-manifest.json", import.meta.url),
} = {}) {
  const manifest = await readResourceManifest(manifestFile);
  const expected = new Set(runtimePaths());
  if (manifest.version !== 1 || !Array.isArray(manifest.files) ||
      manifest.files.length !== expected.size || new Set(manifest.files.map((f) => f.path)).size !== expected.size)
    throw new Error("资源清单数量或版本不匹配，请审核后运行 npm run resources:publish。");
  for (const entry of manifest.files) {
    if (!expected.has(entry.path)) throw new Error(`资源清单已过期：${entry.path}`);
    let bytes;
    try { bytes = await readFile(new URL(entry.path.slice(1), publicDirectory)); }
    catch { throw new Error(`运行资源缺失：${entry.path}。请恢复 Git 中的资源；维护者可运行 npm run resources:publish。`); }
    if (bytes.length !== entry.bytes || digest(bytes) !== entry.sha256)
      throw new Error(`运行资源校验失败：${entry.path}`);
  }
  console.log(`运行资源核验通过：${solarTerms.length} 张图片、${dialogueCues.length} 段中文录音，共 ${manifest.files.reduce((sum, f) => sum + f.bytes, 0)} bytes。`);
  return manifest;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await validateResources();
