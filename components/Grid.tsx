import React, { useRef, useState, useCallback } from 'react';
import { Cell, Coordinate, Word } from '../types';
import { getSelectedCells, getWordFromCells } from '../utils/gridGenerator';
import { GRID_SIZE } from '../constants';

interface GridProps {
  grid: Cell[][];
  foundWords: string[]; // IDs of found words
  onWordCheck: (word: string) => Word | null; // Returns matched word object or null
  darkMode?: boolean;
}

const GridBoard: React.FC<GridProps> = ({ grid, foundWords, onWordCheck, darkMode = false }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Coordinate | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Coordinate | null>(null);
  const [selectedCells, setSelectedCells] = useState<Coordinate[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSelection = useCallback((end: Coordinate) => {
    if (!selectionStart) return;
    const cells = getSelectedCells(selectionStart, end, GRID_SIZE);
    setSelectedCells(cells);
    setSelectionEnd(end);
  }, [selectionStart]);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    e.preventDefault();
    // Only start if left click or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    const start = { row: r, col: c };
    setIsSelecting(true);
    setSelectionStart(start);
    setSelectionEnd(start);
    setSelectedCells([start]);
    
    // Capture pointer to handle moves outside the initial cell and ensure we don't lose the drag
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Because we use setPointerCapture, all events go to the Start Cell.
  // We must manually check which element is under the cursor.
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSelecting || !selectionStart) return;
    
    // Check coordinates of the pointer
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target) return;

    // Find the closest cell container
    const cellDiv = target.closest('[data-row]');
    if (cellDiv) {
      const r = parseInt(cellDiv.getAttribute('data-row') || '-1');
      const c = parseInt(cellDiv.getAttribute('data-col') || '-1');
      
      if (r >= 0 && c >= 0) {
        // Only update if the cell has changed from the current end selection
        if (!selectionEnd || r !== selectionEnd.row || c !== selectionEnd.col) {
          updateSelection({ row: r, col: c });
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isSelecting) return;
    
    setIsSelecting(false);
    // Release capture if it was set
    if (e.target instanceof HTMLElement && e.target.hasPointerCapture(e.pointerId)) {
       (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }

    // Validate word
    const selectedString = getWordFromCells(grid, selectedCells);
    const reversedString = selectedString.split('').reverse().join('');
    
    // Check normal and reverse (in case user dragged backwards)
    let found = onWordCheck(selectedString);
    if (!found) {
        found = onWordCheck(reversedString);
    }

    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedCells([]);
  };

  // Helper to check if a cell is currently selected
  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some(cell => cell.row === r && cell.col === c);
  };
  
  return (
    <div
      className={`grid gap-1 p-3 select-none touch-none rounded-xl shadow-lg border-2 mx-auto
        ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        width: '100%',
        maxWidth: '400px', // Max width for PC
        aspectRatio: '1/1',
        maxHeight: '60vh' // Limit height on landscape devices to ensure visibility
      }}
      ref={containerRef}
    >
      {grid.map((row, rIndex) => (
        row.map((cell, cIndex) => {
          const isSelected = isCellSelected(rIndex, cIndex);
          const isFound = cell.isPartOfWord; 

          let bgClass = darkMode ? 'bg-slate-700 text-slate-50 border-slate-600' : 'bg-slate-50 text-slate-900 border-slate-200';
          if (isFound) bgClass = darkMode
            ? 'bg-emerald-900 text-emerald-200 border-emerald-700'
            : 'bg-green-100 text-green-800 border-green-200';
          if (isSelected) bgClass = 'bg-blue-500 text-white scale-105 z-10 shadow-md transform transition-transform';

          return (
            <div
              key={cell.id}
              data-row={rIndex}
              data-col={cIndex}
              className={`
                ${bgClass}
                flex items-center justify-center 
                text-lg sm:text-xl md:text-2xl font-bold rounded-md cursor-pointer 
                transition-colors duration-150
              `}
              onPointerDown={(e) => handlePointerDown(rIndex, cIndex, e)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {cell.char}
            </div>
          );
        })
      ))}
    </div>
  );
};

export default GridBoard;