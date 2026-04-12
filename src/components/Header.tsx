import type { Unit } from '../lib/types';

interface Props {
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
}

export default function Header({ unit, onUnitChange }: Props) {
  return (
    <header className="flex items-center justify-between py-5 mb-2">
      <div className="flex items-center gap-2.5">
        {/* Flat timing icon with lightning bolt */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="16" r="10" stroke="#f97316" strokeWidth="2"/>
          <rect x="11.5" y="5" width="5" height="2.5" rx="1.25" fill="#f97316"/>
          <rect x="13.25" y="4" width="1.5" height="2" rx="0.75" fill="#f97316"/>
          <path d="M16 10.5L10.5 17H14.5L12 22.5L19 15.5H15L16 10.5Z" fill="#f97316"/>
        </svg>
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
