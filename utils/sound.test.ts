import { describe, it, expect, vi } from 'vitest';
import { playSound } from './sound';

// Basic smoke tests for the sound helper to ensure it does not throw
// and that it calls navigator.vibrate when available.

describe('sound.playSound', () => {
  it('does not throw when playing a ui-soft sound', () => {
    expect(() => playSound('ui-soft')).not.toThrow();
  });

  it('invokes navigator.vibrate when vibrate option is provided (if available)', () => {
    const originalVibrate = navigator.vibrate;
    const vibrateSpy = vi.fn();

    // Try to patch vibrate directly; if that fails, fall back to spying.
    let restore: (() => void) | null = null;
    try {
      (navigator as any).vibrate = vibrateSpy;
      restore = () => {
        try {
          (navigator as any).vibrate = originalVibrate;
        } catch {
          // ignore if not writable
        }
      };
    } catch {
      if (originalVibrate) {
        const spy = vi.spyOn(navigator, 'vibrate').mockImplementation(vibrateSpy as any);
        restore = () => spy.mockRestore();
      }
    }

    expect(() => playSound('tile-touch', { vibrate: 10 })).not.toThrow();

    if (navigator.vibrate) {
      expect(vibrateSpy).toHaveBeenCalled();
    }

    if (restore) restore();
  });

  it('handles game-complete melody without throwing', () => {
    expect(() => playSound('game-complete', { vibrate: [50, 80, 50] })).not.toThrow();
  });
});
