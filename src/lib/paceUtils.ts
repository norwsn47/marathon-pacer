import type { Segment, Strategy, Unit } from './types';

export const MARATHON_KM = 42.195;
export const KM_PER_MILE = 1.60934;

// Pace slider bounds in sec/km
export const PACE_MIN_SEC = 170; // ~2:50/km — elite end
export const PACE_MAX_SEC = 660; // ~11:00/km — walk/run end
export const PACE_STEP = 5;

function getSegmentDistancesKm(unit: Unit): number[] {
  if (unit === 'km') {
    // 8 × 5km + 1 × 2.195km
    return [5, 5, 5, 5, 5, 5, 5, 5, 2.195];
  } else {
    // 5 × 5-mile + 1 × 1.2188-mile
    const fiveMiKm = 5 * KM_PER_MILE;
    const remainder = MARATHON_KM - 5 * fiveMiKm;
    return [fiveMiKm, fiveMiKm, fiveMiKm, fiveMiKm, fiveMiKm, remainder];
  }
}

function segmentLabel(index: number, unit: Unit, total: number): string {
  if (unit === 'km') {
    const start = index * 5;
    const end = index === total - 1 ? 42.2 : (index + 1) * 5;
    return `${start}–${end}`;
  } else {
    const start = index * 5;
    const end = index === total - 1 ? 26.2 : (index + 1) * 5;
    return `${start}–${end}`;
  }
}

export function generateSegments(targetSec: number, strategy: Strategy, unit: Unit): Segment[] {
  const distances = getSegmentDistancesKm(unit);
  const n = distances.length;
  const avgPace = targetSec / MARATHON_KM;

  return distances.map((dist, i) => {
    let pace = avgPace;

    if (strategy === 'negative') {
      // Linear ramp: start 5% slower → finish 5% faster
      const factor = 1.05 - (0.10 * i) / (n - 1);
      pace = avgPace * factor;
    } else if (strategy === 'positive') {
      // Linear ramp: start 5% faster → finish 5% slower
      const factor = 0.95 + (0.10 * i) / (n - 1);
      pace = avgPace * factor;
    }

    return {
      id: i,
      label: segmentLabel(i, unit, n),
      distanceKm: dist,
      paceSecPerKm: Math.round(pace / PACE_STEP) * PACE_STEP,
    };
  });
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

export function parseDurationToSec(str: string): number | null {
  const parts = str.split(':').map(p => parseInt(p, 10));
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
}

export function getChartData(segments: Segment[], targetSec: number, unit: Unit): ChartPoint[] {
  const targetPace = targetSec / MARATHON_KM;
  let cumTime = 0;
  let cumKm = 0;

  return segments.map((seg) => {
    cumTime += seg.paceSecPerKm * seg.distanceKm;
    cumKm += seg.distanceKm;
    const targetCumTime = targetPace * cumKm;

    const distDisplay =
      unit === 'km'
        ? `${Math.round(cumKm * 10) / 10}km`
        : `${Math.round((cumKm / KM_PER_MILE) * 10) / 10}mi`;

    return {
      name: seg.label,
      paceMin: +(seg.paceSecPerKm / 60).toFixed(3),
      targetPaceMin: +(targetPace / 60).toFixed(3),
      cumulativeMins: +(cumTime / 60).toFixed(2),
      targetCumulativeMins: +(targetCumTime / 60).toFixed(2),
      deltaSeconds: +(cumTime - targetCumTime).toFixed(1),
      distLabel: distDisplay,
    };
  });
}
