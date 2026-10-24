import React from 'react';
import { Radio, Search, Sliders, Download, Sparkles, Smartphone, Moon, Sun, Languages } from 'lucide-react';
import { translations } from '../i18n/translations';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  lang: 'sl' | 'en';
  theme: 'dark' | 'light' | 'system';
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onOpenStationManager: () => void;
  onOpenRadioBrowser: () => void;
  onOpenImportExport: () => void;
  onOpenBoostSettings: () => void;
  onOpenAndroidInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  theme,
  onToggleLang,
  onToggleTheme,
  onOpenStationManager,
  onOpenRadioBrowser,
  onOpenImportExport,
  onOpenBoostSettings,
  onOpenAndroidInfo,
}) => {
  const t = translations[lang];
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-slate-900/85 dark:bg-slate-950/85 border-b border-slate-800/80 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Logo and App Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Radio className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
              {t.appTitle}
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Android PWA
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block truncate">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* PWA Install Button (Prompted if installable) */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
              title={t.installApp}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.installApp}</span>
            </button>
          )}

          {/* Radio Browser Search */}
          <button
            onClick={onOpenRadioBrowser}
            className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95"
            title={t.searchStations}
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">{t.searchStations}</span>
          </button>

          {/* Station Manager */}
          <button
            onClick={onOpenStationManager}
            className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95"
            title={t.stationManager}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">{t.stationManager}</span>
          </button>

          {/* Import / Export */}
          <button
            onClick={onOpenImportExport}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
            title={t.importExport}
          >
            <Download className="w-4 h-4 text-amber-400" />
          </button>

          {/* Speech Boost Settings */}
          <button
            onClick={onOpenBoostSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
            title={t.boostSettings}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
          </button>

          {/* Android Info & APK Download */}
          <button
            onClick={onOpenAndroidInfo}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 font-bold text-xs transition active:scale-95 shadow-sm"
            title="APK & Namestitev na Android"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">APK</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition active:scale-95"
            title={t.language}
          >
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
            title={t.theme}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
