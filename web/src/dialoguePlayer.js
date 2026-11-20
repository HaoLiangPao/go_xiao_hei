import { recordedClip } from "./dialogueClips.js";

import { castVoice, mandarinVoices, voiceProfiles } from "./voiceProfiles.js";

// Every play settles on completion, failure, or cancellation so subtitles can advance.
export function createDialoguePlayer({
  Audio = window.Audio,
  synthesis = window.speechSynthesis,
  Utterance = window.SpeechSynthesisUtterance,
  onSpeaking,
  onNote,
  voiceCast = () => ({}),
  voiceWait = 1500,
  loadWait = 8000,
}) {
  let current = null;
  function stop() {
    if (!current) return;
    const task = current;
    current = null;
    task.cleanups.forEach((cleanup) => cleanup());
    task.resolve();
    onSpeaking(false);
  }
  function play(cue) {
    stop();
    onNote("");
    let resolve;
    const finished = new Promise((done) => { resolve = done; });
    const task = { resolve, cleanups: [] };
    current = task;
    onSpeaking(true);
    const active = () => current === task;
    const finish = () => { if (active()) stop(); };
    const schedule = (callback, delay) => {
      const timer = setTimeout(callback, delay);
      task.cleanups.push(() => clearTimeout(timer));
      return timer;
    };
    let fallingBack = false;
    async function fallback() {
      if (!active() || fallingBack) return;
      fallingBack = true;
      releaseAudio();
      if (!synthesis || !Utterance) {
        onNote("录音暂不可用，当前浏览器也不支持系统朗读；字幕和音效仍可使用。");
        finish();
        return;
      }
      try {
        const chineseVoices = () => synthesis.getVoices().filter((item) => /^zh(?:-|$)/i.test(item.lang));
        let voices = chineseVoices();
        if (!voices.length) {
          onNote("录音暂不可用，正在等待设备的中文语音。");
          await new Promise((done) => {
            let timer;
            const cleanup = () => {
              synthesis.removeEventListener?.("voiceschanged", update);
              clearTimeout(timer);
              done();
            };
            const update = () => {
              try { if (chineseVoices().length) cleanup(); }
              catch { cleanup(); }
            };
            task.cleanups.push(cleanup);
            synthesis.addEventListener?.("voiceschanged", update);
            timer = setTimeout(cleanup, voiceWait);
            update();
          });
          if (!active()) return;
          voices = chineseVoices();
        }
        if (!voices.length) {
          onNote("录音暂不可用，未找到中文系统语音；字幕和音效仍可使用。");
          finish();
          return;
        }
        const role = cue.voice ?? (cue.speaker === "小黑" ? "child" : cue.speaker === "无限" ? "adultMale" : "adultFemale");
        const utterance = new Utterance(cue.text);
        utterance.voice = castVoice(mandarinVoices(voices), role, voiceCast());
        utterance.lang = utterance.voice.lang;
        const { rate, pitch } = voiceProfiles[role] ?? voiceProfiles.adultFemale;
        Object.assign(utterance, { rate, pitch });
        utterance.onend = finish;
        utterance.onerror = (event) => {
          if (!active()) return;
          if (!["canceled", "interrupted"].includes(event.error))
            onNote("系统朗读未能播放，字幕仍可使用。");
          finish();
        };
        task.cleanups.push(() => {
          utterance.onend = utterance.onerror = null;
          synthesis.cancel();
        });
        onNote("录音暂不可用，已改用设备中文语音。");
        onSpeaking(true);
        schedule(() => {
          if (active()) onNote("系统朗读未能完成，字幕继续显示。");
          finish();
        }, 30000);
        synthesis.speak(utterance);
      } catch {
        if (active()) onNote("系统朗读未能播放，字幕仍可使用。");
        finish();
      }
    }
    let audio = null;
    function releaseAudio() {
      if (!audio) return;
      const previous = audio;
      audio = null;
      previous.onplaying = previous.onended = previous.onerror = null;
      previous.pause();
      previous.removeAttribute("src");
      previous.load();
    }
    const source = recordedClip(cue);
    if (source && Audio) {
      try {
        audio = new Audio(source);
        task.cleanups.push(releaseAudio);
        const loading = schedule(fallback, loadWait);
        audio.onplaying = () => {
          if (!active()) return;
          clearTimeout(loading);
          onNote("正在播放普通中文合成配音。");
          onSpeaking(true);
          schedule(() => {
            if (active()) onNote("录音播放未能完成，字幕继续显示。");
            finish();
          }, 30000);
        };
        audio.onended = () => {
          if (active()) onNote("");
          finish();
        };
        audio.onerror = fallback;
        audio.play().catch((error) => {
          if (!active()) return;
          if (error.name === "NotAllowedError") {
            onNote("浏览器阻止了播放，请点试听按钮后重试；字幕仍可使用。");
            finish();
          } else fallback();
        });
      } catch { fallback(); }
    } else fallback();
    return finished;
  }
  return { play, stop };
}
