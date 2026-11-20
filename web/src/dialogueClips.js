import { puzzleStories } from "./puzzleStories.js";
import { solarTerms } from "./solarTerms.js";

export const opening = puzzleStories.rain.opening;
export const closing = puzzleStories.rain.ending;
export const dialogueCues = Object.values(puzzleStories).flatMap((story) => [story.opening, ...story.memories, story.ending]);
export function dialogueCuesForSeason(season) {
  return solarTerms.filter((term) => term.season === season).flatMap((term) => {
    const story = puzzleStories[term.id];
    return story ? [story.opening, ...story.memories, story.ending] : [];
  });
}
export const voiceProfiles = {
  四时旁白: { voice: "zh-CN-XiaoxiaoNeural", rate: "-8%", pitch: "+0Hz" },
  无限: { voice: "zh-CN-YunxiNeural", rate: "-18%", pitch: "-26Hz" },
  小黑: { voice: "zh-CN-YunxiaNeural", rate: "+6%", pitch: "+10Hz" },
  春日旁白: { voice: "zh-CN-XiaoxiaoNeural", rate: "-8%", pitch: "+0Hz" },
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
