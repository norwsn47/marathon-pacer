import { useState, useCallback } from 'react';
import type { Segment, Strategy, Unit } from './lib/types';
import { generateSegments, totalTimeSeconds } from './lib/paceUtils';
import Header from './components/Header';
import TargetTime from './components/TargetTime';
import StrategyPresets from './components/StrategyPresets';
import PaceChart from './components/PaceChart';
import PaceSliders from './components/PaceSliders';
import SummaryCard from './components/SummaryCard';

const DEFAULT_TARGET = 3 * 3600 + 30 * 60; // 3:30:00

export default function App() {
  const [targetSec, setTargetSec] = useState(DEFAULT_TARGET);
  const [unit, setUnit] = useState<Unit>('km');
  const [strategy, setStrategy] = useState<Strategy>('even');
  const [segments, setSegments] = useState<Segment[]>(() =>
    generateSegments(DEFAULT_TARGET, 'even', 'km')
  );

  const projectedSec = totalTimeSeconds(segments);

  const handleUnitChange = useCallback((newUnit: Unit) => {
    setUnit(newUnit);
    setSegments(generateSegments(targetSec, strategy === 'custom' ? 'even' : strategy, newUnit));
    if (strategy === 'custom') setStrategy('even');
  }, [targetSec, strategy]);

  const handleTargetChange = useCallback((newTarget: number) => {
    setTargetSec(newTarget);
    if (strategy !== 'custom') {
      setSegments(generateSegments(newTarget, strategy, unit));
    }
  }, [strategy, unit]);

  const handleStrategySelect = useCallback((s: Strategy) => {
    setStrategy(s);
    if (s !== 'custom') {
      setSegments(generateSegments(targetSec, s, unit));
    }
  }, [targetSec, unit]);

  const handleSegmentChange = useCallback((id: number, paceSecPerKm: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, paceSecPerKm } : s));
    setStrategy('custom');
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d12] text-slate-100 font-sans">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <Header unit={unit} onUnitChange={handleUnitChange} />

        <div className="space-y-4">
          <TargetTime
            targetSec={targetSec}
            projectedSec={projectedSec}
            onChange={handleTargetChange}
          />

          <StrategyPresets
            strategy={strategy}
            onSelect={handleStrategySelect}
          />

          <PaceChart
            segments={segments}
            targetSec={targetSec}
            unit={unit}
          />

          <PaceSliders
            segments={segments}
            targetSec={targetSec}
            unit={unit}
            onChange={handleSegmentChange}
          />

          <SummaryCard
            segments={segments}
            targetSec={targetSec}
            unit={unit}
            strategy={strategy}
          />
        </div>
      </div>
    </div>
  );
}
