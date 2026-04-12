import type { Segment, Strategy, Unit, NegativePct } from './types';

export const MARATHON_KM = 42.195;
export const KM_PER_MILE = 1.60934;

// Pace slider bounds in sec/km
export const PACE_MIN_SEC = 170; // ~2:50/km
export const PACE_MAX_SEC = 660; // ~11:00/km

// Always split by 10km regardless of display unit
function getSegmentDistancesKm(_unit: Unit): number[] {
  return [10, 10, 10, 10, 2.195];
}

function segmentLabel(index: number, unit: Unit, total: number): string {
  if (unit === 'km') {
    const start = index * 10;
    const end = index === total - 1 ? 42.2 : (index + 1) * 10;
    return `${start}–${end}`;
  } else {
    // Show miles: 10km = 6.21mi, remainder = 1.36mi
    const miPerSeg = 10 / KM_PER_MILE;
    const start = +(index * miPerSeg).toFixed(1);
    const end = index === total - 1 ? '26.2' : +((index + 1) * miPerSeg).toFixed(1);
    return `${start}–${end}`;
  }
}

export function generateSegments(targetSec: number, strategy: Strategy, unit: Unit, negativePct: NegativePct = 3): Segment[] {
  const distances = getSegmentDistancesKm(unit);
  const n = distances.length;
  const avgPace = targetSec / MARATHON_KM;

  let paces: number[];

  if (strategy === 'negative') {
    // Four distinct pace levels across four sections (segments 3+4 share one pace):
    //   section 0 (0–10km)   : firstPace = avgPace × (1 + pct/100)  — fixed anchor
    //   section 3 (30–42.2km): finalPace = avgPace × (1 − pct/100)  — fixed anchor
    //   sections 1 & 2 are linearly interpolated at 1/3 and 2/3 of the way from
    //   firstPace → finalPace, then both shifted by a uniform correction so that
    //   pace1×10 + pace2×10 = remaining time (total − section0 − section3).
    //   This preserves the even step between sections while hitting targetSec exactly.
    const firstPace = avgPace * (1 + negativePct / 100);
    const finalPace = avgPace * (1 - negativePct / 100);
    const finalDist = distances[3] + distances[4]; // 12.195km

    const pace1Raw = firstPace + (finalPace - firstPace) * (1 / 3);
    const pace2Raw = firstPace + (finalPace - firstPace) * (2 / 3);

    // Uniform correction so the pair sums to exactly the remaining time
    const middleTime = targetSec - firstPace * distances[0] - finalPace * finalDist;
    const correction = middleTime / 20 - (pace1Raw + pace2Raw) / 2;

    paces = [firstPace, pace1Raw + correction, pace2Raw + correction, finalPace, finalPace];
  } else {
    paces = distances.map(() => avgPace);
  }

  // Sanity-scale to absorb floating-point drift (should be ≈1.0 for negative, exactly 1 for even)
  const rawTotal = paces.reduce((acc, p, i) => acc + p * distances[i], 0);
  const scale = targetSec / rawTotal;
  paces = paces.map((p) => p * scale);

  return distances.map((dist, i) => ({
    id: i,
    label: segmentLabel(i, unit, n),
    distanceKm: dist,
    paceSecPerKm: paces[i],
  }));
}

export function totalTimeSeconds(segments: Segment[]): number {
  return segments.reduce((acc, s) => acc + s.paceSecPerKm * s.distanceKm, 0);
}

export function avgPaceSecPerKm(segments: Segment[]): number {
  return totalTimeSeconds(segments) / MARATHON_KM;
}

export function formatPace(secPerKm: number, unit: Unit): string {
  const sec = unit === 'km' ? secPerKm : secPerKm * KM_PER_MILE;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Dynamic slider bounds centred on average pace, ±50%
export function getPaceBounds(targetSec: number): { min: number; max: number } {
  const avg = targetSec / MARATHON_KM;
  return {
    min: Math.max(150, avg * 0.9),
    max: Math.min(720, avg * 1.1),
  };
}

// Returns the indices of the last two segments (30km → finish)
export function getAutoBalanceIdxs(segments: Segment[]): number[] {
  const n = segments.length;
  return [n - 2, n - 1];
}

// Pace the auto-balanced segments would need to collectively hit targetSec exactly
// Both locked segments get the same pace
export function calcAutoBalancePace(segments: Segment[], autoIdxs: number[], targetSec: number): number {
  const idxSet = new Set(autoIdxs);
  const otherTime = segments.reduce(
    (acc, s, i) => (idxSet.has(i) ? acc : acc + s.paceSecPerKm * s.distanceKm),
    0
  );
  const lockedDist = autoIdxs.reduce((acc, i) => acc + segments[i].distanceKm, 0);
  return (targetSec - otherTime) / lockedDist;
}

export function parseDurationToSec(str: string): number | null {
  const parts = str.split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
  return null;
}

export interface ChartPoint {
  name: string;
  paceMin: number;
  targetPaceMin: number;
  cumulativeMins: number;
  targetCumulativeMins: number;
  deltaSeconds: number;
  distLabel: string;
  segTimeSec: number;
  elevGain?: number;
}

export function getChartData(
  segments: Segment[],
  targetSec: number,
  unit: Unit,
  segElevGain?: number[]
): ChartPoint[] {
  const targetPace = targetSec / MARATHON_KM;
  let cumTime = 0;
  let cumKm = 0;

  return segments.map((seg, i) => {
    cumTime += seg.paceSecPerKm * seg.distanceKm;
    cumKm += seg.distanceKm;
    const targetCumTime = targetPace * cumKm;

    const distDisplay =
      unit === 'km'
        ? `${Math.round(cumKm * 10) / 10}km`
        : `${Math.round((cumKm / KM_PER_MILE) * 10) / 10}mi`;

    const segTimeSec = seg.paceSecPerKm * seg.distanceKm;
    return {
      name: seg.label,
      paceMin: +(seg.paceSecPerKm / 60).toFixed(3),
      targetPaceMin: +(targetPace / 60).toFixed(3),
      cumulativeMins: +(cumTime / 60).toFixed(2),
      targetCumulativeMins: +(targetCumTime / 60).toFixed(2),
      deltaSeconds: +(cumTime - targetCumTime).toFixed(1),
      segTimeSec: +segTimeSec.toFixed(0),
      distLabel: distDisplay,
      elevGain: segElevGain?.[i],
    };
  });
}
