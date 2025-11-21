import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { playSound } from '../utils/sound';

interface WordListProps {
  words: Word[];
  foundWordIds: string[];
  showJapaneseHints?: boolean;
  darkMode?: boolean;
}

const WordList: React.FC<WordListProps> = ({ words, foundWordIds, showJapaneseHints = false, darkMode = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hintPulse, setHintPulse] = useState(false);

  const foundCount = foundWordIds.length;
  const totalCount = words.length;

  // Trigger a small pull animation on the toggle button
  // when hints are turned on while the list is closed.
  useEffect(() => {
    if (showJapaneseHints && !isOpen) {
      setHintPulse(true);
      const timeout = window.setTimeout(() => setHintPulse(false), 450);
      return () => window.clearTimeout(timeout);
    }
  }, [showJapaneseHints, isOpen]);

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <div
        className={`w-full max-w-[400px] rounded-t-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-x flex flex-col-reverse pointer-events-auto
          ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
      >
        {/* Toggle Button (Always visible at bottom) */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            playSound('ui-soft', { vibrate: 8 });
          }}
          className={`w-full p-4 rounded-t-none first:rounded-t-xl
            ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
        >
          <div
            className={`flex items-center justify-between w-full
              ${hintPulse ? 'animate-[pullUpDown_0.45s_ease-out]' : ''}`}
          >
            <div className="flex flex-col items-start">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Word List</h2>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {foundCount} / {totalCount} Found
              </span>
            </div>
            {/* Arrow Logic: Closed (Expand Up) -> Up. Open (Collapse Down) -> Down. */}
            {isOpen ? <ChevronDown className={darkMode ? 'text-slate-400' : 'text-slate-400'} /> : <ChevronUp className={darkMode ? 'text-slate-400' : 'text-slate-400'} />}
          </div>
        </button>

        {/* List Content (Expands Upwards) */}
        <div
          className={`
            transition-all duration-300 ease-in-out overflow-hidden
            ${darkMode ? 'bg-slate-900' : 'bg-white'}
            ${isOpen ? 'max-h-[50vh] opacity-100 border-b border-slate-100/20' : 'max-h-0 opacity-0 border-b-0'}
          `}
        >
          <div className="overflow-y-auto max-h-[50vh] p-2 scrollbar-hide">
            <ul className="grid grid-cols-2 gap-2">
              {words.map((word) => {
                const isFound = foundWordIds.includes(word.id);
                const showJapanese = isFound || showJapaneseHints;
                return (
                  <li
                    key={word.id}
                    className={`
                      flex items-center justify-between p-2 rounded-md border
                      transition-all duration-500
                      ${isFound
                        ? darkMode
                          ? 'bg-emerald-900/60 border-emerald-700'
                          : 'bg-green-50 border-green-200'
                        : darkMode
                          ? 'bg-slate-800 border-slate-700 hover:border-slate-500'
                          : 'bg-white border-slate-100 hover:border-slate-300'}
                    `}
                  >
                    <div className="flex flex-col min-w-0 flex-1 mr-1">
                      <span
                        className={`text-sm font-medium truncate ${
                          isFound
                            ? darkMode
                              ? 'text-emerald-200'
                              : 'text-green-700'
                            : darkMode
                              ? 'text-slate-100'
                              : 'text-slate-800'
                        }`}
                        title={word.meaning}
                      >
                        {word.meaning}
                      </span>
                      <span
                        className={`
                          text-xs font-bold mt-0.5 transition-all duration-500
                          ${showJapanese ? (darkMode ? 'text-slate-200 opacity-100 translate-y-0' : 'text-slate-700 opacity-100 translate-y-0') : 'opacity-0 -translate-y-2 h-0 overflow-hidden'}
                        `}
                      >
                        {showJapanese ? `${word.kanji} (${word.hiragana})` : ''}
                      </span>
                    </div>
                    {isFound && <Check className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-emerald-300' : 'text-green-500'}`} />}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WordList;
