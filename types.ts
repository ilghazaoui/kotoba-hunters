export interface Word {
  id: string;
  hiragana: string;
  kanji: string;
  meaning: string;
}

export interface Cell {
  row: number;
  col: number;
  char: string;
  id: string; // unique id for React keys
  isPartOfWord?: boolean;
}

export type Grid = Cell[][];

export interface Coordinate {
  row: number;
  col: number;
}