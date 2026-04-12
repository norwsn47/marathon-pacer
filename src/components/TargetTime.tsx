import { useState, useEffect } from 'react';
import { formatDuration, parseDurationToSec } from '../lib/paceUtils';

const QUOTES = [
  { text: 'Only the disciplined ones are free in life.', attr: 'Eliud Kipchoge — 2× Olympic marathon gold' },
  { text: "Don't dream of winning, train for it.", attr: 'Mo Farah — 4× Olympic gold' },
  { text: 'You have to believe in yourself when no one else does.', attr: 'Haile Gebrselassie — 2× Olympic gold, marathon WR' },
  { text: "The miracle isn't that I finished. The miracle is that I had the courage to start.", attr: 'John Bingham — popularised beginner marathoning' },
  { text: 'Run often. Run long. But never outrun your joy of running.', attr: 'Julie Isphording — Olympian, Masters WR holder' },
  { text: "It's supposed to be hard. If it wasn't hard, everyone would do it.", attr: 'Kara Goucher — World Championship medallist' },
  { text: 'The will to win means nothing without the will to prepare.', attr: 'Juma Ikangaa — NYC Marathon winner' },
];

interface Props {
  targetSec: number;
  projectedSec: number;
  onChange: (seconds: number) => void;
}

export default function TargetTime({ targetSec, projectedSec, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  function nextQuote() {
    setQuoteIdx(i => {
      let n = Math.floor(Math.random() * (QUOTES.length - 1));
      if (n >= i) n += 1;
      return n;
    });
  }

  const quote = QUOTES[quoteIdx];

  const diff = projectedSec - targetSec;
  const absDiff = Math.abs(diff);
  const ahead = diff < -15;
  const behind = diff > 15;

  function fmtDiff(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    if (m === 0) return `${s}s`;
    return s === 0 ? `${m}m` : `${m}m ${s}s`;
  }

  const diffLabel = `${fmtDiff(absDiff)} ${diff < 0 ? 'ahead' : 'behind'}`;

  function startEditing() {
    setInputVal(formatDuration(targetSec));
    setEditing(true);
  }

  function commitEdit() {
    const parsed = parseDurationToSec(inputVal);
    if (parsed && parsed >= 7200 && parsed <= 25200) onChange(parsed);
    setEditing(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  }

  useEffect(() => {
    if (!editing) setInputVal(formatDuration(targetSec));
  }, [targetSec, editing]);

  return (
    <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border">
      <div className="flex items-start justify-between gap-4">
        {/* Left: target time */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Target Finish Time
          </p>

          <div className="flex items-end gap-3">
            {editing ? (
              <input
                autoFocus
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKey}
                className="text-3xl font-bold font-mono bg-transparent text-white outline-none border-b-2 border-orange-500 w-36"
                placeholder="H:MM:SS"
              />
            ) : (
              <button
                onClick={startEditing}
                className="text-3xl font-bold font-mono text-white hover:text-orange-400 transition-colors"
                title="Click to edit"
              >
                {formatDuration(targetSec)}
              </button>
            )}

            {(ahead || behind) && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 mb-1 ${
                ahead ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
              }`}>
                {ahead ? '↑ ' : '↓ '}{diffLabel}
              </span>
            )}
          </div>

          {/* Presets */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-600 shrink-0">Presets:</span>
            {[
              { label: '2:55', sec: 2 * 3600 + 55 * 60 },
              { label: '3:00', sec: 3 * 3600 },
              { label: '3:55', sec: 3 * 3600 + 55 * 60 },
              { label: '4:00', sec: 4 * 3600 },
            ].map(({ label, sec }) => (
              <button
                key={label}
                onClick={() => onChange(sec)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                  targetSec === sec
                    ? 'bg-orange-500/20 border-orange-500/60 text-orange-400'
                    : 'bg-surface-2 border-border text-slate-500 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: quote — desktop only */}
        <div className="hidden sm:block text-right w-[300px] shrink-0">
          <p className="text-sm italic text-slate-300 leading-snug line-clamp-2">"{quote.text}"</p>
          <div className="flex items-center justify-end gap-2 mt-1.5">
            <p className="text-[11px] text-slate-500 whitespace-nowrap">{quote.attr}</p>
            <button
              onClick={nextQuote}
              title="New quote"
              className="text-slate-600 hover:text-orange-400 transition-colors text-base leading-none shrink-0"
            >
              ↻
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
