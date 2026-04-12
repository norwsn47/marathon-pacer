import type { Strategy } from '../lib/types';

interface Props {
  strategy: Strategy;
  onSelect: (s: Strategy) => void;
}

const PRESETS: { key: Strategy; label: string; desc: string; emoji: string }[] = [
  {
    key: 'even',
    label: 'Even Split',
    desc: 'Same pace throughout',
    emoji: '➖',
  },
  {
    key: 'negative',
    label: 'Negative Split',
    desc: 'Start slow, finish fast',
    emoji: '📈',
  },
  {
    key: 'positive',
    label: 'Positive Split',
    desc: 'Start fast, finish strong-ish',
    emoji: '📉',
  },
];

export default function StrategyPresets({ strategy, onSelect }: Props) {
  return (
    <div className="bg-surface rounded-2xl p-4 border border-border">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
        Race Strategy
      </p>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => onSelect(p.key)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all active:scale-95 ${
              strategy === p.key
                ? 'bg-orange-500/15 border-orange-500/60 text-orange-400'
                : 'bg-surface-2 border-border text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            <span className="text-lg">{p.emoji}</span>
            <span className="text-xs font-bold leading-tight text-center">{p.label}</span>
            <span className="text-[10px] leading-tight text-center opacity-70">{p.desc}</span>
          </button>
        ))}
      </div>
      {strategy === 'custom' && (
        <p className="mt-3 text-xs text-slate-500 text-center animate-fade-in">
          Custom — sliders adjusted manually
        </p>
      )}
    </div>
  );
}
