import { useEffect, useRef, useState } from "react";
import { opening } from "./dialogueClips.js";
export function useDialogue(sound, paused = false) {
  const [queue, setQueue] = useState([opening]),
    [last, setLast] = useState(opening),
    [length, setLength] = useState(0),
    [log, setLog] = useState([]);
  const audio = useRef(sound);
  audio.current = sound;
  const active = queue[0];
  useEffect(() => {
    if (!active) return;
    setLast(active);
    setLength(0);
    const playback = paused ? Promise.resolve() : audio.current.speak(active);
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
  }, [active?.id]);
  function enqueue(events) {
    if (!events.length) return;
    setLog((items) => [...items, ...events]);
    setQueue((items) => [...items, ...events]);
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
    setLast(opening);
    setQueue([{ ...opening, id: `opening-${Date.now()}` }]);
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
