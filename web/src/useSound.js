import { useEffect, useRef, useState } from "react";
import { createRainSoundscape } from "./rainSoundscape.js";
import { createDialoguePlayer } from "./dialoguePlayer.js";

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
    player = useRef(null),
    playbackKind = useRef(null);
  if (!player.current)
    player.current = createDialoguePlayer({ onSpeaking: setSpeaking, onNote: setNote });

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
      player.current.stop();
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
    preview,
    speaking,
    stopDialogue,
    stop,
    note,
  };
}
