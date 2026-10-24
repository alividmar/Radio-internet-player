import React, { useState } from 'react';
import { X, Sparkles, HelpCircle, Save, Check } from 'lucide-react';
import { AppSettings, BoostMode } from '../types/radio';
import { translations } from '../i18n/translations';

interface BoostSettingsModalProps {
  lang: 'sl' | 'en';
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSaveSettings: (newSettings: Partial<AppSettings>) => void;
}

export const BoostSettingsModal: React.FC<BoostSettingsModalProps> = ({
  lang,
  isOpen,
  settings,
  onClose,
  onSaveSettings,
}) => {
  const t = translations[lang];

  const [keywords, setKeywords] = useState(settings.globalKeywords);
  const [boostAmount, setBoostAmount] = useState(settings.boostAmount);
  const [boostMode, setBoostMode] = useState<BoostMode>(settings.boostMode);
  const [fadeLast60s, setFadeLast60s] = useState(settings.fadeLast60s);
  const [useProxyForHttp, setUseProxyForHttp] = useState(settings.useProxyForHttp);
  const [hasSaved, setHasSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      globalKeywords: keywords.trim(),
      boostAmount,
      boostMode,
      fadeLast60s,
      useProxyForHttp,
    });
    setHasSaved(true);
    setTimeout(() => {
      setHasSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>{t.boostSettings}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pametno zaznavanje govornih oddaj in samodejni dvig glasnosti
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Explanation Box */}
          <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-3.5 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.keywordsExplanation}
            </p>
          </div>

          {/* Global Keywords Input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
              {t.globalKeywords}
            </label>
            <textarea
              rows={3}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={t.keywordsPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Primeri: govorna;glasovanje;pogovor;poročila;dnevnik;novice;studio;oddaja
            </span>
          </div>

          {/* Boost Mode: Percentage vs Fixed */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              {t.boostMode}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBoostMode('percentage')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition ${
                  boostMode === 'percentage'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="block font-bold">{t.percentageBoost}</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Dvig za +{boostAmount}% nad osnovno
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBoostMode('fixed')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition ${
                  boostMode === 'fixed'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="block font-bold">{t.fixedBoost}</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Nastavi na točno določeno raven
                </span>
              </button>
            </div>
          </div>

          {/* Boost Amount Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t.boostAmount}
              </label>
              <span className="text-xs font-bold text-purple-400 font-mono">
                +{boostAmount}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={boostAmount}
              onChange={(e) => setBoostAmount(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>+5%</span>
              <span>+25%</span>
              <span>+50%</span>
            </div>
          </div>

          {/* Additional settings */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={fadeLast60s}
                onChange={(e) => setFadeLast60s(e.target.checked)}
                className="w-4 h-4 rounded text-purple-500 bg-slate-950 border-slate-700 focus:ring-purple-500"
              />
              <span className="text-xs text-slate-300 font-medium">
                {t.fadeLast60s}
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useProxyForHttp}
                onChange={(e) => setUseProxyForHttp(e.target.checked)}
                className="w-4 h-4 rounded text-purple-500 bg-slate-950 border-slate-700 focus:ring-purple-500"
              />
              <span className="text-xs text-slate-300 font-medium">
                Omogoči varen prehod za starejše HTTP tokove (cleartext proxy)
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              {hasSaved ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Shranjeno!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t.save}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
