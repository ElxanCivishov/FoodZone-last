type BellTone = {
  freq: number;
  start: number;
  duration: number;
  volume: number;
  type?: OscillatorType;
};

const MIN_NOTIFICATION_SECONDS = 5;
const MAX_PENDING_SOUNDS = 2;

type SoundKind = "ready" | "request";
type QueuedSound = {
  kind: SoundKind;
  seconds: number;
};

let isPlaying = false;
let pendingSounds: QueuedSound[] = [];

function notificationLength(seconds?: number) {
  return Math.max(MIN_NOTIFICATION_SECONDS, seconds ?? MIN_NOTIFICATION_SECONDS);
}

function createAudioContext() {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioCtx() as AudioContext;
}

function createMaster(ctx: AudioContext) {
  const master = ctx.createGain();
  const warmth = ctx.createBiquadFilter();
  const compressor = ctx.createDynamicsCompressor();
  master.gain.value = 0.68;
  warmth.type = "lowpass";
  warmth.frequency.value = 4800;
  warmth.Q.value = 0.45;
  compressor.threshold.value = -16;
  compressor.knee.value = 18;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.22;
  master.connect(warmth);
  warmth.connect(compressor);
  compressor.connect(ctx.destination);
  return master;
}

function playBellTone(
  ctx: AudioContext,
  master: GainNode,
  { freq, start, duration, volume, type = "sine" }: BellTone,
) {
  const now = ctx.currentTime;
  const partials: Array<[number, number, number]> = [
    [1, 1, 1],
    [2.01, 0.34, 0.68],
    [3.02, 0.16, 0.48],
    [4.18, 0.08, 0.34],
  ];

  partials.forEach(([ratio, weight, decay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * ratio, now + start);
    osc.detune.setValueAtTime(ratio === 1 ? 0 : -4 + ratio * 1.5, now + start);
    osc.connect(gain);
    gain.connect(master);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume * weight),
      now + start + 0.018,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + start + duration * decay,
    );
    osc.start(now + start);
    osc.stop(now + start + duration + 0.04);
  });
}

function playMarimbaTone(
  ctx: AudioContext,
  master: GainNode,
  { freq, start, duration, volume }: BellTone,
) {
  const now = ctx.currentTime;
  const partials: Array<[number, number]> = [
    [1, 1],
    [2, 0.24],
    [3, 0.1],
  ];

  partials.forEach(([ratio, weight]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * ratio, now + start);
    osc.connect(gain);
    gain.connect(master);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.linearRampToValueAtTime(volume * weight, now + start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.04);
  });
}

function repeatPattern(
  seconds: number | undefined,
  interval: number,
  pattern: BellTone[],
  playTone: (ctx: AudioContext, master: GainNode, tone: BellTone) => void,
) {
  const ctx = createAudioContext();
  const master = createMaster(ctx);
  const length = notificationLength(seconds);

  for (let offset = 0; offset < length; offset += interval) {
    pattern.forEach((tone) => {
      const start = offset + tone.start;
      if (start < length) playTone(ctx, master, { ...tone, start });
    });
  }

  setTimeout(() => ctx.close(), Math.ceil((length + 1.2) * 1000));
  return length;
}

function playSoundNow({ kind, seconds }: QueuedSound) {
  if (kind === "ready") {
    return repeatPattern(
      seconds,
      1.45,
      [
        { freq: 587.33, start: 0, duration: 0.75, volume: 0.12 },
        { freq: 739.99, start: 0.16, duration: 0.95, volume: 0.13 },
        { freq: 987.77, start: 0.38, duration: 1.35, volume: 0.16 },
        { freq: 1318.51, start: 0.68, duration: 1.1, volume: 0.08 },
      ],
      playBellTone,
    );
  }

  return repeatPattern(
    seconds,
    1.3,
    [
      { freq: 523.25, start: 0, duration: 0.38, volume: 0.12 },
      { freq: 392, start: 0.28, duration: 0.5, volume: 0.11 },
      { freq: 523.25, start: 0.72, duration: 0.36, volume: 0.08 },
    ],
    playMarimbaTone,
  );
}

function drainSoundQueue() {
  if (isPlaying) return;
  const next = pendingSounds.shift();
  if (!next) return;

  try {
    isPlaying = true;
    const length = playSoundNow(next);
    setTimeout(() => {
      isPlaying = false;
      drainSoundQueue();
    }, Math.ceil((length + 0.35) * 1000));
  } catch {
    isPlaying = false;
    drainSoundQueue();
  }
}

function enqueueSound(kind: SoundKind, seconds?: number) {
  const next = { kind, seconds: notificationLength(seconds) };
  const existing = pendingSounds.find((item) => item.kind === kind);
  if (existing) {
    existing.seconds = Math.max(existing.seconds, next.seconds);
  } else {
    pendingSounds.push(next);
  }
  if (pendingSounds.length > MAX_PENDING_SOUNDS) {
    pendingSounds = pendingSounds.slice(-MAX_PENDING_SOUNDS);
  }
  drainSoundQueue();
}

export function playReadyOrderSound(seconds?: number) {
  enqueueSound("ready", seconds);
}

export function playWaiterRequestSound(seconds?: number) {
  enqueueSound("request", seconds);
}
