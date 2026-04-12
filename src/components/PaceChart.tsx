import { useRef, useState, useMemo } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Customized,
} from 'recharts';
import { getChartData, formatPace, formatDuration, totalTimeSeconds, MARATHON_KM } from '../lib/paceUtils';
import { parseGpx, type GpxPoint, type ElevSample } from '../lib/gpxParser';
import type { Segment, Unit } from '../lib/types';

interface Props {
  segments: Segment[];
  targetSec: number;
  unit: Unit;
  segmentElevGain?: number[];
  elevationPoints?: ElevSample[];
  onGpxLoad: (points: GpxPoint[], filename: string) => void;
  gpxFilename: string;
  totalElevGain: number;
}

interface TooltipState {
  idx: number;
  x: number; // container-relative px
  y: number;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TooltipContent({
  idx,
  segments,
  targetSec,
  unit,
  segmentElevGain,
}: {
  idx: number;
  segments: Segment[];
  targetSec: number;
  unit: Unit;
  segmentElevGain?: number[];
}) {
  const seg = segments[idx];
  if (!seg) return null;

  // Compute cumulative time vs target at this segment end
  const targetPace = targetSec / MARATHON_KM;
  let cumTime = 0;
  let cumKm = 0;
  for (let i = 0; i <= idx; i++) {
    cumTime += segments[i].paceSecPerKm * segments[i].distanceKm;
    cumKm += segments[i].distanceKm;
  }
  const targetCumTime = targetPace * cumKm;
  const delta = Math.round(cumTime - targetCumTime);
  const segTimeSec = seg.paceSecPerKm * seg.distanceKm;
  const unitLabel = unit === 'km' ? 'km' : 'mi';
  const elevGain = segmentElevGain?.[idx];

  return (
    <div className="bg-[#1e1e2a] border border-[#2a2a3d] rounded-xl px-4 py-3 shadow-xl pointer-events-none">
      <p className="font-bold text-white mb-1.5 text-sm">{seg.label} {unitLabel}</p>
      <p className="text-orange-400 font-mono font-semibold text-sm">
        {formatPace(seg.paceSecPerKm, unit)}/{unitLabel}
      </p>
      {segTimeSec > 0 && (
        <p className="text-slate-300 font-mono text-xs font-semibold mt-1">
          Split time: {fmtTime(segTimeSec)}
        </p>
      )}
      {elevGain !== undefined && elevGain > 0 && (
        <p className="text-cyan-400 text-xs font-semibold mt-1">↑ {elevGain} m gain</p>
      )}
      <p className={`text-xs mt-1 font-semibold ${delta < 0 ? 'text-green-400' : delta > 0 ? 'text-red-400' : 'text-slate-400'}`}>
        {Math.abs(delta) < 5 ? 'On pace' : delta < 0 ? `${Math.abs(delta).toFixed(0)}s ahead` : `${delta.toFixed(0)}s behind`}
      </p>
    </div>
  );
}

// X-axis labels centred under each proportional bar
function ProportionalXAxis({
  offset,
  segments,
  unit,
}: {
  offset?: { left: number; top: number; width: number; height: number };
  segments: Segment[];
  unit: Unit;
}) {
  if (!offset) return null;
  const { left, top, width, height } = offset;
  if (width <= 0) return null;

  const totalDist = segments.reduce((s, sg) => s + sg.distanceKm, 0);
  const GAP_PX = 5;
  const drawableWidth = width - GAP_PX * (segments.length - 1);
  const labelY = top + height + 13;

  let cumDist = 0;
  return (
    <g>
      {segments.map((seg, i) => {
        const barW = (seg.distanceKm / totalDist) * drawableWidth;
        const barX = left + (cumDist / totalDist) * drawableWidth + i * GAP_PX;
        cumDist += seg.distanceKm;
        const suffix = unit === 'km' ? 'km' : 'mi';
        return (
          <text
            key={i}
            x={barX + barW / 2}
            y={labelY}
            textAnchor="middle"
            fill="#64748b"
            fontSize={9}
            fontFamily="Inter"
          >
            {seg.label}{suffix}
          </text>
        );
      })}
    </g>
  );
}

// Draw all bars proportionally by distance — last bar ends at exactly the right edge
// Also renders invisible full-height hover rects for custom tooltip
function ProportionalBars({
  offset,
  segments,
  targetPaceMin,
  paceDomain,
  unit,
  activeIdx,
  onBarEnter,
  onBarLeave,
}: {
  offset?: { left: number; top: number; width: number; height: number };
  segments: Segment[];
  targetPaceMin: number;
  paceDomain: [number, number];
  unit: Unit;
  activeIdx: number | null;
  onBarEnter: (idx: number, svgX: number, svgY: number) => void;
  onBarLeave: () => void;
}) {
  if (!offset) return null;
  const { left, top, width, height } = offset;
  if (width <= 0 || height <= 0) return null;

  const totalDist = segments.reduce((s, sg) => s + sg.distanceKm, 0);
  const GAP_PX = 5;
  const totalGap = GAP_PX * (segments.length - 1);
  const drawableWidth = width - totalGap;
  const domainSpan = paceDomain[1] - paceDomain[0];

  let cumDist = 0;

  return (
    <g>
      {segments.map((seg, i) => {
        const barW = (seg.distanceKm / totalDist) * drawableWidth;
        const barX = left + (cumDist / totalDist) * drawableWidth + i * GAP_PX;
        cumDist += seg.distanceKm;

        const paceMin = seg.paceSecPerKm / 60;
        const topFrac = (paceMin - paceDomain[0]) / domainSpan;
        const barY = top + topFrac * height;
        const barH = height - topFrac * height;

        const fill = paceMin <= targetPaceMin * 1.003 ? '#f97316' : '#7c3aed';
        const r = Math.min(4, barW / 2);
        const isActive = activeIdx === i;

        return (
          <g key={i}>
            {/* Visible bar */}
            {barH >= 1 && (
              <rect
                x={barX}
                y={barY}
                width={barW}
                height={barH}
                rx={r}
                ry={r}
                fill={fill}
                fillOpacity={isActive ? 1 : 0.85}
              />
            )}
            {barH >= 22 && barW >= 22 && (
              <text
                x={barX + barW / 2}
                y={barY + barH / 2 + 4}
                textAnchor="middle"
                fill="rgba(255,255,255,0.92)"
                fontSize={barW < 38 ? 7 : 9}
                fontFamily="JetBrains Mono, monospace"
                fontWeight={700}
              >
                {formatPace(seg.paceSecPerKm, unit)}
              </text>
            )}
            {/* Full-height transparent hover rect */}
            <rect
              x={barX}
              y={top}
              width={barW}
              height={height}
              fill="transparent"
              style={{ cursor: 'default' }}
              onMouseEnter={(e) => {
                const svgEl = (e.currentTarget as SVGRectElement).closest('svg');
                const svgRect = svgEl?.getBoundingClientRect();
                const svgX = svgRect ? svgRect.left + barX + barW / 2 : 0;
                const svgY = svgRect ? svgRect.top + barY : 0;
                onBarEnter(i, svgX, svgY);
              }}
              onMouseLeave={onBarLeave}
            />
          </g>
        );
      })}
    </g>
  );
}

// Elevation profile centred on the avg-pace reference line
function ElevationOverlay({
  elevationPoints,
  offset,
  targetPaceMin,
  paceDomain,
}: {
  elevationPoints: ElevSample[];
  offset?: { left: number; top: number; width: number; height: number };
  targetPaceMin: number;
  paceDomain: [number, number];
}) {
  if (!offset || !elevationPoints.length) return null;
  const { left, top, width, height } = offset;
  if (width <= 0 || height <= 0) return null;

  const eles = elevationPoints.map(p => p.ele);
  const minE = Math.min(...eles);
  const maxE = Math.max(...eles);
  const eleRange = maxE - minE;
  if (eleRange < 2) return null;

  const domainSpan = paceDomain[1] - paceDomain[0];
  const refFrac = (targetPaceMin - paceDomain[0]) / domainSpan;
  const refY = top + refFrac * height;
  const amplitude = height * 0.28;
  const midE = (minE + maxE) / 2;
  const halfRange = eleRange / 2;

  const pts = elevationPoints.map(p => ({
    x: left + p.pct * width,
    y: refY - ((p.ele - midE) / halfRange) * amplitude,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L${(left + width).toFixed(1)},${refY.toFixed(1)} L${left.toFixed(1)},${refY.toFixed(1)} Z`;

  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0891b2" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#0891b2" stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#elevFill)" />
      <path d={linePath} fill="none" stroke="#67e8f9" strokeWidth={1.5} strokeLinejoin="round" strokeOpacity={0.55} />
    </g>
  );
}

export default function PaceChart({ segments, targetSec, unit, segmentElevGain, elevationPoints, onGpxLoad, gpxFilename, totalElevGain }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gpxError, setGpxError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  function handleGpxFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.gpx')) { setGpxError('Not a .gpx file'); return; }
    setGpxError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const pts = parseGpx(e.target?.result as string);
      if (!pts.length) { setGpxError('No track points found'); return; }
      onGpxLoad(pts, file.name);
    };
    reader.onerror = () => setGpxError('Failed to read file');
    reader.readAsText(file);
  }

  // Provides recharts with internal data structures; paceDomain is computed directly from segments
  const data = useMemo(
    () => getChartData(segments, targetSec, unit, segmentElevGain),
    [segments, targetSec, unit, segmentElevGain]
  );
  const targetPaceMin = targetSec / MARATHON_KM / 60;
  const hasElev = !!(elevationPoints?.length);

  const paceVals = segments.map(s => s.paceSecPerKm / 60);
  const minP = Math.min(...paceVals, targetPaceMin);
  const maxP = Math.max(...paceVals, targetPaceMin);
  const pad = Math.max((maxP - minP) * 0.4, 0.15);
  const paceDomain: [number, number] = [minP - pad, maxP + pad];

  function handleBarEnter(idx: number, viewportX: number, viewportY: number) {
    if (!containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    setTooltip({ idx, x: viewportX - cr.left, y: viewportY - cr.top });
  }

  function handleBarLeave() {
    setTooltip(null);
  }

  // Compute tooltip position — clamp so it stays inside container
  let tipX = tooltip ? tooltip.x : 0;
  let tipY = tooltip ? tooltip.y - 8 : 0;
  const TIP_W = 170;
  if (containerRef.current && tooltip) {
    const cw = containerRef.current.offsetWidth;
    if (tipX + TIP_W > cw - 8) tipX = cw - TIP_W - 8;
    if (tipX < 8) tipX = 8;
    if (tipY < 8) tipY = 8;
  }

  return (
    <div ref={containerRef} className="relative bg-surface rounded-2xl p-4 border border-border">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest shrink-0">Pace Plan</p>
          {/* Route name + elevation */}
          {gpxFilename && (
            <span className="text-[10px] font-semibold text-cyan-400 font-mono truncate max-w-[130px] sm:max-w-none">
              ⛰ {gpxFilename} ↑{totalElevGain}m
            </span>
          )}
          {/* Upload button — always visible */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Adds elevation profile to chart & per-split gain"
            className="text-[10px] font-semibold text-slate-500 hover:text-cyan-400 border border-border hover:border-cyan-500/40 px-2 py-1 rounded-md transition-all shrink-0"
          >
            <span className="sm:hidden">{gpxFilename ? 'Change route' : '+ GPX'}</span>
            <span className="hidden sm:inline">{gpxFilename ? 'Upload your own route' : '+ GPX route'}</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".gpx" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleGpxFile(f); e.target.value = ''; }} />
          {gpxError && <span className="text-[10px] text-red-400">{gpxError}</span>}
        </div>
        {/* Key hover popup + projected time below */}
        <div className="relative shrink-0 flex flex-col items-end gap-1.5"
          onMouseEnter={() => setShowKey(true)}
          onMouseLeave={() => setShowKey(false)}
        >
          <button className="w-4 h-4 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white text-[10px] font-bold flex items-center justify-center transition-colors">
            ?
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Projected</span>
            <span className="text-[17px] font-mono font-bold text-white leading-tight">{formatDuration(totalTimeSeconds(segments))}</span>
          </div>
          {showKey && (
            <div className="absolute right-0 top-6 z-50 bg-[#1a1a26] border border-[#2a2a3d] rounded-xl shadow-xl p-3 flex flex-col gap-2 min-w-[130px]">
              <span className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="inline-block w-3 h-3 rounded-sm bg-orange-500 opacity-90 shrink-0" />On / ahead
              </span>
              <span className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="inline-block w-3 h-3 rounded-sm bg-violet-500 opacity-80 shrink-0" />Behind
              </span>
              {hasElev && (
                <span className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="inline-block w-5 border-t-2 border-cyan-400 shrink-0" />Elevation
                </span>
              )}
              <span className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="inline-block w-5 border-t border-dashed border-orange-400 opacity-70 shrink-0" />Target pace
              </span>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 16 }} barCategoryGap="0%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2a" vertical={false} />
          <XAxis
            dataKey="name"
            tick={false}
            axisLine={false}
            tickLine={false}
            height={0}
          />
          <YAxis
            yAxisId="pace"
            orientation="left"
            tickFormatter={v => formatPace(v * 60, unit)}
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            domain={paceDomain}
            reversed
            width={44}
          />
          <ReferenceLine
            yAxisId="pace"
            y={targetPaceMin}
            stroke="#f97316"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            strokeOpacity={0.7}
          />

          {/* Proportional visual bars + hover rects */}
          <Customized
            component={(props: unknown) => {
              const p = props as { offset?: { left: number; top: number; width: number; height: number } };
              return (
                <ProportionalBars
                  offset={p.offset}
                  segments={segments}
                  targetPaceMin={targetPaceMin}
                  paceDomain={paceDomain}
                  unit={unit}
                  activeIdx={tooltip?.idx ?? null}
                  onBarEnter={handleBarEnter}
                  onBarLeave={handleBarLeave}
                />
              );
            }}
          />

          {/* Elevation overlay */}
          {hasElev && (
            <Customized
              component={(props: unknown) => {
                const p = props as { offset?: { left: number; top: number; width: number; height: number } };
                return (
                  <ElevationOverlay
                    elevationPoints={elevationPoints!}
                    offset={p.offset}
                    targetPaceMin={targetPaceMin}
                    paceDomain={paceDomain}
                  />
                );
              }}
            />
          )}

          {/* Proportional x-axis labels */}
          <Customized
            component={(props: unknown) => {
              const p = props as { offset?: { left: number; top: number; width: number; height: number } };
              return (
                <ProportionalXAxis
                  offset={p.offset}
                  segments={segments}
                  unit={unit}
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Custom HTML tooltip — absolutely positioned inside container */}
      {tooltip !== null && (
        <div
          className="absolute z-40"
          style={{ left: tipX, top: tipY, transform: 'translate(-50%, -100%)' }}
          onMouseEnter={handleBarLeave}
        >
          <TooltipContent
            idx={tooltip.idx}
            segments={segments}
            targetSec={targetSec}
            unit={unit}
            segmentElevGain={segmentElevGain}
          />
        </div>
      )}
    </div>
  );
}
