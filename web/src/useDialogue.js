import { useEffect, useRef, useState } from "react";
export const opening = {
  id: "opening",
  speaker: "春日来信",
  text: "春雨落在叶尖。把散落的画面放回去，听听这一场雨。",
};
export function useDialogue(sound, openingCue = opening, paused = false) {
  const [queue, setQueue] = useState([openingCue]),
    [last, setLast] = useState(openingCue),
    [length, setLength] = useState(0),
    [log, setLog] = useState([]);
  const audio = useRef(sound);
  audio.current = sound;
  const active = queue[0];
  useEffect(() => {
    if (!active || paused) return;
    setLast(active);
    setLength(0);
    const playback = audio.current.speak(active);
    let canceled = false;
    const characters = Array.from(active.text);
    let index = 0,
      linger;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    function done() {
      linger = setTimeout(
        async () => {
          await playback;
          if (!canceled) setQueue((q) => (q[0]?.id === active.id ? q.slice(1) : q));
        },
        4200,
      );
    }
    if (reduced) {
      setLength(characters.length);
      done();
    }
    const interval = reduced
      ? null
      : setInterval(() => {
          index++;
          setLength(index);
          if (index >= characters.length) {
            clearInterval(interval);
            done();
          }
        }, 48);
    return () => {
      canceled = true;
      clearInterval(interval);
      clearTimeout(linger);
      audio.current.stopDialogue();
    };
  }, [active?.id, paused]);
  function enqueue(events) {
    if (!events.length) return;
    setLog((items) => [...items, ...events]);
    setQueue((items) => [
      ...items.filter((item) => !item.id.startsWith("opening")),
      ...events,
    ]);
  }
  function next() {
    setQueue((items) => items.slice(1));
  }
  function replay(event) {
    setQueue([{ ...event, id: `${event.id}-replay-${Date.now()}` }]);
  }
  function reset() {
    audio.current.stop();
    setLog([]);
    setLast(openingCue);
    setQueue([{ ...openingCue, id: `opening-${Date.now()}` }]);
  }
  const cue = active || last,
    text = active ? Array.from(cue.text).slice(0, length).join("") : cue.text;
  return {
    cue,
    text,
    enqueue,
    replay,
    next,
    reset,
    log,
    typing: !!active && length < Array.from(cue.text).length,
    pending: queue.length,
  };
}
