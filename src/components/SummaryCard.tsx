import { useCallback } from 'react';
import {
  totalTimeSeconds,
  avgPaceSecPerKm,
  formatDuration,
  formatPace,
  MARATHON_KM,
  KM_PER_MILE,
} from '../lib/paceUtils';
import type { Segment, Strategy, Unit } from '../lib/types';

interface Props {
  segments: Segment[];
  targetSec: number;
  unit: Unit;
  strategy: Strategy;
}

const STRATEGY_LABELS: Record<Strategy, string> = {
  even: 'Even Split',
  negative: 'Negative Split',
  positive: 'Positive Split',
  custom: 'Custom',
};

export default function SummaryCard({ segments, targetSec, unit, strategy }: Props) {
  const projectedSec = totalTimeSeconds(segments);
  const avgPace = avgPaceSecPerKm(segments);
  const targetPace = targetSec / MARATHON_KM;
  const diff = projectedSec - targetSec;
  const ahead = diff < -15;
  const behind = diff > 15;

  const pacesPerKm = segments.map(s => s.paceSecPerKm);
  const fastestPace = Math.min(...pacesPerKm);
  const slowestPace = Math.max(...pacesPerKm);

  // Cumulative split times for the table
  let cumSec = 0;
  const splitRows = segments.map(seg => {
    cumSec += seg.paceSecPerKm * seg.distanceKm;
    const targetCum = (cumSec / projectedSec) * projectedSec; // normalized
    const targetAtPoint = targetPace * (cumSec / (avgPace));
    const delta = cumSec - (targetSec / MARATHON_KM) * (cumSec / avgPace);
    return {
      label: seg.label,
      dist: unit === 'km'
        ? `${Math.round(cumSec / avgPace / 5) * 5}km`
        : `${Math.round((cumSec / avgPace / KM_PER_MILE) * 10) / 10}mi`,
      pace: formatPace(seg.paceSecPerKm, unit),
      split: formatDuration(cumSec),
      delta: delta,
      _unused: targetCum + targetAtPoint, // keep ts happy
    };
  });

  const copyText = useCallback(() => {
    const unitLabel = unit === 'km' ? 'km' : 'mi';
    const lines = [
      '🏃 Marathon Pace Plan',
      `Strategy: ${STRATEGY_LABELS[strategy]}`,
      `Target:    ${formatDuration(targetSec)}`,
      `Projected: ${formatDuration(projectedSec)}`,
      `Avg pace:  ${formatPace(avgPace, unit)}/${unitLabel}`,
      '',
      ...segments.map(
        (s, i) =>
          `${s.label.padEnd(7)} ${formatPace(s.paceSecPerKm, unit)}/${unitLabel}  →  ${splitRows[i].split}`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
  }, [segments, targetSec, projectedSec, avgPace, unit, strategy, splitRows]);

  return (
    <div className="bg-surface rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Race Summary
        </p>
        <button
          onClick={copyText}
          className="text-xs font-semibold text-slate-400 hover:text-orange-400 border border-border hover:border-orange-500/40 px-3 py-1.5 rounded-lg transition-all active:scale-95"
        >
          Copy plan
        </button>
      </div>

      {/* Big finish time */}
      <div className="text-center py-4 mb-4 bg-surface-2 rounded-xl border border-border">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">Projected Finish</p>
        <p className={`text-4xl font-bold font-mono ${ahead ? 'text-green-400' : behind ? 'text-red-400' : 'text-white'}`}>
          {formatDuration(projectedSec)}
        </p>
        {Math.abs(diff) > 15 && (
          <p className={`text-xs mt-1.5 font-semibold ${ahead ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(diff) < 60
              ? `${Math.abs(Math.round(diff))}s ${diff < 0 ? 'under' : 'over'} target`
              : `${formatDuration(Math.abs(diff))} ${diff < 0 ? 'under' : 'over'} target`}
          </p>
        )}
        {Math.abs(diff) <= 15 && (
          <p className="text-xs mt-1.5 font-semibold text-slate-400">Right on target</p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          {
            label: 'Avg pace',
            value: `${formatPace(avgPace, unit)}/${unit === 'km' ? 'km' : 'mi'}`,
          },
          {
            label: 'Strategy',
            value: STRATEGY_LABELS[strategy],
          },
          {
            label: 'Fastest split',
            value: `${formatPace(fastestPace, unit)}/${unit === 'km' ? 'km' : 'mi'}`,
            accent: true,
          },
          {
            label: 'Slowest split',
            value: `${formatPace(slowestPace, unit)}/${unit === 'km' ? 'km' : 'mi'}`,
          },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-2 rounded-xl p-3 border border-border">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={`text-sm font-bold font-mono ${stat.accent ? 'text-green-400' : 'text-white'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Split table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-600 uppercase text-[10px] tracking-wider">
              <th className="text-left pb-2 font-semibold">Split</th>
              <th className="text-right pb-2 font-semibold">Pace</th>
              <th className="text-right pb-2 font-semibold">Cumulative</th>
              <th className="text-right pb-2 font-semibold">vs target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {splitRows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-2 transition-colors">
                <td className="py-2 text-slate-400 font-medium">
                  {row.label}
                  <span className="text-slate-600 ml-0.5 text-[10px]">
                    {unit === 'km' ? 'km' : 'mi'}
                  </span>
                </td>
                <td className="py-2 text-right font-mono text-white font-semibold">
                  {row.pace}
                </td>
                <td className="py-2 text-right font-mono text-slate-300">
                  {row.split}
                </td>
                <td
                  className={`py-2 text-right font-mono text-xs font-semibold ${
                    Math.abs(row.delta) < 5
                      ? 'text-slate-500'
                      : row.delta < 0
                      ? 'text-green-400'
                      : 'text-orange-400'
                  }`}
                >
                  {Math.abs(row.delta) < 5
                    ? '—'
                    : `${row.delta < 0 ? '−' : '+'}${Math.abs(Math.round(row.delta))}s`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
