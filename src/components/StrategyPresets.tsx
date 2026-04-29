import { useState, useEffect } from 'react';
import type { Strategy, NegativePct } from '../lib/types';

interface Props {
  strategy: Strategy;
  negativePct: NegativePct;
  onSelect: (s: Strategy) => void;
  onNegativePctChange: (pct: NegativePct) => void;
}

const PRESETS: { key: Strategy; pct: NegativePct | null; emoji: string | null; label: string; desc: string }[] = [
  { key: 'even',     pct: null, emoji: '➖', label: 'Even Split', desc: 'Same pace throughout' },
  { key: 'negative', pct: 2,    emoji: '📈', label: '-2%',        desc: 'Bold progression'     },
  { key: 'negative', pct: 1,    emoji: '📈', label: '-1%',        desc: 'Moderate progression' },
  { key: 'negative', pct: 0.5,  emoji: '📈', label: '-0.5%',      desc: 'Gentle progression'   },
];

const NEGATIVE_SPLIT_INFO = [
  {
    title: 'Energy Management',
    body: 'Starting slower lets you settle into a groove and conserve energy for the latter half — avoiding "The Wall".',
  },
  {
    title: 'Natural Warm-Up',
    body: 'A slower start lets your body warm up gradually, reducing the shock of hard early effort.',
  },
  {
    title: 'Psychological Edge',
    body: 'Passing competitors in the final miles feels great. Starting steady means you\'re the one overtaking, not being overtaken.',
  },
  {
    title: 'Better Race Reading',
    body: 'Starting conservatively gives you time to assess how your body feels and adapt your plan accordingly.',
  },
  {
    title: 'Reduced Injury Risk',
    body: 'A gradual build-up keeps muscles warm and reduces the risk of early strain.',
  },
];

function NegativeSplitPopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a26] border border-[#2a2a3d] rounded-2xl shadow-2xl max-w-sm w-full p-5 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">What are Negative Splits?</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
        </div>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          The most common strategy for distances above 800m — start slower than you finish, gradually picking up pace as the race progresses.
        </p>
        <div className="space-y-3">
          {NEGATIVE_SPLIT_INFO.map((item, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="text-orange-500 font-bold text-xs shrink-0 w-4 mt-0.5">{i + 1}.</span>
              <div>
                <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#2a2a3d]">
          <p className="text-[10px] font-semibold text-slate-400 mb-1.5">How the pace calculation works</p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Your chosen % sets two fixed anchor paces: your first 10km runs exactly that % <span className="text-slate-300">slower</span> than average, and your final 12.2km block (30–42.2km) runs exactly that % <span className="text-slate-300">faster</span>. The two middle sections (10–20km and 20–30km) are placed on a straight line between those anchors — at one-third and two-thirds of the total pace drop — then nudged equally so the overall total hits your target time exactly. The result is four distinct paces stepping down evenly through the race.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StrategyPresets({ strategy, negativePct, onSelect, onNegativePctChange }: Props) {
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!showInfo) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowInfo(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showInfo]);

  const isActive = (p: typeof PRESETS[number]) =>
    p.key === 'even' ? strategy === 'even' : strategy === 'negative' && negativePct === p.pct;

  return (
    <div className="bg-surface rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Race Strategy Presets
        </p>
        <button
          onClick={() => setShowInfo(true)}
          className="text-[10px] text-slate-500 hover:text-cyan-400 border border-border hover:border-cyan-500/40 px-2 py-0.5 rounded-md transition-all"
          title="Why negative splits?"
        >
          ? Negative splits
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelect(p.key);
              if (p.pct !== null) onNegativePctChange(p.pct);
            }}
            className={`flex flex-col items-center gap-1 py-2 sm:py-3 px-1 sm:px-2 rounded-xl border transition-all active:scale-95 ${
              isActive(p)
                ? 'bg-orange-500/15 border-orange-500/60 text-orange-400'
                : 'bg-surface-2 border-border text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            {p.emoji && (
              <span className="text-lg hidden sm:block">{p.emoji}</span>
            )}
            <span className="text-xs font-bold leading-tight text-center">{p.label}</span>
            <span className="text-[10px] leading-tight text-center opacity-70 hidden sm:block">{p.desc}</span>
          </button>
        ))}
      </div>

      {strategy === 'custom' && (
        <p className="mt-3 text-xs text-slate-500 text-center animate-fade-in">
          Custom — sliders adjusted manually
        </p>
      )}

      {showInfo && <NegativeSplitPopup onClose={() => setShowInfo(false)} />}
    </div>
  );
}
