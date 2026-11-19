// The score and rain are synthesized locally. Each loop uses the same sample
// rate so it can play on both mobile and desktop audio contexts.
const RATE = 24000;
const TAU = 2 * Math.PI;

function makeLoop(context, seconds, render) {
  const buffer = context.createBuffer(1, RATE * seconds, RATE);
  render(buffer.getChannelData(0));
  const source = context.createBufferSource();
  const volume = context.createGain();
  source.buffer = buffer;
  source.loop = true;
  volume.gain.value = 0;
  source.connect(volume).connect(context.destination);
  source.start();
  return volume.gain;
}

function drawRain(samples) {
  let low = 0;
  for (let i = 0; i < samples.length; i++) {
    const noise = Math.random() * 2 - 1;
    low += 0.065 * (noise - low);
    samples[i] = 0.75 * low + 0.08 * noise;
  }
}

function drawUmbrella(samples) {
  // Short, uneven impacts have a dull resonance and a light surface tick.
  for (let at = 0.17; at < 11.8; at += 0.14 + Math.random() * 0.4) {
    const start = Math.floor(at * RATE);
    const frequency = 230 + Math.random() * 190;
    const strength = 0.2 + Math.random() * 0.55;
    for (let i = 0; i < RATE * 0.12; i++) {
      const t = i / RATE;
      const body = 0.5 * Math.sin(TAU * frequency * t) * Math.exp(-40 * t);
      const tick = 0.24 * (Math.random() * 2 - 1) * Math.exp(-100 * t);
      samples[start + i] += strength * (1 - Math.exp(-900 * t)) * (body + tick);
    }
  }
}

function drawMusic(samples) {
  // A quiet four-bar original motif. Leave a little silence at the loop seam.
  const melody = [
    [0.4, 60],
    [1.2, 67],
    [2, 74],
    [3.1, 76],
    [4.4, 57],
    [5.2, 64],
    [6.1, 72],
    [7.2, 71],
    [8.4, 53],
    [9.2, 60],
    [10, 67],
    [11.2, 72],
    [12.4, 55],
    [13.2, 62],
    [14.1, 69],
  ];
  for (const [at, note] of melody) {
    const frequency = 440 * 2 ** ((note - 69) / 12);
    const start = Math.floor(at * RATE);
    for (let i = 0; i < 1.65 * RATE; i++) {
      const t = i / RATE;
      const phase = TAU * frequency * t;
      const envelope =
        Math.min(1, t / 0.04) *
        Math.exp(-3.5 * t) *
        Math.min(1, (1.65 - t) / 0.18);
      samples[start + i] +=
        0.45 * envelope * (Math.sin(phase) + 0.22 * Math.sin(2 * phase));
    }
  }
}

export function createRainSoundscape(context) {
  const rain = makeLoop(context, 8, drawRain);
  const umbrella = makeLoop(context, 12, drawUmbrella);
  const music = makeLoop(context, 16, drawMusic);
  return function mix({ active, sheltered, playingMusic, speaking }) {
    const time = context.currentTime;
    const duck = speaking ? 0.55 : 1;
    rain.setTargetAtTime(
      active ? (sheltered ? 0.11 : 0.29) * duck : 0,
      time,
      0.12,
    );
    umbrella.setTargetAtTime(active && sheltered ? 0.19 * duck : 0, time, 0.12);
    music.setTargetAtTime(
      active && playingMusic ? 0.085 * duck : 0,
      time,
      0.12,
    );
  };
}
