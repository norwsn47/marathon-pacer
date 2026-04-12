import { getPaceBounds, formatPace, MARATHON_KM, calcAutoBalancePace } from '../lib/paceUtils';
import type { Segment, Strategy, Unit } from '../lib/types';

const SLIDER_STEP = 1;

interface Props {
  segments: Segment[];       // display segments (auto-balanced pace already applied)
  baseSegments: Segment[];   // raw user-set segments (for calculating if result is in range)
  targetSec: number;
  unit: Unit;
  strategy: Strategy;
  autoBalance: boolean;
  autoBalanceIdxs: number[];
  onToggleAutoBalance: () => void;
  segmentElevGain?: number[];
  onChange: (id: number, paceSecPerKm: number) => void;
}

function SliderRow({
  seg,
  targetPaceSec,
  unit,
  locked,
  elevGain,
  paceMin,
  paceMax,
  onChange,
}: {
  seg: Segment;
  targetPaceSec: number;
  unit: Unit;
  locked?: boolean;
  elevGain?: number;
  paceMin: number;
  paceMax: number;
  onChange: (id: number, val: number) => void;
}) {
  const pace = seg.paceSecPerKm;
  const diff = pace - targetPaceSec;
  const splitSec = Math.round(seg.paceSecPerKm * seg.distanceKm);
  const splitTime = `${Math.floor(splitSec / 60)}:${(splitSec % 60).toString().padStart(2, '0')}`;
  const pct = Math.max(0, Math.min(100, ((pace - paceMin) / (paceMax - paceMin)) * 100));
  const normalBackground = `linear-gradient(to right, #f97316 ${pct}%, #2a2a3d ${pct}%)`;

  const dotColor = locked
    ? '#22d3ee'
    : Math.abs(diff) < 3
    ? '#64748b'
    : diff < 0
    ? '#4ade80'
    : '#f97316';

  return (
    <div className={`flex flex-col border-b border-border last:border-0 ${locked ? 'opacity-90' : ''}`}>
    <div className="flex items-center gap-3 py-2">
      {/* Segment label */}
      <span className="text-[11px] font-semibold shrink-0 w-16" style={{ color: locked ? '#22d3ee' : '#64748b' }}>
        {seg.label}
        <span className="text-[9px] ml-0.5" style={{ color: locked ? '#0891b2' : '#374151' }}>
          {unit === 'km' ? 'km' : 'mi'}
        </span>
      </span>

      {locked ? (
        /* Auto-balanced — show a non-interactive filled bar + lock icon */
        <div className="flex-1 relative h-[6px] rounded-full overflow-hidden bg-[#2a2a3d]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-cyan-400 opacity-60"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full bg-cyan-400 border-2 border-[#0d0d12]"
            style={{ left: `calc(${pct}% - 5px)` }}
          />
        </div>
      ) : (
        <input
          type="range"
          min={paceMin}
          max={paceMax}
          step={SLIDER_STEP}
          value={Math.min(paceMax, Math.max(paceMin, Math.round(pace)))}
          onChange={e => onChange(seg.id, Number(e.target.value))}
          style={{ background: normalBackground }}
          className="flex-1 min-w-0"
          aria-label={`Pace for ${seg.label}`}
        />
      )}

      {/* Pace value + dot + cumulative time */}
      <div className="flex flex-col items-end shrink-0 w-20">
        <div className="flex items-center gap-1.5">
          {locked && (
            <span className="text-[9px] text-cyan-500 font-bold tracking-tight mr-0.5">AUTO</span>
          )}
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
          <span className={`text-[12px] font-bold font-mono ${locked ? 'text-cyan-300' : 'text-white'}`}>
            {formatPace(pace, unit)}
          </span>
        </div>
        <span className="text-[9px] font-mono text-slate-500">{splitTime}</span>
      </div>

      {locked && (
        <span className="text-cyan-600 text-[14px] shrink-0" title="Auto-balanced to hit target">🔒</span>
      )}
    </div>
    {elevGain !== undefined && elevGain > 0 && (
      <p className="text-[10px] text-cyan-600 font-semibold pb-1.5 pl-0.5 -mt-1">
        ↑ {elevGain}m
      </p>
    )}
    </div>
  );
}

export default function PaceSliders({
  segments,
  baseSegments,
  targetSec,
  unit,
  strategy,
  autoBalance,
  autoBalanceIdxs,
  onToggleAutoBalance,
  segmentElevGain,
  onChange,
}: Props) {
  const targetPaceSec = targetSec / MARATHON_KM;
  const isCustom = strategy === 'custom';
  const { min: paceMin, max: paceMax } = getPaceBounds(targetSec);
  const idxSet = new Set(autoBalanceIdxs);

  // Check if auto-balance would produce a valid pace
  const abPace = calcAutoBalancePace(baseSegments, autoBalanceIdxs, targetSec);
  const abValid = abPace >= paceMin && abPace <= paceMax;
  // Label shows the first locked segment (30km start)
  const abSeg = segments[autoBalanceIdxs[0]];

  return (
    <div className="bg-surface rounded-2xl px-4 pt-3 pb-1 border border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Split Paces
        </p>
        <p className="text-[10px] text-slate-600">
          avg {formatPace(targetPaceSec, unit)}/{unit === 'km' ? 'km' : 'mi'}
        </p>
      </div>

      {/* Auto-balance toggle — only visible in custom mode */}
      {isCustom && (
        <button
          onClick={onToggleAutoBalance}
          disabled={!abValid && !autoBalance}
          title={!abValid ? 'Required pace is out of range' : undefined}
          className={`w-full mb-3 flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98] ${
            autoBalance
              ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
              : abValid
              ? 'bg-surface-2 border-border text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400'
              : 'bg-surface-2 border-border text-slate-600 opacity-50 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            <span>
              Auto-balance 30km → finish
              <span className="font-normal text-[10px] ml-1 opacity-70">
                to hit target
              </span>
              <span className="font-normal text-[9px] ml-1 opacity-40">({abSeg?.label}…)</span>
            </span>
          </span>
          <span className="flex items-center gap-2">
            {autoBalance && abValid && (
              <span className="font-mono text-cyan-300 text-[11px]">
                {formatPace(abPace, unit)}/{unit === 'km' ? 'km' : 'mi'}
              </span>
            )}
            {!abValid && !autoBalance && (
              <span className="text-[10px] text-slate-600">out of range</span>
            )}
            {/* Toggle pill */}
            <span
              className={`inline-flex w-8 h-4 rounded-full transition-colors ${
                autoBalance ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`my-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                  autoBalance ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </span>
          </span>
        </button>
      )}

      {segments.map((seg, i) => (
        <SliderRow
          key={seg.id}
          seg={seg}
          targetPaceSec={targetPaceSec}
          unit={unit}
          locked={isCustom && autoBalance && idxSet.has(i)}
          elevGain={segmentElevGain?.[i]}
          paceMin={paceMin}
          paceMax={paceMax}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
