import { useCallback, useState } from 'react';
import {
  totalTimeSeconds,
  avgPaceSecPerKm,
  formatDuration,
  formatPace,
  MARATHON_KM,
} from '../lib/paceUtils';
import type { Segment, Strategy, Unit } from '../lib/types';

interface Props {
  segments: Segment[];
  targetSec: number;
  unit: Unit;
  strategy: Strategy;
  segmentElevGain?: number[];
}

const STRATEGY_LABELS: Record<Strategy, string> = {
  even: 'Even Split',
  negative: 'Negative Split',
  custom: 'Custom',
};

export default function SummaryCard({ segments, targetSec, unit, strategy, segmentElevGain }: Props) {
  const [copied, setCopied] = useState(false);
  const projectedSec = totalTimeSeconds(segments);
  const avgPace = avgPaceSecPerKm(segments);
  const targetPace = targetSec / MARATHON_KM;
  const diff = projectedSec - targetSec;
  const ahead = diff < -15;
  const behind = diff > 15;

  const hasElev = !!segmentElevGain?.some((v) => v > 0);
  const totalElevGain = hasElev ? segmentElevGain!.reduce((a, b) => a + b, 0) : 0;

  const pacesPerKm = segments.map((s) => s.paceSecPerKm);
  const fastestPace = Math.min(...pacesPerKm);
  const slowestPace = Math.max(...pacesPerKm);

  // Cumulative split times for the table
  let cumSec = 0;
  let cumKm = 0;
  const splitRows = segments.map((seg, i) => {
    const segTime = seg.paceSecPerKm * seg.distanceKm;
    cumSec += segTime;
    cumKm += seg.distanceKm;
    const targetCumTime = targetPace * cumKm;
    const delta = cumSec - targetCumTime;
    const sm = Math.floor(segTime / 60);
    const ss = Math.round(segTime % 60);
    return {
      label: seg.label,
      pace: formatPace(seg.paceSecPerKm, unit),
      segTime: `${sm}:${ss.toString().padStart(2, '0')}`,
      split: formatDuration(cumSec),
      delta,
      elevGain: segmentElevGain?.[i],
    };
  });

  const unitLabel = unit === 'km' ? 'km' : 'mi';

  const copyText = useCallback(() => {
    const lines = [
      '🏃 Marathon Pace Plan',
      `Strategy: ${STRATEGY_LABELS[strategy]}`,
      `Target:    ${formatDuration(targetSec)}`,
      `Projected: ${formatDuration(projectedSec)}`,
      `Avg pace:  ${formatPace(avgPace, unit)}/${unitLabel}`,
      ...(hasElev ? [`Elev gain: ↑ ${totalElevGain.toLocaleString()} m`] : []),
      '',
      ...segments.map(
        (s, i) =>
          `${s.label.padEnd(7)} ${formatPace(s.paceSecPerKm, unit)}/${unitLabel}  →  ${splitRows[i].split}${
            segmentElevGain?.[i] ? `  ↑${segmentElevGain[i]}m` : ''
          }`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [segments, targetSec, projectedSec, avgPace, unit, unitLabel, strategy, splitRows, hasElev, totalElevGain, segmentElevGain]);

  const stats = [
    { label: 'Avg pace', value: `${formatPace(avgPace, unit)}/${unitLabel}` },
    { label: 'Strategy', value: STRATEGY_LABELS[strategy] },
    { label: 'Fastest split', value: `${formatPace(fastestPace, unit)}/${unitLabel}`, color: 'text-green-400' },
    { label: 'Slowest split', value: `${formatPace(slowestPace, unit)}/${unitLabel}` },
    ...(hasElev
      ? [{ label: 'Total elev ↑', value: `${totalElevGain.toLocaleString()} m`, color: 'text-cyan-400' }]
      : []),
  ];

  return (
    <div className="bg-surface rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Race Summary</p>
        <button
          onClick={copyText}
          className={`text-xs font-semibold border px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
            copied
              ? 'text-green-400 border-green-500/40 bg-green-500/10'
              : 'text-slate-400 hover:text-orange-400 border-border hover:border-orange-500/40'
          }`}
        >
          {copied ? 'Copied!' : 'Copy plan'}
        </button>
      </div>

      {/* Big finish time */}
      <div className="text-center py-4 mb-4 bg-surface-2 rounded-xl border border-border">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">Projected Finish</p>
        <p className={`text-4xl font-bold font-mono ${ahead ? 'text-green-400' : behind ? 'text-red-400' : 'text-white'}`}>
          {formatDuration(projectedSec)}
        </p>
        <p className={`text-xs mt-1.5 font-semibold ${ahead ? 'text-green-500' : behind ? 'text-red-500' : 'text-slate-400'}`}>
          {Math.abs(diff) <= 15
            ? 'Right on target'
            : Math.abs(diff) < 60
            ? `${Math.abs(Math.round(diff))}s ${diff < 0 ? 'under' : 'over'} target`
            : `${formatDuration(Math.abs(diff))} ${diff < 0 ? 'under' : 'over'} target`}
        </p>
      </div>

      {/* Stats grid */}
      <div className={`grid gap-3 mb-5 ${stats.length === 5 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-2 rounded-xl p-3 border border-border">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={`text-sm font-bold font-mono ${stat.color ?? 'text-white'}`}>
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
              {hasElev && <th className="text-right pb-2 font-semibold text-cyan-700">Elev ↑</th>}
              <th className="text-right pb-2 font-semibold">Time</th>
              <th className="text-right pb-2 font-semibold">Cumulative</th>
              <th className="text-right pb-2 font-semibold">vs target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {splitRows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-2 transition-colors">
                <td className="py-2 text-slate-400 font-medium">
                  {row.label}
                  <span className="text-slate-600 ml-0.5 text-[10px]">{unitLabel}</span>
                </td>
                <td className="py-2 text-right font-mono text-white font-semibold">{row.pace}</td>
                {hasElev && (
                  <td className="py-2 text-right font-mono text-cyan-400 font-semibold text-[11px]">
                    {row.elevGain ? `↑${row.elevGain}m` : '—'}
                  </td>
                )}
                <td className="py-2 text-right font-mono text-slate-400">{row.segTime}</td>
                <td className="py-2 text-right font-mono text-slate-300">{row.split}</td>
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
