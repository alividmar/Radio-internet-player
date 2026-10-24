import React from 'react';
import { Play, Volume2, Radio } from 'lucide-react';
import { RadioStation } from '../types/radio';
import { translations } from '../i18n/translations';

interface StationGridProps {
  lang: 'sl' | 'en';
  stations: RadioStation[];
  currentStationIndex: number;
  isPlaying: boolean;
  onSelectStation: (index: number) => void;
}

export const StationGrid: React.FC<StationGridProps> = ({
  lang,
  stations,
  currentStationIndex,
  isPlaying,
  onSelectStation,
}) => {
  const t = translations[lang];

  // Exactly first 16 stations as requested:
  // "Mreža ikon: prvih 16 postaj kot velike ikone (2×8, na telefonu 4 stolpci). Dotik na ikono začne predvajati."
  const top16Stations = stations.slice(0, 16);

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 px-3 pb-8">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.first16Stations}</span>
          <span className="text-[10px] font-normal text-slate-500">
            ({top16Stations.length}/16)
          </span>
        </h3>
        <span className="text-[10px] text-slate-500 hidden sm:inline">
          {lang === 'sl' ? 'Dotik na ikono takoj predvaja' : 'Tap icon to play instantly'}
        </span>
      </div>

      {/* 2x8 on tablet/desktop, 4 columns on phone */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
        {top16Stations.map((station, index) => {
          const isCurrent = index === currentStationIndex;
          const isCurrentAndPlaying = isCurrent && isPlaying;

          return (
            <button
              key={station.id || index}
              onClick={() => onSelectStation(index)}
              className={`group relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer border ${
                isCurrentAndPlaying
                  ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-900/30'
                  : isCurrent
                  ? 'bg-slate-800/90 border-cyan-500/80 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
              }`}
              title={`${station.name} (${station.genre || ''})`}
            >
              {/* Station Icon / Badge */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-950 shadow-inner flex items-center justify-center">
                {station.icon ? (
                  <img
                    src={station.icon}
                    alt={station.name}
                    className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 ${
                      isCurrentAndPlaying ? 'brightness-105' : ''
                    }`}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xs font-black text-slate-300">
                    {station.name.substring(0, 3).toUpperCase()}
                  </span>
                )}

                {/* Overlaid play status icon */}
                {isCurrentAndPlaying ? (
                  <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                )}
              </div>

              {/* Station Name */}
              <span
                className={`mt-1.5 text-[11px] font-semibold tracking-tight text-center truncate w-full px-0.5 leading-tight ${
                  isCurrentAndPlaying
                    ? 'text-emerald-300 font-bold'
                    : isCurrent
                    ? 'text-cyan-300 font-bold'
                    : 'text-slate-300 group-hover:text-white'
                }`}
              >
                {station.name}
              </span>

              {/* Number tag */}
              <span className="absolute top-1 right-1.5 text-[9px] font-mono text-slate-500/70">
                {index + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
