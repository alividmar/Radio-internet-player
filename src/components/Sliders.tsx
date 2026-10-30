import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { translations } from '../i18n/translations';

const SLIDER_STYLE: React.CSSProperties = {
  writingMode: 'vertical-lr',
  direction: 'rtl',
  height: '110px',
  width: '28px',
};

interface VolumeSliderProps {
  lang: 'sl' | 'en';
  volume: number;
  effectiveVolume: number;
  isSpeechBoostActive: boolean;
  onSetVolume: (vol: number) => void;
}

/** Levi navpični drsnik: glasnost (v APK = glasnost medija na telefonu) */
export const VolumeSlider: React.FC<VolumeSliderProps> = ({
  lang,
  volume,
  effectiveVolume,
  isSpeechBoostActive,
  onSetVolume,
}) => {
  const t = translations[lang];
  const [prevVolume, setPrevVolume] = useState(0.7);

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      onSetVolume(0);
    } else {
      onSetVolume(prevVolume || 0.7);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 h-7 flex items-end text-center leading-tight">
        {t.volume}
      </span>
      <div className="relative flex items-center justify-center h-36 w-12 bg-slate-950/70 rounded-2xl border border-slate-800 p-2 shadow-inner">
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
          style={SLIDER_STYLE}
          aria-label={t.volume}
        />
      </div>
      <div className="flex items-center gap-1 mt-2">
        <button onClick={toggleMute} className="p-1 text-slate-400" title="Mute/Unmute">
          {volume === 0 ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>
        <span className="text-xs font-bold text-slate-200">{Math.round(effectiveVolume * 100)}%</span>
      </div>
    </div>
  );
};

interface BoostSliderProps {
  lang: 'sl' | 'en';
  boostAmount: number;
  boostEnabled: boolean;
  onSetBoostAmount: (amount: number) => void;
}

/** Desni navpični drsnik: dvig glasnosti pri govoru */
export const BoostSlider: React.FC<BoostSliderProps> = ({
  lang,
  boostAmount,
  boostEnabled,
  onSetBoostAmount,
}) => {
  const t = translations[lang];
  return (
    <div className="flex flex-col items-center w-full">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 h-7 flex items-end text-center leading-tight">
        {t.speechBoost}
      </span>
      <div className="relative flex items-center justify-center h-36 w-12 bg-slate-950/70 rounded-2xl border border-slate-800 p-2 shadow-inner">
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
          style={SLIDER_STYLE}
          aria-label={t.speechBoost}
        />
      </div>
      <div className="flex items-center gap-1 mt-2 py-1">
        <Sparkles className={`w-3.5 h-3.5 ${boostEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
        <span className={`text-xs font-bold ${boostEnabled ? 'text-cyan-300' : 'text-slate-500'}`}>
          +{boostAmount}%
        </span>
      </div>
    </div>
  );
};
