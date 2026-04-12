import { useState, useEffect } from 'react';
import { formatDuration, parseDurationToSec } from '../lib/paceUtils';

interface Props {
  targetSec: number;
  projectedSec: number;
  onChange: (seconds: number) => void;
}

const QUICK_STEPS = [
  { label: '−15m', delta: -15 * 60 },
  { label: '−5m', delta: -5 * 60 },
  { label: '+5m', delta: 5 * 60 },
  { label: '+15m', delta: 15 * 60 },
];

export default function TargetTime({ targetSec, projectedSec, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const diff = projectedSec - targetSec;
  const absDiff = Math.abs(diff);
  const ahead = diff < -15;
  const behind = diff > 15;

  const diffLabel =
    absDiff < 15
      ? 'Right on target'
      : `${formatDuration(absDiff)} ${diff < 0 ? 'ahead' : 'behind'}`;

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
    <div className="bg-surface rounded-2xl p-5 border border-border">
      <div className="flex items-start justify-between gap-4">
        {/* Target time */}
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Target Finish Time
          </p>
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
        </div>

        {/* Projected */}
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Projected
          </p>
          <p
            className={`text-3xl font-bold font-mono ${
              ahead ? 'text-green-400' : behind ? 'text-red-400' : 'text-slate-300'
            }`}
          >
            {formatDuration(projectedSec)}
          </p>
        </div>
      </div>

      {/* Delta badge */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            ahead
              ? 'bg-green-500/15 text-green-400'
              : behind
              ? 'bg-red-500/15 text-red-400'
              : 'bg-slate-500/15 text-slate-400'
          }`}
        >
          {ahead && '↑ '}
          {behind && '↓ '}
          {diffLabel}
        </span>
      </div>

      {/* Quick-adjust buttons */}
      <div className="mt-4 flex gap-2">
        {QUICK_STEPS.map(({ label, delta }) => (
          <button
            key={label}
            onClick={() => {
              const next = Math.max(7200, Math.min(25200, targetSec + delta));
              onChange(next);
            }}
            className="flex-1 py-2 rounded-xl bg-surface-2 text-xs font-semibold text-slate-400 hover:bg-surface-3 hover:text-orange-400 border border-border transition-all active:scale-95"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
