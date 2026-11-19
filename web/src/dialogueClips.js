import { memories } from "./gameplay.js";

export const opening = {
  id: "opening",
  speaker: "春日来信",
  text: "春雨落在叶尖。把散落的画面放回去，听听这一场雨。",
};
export const closing = {
  id: "complete",
  speaker: "春日来信",
  text: "春天完整了。谢谢你，陪他们慢慢走完这一场雨。",
};
export const dialogueCues = [opening, ...memories, closing];
export const voiceProfiles = {
  无限: { voice: "zh-CN-YunxiNeural", rate: "-18%", pitch: "-26Hz" },
  小黑: { voice: "zh-CN-YunxiaNeural", rate: "+6%", pitch: "+10Hz" },
  春日来信: { voice: "zh-CN-XiaoxiaoNeural", rate: "-8%", pitch: "+0Hz" },
};

export function clipFilename(cue) {
  // Tie local audio to its exact text and synthesis settings, including replays.
  const profile = voiceProfiles[cue.speaker];
  let hash = 2166136261;
  for (const character of JSON.stringify([cue.speaker, cue.text, profile]))
    hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  return `${cue.id}-${hash.toString(16)}.mp3`;
}
export function recordedClip(cue) {
  const original = dialogueCues.find(
    (item) => item.text === cue.text && item.speaker === cue.speaker,
  );
  return original ? `/audio/dialogue/${clipFilename(original)}` : null;
}
