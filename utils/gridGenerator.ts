import { Cell, Word, Grid, Coordinate } from '../types';
import { HIRAGANA_CHARS, GRID_SIZE } from '../constants';

const DIRECTIONS = [
  [0, 1],   // Horizontal
  [1, 0],   // Vertical
  [1, 1],   // Diagonal Down-Right
];

export const createEmptyGrid = (size: number): Grid => {
  const grid: Grid = [];
  for (let r = 0; r < size; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < size; c++) {
      row.push({ row: r, col: c, char: '', id: `${r}-${c}` });
    }
    grid.push(row);
  }
  return grid;
};

const canPlaceWord = (grid: Grid, word: string, row: number, col: number, dr: number, dc: number): boolean => {
  const size = grid.length;
  
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;

    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    
    const cellChar = grid[r][c].char;
    // Must be empty or match the character we want to place
    if (cellChar !== '' && cellChar !== word[i]) return false;
  }
  return true;
};

const placeWord = (grid: Grid, word: string, row: number, col: number, dr: number, dc: number) => {
  for (let i = 0; i < word.length; i++) {
    grid[row + dr * i][col + dc * i].char = word[i];
  }
};

export const generateGameGrid = (allWords: Word[], count: number): { grid: Grid; placedWords: Word[] } => {
  let grid = createEmptyGrid(GRID_SIZE);
  const placedWords: Word[] = [];
  
  // Shuffle words
  const shuffled = [...allWords].sort(() => 0.5 - Math.random());
  
  for (const wordObj of shuffled) {
    if (placedWords.length >= count) break;

    const word = wordObj.hiragana;
    // Try placing word 50 times before giving up and skipping it
    let placed = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const [dr, dc] = dir;
      
      const startRow = Math.floor(Math.random() * GRID_SIZE);
      const startCol = Math.floor(Math.random() * GRID_SIZE);

      if (canPlaceWord(grid, word, startRow, startCol, dr, dc)) {
        placeWord(grid, word, startRow, startCol, dr, dc);
        placedWords.push(wordObj);
        placed = true;
        break;
      }
    }
  }

  // Fill empty cells
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c].char === '') {
        grid[r][c].char = HIRAGANA_CHARS[Math.floor(Math.random() * HIRAGANA_CHARS.length)];
      }
    }
  }

  return { grid, placedWords };
};

export const getSelectedCells = (start: Coordinate, end: Coordinate, size: number): Coordinate[] => {
  const dx = end.col - start.col;
  const dy = end.row - start.row;

  if (dx === 0 && dy === 0) return [{ ...start }];

  // Calculate angle to determine direction
  // We snap to 8 cardinal directions (Horizontal, Vertical, Diagonal)
  const angle = Math.atan2(dy, dx);
  const octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;

  // Map octant to unit vector
  // 0: E, 1: SE, 2: S, 3: SW, 4: W, 5: NW, 6: N, 7: NE
  const mapping = [
    { dr: 0, dc: 1 },   // 0: Right
    { dr: 1, dc: 1 },   // 1: Down-Right
    { dr: 1, dc: 0 },   // 2: Down
    { dr: 1, dc: -1 },  // 3: Down-Left
    { dr: 0, dc: -1 },  // 4: Left
    { dr: -1, dc: -1 }, // 5: Up-Left
    { dr: -1, dc: 0 },  // 6: Up
    { dr: -1, dc: 1 },  // 7: Up-Right
  ];

  const { dr, dc } = mapping[octant];

  // Determine length of selection based on maximum axis displacement.
  // This allows the user to control the length intuitively by distance from start.
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  
  const cells: Coordinate[] = [];
  for (let i = 0; i <= steps; i++) {
    const r = start.row + dr * i;
    const c = start.col + dc * i;
    
    // Only add valid cells within bounds
    if (r >= 0 && r < size && c >= 0 && c < size) {
      cells.push({ row: r, col: c });
    } else {
      break; // Stop if we hit the edge
    }
  }
  return cells;
};

export const getWordFromCells = (grid: Grid, cells: Coordinate[]): string => {
  return cells.map(c => grid[c.row][c.col].char).join('');
};