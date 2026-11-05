import React from 'react';
import { AudioTake } from '../types/voice';
import { Play, Download, Trash2, Clock, History, Music } from 'lucide-react';

interface AudioHistoryShelfProps {
  takes: AudioTake[];
  activeTakeId?: string;
  onSelectTake: (take: AudioTake) => void;
  onDeleteTake: (id: string) => void;
  onClearAll: () => void;
}

export const AudioHistoryShelf: React.FC<AudioHistoryShelfProps> = ({
  takes,
  activeTakeId,
  onSelectTake,
  onDeleteTake,
  onClearAll,
}) => {
  if (takes.length === 0) {
    return null;
  }

  const handleDownload = (take: AudioTake, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = `data:audio/wav;base64,${take.audioBase64}`;
    const cleanTitle = (take.title || take.voiceName || 'voice')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    link.download = `${cleanTitle}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Project Takes & Audio History ({takes.length})
          </h3>
        </div>
        <button
          onClick={onClearAll}
          className="text-[11px] text-slate-500 hover:text-red-400 transition"
        >
          Clear History
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {takes.map((take) => {
          const isActive = activeTakeId === take.id;
          return (
            <div
              key={take.id}
              onClick={() => onSelectTake(take)}
              className={`group flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                isActive
                  ? 'border-indigo-500 bg-indigo-950/40 shadow-sm'
                  : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Music className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-200 truncate">
                      {take.title}
                    </span>
                    <span className="rounded bg-slate-800 px-1 py-0.2 text-[9px] text-slate-400">
                      {take.voiceName || 'Multi'}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-slate-500 font-sans">
                    {take.text.slice(0, 45)}...
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={(e) => handleDownload(take, e)}
                  title="Download WAV"
                  className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTake(take.id);
                  }}
                  title="Delete Take"
                  className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
