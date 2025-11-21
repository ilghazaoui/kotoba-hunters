import { Word } from '../types';

// Very small CSV splitter that handles quotes and commas inside quotes.
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Escaped quote inside quotes
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// Normalize kana readings coming from CSV.
// - Trim whitespace
// - If reading contains a semicolon (e.g. "XX; YY"), keep only the first part ("XX").
// - If reading contains parentheses (e.g. "そうじ (する)"), drop everything from the first '('.
// - Remove tilde markers like "～" or "~" (e.g. "～がつ" -> "がつ").
function normalizeKana(input: string): string {
  if (!input) return '';

  let base = input;

  // Cut anything after the first opening parenthesis (ASCII or full-width)
  const parenIndex = base.indexOf('(');
  const fullWidthParenIndex = base.indexOf('（');
  let cutIndex = -1;
  if (parenIndex !== -1 && fullWidthParenIndex !== -1) {
    cutIndex = Math.min(parenIndex, fullWidthParenIndex);
  } else if (parenIndex !== -1) {
    cutIndex = parenIndex;
  } else if (fullWidthParenIndex !== -1) {
    cutIndex = fullWidthParenIndex;
  }
  if (cutIndex !== -1) {
    base = base.substring(0, cutIndex);
  }

  // Then handle semicolons (ASCII or full-width)
  const semicolonIndex = base.indexOf(';');
  const fullWidthSemicolonIndex = base.indexOf('；');

  if (semicolonIndex !== -1 && fullWidthSemicolonIndex !== -1) {
    base = base.substring(0, Math.min(semicolonIndex, fullWidthSemicolonIndex));
  } else if (semicolonIndex !== -1) {
    base = base.substring(0, semicolonIndex);
  } else if (fullWidthSemicolonIndex !== -1) {
    base = base.substring(0, fullWidthSemicolonIndex);
  }

  // Remove tilde markers (ASCII ~ and full-width ～) often used like "～がつ"
  base = base.replace(/[~～]/g, '');

  return base.trim();
}

// Generic CSV parser for JLPT vocabulary.
// Expected columns: expression,reading,meaning,tags
export function parseJlptCsv(csvText: string): Word[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const header = splitCsvLine(lines[0]);
  const expressionIdx = header.indexOf('expression');
  const readingIdx = header.indexOf('reading');
  const meaningIdx = header.indexOf('meaning');

  if (expressionIdx === -1 || readingIdx === -1 || meaningIdx === -1) {
    throw new Error('Unexpected CSV header format');
  }

  const words: Word[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    const cols = splitCsvLine(rawLine);
    if (cols.length <= Math.max(expressionIdx, readingIdx, meaningIdx)) continue;

    const expression = cols[expressionIdx] || '';
    const reading = cols[readingIdx] || '';
    const meaning = cols[meaningIdx] || '';

    const normalizedReading = normalizeKana(reading);
    if (!normalizedReading) continue;

    if (/[ァ-ン]/.test(normalizedReading)) continue;

    const id = `word-${i}`;
    words.push({
      id,
      hiragana: normalizedReading,
      kanji: expression,
      meaning,
    });
  }

  return words;
}

// Backward-compatible wrapper for N5 only (garde la même signature)
export function parseN5Csv(csvText: string): Word[] {
  return parseJlptCsv(csvText);
}
