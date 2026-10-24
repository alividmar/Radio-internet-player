/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NowPlayingSection } from './components/NowPlayingSection';
import { AudioControlsSection } from './components/AudioControlsSection';
import { StationGrid } from './components/StationGrid';
import { StationManagerModal } from './components/StationManagerModal';
import { RadioBrowserModal } from './components/RadioBrowserModal';
import { ImportExportModal } from './components/ImportExportModal';
import { BoostSettingsModal } from './components/BoostSettingsModal';
import { AndroidInfoModal } from './components/AndroidInfoModal';

import { AppSettings, RadioStation } from './types/radio';
import { loadStations, saveStations, loadSettings, saveSettings } from './services/storage';
import { DEFAULT_STATIONS } from './services/defaultStations';
import { useRadioPlayer } from './hooks/useRadioPlayer';
import { AlertCircle, WifiOff } from 'lucide-react';

export default function App() {
  const [stations, setStations] = useState<RadioStation[]>(() => loadStations());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Modal visibility states
  const [isStationManagerOpen, setIsStationManagerOpen] = useState(false);
  const [isRadioBrowserOpen, setIsRadioBrowserOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isBoostSettingsOpen, setIsBoostSettingsOpen] = useState(false);
  const [isAndroidInfoOpen, setIsAndroidInfoOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Settings updater callback
  const handleUpdateSettings = useCallback((newPartial: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newPartial };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // Update stations callback
  const handleSaveStations = useCallback((newStations: RadioStation[]) => {
    setStations(newStations);
    saveStations(newStations);
  }, []);

  // Reset to default 16 stations
  const handleResetToDefault = useCallback(() => {
    setStations(DEFAULT_STATIONS);
    saveStations(DEFAULT_STATIONS);
  }, []);

  // Radio Audio Engine Hook
  const {
    currentStation,
    currentStationIndex,
    isPlaying,
    isLoading,
    nowPlayingTitle,
    isSpeechBoostActive,
    effectiveVolume,
    timerRemaining,
    error,
    togglePlay,
    selectStation,
    nextStation,
    prevStation,
    setVolume,
    toggleBoost,
    setBoostAmount,
    startSleepTimer,
    cancelSleepTimer,
  } = useRadioPlayer(stations, settings, handleUpdateSettings);

  // Handle network online/offline indicator
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle Dark / Light Theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const toggleLanguage = () => {
    handleUpdateSettings({ language: settings.language === 'sl' ? 'en' : 'sl' });
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleUpdateSettings({ theme: nextTheme });
  };

  // Add station from Radio Browser search
  const handleAddFromBrowser = (newStation: RadioStation) => {
    const updated = [...stations, newStation];
    handleSaveStations(updated);
  };

  // Import stations (append or replace)
  const handleImportStations = (newStations: RadioStation[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      handleSaveStations(newStations);
      selectStation(0, false);
    } else {
      // Append without duplicate URLs
      const existingUrls = new Set(stations.map(s => s.url));
      const filteredNew = newStations.filter(s => !existingUrls.has(s.url));
      handleSaveStations([...stations, ...filteredNew]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="bg-rose-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4" />
          <span>Ni internetne povezave. Predvajalnik se bo samodejno ponovno povezal ob vrnitvi omrežja.</span>
        </div>
      )}

      {/* Playback Error Toast */}
      {error && (
        <div className="bg-amber-600/90 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Header with quick navigation and PWA install button */}
      <Header
        lang={settings.language}
        theme={settings.theme}
        onToggleLang={toggleLanguage}
        onToggleTheme={toggleTheme}
        onOpenStationManager={() => setIsStationManagerOpen(true)}
        onOpenRadioBrowser={() => setIsRadioBrowserOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenBoostSettings={() => setIsBoostSettingsOpen(true)}
        onOpenAndroidInfo={() => setIsAndroidInfoOpen(true)}
      />

      {/* Main Content Area - Layout from top to bottom as requested */}
      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-start px-2 sm:px-4 py-2 sm:py-4">
        {/* 1. Izbira postaje (spustni seznam in puščici) ter velika ikona predvajane postaje */}
        {/* 2. Naslov “Zdaj predvaja” */}
        <NowPlayingSection
          lang={settings.language}
          stations={stations}
          currentStation={currentStation}
          currentStationIndex={currentStationIndex}
          isPlaying={isPlaying}
          isLoading={isLoading}
          nowPlayingTitle={nowPlayingTitle}
          isSpeechBoostActive={isSpeechBoostActive}
          boostAmount={settings.boostAmount}
          onSelectStation={(idx) => selectStation(idx, isPlaying)}
          onPrevStation={prevStation}
          onNextStation={nextStation}
        />

        {/* 3. Navpična drsnika za glasnost in dvig ter stikalo (rdeče izklopljeno, zeleno vklopljeno) */}
        {/* 4. Predvajaj/Ustavi in timer */}
        <AudioControlsSection
          lang={settings.language}
          volume={settings.volume}
          effectiveVolume={effectiveVolume}
          boostAmount={settings.boostAmount}
          boostEnabled={settings.boostEnabled}
          isSpeechBoostActive={isSpeechBoostActive}
          isPlaying={isPlaying}
          isLoading={isLoading}
          timerRemaining={timerRemaining}
          fadeLast60s={settings.fadeLast60s}
          onSetVolume={setVolume}
          onSetBoostAmount={setBoostAmount}
          onToggleBoost={toggleBoost}
          onTogglePlay={togglePlay}
          onStartTimer={startSleepTimer}
          onCancelTimer={cancelSleepTimer}
          onToggleFadeLast60s={(fade) => handleUpdateSettings({ fadeLast60s: fade })}
        />

        {/* 5. Mreža ikon postaj (prvih 16 postaj kot velike ikone: 2×8, na telefonu 4 stolpci) */}
        <StationGrid
          lang={settings.language}
          stations={stations}
          currentStationIndex={currentStationIndex}
          isPlaying={isPlaying}
          onSelectStation={(idx) => selectStation(idx, true)}
        />
      </main>

      {/* Modals */}
      <StationManagerModal
        lang={settings.language}
        isOpen={isStationManagerOpen}
        stations={stations}
        onClose={() => setIsStationManagerOpen(false)}
        onSaveStations={handleSaveStations}
        onResetToDefault={handleResetToDefault}
      />

      <RadioBrowserModal
        lang={settings.language}
        isOpen={isRadioBrowserOpen}
        userStations={stations}
        onClose={() => setIsRadioBrowserOpen(false)}
        onAddStation={handleAddFromBrowser}
      />

      <ImportExportModal
        lang={settings.language}
        isOpen={isImportExportOpen}
        stations={stations}
        onClose={() => setIsImportExportOpen(false)}
        onImportStations={handleImportStations}
      />

      <BoostSettingsModal
        lang={settings.language}
        isOpen={isBoostSettingsOpen}
        settings={settings}
        onClose={() => setIsBoostSettingsOpen(false)}
        onSaveSettings={handleUpdateSettings}
      />

      <AndroidInfoModal
        lang={settings.language}
        isOpen={isAndroidInfoOpen}
        onClose={() => setIsAndroidInfoOpen(false)}
      />
    </div>
  );
}
