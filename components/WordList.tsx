import React, { useState } from 'react';
import { Word } from '../types';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

interface WordListProps {
  words: Word[];
  foundWordIds: string[];
  showJapaneseHints?: boolean;
}

const WordList: React.FC<WordListProps> = ({ words, foundWordIds, showJapaneseHints = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const foundCount = foundWordIds.length;
  const totalCount = words.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <div className="w-full max-w-[400px] bg-white rounded-t-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-x border-slate-200 flex flex-col-reverse pointer-events-auto">
        
        {/* Toggle Button (Always visible at bottom) */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-t-none first:rounded-t-xl"
        >
          <div className="flex flex-col items-start">
            <h2 className="text-lg font-bold text-slate-800">Word List</h2>
            <span className="text-sm text-slate-500">{foundCount} / {totalCount} Found</span>
          </div>
          {/* Arrow Logic: Closed (Expand Up) -> Up. Open (Collapse Down) -> Down. */}
          {isOpen ? <ChevronDown className="text-slate-400" /> : <ChevronUp className="text-slate-400" />}
        </button>

        {/* List Content (Expands Upwards) */}
        <div 
          className={`
            transition-all duration-300 ease-in-out overflow-hidden bg-white
            ${isOpen ? 'max-h-[50vh] opacity-100 border-b border-slate-100' : 'max-h-0 opacity-0 border-b-0'}
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
                      ${isFound ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100 hover:border-slate-300'}
                    `}
                  >
                    <div className="flex flex-col min-w-0 flex-1 mr-1">
                      <span className={`text-sm font-medium truncate ${isFound ? 'text-green-700' : 'text-slate-800'}`} title={word.meaning}>
                        {word.meaning}
                      </span>
                      <span 
                        className={`
                          text-xs font-bold mt-0.5 transition-all duration-500
                          ${showJapanese ? 'text-slate-700 opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 h-0 overflow-hidden'}
                        `}
                      >
                        {showJapanese ? `${word.kanji} (${word.hiragana})` : ''}
                      </span>
                    </div>
                    {isFound && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
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