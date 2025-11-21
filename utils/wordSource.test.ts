import {beforeEach, describe, expect, it, vi} from 'vitest';
import {type JlptLevel, loadWordsForLevel} from './wordSource';

const SAMPLE_CSV = [
  'expression,reading,meaning,tags',
  '多分,たぶん,probably,N5',
].join('\n');

const mockFetch = vi.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = mockFetch;

describe('wordSource.loadWordsForLevel', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('loads and parses words for a JLPT level', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_CSV,
    });

    const words = await loadWordsForLevel('N5');
    expect(words.length).toBeGreaterThan(0);
    expect(words[0].hiragana).toBe('たぶん');
  });

  it('throws when the CSV cannot be fetched', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, text: async () => '' });

    await expect(loadWordsForLevel('N4' as JlptLevel)).rejects.toThrow('Failed to load N4 words CSV');
  });
});

