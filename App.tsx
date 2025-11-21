import React, { useState, useEffect, useCallback } from 'react';
import { Word, Grid as GridType } from './types';
import { generateGameGrid } from './utils/gridGenerator';
import { WORD_COUNT_PER_GAME } from './constants';
import { loadWordsForLevel, JlptLevel } from './utils/wordSource';
import GridBoard from './components/Grid';
import WordList from './components/WordList';
import { RefreshCw, Trophy } from 'lucide-react';

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const App: React.FC = () => {
  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [grid, setGrid] = useState<GridType[]>([] as any);
  const [foundWordIds, setFoundWordIds] = useState<string[]>([]);
  const [showWinModal, setShowWinModal] = useState(false);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>('N5');
  const [showJapaneseHints, setShowJapaneseHints] = useState<boolean>(false);

  const startNewGame = useCallback(() => {
    if (!allWords.length) {
      return;
    }
    const { grid: newGrid, placedWords } = generateGameGrid(allWords, WORD_COUNT_PER_GAME);
    setGrid(newGrid);
    setGameWords(placedWords);
    setFoundWordIds([]);
    setShowWinModal(false);
    setShowJapaneseHints(false);
  }, [allWords]);

  // Charger les mots quand le niveau change
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoadingWords(true);
      setLoadError(null);
      setAllWords([]);
      setGameWords([]);
      setGrid([] as any);
      setFoundWordIds([]);
      setShowWinModal(false);
      setShowJapaneseHints(false);
      try {
        const words = await loadWordsForLevel(selectedLevel);
        if (cancelled) return;
        setAllWords(words);
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error
            ? e.message
            : `Unknown error while loading ${selectedLevel} words`;
        setLoadError(msg);
      } finally {
        if (!cancelled) setIsLoadingWords(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedLevel]);

  useEffect(() => {
    if (allWords.length) {
      startNewGame();
    }
  }, [allWords, startNewGame]);

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
          className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
          aria-label="Restart Game"
          disabled={isLoadingWords || !!loadError || !allWords.length}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {/* Sélecteur de niveau, en haut de la grille */}
      <div className="w-full max-w-[400px] mb-3 flex items-center justify-center gap-2">
        {LEVELS.map(level => (
          <button
            key={level}
            type="button"
            onClick={() => setSelectedLevel(level)}
            disabled={isLoadingWords && level === selectedLevel}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors
              ${
                level === selectedLevel
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }
              ${isLoadingWords && level === selectedLevel ? 'opacity-60 cursor-default' : ''}
            `}
          >
            {level}
          </button>
        ))}
      </div>

      <main className="flex flex-col items-center w-full gap-4">
        {isLoadingWords && (
          <p className="text-sm text-slate-500">Loading {selectedLevel} words...</p>
        )}
        {loadError && (
          <p className="text-sm text-red-600">Failed to load words: {loadError}</p>
        )}
        {!isLoadingWords && !loadError && !!allWords.length && (
          <>
            <div className="relative w-full flex flex-col items-center gap-2">
              <div className="w-full flex justify-center">
                <GridBoard grid={grid as any} foundWords={foundWordIds} onWordCheck={handleWordCheck} />
              </div>

              {/* Show hints toggle under the grid */}
              <button
                type="button"
                onClick={() => setShowJapaneseHints(prev => !prev)}
                disabled={isLoadingWords || !!loadError || !allWords.length}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors
                  ${
                    showJapaneseHints
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }
                  ${isLoadingWords || !allWords.length ? 'opacity-60 cursor-default' : ''}
                `}
                aria-label={showJapaneseHints ? 'Hide Japanese hints' : 'Show Japanese hints'}
              >
                {showJapaneseHints ? 'Hide hints' : 'Show hints'}
              </button>
            </div>

            <WordList
              words={gameWords}
              foundWordIds={foundWordIds}
              showJapaneseHints={showJapaneseHints}
            />
          </>
        )}
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
      </footer>
    </div>
  );
};

export default App;

