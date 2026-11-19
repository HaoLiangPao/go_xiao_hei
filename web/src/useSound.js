import { useEffect, useRef, useState } from "react";
import { createRainSoundscape } from "./rainSoundscape.js";

const delivery = {
  无限: { rate: 0.84, pitch: 0.86 },
  小黑: { rate: 1.02, pitch: 1.23 },
};

export function useSound() {
  const [enabled, setEnabled] = useState(false),
    [voice, setVoice] = useState(false),
    [music, setMusic] = useState(true),
    [sheltered, setSheltered] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [visible, setVisible] = useState(() => !document.hidden),
    [note, setNote] = useState("");
  const context = useRef(null),
    mix = useRef(null),
    currentUtterance = useRef(null);

  function unlock() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) {
        setNote("当前浏览器不支持音效，字幕仍可使用。");
        return;
      }
      if (!context.current) {
        context.current = new Audio();
        mix.current = createRainSoundscape(context.current);
      }
      context.current
        .resume()
        .catch(() => setNote("音效未能开启，请再点一次声音按钮。"));
    } catch {
      setNote("音效暂时不可用，字幕仍可使用。");
    }
  }
  function toggle() {
    if (!enabled) unlock();
    else stop();
    setEnabled(!enabled);
  }
  function play(kind) {
    if (
      !enabled ||
      !visible ||
      !context.current ||
      context.current.state !== "running"
    )
      return;
    const notes =
      kind === "memory"
        ? [523.25, 659.25, 783.99]
        : kind === "place"
          ? [659.25, 987.77]
          : [440];
    try {
      notes.forEach((frequency, index) => {
        const audio = context.current,
          time = audio.currentTime + index * 0.085,
          oscillator = audio.createOscillator(),
          gain = audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(
          kind === "pick" ? 0.025 : 0.06,
          time + 0.008,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(time);
        oscillator.stop(time + 0.25);
      });
    } catch {
      setNote("音效暂时不可用，字幕仍可使用。");
    }
  }
  function speak({ text, speaker }) {
    if (!enabled || !voice || document.hidden) return;
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setNote("当前浏览器没有系统朗读功能。");
      return;
    }
    const chinese = window.speechSynthesis
      .getVoices()
      .filter((item) => /^zh(?:-|$)/i.test(item.lang));
    const mandarin = chinese.filter((item) =>
      /^zh(?:-(?:CN|TW|SG|Hans|Hant))?$/i.test(item.lang),
    );
    const choices = mandarin.length ? mandarin : chinese;
    const systemVoice =
      choices[speaker === "小黑" && choices.length > 1 ? 1 : 0];
    if (!systemVoice) {
      setNote("未找到中文系统语音；字幕和音效仍可使用。");
      return;
    }
    stop();
    setNote("");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = systemVoice;
    utterance.lang = systemVoice.lang;
    const { rate, pitch } = delivery[speaker] ?? { rate: 0.91, pitch: 1 };
    utterance.rate = rate;
    utterance.pitch = pitch;
    function finish() {
      if (currentUtterance.current !== utterance) return;
      currentUtterance.current = null;
      setSpeaking(false);
    }
    utterance.onend = finish;
    utterance.onerror = (event) => {
      if (
        currentUtterance.current === utterance &&
        !["canceled", "interrupted"].includes(event.error)
      ) {
        setNote("系统朗读未能播放，字幕仍可使用。");
      }
      finish();
    };
    currentUtterance.current = utterance;
    setSpeaking(true);
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      finish();
      setNote("系统朗读未能播放，字幕仍可使用。");
    }
  }
  function stop() {
    if (currentUtterance.current) {
      currentUtterance.current = null;
      window.speechSynthesis?.cancel();
    }
    setSpeaking(false);
  }
  useEffect(() => {
    mix.current?.({
      active: enabled && visible,
      sheltered,
      playingMusic: music,
      speaking,
    });
  }, [enabled, visible, sheltered, music, speaking]);
  useEffect(() => {
    if (!voice) stop();
  }, [voice]);
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    function onVisibility() {
      setVisible(!document.hidden);
      if (document.hidden) stop();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (currentUtterance.current) window.speechSynthesis?.cancel();
      context.current?.close().catch(() => {});
    };
  }, []);
  return {
    enabled,
    voice,
    setVoice,
    music,
    setMusic,
    sheltered,
    setSheltered,
    toggle,
    play,
    speak,
    stop,
    note,
  };
}
