export type SoundId =
  | 'tile-touch'
  | 'word-match'
  | 'game-complete'
  | 'ui-soft';

let audioCtx: AudioContext | null = null;

const ensureAudioContext = async () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      audioCtx = new Ctx();
    } catch {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch {
      // ignore resume failure
    }
  }
  return audioCtx;
};

interface PlayOptions {
  vibrate?: number | number[];
}

const playGameCompleteMelody = (ctx: AudioContext) => {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const now = ctx.currentTime;
  const noteDuration = 0.12;

  notes.forEach((freq, index) => {
    const startTime = now + index * (noteDuration + 0.03);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.14, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + noteDuration + 0.05);
  });
};

const playBeep = async (id: SoundId) => {
  const ctx = await ensureAudioContext();
  if (!ctx) return;

  if (id === 'game-complete') {
    playGameCompleteMelody(ctx);
    return;
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Base settings per sound id
  let duration = 0.08; // seconds
  let startFreq = 440;
  let endFreq = 440;

  switch (id) {
    case 'tile-touch':
      duration = 0.05;
      startFreq = 520;
      endFreq = 480;
      break;
    case 'word-match':
      duration = 0.15;
      startFreq = 640;
      endFreq = 780;
      break;
    case 'ui-soft':
      duration = 0.05;
      startFreq = 360;
      endFreq = 300;
      break;
  }

  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  const baseGain = id === 'word-match' ? 0.08 : 0.04;
  gain.gain.linearRampToValueAtTime(baseGain, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration + 0.02);
};

export const playSound = (id: SoundId, options?: PlayOptions) => {
  try {
    void playBeep(id);
    if (options?.vibrate !== undefined && navigator.vibrate) {
      navigator.vibrate(options.vibrate);
    }
  } catch {
    // ignore failures
  }
};
