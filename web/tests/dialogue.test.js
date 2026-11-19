import test from "node:test";
import assert from "node:assert/strict";
import { createDialoguePlayer } from "../src/dialoguePlayer.js";
import { dialogueCues, clipFilename, recordedClip } from "../src/dialogueClips.js";

function fixture(options = {}) {
  const state = { audio: [], spoken: [], notes: [], speaking: [], voices: [], canceled: 0 };
  class Audio {
    constructor(src) { this.src = src; state.audio.push(this); }
    play() { return options.rejection ? Promise.reject(options.rejection) : Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute() { this.src = ""; }
    load() {}
  }
  const synthesis = Object.assign(new EventTarget(), {
    getVoices: () => state.voices,
    speak: (item) => state.spoken.push(item),
    cancel: () => state.canceled++,
  });
  const player = createDialoguePlayer({
    Audio, synthesis, Utterance: class { constructor(text) { this.text = text; } },
    onSpeaking: (value) => state.speaking.push(value),
    onNote: (value) => state.notes.push(value),
    voiceWait: 10, ...options,
  });
  return { state, synthesis, player };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
const cue = dialogueCues[1];

test("replayed dialogue uses the matching clip; changed text/profile cannot reuse stale audio", () => {
  assert.equal(recordedClip({ ...cue, id: "umbrella-replay-123" }), recordedClip(cue));
  assert.equal(recordedClip({ ...cue, text: "新台词" }), null);
  assert.notEqual(clipFilename({ ...cue, text: "新台词" }), clipFilename(cue));
  assert.equal(new Set(dialogueCues.map(clipFilename)).size, 6);
});

test("recording plays with no OS voices and settles only when ended", async () => {
  const { state, player } = fixture();
  let ended = false;
  const done = player.play(cue).then(() => { ended = true; });
  state.audio[0].onplaying();
  await flush();
  assert.equal(ended, false);
  assert.equal(state.spoken.length, 0);
  state.audio[0].onended();
  await done;
  assert.equal(state.speaking.at(-1), false);
});

test("new clip cancels the old one and stale play rejection cannot start speech", async () => {
  const { state, player } = fixture({ rejection: new Error("missing") });
  const first = player.play(cue);
  const second = player.play(dialogueCues[3]);
  player.stop();
  await Promise.all([first, second]);
  await flush();
  assert.ok(state.audio.every((audio) => audio.paused));
  assert.equal(state.spoken.length, 0);
});

test("missing recording falls back once to system Chinese speech", async () => {
  const { state, player } = fixture({ rejection: new Error("404") });
  state.voices = [{ lang: "zh-CN", name: "中文" }];
  const done = player.play(cue);
  const lateError = state.audio[0].onerror;
  await flush();
  lateError();
  assert.equal(state.spoken.length, 1);
  assert.equal(state.spoken[0].text, cue.text);
  state.spoken[0].onend();
  await done;
});

test("voiceschanged supplies late Chinese voices before reporting unavailable", async () => {
  const { state, synthesis, player } = fixture();
  const done = player.play(cue);
  state.audio[0].onerror();
  state.voices = [{ lang: "zh-CN", name: "延迟中文" }];
  synthesis.dispatchEvent(new Event("voiceschanged"));
  await flush();
  assert.equal(state.spoken.length, 1);
  state.spoken[0].onend();
  await done;
});

test("canceling while waiting for voices prevents late speech", async () => {
  const { state, synthesis, player } = fixture();
  const done = player.play(cue);
  state.audio[0].onerror();
  player.stop();
  state.voices = [{ lang: "zh-CN" }];
  synthesis.dispatchEvent(new Event("voiceschanged"));
  await done;
  await flush();
  assert.equal(state.spoken.length, 0);
});

test("missing audio and Chinese voices settle and preserve a useful subtitle notice", async () => {
  const { state, player } = fixture();
  const done = player.play(cue);
  state.audio[0].onerror();
  await done;
  assert.match(state.notes.at(-1), /未找到中文系统语音.*字幕和音效仍可使用/);
  assert.equal(state.speaking.at(-1), false);
});

test("autoplay rejection asks for a gesture and does not attempt another automatic player", async () => {
  const rejection = Object.assign(new Error("blocked"), { name: "NotAllowedError" });
  const { state, player } = fixture({ rejection });
  await player.play(cue);
  assert.match(state.notes.at(-1), /试听按钮/);
  assert.equal(state.spoken.length, 0);
});

test("stalled loading and interrupted playback cannot hang the dialogue queue", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { state, player } = fixture({ voiceWait: 20, loadWait: 10 });
  const loading = player.play(cue);
  t.mock.timers.tick(10);
  t.mock.timers.tick(20);
  await loading;
  const playing = player.play(cue);
  state.audio.at(-1).onplaying();
  t.mock.timers.tick(30000);
  await playing;
  assert.match(state.notes.at(-1), /录音播放未能完成/);
});

test("subtitle queue waits for audio after its reading timer and still supports next", async (t) => {
  const { JSDOM } = await import("jsdom");
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { useDialogue } = await import("../src/useDialogue.js");
  const dom = new JSDOM('<div id="root"></div>');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = () => ({ matches: true });
  let resolvePlayback, dialogue;
  const sound = { speak: () => new Promise((resolve) => { resolvePlayback = resolve; }), stopDialogue: () => resolvePlayback?.(), stop: () => resolvePlayback?.() };
  function Harness() { dialogue = useDialogue(sound); return null; }
  const root = createRoot(document.getElementById("root"));
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    await React.act(() => root.render(React.createElement(Harness)));
    await React.act(() => dialogue.enqueue([cue]));
    await React.act(async () => { t.mock.timers.tick(10000); });
    assert.equal(dialogue.cue.id, "opening");
    assert.equal(dialogue.pending, 2);
    await React.act(async () => { resolvePlayback(); });
    assert.equal(dialogue.cue.id, cue.id);
    await React.act(() => dialogue.next());
    assert.equal(dialogue.pending, 0);
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
