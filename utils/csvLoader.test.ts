import { describe, it, expect } from 'vitest';
import { parseJlptCsv } from './csvLoader';

const sampleCsv = [
  'expression,reading,meaning,tags',
  '多分,たぶん,probably,N5',
  'そうじ,そうじ (する),cleaning,N5',
  '月,~がつ,month (counter),N5',
  'できる,できる,can / be able to,N5',
  'カタカナ,カタカナ,katakana (should be skipped because of katakana),N5',
].join('\n');

describe('csvLoader.parseJlptCsv', () => {
  const words = parseJlptCsv(sampleCsv);

  it('parses basic CSV rows into Word objects', () => {
    expect(words.length).toBeGreaterThan(0);
  });

  it('normalizes 多分 reading to たぶん', () => {
    const tabun = words.find(w => w.kanji === '多分');
    expect(tabun).toBeDefined();
    expect(tabun!.hiragana).toBe('たぶん');
  });

  it('drops (する) from そうじ (する)', () => {
    const souji = words.find(w => w.kanji === 'そうじ');
    expect(souji).toBeDefined();
    expect(souji!.hiragana).toBe('そうじ');
  });

  it('removes the leading tilde from ~がつ', () => {
    const gatsu = words.find(w => w.kanji === '月');
    expect(gatsu).toBeDefined();
    expect(gatsu!.hiragana).toBe('がつ');
  });

  it('keeps できる reading as できる', () => {
    const dekiru = words.find(w => w.kanji === 'できる');
    expect(dekiru).toBeDefined();
    expect(dekiru!.hiragana).toBe('できる');
  });

  it('skips katakana-only entries', () => {
    expect(words.some(w => w.kanji === 'カタカナ')).toBe(false);
  });
});
