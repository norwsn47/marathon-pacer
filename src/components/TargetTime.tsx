import { useState, useEffect } from 'react';
import { formatDuration, parseDurationToSec, formatPace, MARATHON_KM, KM_PER_MILE } from '../lib/paceUtils';
import type { Unit } from '../lib/types';
import { QUOTES } from '../lib/quotes';

interface Props {
  targetSec: number;
  projectedSec: number;
  unit: Unit;
  onChange: (seconds: number) => void;
}

function parsePaceInput(val: string, unit: Unit): number | null {
  const parts = val.trim().split(':');
  if (parts.length !== 2) return null;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (isNaN(mins) || isNaN(secs) || secs >= 60 || mins < 0) return null;
  const secInUnit = mins * 60 + secs;
  const secPerKm = unit === 'km' ? secInUnit : secInUnit / KM_PER_MILE;
  return Math.round(secPerKm * MARATHON_KM);
}

export default function TargetTime({ targetSec, projectedSec, unit, onChange }: Props) {
  const [editingTime, setEditingTime] = useState(false);
  const [timeVal, setTimeVal] = useState('');
  const [timeError, setTimeError] = useState(false);

  const [editingPace, setEditingPace] = useState(false);
  const [paceVal, setPaceVal] = useState('');
  const [paceError, setPaceError] = useState(false);

  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  function nextQuote() {
    setQuoteIdx(i => {
      let n = Math.floor(Math.random() * (QUOTES.length - 1));
      if (n >= i) n += 1;
      return n;
    });
  }

  const quote = QUOTES[quoteIdx];
  const unitLabel = unit === 'km' ? 'km' : 'mi';

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

  function startEditingTime() {
    setEditingPace(false);
    setTimeVal(formatDuration(targetSec));
    setTimeError(false);
    setEditingTime(true);
  }

  function commitTime() {
    const parsed = parseDurationToSec(timeVal);
    if (parsed !== null && parsed >= 7200 && parsed <= 25200) {
      onChange(parsed);
      setTimeError(false);
      setEditingTime(false);
    } else {
      setTimeError(true);
    }
  }

  function handleTimeKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitTime();
    if (e.key === 'Escape') { setTimeError(false); setEditingTime(false); }
  }

  function startEditingPace() {
    setEditingTime(false);
    setPaceVal(formatPace(targetSec / MARATHON_KM, unit));
    setPaceError(false);
    setEditingPace(true);
  }

  function commitPace() {
    const newSec = parsePaceInput(paceVal, unit);
    if (newSec !== null && newSec >= 7200 && newSec <= 25200) {
      onChange(newSec);
      setPaceError(false);
      setEditingPace(false);
    } else {
      setPaceError(true);
    }
  }

  function handlePaceKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitPace();
    if (e.key === 'Escape') { setPaceError(false); setEditingPace(false); }
  }

  useEffect(() => {
    if (!editingTime) setTimeVal(formatDuration(targetSec));
  }, [targetSec, editingTime]);

  useEffect(() => {
    if (!editingPace) setPaceVal(formatPace(targetSec / MARATHON_KM, unit));
  }, [targetSec, unit, editingPace]);

  return (
    <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border">
      <div className="flex items-start justify-between gap-4">
        {/* Left: time + pace inputs */}
        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-6 flex-wrap">
            {/* Target Time */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Target Time
              </p>
              {editingTime ? (
                <div className="flex flex-col gap-0.5">
                  <input
                    autoFocus
                    value={timeVal}
                    onChange={e => { setTimeVal(e.target.value); setTimeError(false); }}
                    onBlur={commitTime}
                    onKeyDown={handleTimeKey}
                    className={`text-3xl font-bold font-mono bg-transparent text-white outline-none border-b-2 w-36 ${
                      timeError ? 'border-red-500' : 'border-orange-500'
                    }`}
                    placeholder="H:MM:SS"
                    aria-label="Target finish time"
                    aria-invalid={timeError}
                  />
                  {timeError && (
                    <span className="text-[10px] text-red-400">2:00:00 – 7:00:00</span>
                  )}
                </div>
              ) : (
                <button
                  onClick={startEditingTime}
                  className="text-3xl font-bold font-mono text-white hover:text-orange-400 transition-colors"
                  title="Click to edit"
                  aria-label={`Target finish time: ${formatDuration(targetSec)}. Click to edit.`}
                >
                  {formatDuration(targetSec)}
                </button>
              )}
            </div>

            {/* Target Pace */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Target Pace
              </p>
              {editingPace ? (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-end gap-1">
                    <input
                      autoFocus
                      value={paceVal}
                      onChange={e => { setPaceVal(e.target.value); setPaceError(false); }}
                      onBlur={commitPace}
                      onKeyDown={handlePaceKey}
                      className={`text-3xl font-bold font-mono bg-transparent text-white outline-none border-b-2 w-20 ${
                        paceError ? 'border-red-500' : 'border-orange-500'
                      }`}
                      placeholder="M:SS"
                      aria-label="Target pace"
                      aria-invalid={paceError}
                    />
                    <span className="text-base font-semibold text-slate-500 mb-1">/{unitLabel}</span>
                  </div>
                  {paceError && (
                    <span className="text-[10px] text-red-400">Enter a valid pace (M:SS)</span>
                  )}
                </div>
              ) : (
                <button
                  onClick={startEditingPace}
                  className="text-3xl font-bold font-mono text-white hover:text-orange-400 transition-colors"
                  title="Click to edit pace"
                  aria-label={`Target pace: ${formatPace(targetSec / MARATHON_KM, unit)}/${unitLabel}. Click to edit.`}
                >
                  {formatPace(targetSec / MARATHON_KM, unit)}
                  <span className="text-base font-semibold text-slate-500 ml-1">/{unitLabel}</span>
                </button>
              )}
            </div>

            {/* Diff badge */}
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
              { label: '3:50', sec: 3 * 3600 + 50 * 60 },
              { label: '3:55', sec: 3 * 3600 + 55 * 60 },
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
              aria-label="Show next quote"
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
