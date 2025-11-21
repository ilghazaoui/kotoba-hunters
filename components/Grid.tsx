import React, { useRef, useState, useCallback } from 'react';
import { Cell, Coordinate, Word } from '../types';
import { getSelectedCells, getWordFromCells } from '../utils/gridGenerator';
import { playSound } from '../utils/sound';

interface GridProps {
  grid: Cell[][];
  foundWords: string[]; // IDs of found words
  onWordCheck: (word: string, path: Coordinate[]) => Word | null; // Returns matched word object or null
  darkMode?: boolean;
}

const GridBoard: React.FC<GridProps> = ({ grid, onWordCheck, darkMode = false }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Coordinate | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Coordinate | null>(null);
  const [selectedCells, setSelectedCells] = useState<Coordinate[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSelection = useCallback((end: Coordinate) => {
    if (!selectionStart) return;
    const cells = getSelectedCells(selectionStart, end, grid.length);
    setSelectedCells(cells);
    setSelectionEnd(end);
  }, [selectionStart, grid.length]);

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    e.preventDefault();
    // Only start if left click or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    const start = { row: r, col: c };
    setIsSelecting(true);
    setSelectionStart(start);
    setSelectionEnd(start);
    setSelectedCells([start]);

    playSound('tile-touch', { vibrate: 10 });

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
        const isNewCell = !selectionEnd || r !== selectionEnd.row || c !== selectionEnd.col;
        if (isNewCell) {
          updateSelection({ row: r, col: c });
          // Play a very soft feedback for each new tile in the drag path
          playSound('tile-touch', { vibrate: 5 });
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

    const selectedString = getWordFromCells(grid, selectedCells);

    // Try original order
    let matched = onWordCheck(selectedString, selectedCells);

    // If not found, try reversed coordinates (opposite direction)
    if (!matched && selectedCells.length >= 2) {
      const reversedCoords = [...selectedCells].reverse();
      const reversedString = getWordFromCells(grid, reversedCoords);

      onWordCheck(reversedString, reversedCoords);
    }

    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedCells([]);
  };

  // Helper to check if a cell is currently selected
  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some(cell => cell.row === r && cell.col === c);
  };
  
  const size = grid.length || 0;

  const baseFontClasses =
    size >= 10 ? 'text-lg sm:text-xl md:text-2xl' :
    size >= 8 ? 'text-xl sm:text-2xl md:text-3xl' :
    size >= 6 ? 'text-2xl sm:text-3xl md:text-4xl' :
                'text-3xl sm:text-4xl md:text-5xl';

  return (
    <div
      className={`grid gap-1 p-3 select-none touch-none rounded-xl shadow-lg border-2 mx-auto
        ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
      style={{
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        width: '100%',
        maxWidth: '400px',
        aspectRatio: '1/1',
        maxHeight: '60vh',
      }}
      ref={containerRef}
    >
      {grid.map((row, rIndex) => (
        row.map((cell, cIndex) => {
          const isSelected = isCellSelected(rIndex, cIndex);
          const isFound = cell.isPartOfWord;

          let bgClass = darkMode
            ? 'bg-slate-700 text-slate-50 border-slate-600'
            : 'bg-slate-100 text-slate-900 border-slate-300 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.6)]';
          if (isFound) bgClass = darkMode
            ? 'bg-emerald-900 text-emerald-200 border-emerald-700'
            : 'bg-green-100 text-green-800 border-green-300 shadow-[inset_0_0_0_1px_rgba(74,222,128,0.7)]';
          if (isSelected) bgClass = 'bg-blue-500 text-white scale-105 z-10 shadow-md transform transition-transform';

          return (
            <div
              key={cell.id}
              data-row={rIndex}
              data-col={cIndex}
              className={`${bgClass} flex items-center justify-center ${baseFontClasses} font-bold rounded-md cursor-pointer transition-colors duration-150 border`}
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
