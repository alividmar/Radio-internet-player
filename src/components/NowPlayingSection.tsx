import React from 'react';
import { ChevronLeft, ChevronRight, Mic, Radio, Volume2 } from 'lucide-react';
import { RadioStation } from '../types/radio';
import { translations } from '../i18n/translations';

interface NowPlayingSectionProps {
  lang: 'sl' | 'en';
  stations: RadioStation[];
  currentStation: RadioStation | null;
  currentStationIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  nowPlayingTitle: string;
  isSpeechBoostActive: boolean;
  boostAmount: number;
  onSelectStation: (index: number) => void;
  onPrevStation: () => void;
  onNextStation: () => void;
}

export const NowPlayingSection: React.FC<NowPlayingSectionProps> = ({
  lang,
  stations,
  currentStation,
  currentStationIndex,
  isPlaying,
  isLoading,
  nowPlayingTitle,
  isSpeechBoostActive,
  boostAmount,
  onSelectStation,
  onPrevStation,
  onNextStation,
}) => {
  const t = translations[lang];

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. Izbira postaje (spustni seznam in puščici) */}
      <div className="w-full max-w-md flex items-center justify-between gap-2 px-2 py-2">
        <button
          onClick={onPrevStation}
          className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 shadow-md transition active:scale-90"
          title={t.prevStation}
          aria-label={t.prevStation}
        >
          <ChevronLeft className="w-6 h-6 text-emerald-400" />
        </button>

        <div className="flex-1 relative">
          <select
            value={currentStationIndex}
            onChange={(e) => onSelectStation(Number(e.target.value))}
            className="w-full appearance-none bg-slate-800/90 hover:bg-slate-750 text-slate-100 font-semibold text-center text-sm sm:text-base py-2.5 px-4 rounded-xl border border-slate-700/80 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
          >
            {stations.map((st, idx) => (
              <option key={st.id} value={idx} className="bg-slate-900 text-white text-left py-1">
                {idx + 1}. {st.name} {st.genre ? `• ${st.genre}` : ''}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
            <span className="text-xs">▼</span>
          </div>
        </div>

        <button
          onClick={onNextStation}
          className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 shadow-md transition active:scale-90"
          title={t.nextStation}
          aria-label={t.nextStation}
        >
          <ChevronRight className="w-6 h-6 text-emerald-400" />
        </button>
      </div>

      {/* Velika ikona predvajane postaje */}
      <div className="relative mt-2 mb-3 flex items-center justify-center">
        {/* Animated Sound Wave Rings when Playing */}
        {isPlaying && (
          <div className="absolute inset-0 -m-3 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 blur-xl animate-pulse" />
        )}

        <div
          className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border-2 ${
            isPlaying
              ? 'border-emerald-500/80 shadow-emerald-500/25 scale-102 ring-4 ring-emerald-500/20'
              : 'border-slate-700/80 shadow-black/40 grayscale-20'
          } bg-slate-900 flex items-center justify-center`}
        >
          {currentStation?.icon ? (
            <img
              src={currentStation.icon}
              alt={currentStation.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if broken image
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Radio className="w-12 h-12 text-slate-500" />
              <span className="text-xs font-bold mt-1 text-slate-300">
                {currentStation?.name?.substring(0, 3)?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Playing indicator pill */}
          {isPlaying && (
            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-sm rounded-md py-0.5 px-1.5 flex items-center justify-center gap-1.5 border border-emerald-500/30">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                V ŽIVO (LIVE)
              </span>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center backdrop-blur-xs">
              <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-medium text-emerald-300 mt-2">
                {t.buffering}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Naslov “Zdaj predvaja” */}
      <div className="w-full max-w-lg text-center px-4">
        <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
          {t.nowPlaying}
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5 line-clamp-2 min-h-[3rem] flex items-center justify-center px-2">
          {nowPlayingTitle ? (
            <span className="text-slate-100">{nowPlayingTitle}</span>
          ) : (
            <span className="text-slate-400 font-normal italic">
              {currentStation ? `${currentStation.name} • ${currentStation.genre || t.appTitle}` : t.noMetadata}
            </span>
          )}
        </h2>

        {/* Speech Boost Detected Badge */}
        {isSpeechBoostActive && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse shadow-md shadow-emerald-500/10">
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.speechDetected} (+{boostAmount}%)</span>
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );
};
