import { useRef, useState } from 'react';
import { parseGpx, type GpxPoint } from '../lib/gpxParser';

interface Props {
  onLoad: (points: GpxPoint[], filename: string) => void;
  onClear: () => void;
  filename: string;
  totalGain: number;
}

export default function GpxUpload({ onLoad, onClear, filename, totalGain }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setError('Please upload a .gpx file');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const points = parseGpx(text);
      if (!points.length) {
        setError('No track points found in this file');
        return;
      }
      onLoad(points, file.name);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  if (filename) {
    return (
      <div className="bg-surface rounded-2xl px-4 py-3 border border-cyan-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">⛰️</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{filename}</p>
            <p className="text-[11px] text-cyan-400 font-semibold font-mono">
              ↑ {totalGain.toLocaleString()} m elevation gain
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-[10px] font-semibold text-slate-500 hover:text-red-400 border border-border hover:border-red-500/40 px-2.5 py-1.5 rounded-lg transition-all shrink-0"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
        dragging ? 'border-cyan-500 bg-cyan-500/5' : 'border-border bg-surface hover:border-slate-600'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="text-xl shrink-0">⛰️</span>
        <div>
          <p className="text-sm font-semibold text-slate-300">Upload GPX route</p>
          <p className="text-[11px] text-slate-500">Drag & drop or click — adds elevation to chart & splits</p>
        </div>
        <span className="ml-auto text-xs font-semibold text-cyan-500 border border-cyan-500/40 px-2.5 py-1 rounded-lg shrink-0">
          Browse
        </span>
      </div>
      {error && <p className="px-4 pb-3 text-xs text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
