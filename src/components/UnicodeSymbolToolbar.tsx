import React, { useState } from 'react';

interface UnicodeSymbolToolbarProps {
  onInsertSymbol: (symbol: string) => void;
  className?: string;
}

const MATH_SYMBOLS = [
  '±', '×', '÷', '≤', '≥', '≠', '≈', '√', 'π', '∞', '°',
  '²', '³', '₁', '₂', 'α', 'β', 'γ', 'Δ', 'Ω', 'μ', '½', '¾', '⅓',
];

const SINHALA_CHARACTERS = [
  '්', 'ා', 'ැ', 'ෑ', 'ි', 'ී', 'ු', 'ූ', 'ෘ', 'ෙ', 'ේ', 'ෛ', 'ො', 'ෝ', 'ෞ', 'ෟ',
  'ං', 'ඃ', 'ඥ', 'ඳ', 'ඟ', 'ඦ', 'ඬ',
];

export const UnicodeSymbolToolbar: React.FC<UnicodeSymbolToolbarProps> = ({ onInsertSymbol, className = '' }) => {
  const [activeTab, setActiveTab] = useState<'math' | 'sinhala'>('math');

  return (
    <div className={`p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2">Quick Insert:</span>
          <button
            type="button"
            onClick={() => setActiveTab('math')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'math'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Math & Science
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sinhala')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'sinhala'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Sinhala Vowels & Ligatures
          </button>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
          Click symbol to insert into active input
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(activeTab === 'math' ? MATH_SYMBOLS : SINHALA_CHARACTERS).map((sym) => (
          <button
            key={sym}
            type="button"
            onClick={() => onInsertSymbol(sym)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-800 hover:text-white dark:text-slate-200 dark:hover:text-white font-medium border border-slate-200 dark:border-slate-700/60 rounded-lg text-sm transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
            title={`Insert ${sym}`}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
};
