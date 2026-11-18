// All clocks, envelopes, and mute state belong to audio alone.
const masterVolume = 0.22;
const sirenRange = 420;
const beat = 0.54;
const chords = [
  [57, 64, 67, 72], [53, 60, 64, 69], [48, 55, 59, 64], [55, 62, 65, 69],
];
const cues = {
  enter: [[105, 0, 0.13, 0.24], [320, 0.055, 0.08, 0.12]],
  exit: [[95, 0, 0.14, 0.23], [250, 0.06, 0.08, 0.12]],
  wanted: [[330, 0, 0.13, 0.18], [466, 0.09, 0.21, 0.18]],
  missionStart: [[523, 0.09, 0.15, 0.15], [659, 0.18, 0.18, 0.12]],
  missionComplete: [[523, 0, 0.12, 0.15], [659, 0.09, 0.13, 0.15],
    [784, 0.18, 0.17, 0.15], [1047, 0.29, 0.38, 0.16]],
  busted: [[392, 0, 0.17, 0.26], [294, 0.12, 0.2, 0.23], [196, 0.25, 0.43, 0.23]],
  confirm: [[440, 0, 0.08, 0.16], [587, 0.065, 0.1, 0.14]],
};

let audio;
let muted = false;

function safely(action) {
  try {
    action();
  } catch {
    // Audio may be blocked or disappear at any time.
  }
}

function voice(context, output, type, frequency) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  gain.gain.value = 0;
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gain).connect(output);
  return { oscillator, gain };
}

function envelope(gain, time, duration, volume) {
  gain.setValueAtTime(0, time);
  gain.linearRampToValueAtTime(volume, time + Math.min(0.05, duration / 4));
  gain.exponentialRampToValueAtTime(0.0001, time + duration);
}

function note({ context, master }, time, frequency, duration, volume, type = 'triangle') {
  const { oscillator, gain } = voice(context, master, type, frequency);
  envelope(gain.gain, time, duration, volume);
  oscillator.start(time);
  oscillator.stop(time + duration);
}

function scheduleMusic(state) {
  if (state.context.state !== 'running') return;
  const now = state.context.currentTime;
  state.nextBeat = Math.max(state.nextBeat, now + 0.015);
  while (state.nextBeat < now + 0.16) {
    const step = state.step++ % 32;
    const chord = chords[Math.floor(step / 8)];
    const midi = chord[[0, 1, 2, 3, 2, 1, 3, 2][step % 8]];
    if (!muted) {
      note(state, state.nextBeat, 440 * 2 ** ((midi - 69) / 12), 0.72, 0.055);
      if (step % 8 === 0) {
        note(state, state.nextBeat, 220 * 2 ** ((midi - 69) / 12), 1.8, 0.013, 'square');
      }
    }
    state.nextBeat += beat;
  }
}

function createNoise(context) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.16), context.sampleRate);
  const samples = buffer.getChannelData(0);
  let seed = 0x6b17;
  for (let i = 0; i < samples.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    samples[i] = seed / 0x80000000 - 1;
  }
  return buffer;
}

function initialize() {
  const AudioContext = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  try {
    const master = context.createGain();
    master.gain.value = muted ? 0 : masterVolume;
    master.connect(context.destination);
    const engine = voice(context, master, 'triangle', 40);
    engine.oscillator.start();

    const siren = voice(context, master, 'triangle', 570);
    const modulation = context.createOscillator();
    const depth = context.createGain();
    modulation.type = 'square';
    modulation.frequency.value = 1.15;
    depth.gain.value = 115;
    modulation.connect(depth).connect(siren.oscillator.frequency);
    modulation.start();
    siren.oscillator.start();

    const state = { context, master, engine, siren, noise: createNoise(context),
      step: 0, nextBeat: 0, pendingCues: [], resuming: false };
    setInterval(() => safely(() => scheduleMusic(state)), 100);
    audio = state;
  } catch {
    context.close().catch(() => {});
  }
}

function resumeAudio(state) {
  if (state.context.state !== 'suspended' || state.resuming) return;
  const resumed = state.context.resume();
  state.resuming = true;
  resumed.then(() => {
    state.resuming = false;
    for (const cue of state.pendingCues.splice(0)) playSound(cue);
  }, () => {
    state.resuming = false;
    state.pendingCues.length = 0;
  });
}

// Installed only for the interactive game. Capture runs before the title handlers.
export function listenForSound() {
  safely(() => {
    const onGesture = (event) => safely(() => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.type === 'keydown' && event.key.toLowerCase() === 'm') {
        muted = !muted;
        if (audio) audio.master.gain.setTargetAtTime(muted ? 0 : masterVolume, audio.context.currentTime, 0.015);
      }
      if (!audio) initialize();
      if (audio) resumeAudio(audio);
    });
    for (const type of ['pointerdown', 'click', 'keydown']) {
      window.addEventListener(type, onGesture, true);
    }
  });
}

export function playSound(cue) {
  if (!audio || muted) return;
  safely(() => {
    if (audio.context.state !== 'running') {
      if (audio.resuming && audio.pendingCues.length < 4) audio.pendingCues.push(cue);
      return;
    }
    const time = audio.context.currentTime;
    for (const [frequency, delay, duration, volume] of cues[cue]) {
      note(audio, time + delay, frequency, duration, volume);
    }
  });
}

export function playCollision(speed) {
  if (!audio || muted) return;
  safely(() => {
    const { context, master, noise } = audio;
    if (context.state !== 'running') return;
    const strength = Math.min(Math.abs(speed) / 285, 1);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noise;
    filter.type = 'lowpass';
    filter.frequency.value = 145 + 350 * strength;
    filter.Q.value = 0.6;
    source.connect(filter).connect(gain).connect(master);
    const time = context.currentTime;
    envelope(gain.gain, time, 0.15, 0.08 + 0.52 * strength);
    source.start(time);
  });
}

export function updateSound(car, wanted, patrols, player) {
  if (!audio) return;
  safely(() => {
    const { context, engine, siren } = audio;
    if (context.state !== 'running') return;
    const time = context.currentTime;
    const driving = car && !wanted.busted;
    if (driving) engine.oscillator.frequency.setTargetAtTime(40 + Math.abs(car.speed) * 0.31, time, 0.06);
    engine.gain.gain.setTargetAtTime(driving ? 0.11 : 0, time, 0.045);

    let distance = sirenRange;
    if (wanted.stars && !wanted.busted) {
      const target = car ?? player;
      for (const patrol of patrols) {
        distance = Math.min(distance, Math.hypot(patrol.x - target.x, patrol.y - target.y));
      }
    }
    const proximity = 1 - distance / sirenRange;
    siren.gain.gain.setTargetAtTime(0.14 * proximity ** 2, time, 0.08);
  });
}
