import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Segment, Strategy, Unit, NegativePct } from './lib/types';
import {
  generateSegments,
  totalTimeSeconds,
  getAutoBalanceIdxs,
  calcAutoBalancePace,
  getPaceBounds,
} from './lib/paceUtils';
import {
  getSegmentElevationGain,
  sampleElevationProfile,
  parseGpx,
  type GpxPoint,
} from './lib/gpxParser';
import Header from './components/Header';
import QuoteBanner from './components/QuoteBanner';
import TargetTime from './components/TargetTime';
import StrategyPresets from './components/StrategyPresets';
import PaceChart from './components/PaceChart';
import PaceSliders from './components/PaceSliders';
import SummaryCard from './components/SummaryCard';


const DEFAULT_TARGET = 3 * 3600;

export default function App() {
  const [targetSec, setTargetSec] = useState(DEFAULT_TARGET);
  const [unit, setUnit] = useState<Unit>('km');
  const [strategy, setStrategy] = useState<Strategy>('even');
  const [negativePct, setNegativePct] = useState<NegativePct>(3);
  const [segments, setSegments] = useState<Segment[]>(() =>
    generateSegments(DEFAULT_TARGET, 'even', 'km')
  );
  const [autoBalance, setAutoBalance] = useState(false);
  const [gpxPoints, setGpxPoints] = useState<GpxPoint[]>([]);
  const [gpxFilename, setGpxFilename] = useState('');

  const autoBalanceIdxs = useMemo(() => getAutoBalanceIdxs(segments), [segments]);

  const displaySegments = useMemo<Segment[]>(() => {
    if (!autoBalance || strategy !== 'custom') return segments;
    const { min, max } = getPaceBounds(targetSec);
    const pace = calcAutoBalancePace(segments, autoBalanceIdxs, targetSec);
    if (pace < min || pace > max) return segments;
    const idxSet = new Set(autoBalanceIdxs);
    return segments.map((s, i) =>
      idxSet.has(i) ? { ...s, paceSecPerKm: pace } : s
    );
  }, [autoBalance, strategy, segments, autoBalanceIdxs, targetSec]);

  const projectedSec = totalTimeSeconds(displaySegments);

  const segmentElevGain = useMemo(
    () => (gpxPoints.length ? getSegmentElevationGain(gpxPoints, displaySegments) : undefined),
    [gpxPoints, displaySegments]
  );

  // Dense continuous elevation profile (200 points) for the chart line overlay
  const elevationPoints = useMemo(
    () => (gpxPoints.length ? sampleElevationProfile(gpxPoints, 200) : undefined),
    [gpxPoints]
  );

  const totalElevGain = segmentElevGain?.reduce((a, b) => a + b, 0) ?? 0;

  const handleUnitChange = useCallback((newUnit: Unit) => {
    setUnit(newUnit);
    setAutoBalance(false);
    setSegments(generateSegments(targetSec, strategy === 'custom' ? 'even' : strategy, newUnit, negativePct));
    if (strategy === 'custom') setStrategy('even');
  }, [targetSec, strategy, negativePct]);

  const handleTargetChange = useCallback((newTarget: number) => {
    setTargetSec(newTarget);
    if (strategy !== 'custom') {
      setSegments(generateSegments(newTarget, strategy, unit, negativePct));
    }
  }, [strategy, unit, negativePct]);

  const handleStrategySelect = useCallback((s: Strategy) => {
    setStrategy(s);
    setAutoBalance(false);
    if (s !== 'custom') {
      setSegments(generateSegments(targetSec, s, unit, negativePct));
    }
  }, [targetSec, unit, negativePct]);

  const handleNegativePctChange = useCallback((pct: NegativePct) => {
    setNegativePct(pct);
    setAutoBalance(false);
    setSegments(generateSegments(targetSec, 'negative', unit, pct));
  }, [targetSec, unit]);

  const handleSegmentChange = useCallback((id: number, paceSecPerKm: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, paceSecPerKm } : s));
    setStrategy('custom');
  }, []);

  const handleAutoBalanceToggle = useCallback(() => {
    setAutoBalance(v => !v);
  }, []);

  // Load Prague Marathon GPX by default on first render
  useEffect(() => {
    fetch('/prague-marathon.gpx')
      .then(r => r.text())
      .then(text => {
        const pts = parseGpx(text);
        if (pts.length) {
          setGpxPoints(pts);
          setGpxFilename('Prague Marathon');
        }
      })
      .catch(() => { /* silently ignore if asset missing */ });
  }, []);

  const handleGpxLoad = useCallback((points: GpxPoint[], filename: string) => {
    setGpxPoints(points);
    setGpxFilename(filename);
  }, []);

  const handleGpxClear = useCallback(() => {
    setGpxPoints([]);
    setGpxFilename('');
  }, []);

  const isOldUrl = typeof window !== 'undefined' && window.location.hostname !== 'pacer.outbuild.uk';

  return (
    <div className="min-h-screen bg-[#0d0d12] text-slate-100 font-sans">
      {isOldUrl && (
        <div className="bg-orange-500/10 border-b border-orange-500/30 py-2 px-4 text-center">
          <a
            href="https://pacer.outbuild.uk"
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors"
          >
            → Go to the latest version at pacer.outbuild.uk
          </a>
        </div>
      )}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <Header unit={unit} onUnitChange={handleUnitChange} />

        <div className="space-y-4">
          {/* Quote shown as its own card on mobile; desktop quote lives inside TargetTime */}
          <div className="sm:hidden">
            <QuoteBanner />
          </div>
          <TargetTime targetSec={targetSec} projectedSec={projectedSec} onChange={handleTargetChange} />
          <StrategyPresets
            strategy={strategy}
            negativePct={negativePct}
            onSelect={handleStrategySelect}
            onNegativePctChange={handleNegativePctChange}
          />

          <PaceChart
            segments={displaySegments}
            targetSec={targetSec}
            unit={unit}
            segmentElevGain={segmentElevGain}
            elevationPoints={elevationPoints}
            onGpxLoad={handleGpxLoad}
            onGpxClear={handleGpxClear}
            gpxFilename={gpxFilename}
            totalElevGain={totalElevGain}
          />

          <PaceSliders
            segments={displaySegments}
            baseSegments={segments}
            targetSec={targetSec}
            unit={unit}
            strategy={strategy}
            autoBalance={autoBalance}
            autoBalanceIdxs={autoBalanceIdxs}
            onToggleAutoBalance={handleAutoBalanceToggle}
            segmentElevGain={segmentElevGain}
            onChange={handleSegmentChange}
          />

          <SummaryCard
            segments={displaySegments}
            targetSec={targetSec}
            unit={unit}
            strategy={strategy}
            segmentElevGain={segmentElevGain}
          />
        </div>
      </div>
    </div>
  );
}
