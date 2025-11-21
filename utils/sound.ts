export type SoundId =
  | 'tile-touch'
  | 'word-match'
  | 'game-complete'
  | 'ui-soft';

let audioCtx: AudioContext | null = null;

const ensureAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      audioCtx = new Ctx();
    } catch {
      audioCtx = null;
    }
  }
  return audioCtx;
};

interface PlayOptions {
  vibrate?: number | number[];
}

const playBeep = (id: SoundId) => {
  const ctx = ensureAudioContext();
  if (!ctx) return;

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
    case 'game-complete':
      duration = 0.4;
      startFreq = 520;
      endFreq = 1040;
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
  const baseGain = id === 'game-complete' ? 0.12 : id === 'word-match' ? 0.08 : 0.04;
  gain.gain.linearRampToValueAtTime(baseGain, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration + 0.02);
};

export const playSound = (id: SoundId, options?: PlayOptions) => {
  try {
    playBeep(id);
    if (options?.vibrate !== undefined && navigator.vibrate) {
      navigator.vibrate(options.vibrate);
    }
  } catch {
    // ignore failures
  }
};

