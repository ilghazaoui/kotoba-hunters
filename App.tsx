import React, {useCallback, useEffect, useState} from 'react';
import {Grid as GridType, Word} from './types';
import {generateGameGrid} from './utils/gridGenerator';
import {getWordCountForGridSize} from './constants';
import {JlptLevel, loadWordsForLevel} from './utils/wordSource';
import GridBoard from './components/Grid';
import WordList from './components/WordList';
import {Moon, RefreshCw, Sun, Trophy} from 'lucide-react';
import {playSound} from './utils/sound';

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const GRID_SIZES = [4, 5, 6, 7, 8, 9, 10];
const DARK_MODE_STORAGE_KEY = 'kotoba-hunters:dark-mode';

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
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(7);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);

  // Initialize dark mode from system preference / localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (stored === 'true') {
      setDarkMode(true);
      return;
    }
    if (stored === 'false') {
      setDarkMode(false);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  // Persist dark mode changes
  useEffect(() => {
    localStorage.setItem(DARK_MODE_STORAGE_KEY, darkMode ? 'true' : 'false');
  }, [darkMode]);

  // Game timer effect
  useEffect(() => {
    if (!isGameActive) return;
    const id = window.setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isGameActive]);

  const startNewGame = useCallback(() => {
    if (!allWords.length) {
      return;
    }
    const targetCount = getWordCountForGridSize(gridSize);
    const { grid: newGrid, placedWords } = generateGameGrid(allWords, targetCount, gridSize);
    setGrid(newGrid as any);
    setGameWords(placedWords);
    setFoundWordIds([]);
    setShowWinModal(false);
    setShowJapaneseHints(false);
    setElapsedSeconds(0);
    setIsGameActive(true);
  }, [allWords, gridSize]);

  // Load words when the JLPT level changes
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

  const handleWordCheck = (selectedString: string, path: { row: number; col: number }[]): Word | null => {
    const matchedWord = gameWords.find(
      w => w.hiragana === selectedString && !foundWordIds.includes(w.id)
    );

    if (matchedWord) {
      playSound('word-match', { vibrate: 40 });

      const newFoundIds = [...foundWordIds, matchedWord.id];
      setFoundWordIds(newFoundIds);

      // Mark the exact path that matched as part of the word
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
        path.forEach(({ row, col }) => {
          if (newGrid[row] && newGrid[row][col]) {
            newGrid[row][col].isPartOfWord = true;
          }
        });
        return newGrid;
      });

      if (newFoundIds.length === gameWords.length) {
        setIsGameActive(false);
        setTimeout(() => {
          playSound('game-complete', { vibrate: [50, 80, 50] });
          setShowWinModal(true);
        }, 300);
      }

      return matchedWord;
    }
    return null;
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start p-4 font-sans pb-32 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <header className="w-full max-w-[400px] flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
              ${darkMode ? 'bg-slate-800 text-yellow-300' : 'bg-slate-900 text-yellow-300'}`}
          >
            わ
          </span>
          <h1
            className={`flex items-baseline gap-1 tracking-tight ${
              darkMode ? 'text-slate-50' : 'text-slate-800'
            }`}
          >
            <span className="text-[1.9rem] leading-none font-black">Kotoba</span>
            <span className="text-[0.8rem] font-semibold uppercase tracking-[0.3em] opacity-80">
              Hunters
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startNewGame}
            className={`p-2 rounded-full shadow-sm border transition-all disabled:opacity-50
              ${darkMode ? 'bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 active:scale-95'}`}
            aria-label="Restart Game"
            disabled={isLoadingWords || !!loadError || !allWords.length}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDarkMode(prev => !prev)}
            className={`p-2 rounded-full shadow-sm border transition-all ${darkMode ? 'bg-yellow-300 text-slate-900 border-yellow-400' : 'bg-slate-800 text-white border-slate-700'}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Level selector above the grid */}
      <div className="w-full max-w-[400px] mb-2 flex items-center justify-center gap-2">
        {LEVELS.map(level => (
          <button
            key={level}
            type="button"
            onClick={() => {
              if (level !== selectedLevel) {
                playSound('ui-soft', { vibrate: 10 });
                setSelectedLevel(level);
              }
            }}
            disabled={isLoadingWords && level === selectedLevel}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors
              ${
                level === selectedLevel
                  ? darkMode
                    ? 'bg-slate-100 text-slate-900 border-slate-200'
                    : 'bg-slate-900 text-white border-slate-900'
                  : darkMode
                    ? 'bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }
              ${isLoadingWords && level === selectedLevel ? 'opacity-60 cursor-default' : ''}
            `}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Grid size selector (cute, mobile-friendly) */}
      <div className="w-full max-w-[400px] mb-3 flex items-center justify-center gap-1 text-xs">
        <div className="flex flex-wrap justify-center gap-1">
          {GRID_SIZES.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => {
                if (size !== gridSize) {
                  playSound('ui-soft', { vibrate: 10 });
                  setGridSize(size);
                }
              }}
              className={`px-2 py-1 rounded-full border font-semibold min-w-[44px]
                ${
                  size === gridSize
                    ? darkMode
                      ? 'bg-slate-100 text-slate-900 border-slate-200'
                      : 'bg-slate-900 text-white border-slate-900'
                    : darkMode
                      ? 'bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }
              `}
            >
              {size}×{size}
            </button>
          ))}
        </div>
      </div>

      <main className="flex flex-col items-center w-full gap-4">
        {isLoadingWords && (
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading {selectedLevel} words...
          </p>
        )}
        {loadError && (
          <p className="text-sm text-red-600">Failed to load words: {loadError}</p>
        )}
        {!isLoadingWords && !loadError && !!allWords.length && (
          <>
            <div className="relative w-full flex flex-col items-center gap-2">
              <div className="w-full flex justify-center">
                <GridBoard
                  grid={grid as any}
                  foundWords={foundWordIds}
                  onWordCheck={handleWordCheck}
                  darkMode={darkMode}
                />
              </div>

              {/* Timer under lower right corner of grid */}
              <div className="w-full max-w-[400px] flex justify-end px-3 -mt-1">
                <div
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-tight
                    ${darkMode
                      ? 'bg-slate-900/80 text-slate-50 border-slate-700'
                      : 'bg-white/80 text-slate-900 border-slate-200'}`}
                >
                  {formatTime(elapsedSeconds)}
                </div>
              </div>

              {/* Show hints toggle under the grid */}
              <button
                type="button"
                onClick={() => {
                  playSound('ui-soft', { vibrate: 10 });
                  setShowJapaneseHints(prev => !prev);
                }}
                disabled={isLoadingWords || !!loadError || !allWords.length}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors
                  ${
                    showJapaneseHints
                      ? darkMode
                        ? 'bg-slate-100 text-slate-900 border-slate-200'
                        : 'bg-slate-900 text-white border-slate-900'
                      : darkMode
                        ? 'bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700'
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
              darkMode={darkMode}
            />
          </>
        )}
      </main>

      {/* Win Modal */}
      {showWinModal && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300
            ${darkMode ? 'bg-black/70' : 'bg-black/50'}`}
        >
          <div
            className={`rounded-xl shadow-2xl p-8 max-w-sm w-full text-center transform animate-in zoom-in-95 duration-300
              ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
          >
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4
                ${darkMode ? 'bg-yellow-900/40' : 'bg-yellow-100'}`}
            >
              <Trophy className={darkMode ? 'w-8 h-8 text-yellow-300' : 'w-8 h-8 text-yellow-600'} />
            </div>
            <h2
              className={`text-2xl font-bold mb-6 ${darkMode ? 'text-slate-50' : 'text-slate-900'}`}
            >
              Nicely done!!
            </h2>
            <p className={darkMode ? 'text-slate-300 mb-6' : 'text-slate-600 mb-6'}>
              You found all {gameWords.length} words!
            </p>
            <button
              onClick={startNewGame}
              className={`w-full py-3 px-4 font-bold rounded-lg transition-colors shadow-lg active:translate-y-0.5
                ${darkMode ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
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

