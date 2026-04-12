import { useState } from 'react';

const QUOTES = [
  { text: 'Only the disciplined ones are free in life.', attr: 'Eliud Kipchoge — 2× Olympic marathon gold' },
  { text: "Don't dream of winning, train for it.", attr: 'Mo Farah — 4× Olympic gold' },
  { text: 'You have to believe in yourself when no one else does.', attr: 'Haile Gebrselassie — 2× Olympic gold, marathon WR' },
  { text: "The miracle isn't that I finished. The miracle is that I had the courage to start.", attr: 'John Bingham — popularised beginner marathoning' },
  { text: 'Run often. Run long. But never outrun your joy of running.', attr: 'Julie Isphording — Olympian, Masters WR holder' },
  { text: "It's supposed to be hard. If it wasn't hard, everyone would do it.", attr: 'Kara Goucher — World Championship medallist' },
  { text: 'The will to win means nothing without the will to prepare.', attr: 'Juma Ikangaa — NYC Marathon winner' },
];

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
