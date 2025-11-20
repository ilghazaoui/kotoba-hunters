import React, { useState, useEffect, useCallback } from 'react';
import { Word, Grid as GridType } from './types';
import { generateGameGrid } from './utils/gridGenerator';
import { JLPT_N5_WORDS, WORD_COUNT_PER_GAME } from './constants';
import GridBoard from './components/Grid';
import WordList from './components/WordList';
import { RefreshCw, Trophy } from 'lucide-react';

const App: React.FC = () => {
  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [grid, setGrid] = useState<GridType>([]);
  const [foundWordIds, setFoundWordIds] = useState<string[]>([]);
  const [showWinModal, setShowWinModal] = useState(false);

  const startNewGame = useCallback(() => {
    const { grid: newGrid, placedWords } = generateGameGrid(JLPT_N5_WORDS, WORD_COUNT_PER_GAME);
    setGrid(newGrid);
    setGameWords(placedWords);
    setFoundWordIds([]);
    setShowWinModal(false);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleWordCheck = (selectedString: string): Word | null => {
    // Check if the selected string matches any of the game words
    const matchedWord = gameWords.find(
      w => w.hiragana === selectedString && !foundWordIds.includes(w.id)
    );

    if (matchedWord) {
      // Vibrate on mobile for feedback
      if (navigator.vibrate) navigator.vibrate(50);
      
      const newFoundIds = [...foundWordIds, matchedWord.id];
      setFoundWordIds(newFoundIds);

      // Mark cells as found in the grid visually
      setGrid(prevGrid => {
         const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
         // Simple linear search for the word in directions (Horizontal, Vertical, Diagonal)
         // This is a "repair" strategy since we didn't store placement.
         const directions = [[0, 1], [1, 0], [1, 1]];
         const len = selectedString.length;
         const size = newGrid.length;
         
         for(let r=0; r<size; r++) {
             for(let c=0; c<size; c++) {
                 for(let [dr, dc] of directions) {
                     // Check if word exists starting here
                     let match = true;
                     let coords = [];
                     for(let i=0; i<len; i++) {
                         const nr = r + dr*i;
                         const nc = c + dc*i;
                         if(nr >= size || nc >= size || newGrid[nr][nc].char !== selectedString[i]) {
                             match = false;
                             break;
                         }
                         coords.push({r: nr, c: nc});
                     }
                     
                     if(match) {
                         // Mark found
                         coords.forEach(({r, c}) => {
                             newGrid[r][c].isPartOfWord = true;
                         });
                         // We can break or continue (if word appears twice? unlikely for generated set)
                     }
                 }
             }
         }
         return newGrid;
      });

      if (newFoundIds.length === gameWords.length) {
        setTimeout(() => setShowWinModal(true), 500);
      }
      
      return matchedWord;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start p-4 font-sans pb-32">
      <header className="w-full max-w-[400px] flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kotoba Hunters</h1>
        <button 
          onClick={startNewGame}
          className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
          aria-label="Restart Game"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      <main className="flex flex-col items-center w-full gap-4">
        <div className="relative w-full flex justify-center">
           <GridBoard 
             grid={grid} 
             foundWords={foundWordIds} 
             onWordCheck={handleWordCheck} 
           />
        </div>

        <WordList words={gameWords} foundWordIds={foundWordIds} />
      </main>

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center transform animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Yatta! (やった!)</h2>
            <p className="text-slate-600 mb-6">
              You found all {gameWords.length} words! Great job practicing your Hiragana.
            </p>
            <button 
              onClick={startNewGame}
              className="w-full py-3 px-4 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-lg active:translate-y-0.5"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      
      <footer className="mt-8 text-slate-400 text-xs text-center">
        <p>JLPT N5 Vocabulary Practice</p>
      </footer>
    </div>
  );
};

export default App;