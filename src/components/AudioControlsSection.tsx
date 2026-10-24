import React, { useState } from 'react';
import { Play, Square, Volume2, VolumeX, Sparkles, Clock, Check, X } from 'lucide-react';
import { translations } from '../i18n/translations';

interface AudioControlsSectionProps {
  lang: 'sl' | 'en';
  volume: number; // 0 to 1
  effectiveVolume: number; // 0 to 1
  boostAmount: number; // e.g. 25
  boostEnabled: boolean; // boolean
  isSpeechBoostActive: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  timerRemaining: number | null; // seconds or null
  fadeLast60s: boolean;
  onSetVolume: (vol: number) => void;
  onSetBoostAmount: (amount: number) => void;
  onToggleBoost: () => void;
  onTogglePlay: () => void;
  onStartTimer: (minutes: number) => void;
  onCancelTimer: () => void;
  onToggleFadeLast60s: (fade: boolean) => void;
}

export const AudioControlsSection: React.FC<AudioControlsSectionProps> = ({
  lang,
  volume,
  effectiveVolume,
  boostAmount,
  boostEnabled,
  isSpeechBoostActive,
  isPlaying,
  isLoading,
  timerRemaining,
  fadeLast60s,
  onSetVolume,
  onSetBoostAmount,
  onToggleBoost,
  onTogglePlay,
  onStartTimer,
  onCancelTimer,
  onToggleFadeLast60s,
}) => {
  const t = translations[lang];
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [customTimerMinutes, setCustomTimerMinutes] = useState('30');
  const [prevVolumeBeforeMute, setPrevVolumeBeforeMute] = useState(0.7);

  // Format timer seconds into MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMuteToggle = () => {
    if (volume > 0) {
      setPrevVolumeBeforeMute(volume);
      onSetVolume(0);
    } else {
      onSetVolume(prevVolumeBeforeMute || 0.7);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-3 px-3">
      {/* 3. Navpična drsnika za glasnost in dvig ter stikalo (rdeče izklopljeno, zeleno vklopljeno) */}
      <div className="bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-around gap-6">
          {/* Vertical Slider 1: Glasnost (Base Volume) */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t.volume}
            </span>

            <div className="relative flex items-center justify-center h-36 w-12 bg-slate-950/70 rounded-2xl border border-slate-800 p-2 shadow-inner">
              {/* Dynamic filled level indicator behind thumb */}
              <div
                className={`absolute bottom-2 w-6 rounded-xl transition-all duration-150 ${
                  isSpeechBoostActive
                    ? 'bg-gradient-to-t from-emerald-600 to-cyan-400'
                    : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                }`}
                style={{ height: `${Math.round(effectiveVolume * 88)}%` }}
              />

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="vertical-slider appearance-none bg-transparent cursor-pointer z-10"
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                  height: '110px',
                  width: '28px',
                }}
                aria-label={t.volume}
              />
            </div>

            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={handleMuteToggle}
                className="text-slate-400 hover:text-slate-200 transition p-1"
                title="Mute/Unmute"
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
              <span className="text-xs font-bold text-slate-200 w-8 text-left">
                {Math.round(effectiveVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Central Section: Stikalo (rdeče izklopljeno, zeleno vklopljeno) */}
          <div className="flex flex-col items-center justify-center px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-1">
              {t.boostSwitch}
            </span>

            {/* Prominent Red (OFF) / Green (ON) toggle switch */}
            <button
              onClick={onToggleBoost}
              className={`relative flex flex-col items-center justify-center w-20 h-24 rounded-2xl border-2 transition-all duration-300 shadow-lg active:scale-95 cursor-pointer ${
                boostEnabled
                  ? 'bg-emerald-950/80 border-emerald-500 shadow-emerald-500/30'
                  : 'bg-rose-950/80 border-rose-600 shadow-rose-600/30'
              }`}
              title={t.boostSwitch}
            >
              {/* LED Status light */}
              <div
                className={`w-4 h-4 rounded-full mb-1 transition-all duration-300 shadow-md ${
                  boostEnabled
                    ? 'bg-emerald-400 shadow-emerald-400 ring-4 ring-emerald-500/30 animate-pulse'
                    : 'bg-rose-500 shadow-rose-500 ring-2 ring-rose-500/20'
                }`}
              />

              <span
                className={`text-xs font-black tracking-wider transition-colors ${
                  boostEnabled ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {boostEnabled ? t.boostOn : t.boostOff}
              </span>

              <Sparkles
                className={`w-3.5 h-3.5 mt-1 transition-opacity ${
                  boostEnabled ? 'text-emerald-400 opacity-100' : 'text-rose-500/60 opacity-60'
                }`}
              />
            </button>

            <span className="text-[10px] text-slate-400 text-center mt-2 max-w-[100px] leading-tight">
              {boostEnabled ? 'Avto dvig pri govoru' : 'Dvig izklopljen'}
            </span>
          </div>

          {/* Vertical Slider 2: Dvig pri govoru (Speech Boost Amount) */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t.speechBoost}
            </span>

            <div className="relative flex items-center justify-center h-36 w-12 bg-slate-950/70 rounded-2xl border border-slate-800 p-2 shadow-inner">
              {/* Dynamic filled level indicator for boost */}
              <div
                className={`absolute bottom-2 w-6 rounded-xl transition-all duration-150 ${
                  boostEnabled
                    ? 'bg-gradient-to-t from-emerald-600 to-cyan-400 opacity-90'
                    : 'bg-slate-700 opacity-40'
                }`}
                style={{ height: `${Math.round(((boostAmount - 5) / 45) * 88)}%` }}
              />

              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={boostAmount}
                disabled={!boostEnabled}
                onChange={(e) => onSetBoostAmount(parseInt(e.target.value, 10))}
                className={`vertical-slider appearance-none bg-transparent z-10 ${
                  boostEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                  height: '110px',
                  width: '28px',
                }}
                aria-label={t.speechBoost}
              />
            </div>

            <div className="flex items-center gap-1 mt-2">
              <Sparkles className={`w-3.5 h-3.5 ${boostEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className={`text-xs font-bold ${boostEnabled ? 'text-cyan-300' : 'text-slate-500'}`}>
                +{boostAmount}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Predvajaj/Ustavi in timer */}
      <div className="mt-3 flex items-center justify-center gap-3">
        {/* Play / Stop Button */}
        <button
          onClick={onTogglePlay}
          className={`flex-1 flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-bold text-base shadow-xl transition-all duration-200 active:scale-95 cursor-pointer ${
            isPlaying
              ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/40 ring-2 ring-rose-500/30'
              : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-900/40 ring-2 ring-emerald-500/40'
          }`}
          title={isPlaying ? t.stop : t.play}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Square className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white" />
          )}
          <span className="tracking-wide">{isPlaying ? t.stop : t.play}</span>
        </button>

        {/* Sleep Timer Toggle / Open Modal */}
        <div className="relative">
          {timerRemaining !== null ? (
            <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/50 rounded-2xl p-1.5 shadow-md">
              <button
                onClick={() => setShowTimerModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-amber-300 font-bold text-xs"
              >
                <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span>{formatTimer(timerRemaining)}</span>
              </button>
              <button
                onClick={onCancelTimer}
                className="p-1.5 hover:bg-amber-500/30 rounded-xl text-amber-400 transition"
                title={t.cancelTimer}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTimerModal(true)}
              className="flex items-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 shadow-md font-semibold text-xs transition active:scale-95 cursor-pointer"
              title={t.sleepTimer}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{t.sleepTimer}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sleep Timer Modal */}
      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">{t.sleepTimer}</h3>
              </div>
              <button
                onClick={() => setShowTimerModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Presets: 15, 30, 45, 60 min */}
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      onStartTimer(mins);
                      setShowTimerModal(false);
                    }}
                    className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 font-bold text-xs text-slate-200 transition"
                  >
                    {mins} {t.minutes}
                  </button>
                ))}
              </div>

              {/* Custom Minutes Input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={customTimerMinutes}
                  onChange={(e) => setCustomTimerMinutes(e.target.value)}
                  className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Min"
                />
                <span className="text-xs text-slate-400">{t.minutes}</span>
                <button
                  onClick={() => {
                    const mins = parseInt(customTimerMinutes, 10);
                    if (!isNaN(mins) && mins > 0) {
                      onStartTimer(mins);
                      setShowTimerModal(false);
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  {t.setTimer}
                </button>
              </div>

              {/* Toggle for Gradual Fade out in last 60s */}
              <label className="flex items-center gap-3 pt-2 border-t border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fadeLast60s}
                  onChange={(e) => onToggleFadeLast60s(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                />
                <span className="text-xs text-slate-300 font-medium">
                  {t.fadeLast60s}
                </span>
              </label>

              {timerRemaining !== null && (
                <button
                  onClick={() => {
                    onCancelTimer();
                    setShowTimerModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition"
                >
                  {t.cancelTimer}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
