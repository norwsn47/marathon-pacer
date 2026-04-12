import {
  ComposedChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { getChartData, formatPace, MARATHON_KM } from '../lib/paceUtils';
import type { Segment, Unit } from '../lib/types';

interface Props {
  segments: Segment[];
  targetSec: number;
  unit: Unit;
}

interface TooltipPayload {
  payload?: {
    name: string;
    paceMin: number;
    deltaSeconds: number;
    distLabel: string;
  };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const d = payload[0].payload;
  const unit = d.distLabel.endsWith('km') ? 'km' : 'mile';
  const paceDisplay = formatPace(d.paceMin * 60, unit);
  const delta = d.deltaSeconds;

  return (
    <div className="bg-[#1e1e2a] border border-[#2a2a3d] rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="font-bold text-white mb-1">{d.name} {unit === 'km' ? 'km' : 'mi'}</p>
      <p className="text-orange-400 font-mono font-semibold">
        {paceDisplay}/{unit === 'km' ? 'km' : 'mi'}
      </p>
      <p className={`text-xs mt-1 font-semibold ${delta < 0 ? 'text-green-400' : delta > 0 ? 'text-red-400' : 'text-slate-400'}`}>
        {Math.abs(delta) < 5
          ? 'On pace'
          : delta < 0
          ? `${Math.abs(delta).toFixed(0)}s ahead of target`
          : `${delta.toFixed(0)}s behind target`}
      </p>
    </div>
  );
}

function paceTickFormatter(val: number, unit: Unit): string {
  const secPerKm = val * 60;
  return formatPace(secPerKm, unit);
}

export default function PaceChart({ segments, targetSec, unit }: Props) {
  const data = getChartData(segments, targetSec, unit);
  const targetPaceMin = targetSec / MARATHON_KM / 60;

  const paceVals = data.map(d => d.paceMin);
  const minP = Math.min(...paceVals, targetPaceMin);
  const maxP = Math.max(...paceVals, targetPaceMin);
  const pad = Math.max((maxP - minP) * 0.4, 0.15);
  const domain: [number, number] = [minP - pad, maxP + pad];

  return (
    <div className="bg-surface rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pace Plan</p>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-orange-500 opacity-90" />
            On/ahead
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-violet-500 opacity-80" />
            Behind
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-5 border-t border-dashed border-orange-400 opacity-70" />
            Target
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2a" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={val => paceTickFormatter(val, unit)}
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            domain={domain}
            reversed
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <ReferenceLine
            y={targetPaceMin}
            stroke="#f97316"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            strokeOpacity={0.7}
          />
          <Bar dataKey="paceMin" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.paceMin <= targetPaceMin * 1.003 ? '#f97316' : '#7c3aed'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
