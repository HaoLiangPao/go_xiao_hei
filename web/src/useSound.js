import { useEffect, useRef, useState } from "react";
import { createRainSoundscape } from "./rainSoundscape.js";
import { mandarinVoices } from "./voiceProfiles.js";

import { createDialoguePlayer } from "./dialoguePlayer.js";

export function useSound(rainy = true) {
  const [enabled, setEnabled] = useState(false),
    [voice, setVoice] = useState(true),
    [music, setMusic] = useState(true),
    [sheltered, setSheltered] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [visible, setVisible] = useState(() => !document.hidden),
    [note, setNote] = useState(""),
    [voices, setVoices] = useState([]),
    [voiceCast, setVoiceCast] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("shiguang-voice-cast")) ?? {};
      } catch {
        return {};
      }
    });
  const context = useRef(null),
    mix = useRef(null),
    player = useRef(null), playbackKind = useRef(null), castRef = useRef(voiceCast);
  castRef.current = voiceCast;
  if (!player.current) player.current = createDialoguePlayer({
    onSpeaking: setSpeaking, onNote: setNote, voiceCast: () => castRef.current,
  });

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
  function speak(cue) {
    if (!enabled || !voice || document.hidden) return Promise.resolve();
    playbackKind.current = "dialogue";
    return player.current.play(cue);
  }
  function preview(cue) {
    if (!enabled || document.hidden) return;
    playbackKind.current = "preview";
    return player.current.play(cue);
  }
  function stopDialogue() {
    if (playbackKind.current !== "dialogue") return;
    playbackKind.current = null;
    player.current.stop();
  }
  function stop() {
    playbackKind.current = null;
    player.current.stop();
    setNote("");
  }
  useEffect(() => {
    mix.current?.({
      active: enabled && visible,
      rainy,
      sheltered,
      playingMusic: music,
      speaking,
    });
  }, [enabled, visible, sheltered, music, speaking, rainy]);
  useEffect(() => {
    if (!voice) stop();
  }, [voice]);
  useEffect(() => {
    const synthesis = window.speechSynthesis;
    function loadVoices() {
      setVoices(mandarinVoices(synthesis?.getVoices() ?? []));
    }
    loadVoices();
    synthesis?.addEventListener?.("voiceschanged", loadVoices);
    function onVisibility() {
      setVisible(!document.hidden);
      if (document.hidden) stop();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      synthesis?.removeEventListener?.("voiceschanged", loadVoices);
      player.current.stop();
      context.current?.close().catch(() => {});
    };
  }, []);
  function chooseVoice(role, voiceURI) {
    const next = { ...voiceCast, [role]: voiceURI };
    setVoiceCast(next);
    try {
      localStorage.setItem("shiguang-voice-cast", JSON.stringify(next));
    } catch {}
  }
  return {
    enabled,
    voice,
    setVoice,
    voices,
    voiceCast,
    chooseVoice,
    music,
    setMusic,
    sheltered,
    setSheltered,
    toggle,
    play,
    speak,
    preview,
    speaking,
    stopDialogue,
    stop,
    note,
  };
}
