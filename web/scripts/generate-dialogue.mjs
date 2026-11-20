import { mkdir, rename, writeFile, rm, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dialogueCues, dialogueCuesForSeason, clipFilename, voiceProfiles } from "../src/dialogueClips.js";

const destination = fileURLToPath(new URL("../../generated-audio/dialogue/", import.meta.url));
const python = process.env.TTS_PYTHON || "python3";
const seasonArgument = process.argv.indexOf("--season");
const season = seasonArgument < 0 ? null : process.argv[seasonArgument + 1];
if (seasonArgument >= 0 && !["spring", "summer", "autumn", "winter"].includes(season)) throw new Error("--season 需要 spring、summer、autumn 或 winter。");
const cues = season ? dialogueCuesForSeason(season) : dialogueCues;
if (!cues.length) throw new Error("该季节尚未接入区域剧情。");
await mkdir(destination, { recursive: true });
const manifest = { provider: "Microsoft Edge online TTS via edge-tts", generatedAt: new Date().toISOString(), clips: [] };
for (const cue of cues) {
  const profile = voiceProfiles[cue.speaker];
  const filename = clipFilename(cue);
  const temporary = destination + filename + ".tmp";
  try {
    const cached = process.argv.includes("--missing") && await stat(destination + filename).then((file) => file.size > 0, () => false);
    if (!cached) await new Promise((resolve, reject) => {
      const child = spawn(python, ["-m", "edge_tts", "--voice", profile.voice,
        `--rate=${profile.rate}`, `--pitch=${profile.pitch}`, "--text", cue.text,
        "--write-media", temporary], { stdio: "inherit", timeout: 45000 });
      child.on("error", reject);
      child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`TTS exited with ${code}`)));
    });
    if (!cached) await rename(temporary, destination + filename);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  manifest.clips.push({ id: cue.id, speaker: cue.speaker, text: cue.text, filename, ...profile });
  console.log(`已准备：${cue.speaker} · ${cue.text}`);
}
await writeFile(destination + "manifest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log("音频保留在 generated-audio/dialogue/，审核后运行 npm run resources:publish，将当前使用的录音加入可发布静态资源。");
