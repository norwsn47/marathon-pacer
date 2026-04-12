import type { Unit } from '../lib/types';

interface Props {
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
}

export default function Header({ unit, onUnitChange }: Props) {
  return (
    <header className="flex items-center justify-between py-5 mb-2">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">🏃</span>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight tracking-tight">
            Marathon Pacer
          </h1>
          <p className="text-xs text-slate-500 leading-none">Plan your perfect race</p>
        </div>
      </div>

      {/* km / mile toggle */}
      <div className="flex items-center bg-surface rounded-full p-1 border border-border">
        <button
          onClick={() => onUnitChange('km')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            unit === 'km'
              ? 'bg-orange-500 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          km
        </button>
        <button
          onClick={() => onUnitChange('mile')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            unit === 'mile'
              ? 'bg-orange-500 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          mi
        </button>
      </div>
    </header>
  );
}
