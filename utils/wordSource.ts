import { Word } from '../types';
import { parseN5Csv } from './csvLoader';

export async function loadN5Words(): Promise<Word[]> {
  // URL du CSV basée sur le base path Vite ; fonctionne en dev et en build
  const base = import.meta.env.BASE_URL || '/';
  const csvUrl = `${base.replace(/\/$/, '')}/data/n5.csv`;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to load N5 words CSV (${csvUrl})`);
  }

  const text = await response.text();

  try {
    const words = parseN5Csv(text);
    if (!words.length) {
      throw new Error('No N5 words found in CSV after filtering');
    }
    return words;
  } catch (err) {
    console.error('Error while parsing N5 CSV', err);
    throw err instanceof Error ? err : new Error('Unknown error while parsing N5 CSV');
  }
}
