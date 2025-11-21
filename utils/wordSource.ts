import { Word } from '../types';
import { parseJlptCsv } from './csvLoader';

export type JlptLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';

function buildCsvUrl(level: JlptLevel): string {
  const base = (import.meta as any).env?.BASE_URL ?? (import.meta as any).env?.VITE_BASE_URL ?? '/';
  const normalizedBase = typeof base === 'string' ? base.replace(/\/$/, '') : '';
  const levelDigit = level.substring(1); // 'N5' -> '5'
  return `${normalizedBase || ''}/data/n${levelDigit}.csv` || `/data/n${levelDigit}.csv`;
}

export async function loadWordsForLevel(level: JlptLevel): Promise<Word[]> {
  const csvUrl = buildCsvUrl(level);
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to load ${level} words CSV (${csvUrl})`);
  }

  const text = await response.text();

  try {
    const words = parseJlptCsv(text);
    if (!words.length) {
      throw new Error(`No ${level} words found in CSV after parsing`);
    }
    return words;
  } catch (err) {
    console.error(`Error while parsing ${level} CSV`, err);
    throw err instanceof Error ? err : new Error(`Unknown error while parsing ${level} CSV`);
  }
}

// Backward-compatible N5-specific loader used initially
export async function loadN5Words(): Promise<Word[]> {
  return loadWordsForLevel('N5');
}
