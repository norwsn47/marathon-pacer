import { useState } from 'react';
import { QUOTES } from '../lib/quotes';

export default function QuoteBanner() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  function next() {
    setIdx(i => {
      let n = Math.floor(Math.random() * (QUOTES.length - 1));
      if (n >= i) n += 1;
      return n;
    });
  }

  const q = QUOTES[idx];

  return (
    <div className="bg-surface rounded-2xl p-4 border border-border flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-base italic text-slate-200 leading-snug">"{q.text}"</p>
        <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{q.attr}</p>
      </div>
      <button
        onClick={next}
        title="New quote"
        aria-label="Next quote"
        className="text-slate-600 hover:text-orange-400 transition-colors text-xl leading-none shrink-0 pt-0.5"
      >
        ↻
      </button>
    </div>
  );
}
