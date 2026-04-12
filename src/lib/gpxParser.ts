import type { Segment } from './types';

export interface GpxPoint {
  distKm: number;
  ele: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Smooth elevation to remove GPS noise
function smooth(points: GpxPoint[], windowSize = 9): GpxPoint[] {
  return points.map((p, i) => {
    const lo = Math.max(0, i - Math.floor(windowSize / 2));
    const hi = Math.min(points.length, i + Math.floor(windowSize / 2) + 1);
    const avg = points.slice(lo, hi).reduce((s, x) => s + x.ele, 0) / (hi - lo);
    return { ...p, ele: avg };
  });
}

export function parseGpx(text: string): GpxPoint[] {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const trkpts = Array.from(doc.querySelectorAll('trkpt, rtept'));
  if (!trkpts.length) return [];

  let cumDist = 0;
  const raw: GpxPoint[] = [];

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat') ?? '0');
    const lon = parseFloat(pt.getAttribute('lon') ?? '0');
    const ele = parseFloat(pt.querySelector('ele')?.textContent ?? '0');

    if (i > 0) {
      const prev = trkpts[i - 1];
      cumDist += haversineKm(
        parseFloat(prev.getAttribute('lat') ?? '0'),
        parseFloat(prev.getAttribute('lon') ?? '0'),
        lat,
        lon
      );
    }
    raw.push({ distKm: cumDist, ele });
  }

  return smooth(raw);
}

export interface ElevSample {
  pct: number; // 0–1, fraction of total track distance
  ele: number; // metres
}

// Dense continuous elevation profile for chart overlay
export function sampleElevationProfile(points: GpxPoint[], numSamples = 200): ElevSample[] {
  if (!points.length) return [];
  const totalDist = points[points.length - 1].distKm;
  if (totalDist === 0) return [];
  const out: ElevSample[] = [];
  for (let i = 0; i < numSamples; i++) {
    const pct = i / (numSamples - 1);
    out.push({ pct, ele: interpolateEle(points, pct * totalDist) });
  }
  return out;
}

// Interpolate absolute elevation at a specific distance along the GPX track
function interpolateEle(points: GpxPoint[], targetDist: number): number {
  if (!points.length) return 0;
  if (targetDist <= points[0].distKm) return points[0].ele;
  const last = points[points.length - 1];
  if (targetDist >= last.distKm) return last.ele;
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].distKm <= targetDist && points[i + 1].distKm >= targetDist) {
      const t = (targetDist - points[i].distKm) / (points[i + 1].distKm - points[i].distKm);
      return points[i].ele + t * (points[i + 1].ele - points[i].ele);
    }
  }
  return last.ele;
}

// Sample absolute elevation at the midpoint of each segment, scaled to GPX track length
export function sampleSegmentElevation(points: GpxPoint[], segments: Segment[]): number[] {
  if (!points.length) return segments.map(() => 0);
  const totalGpxKm = points[points.length - 1].distKm;
  const totalSegKm = segments.reduce((s, seg) => s + seg.distanceKm, 0);

  let cumKm = 0;
  return segments.map((seg) => {
    const midpointRace = cumKm + seg.distanceKm / 2;
    cumKm += seg.distanceKm;
    const scaledDist = (midpointRace / totalSegKm) * totalGpxKm;
    return Math.round(interpolateEle(points, scaledDist));
  });
}

export function getSegmentElevationGain(points: GpxPoint[], segments: Segment[]): number[] {
  if (!points.length) return segments.map(() => 0);
  const totalGpxKm = points[points.length - 1].distKm;

  let cumDist = 0;
  const totalSegKm = segments.reduce((s, seg) => s + seg.distanceKm, 0);

  return segments.map((seg) => {
    const start = (cumDist / totalSegKm) * totalGpxKm;
    cumDist += seg.distanceKm;
    const end = (cumDist / totalSegKm) * totalGpxKm;

    const segPts = points.filter((p) => p.distKm >= start && p.distKm <= end);
    let gain = 0;
    for (let i = 1; i < segPts.length; i++) {
      const d = segPts[i].ele - segPts[i - 1].ele;
      if (d > 0) gain += d;
    }
    return Math.round(gain);
  });
}
