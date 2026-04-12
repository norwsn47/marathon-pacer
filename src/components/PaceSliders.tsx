import { PACE_MIN_SEC, PACE_MAX_SEC, PACE_STEP, formatPace, MARATHON_KM } from '../lib/paceUtils';
import type { Segment, Unit } from '../lib/types';

interface Props {
  segments: Segment[];
  targetSec: number;
  unit: Unit;
  onChange: (id: number, paceSecPerKm: number) => void;
}

function SliderRow({
  seg,
  targetPaceSec,
  unit,
  onChange,
}: {
  seg: Segment;
  targetPaceSec: number;
  unit: Unit;
  onChange: (id: number, val: number) => void;
}) {
  const pace = seg.paceSecPerKm;
  const diff = pace - targetPaceSec;
  const pct = ((pace - PACE_MIN_SEC) / (PACE_MAX_SEC - PACE_MIN_SEC)) * 100;

  const deltaLabel =
    Math.abs(diff) < 3
      ? 'avg'
      : diff < 0
      ? `${formatPace(-diff, unit)} faster`
      : `${formatPace(diff, unit)} slower`;

  const deltaColor =
    Math.abs(diff) < 3
      ? 'text-slate-500'
      : diff < 0
      ? 'text-green-400'
      : 'text-orange-400';

  const sliderBackground = `linear-gradient(to right, #f97316 ${pct}%, #2a2a3d ${pct}%)`;

  const segmentTime = pace * seg.distanceKm;
  const mins = Math.floor(segmentTime / 60);
  const secs = Math.round(segmentTime % 60);
  const splitLabel = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="py-3 border-b border-border last:border-0">
      {/* Top row: label + pace display */}
      <div className="flex items-baseline justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 w-14">
            {seg.label}
            <span className="ml-0.5 text-[10px] text-slate-600">{unit === 'km' ? 'km' : 'mi'}</span>
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className={`text-[10px] font-medium ${deltaColor}`}>{deltaLabel}</span>
          <span className="text-xs text-slate-500 font-mono">{splitLabel}</span>
          <span className="text-base font-bold font-mono text-white w-16 text-right">
            {formatPace(pace, unit)}
            <span className="text-[10px] font-normal text-slate-500 ml-0.5">
              /{unit === 'km' ? 'km' : 'mi'}
            </span>
          </span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={PACE_MIN_SEC}
        max={PACE_MAX_SEC}
        step={PACE_STEP}
        value={pace}
        onChange={e => onChange(seg.id, Number(e.target.value))}
        style={{ background: sliderBackground }}
        className="w-full"
        aria-label={`Pace for ${seg.label}`}
      />
    </div>
  );
}

export default function PaceSliders({ segments, targetSec, unit, onChange }: Props) {
  const targetPaceSec = targetSec / MARATHON_KM;

  return (
    <div className="bg-surface rounded-2xl px-5 pt-4 pb-1 border border-border">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Split Paces
        </p>
        <p className="text-[10px] text-slate-600">
          target avg: {formatPace(targetPaceSec, unit)}/{unit === 'km' ? 'km' : 'mi'}
        </p>
      </div>

      {segments.map(seg => (
        <SliderRow
          key={seg.id}
          seg={seg}
          targetPaceSec={targetPaceSec}
          unit={unit}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
