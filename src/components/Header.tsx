import React, { useState } from 'react';
import {
  Radio,
  Search,
  Sliders,
  Download,
  Sparkles,
  Smartphone,
  Moon,
  Sun,
  Languages,
  MoreVertical,
} from 'lucide-react';
import { translations } from '../i18n/translations';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { isNative } from '../services/native';

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
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [menuOpen, setMenuOpen] = useState(false);

  const run = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  const itemClass =
    'w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-200 hover:bg-slate-800 active:bg-slate-700 transition';

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-slate-900/85 dark:bg-slate-950/85 border-b border-slate-800/80 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Logo in naslov */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
            {t.appTitle}
          </h1>
        </div>

        {/* Ena sama ikona: meni z vsemi nastavitvami */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
                <button className={itemClass} onClick={run(onOpenRadioBrowser)}>
                  <Search className="w-4 h-4 text-cyan-400" />
                  {t.searchStations}
                </button>
                <button className={itemClass} onClick={run(onOpenStationManager)}>
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  {t.stationManager}
                </button>
                <button className={itemClass} onClick={run(onOpenImportExport)}>
                  <Download className="w-4 h-4 text-amber-400" />
                  {t.importExport}
                </button>
                <button className={itemClass} onClick={run(onOpenBoostSettings)}>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  {t.boostSettings}
                </button>
                <div className="border-t border-slate-800" />
                <button className={itemClass} onClick={run(onToggleLang)}>
                  <Languages className="w-4 h-4 text-blue-400" />
                  {t.language}: {lang.toUpperCase()}
                </button>
                <button className={itemClass} onClick={run(onToggleTheme)}>
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  )}
                  {t.theme}
                </button>
                {!isNative && isInstallable && !isInstalled && (
                  <button className={itemClass} onClick={run(install)}>
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    {t.installApp}
                  </button>
                )}
                {!isNative && (
                  <button className={itemClass} onClick={run(onOpenAndroidInfo)}>
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    APK
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
