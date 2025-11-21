import { describe, it, expect } from 'vitest';
import { createEmptyGrid, generateGameGrid, getSelectedCells, getWordFromCells } from './gridGenerator';
import type { Word } from '../types';

const sampleWords: Word[] = [
  { id: 'w1', kanji: '多分', hiragana: 'たぶん', meaning: 'probably' },
  { id: 'w2', kanji: 'そうじ', hiragana: 'そうじ', meaning: 'cleaning' },
  { id: 'w3', kanji: '月', hiragana: 'がつ', meaning: 'month (counter)' },
];

describe('gridGenerator.createEmptyGrid', () => {
  it('creates a square grid of the requested size', () => {
    const size = 5;
    const grid = createEmptyGrid(size);
    expect(grid.length).toBe(size);
    grid.forEach((row) => {
      expect(row.length).toBe(size);
      row.forEach((cell) => {
        expect(cell.char).toBe('');
        expect(cell.id).toBe(`${cell.row}-${cell.col}`);
      });
    });
  });
});

describe('gridGenerator.generateGameGrid', () => {
  it('places words without intersections and fills all cells', () => {
    const size = 7;
    const count = 3;
    const { grid, placedWords } = generateGameGrid(sampleWords, count, size);

    // All cells should be non-empty after generation
    grid.forEach((row) => {
      row.forEach((cell) => {
        expect(cell.char).not.toBe('');
      });
    });

    // All placed words should be part of the original sample set
    placedWords.forEach((w) => {
      expect(sampleWords.some((sw) => sw.id === w.id)).toBe(true);
    });
  });
});

describe('gridGenerator.getSelectedCells & getWordFromCells', () => {
  it('selects a straight line between two coordinates and reads the word', () => {
    const size = 5;
    const grid = createEmptyGrid(size);

    // Place a simple horizontal word manually: A-B-C from (2,1) to (2,3)
    grid[2][1].char = 'A';
    grid[2][2].char = 'B';
    grid[2][3].char = 'C';

    const start = { row: 2, col: 1 };
    const end = { row: 2, col: 3 };

    const cells = getSelectedCells(start, end, size);
    expect(cells.length).toBe(3);
    expect(cells[0]).toEqual(start);
    expect(cells[cells.length - 1]).toEqual(end);

    const word = getWordFromCells(grid as any, cells);
    expect(word).toBe('ABC');
  });
});
