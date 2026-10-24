import { useEffect, useRef, useState, useCallback } from 'react';
import { AppSettings, RadioStation } from '../types/radio';

export interface RadioPlayerState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  isLoading: boolean;
  nowPlayingTitle: string;
  isSpeechBoostActive: boolean;
  effectiveVolume: number;
  timerRemaining: number | null; // seconds remaining, or null if off
  isTimerRunning: boolean;
  error: string | null;
}

export function useRadioPlayer(
  stations: RadioStation[],
  settings: AppSettings,
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void
) {
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nowPlayingTitle, setNowPlayingTitle] = useState<string>('');
  const [isSpeechBoostActive, setIsSpeechBoostActive] = useState<boolean>(false);
  const [effectiveVolume, setEffectiveVolume] = useState<number>(settings.volume);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const icyIntervalRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const volumeRampIntervalRef = useRef<number | null>(null);
  const wasPlayingBeforeDisconnectRef = useRef<boolean>(false);

  const currentStation = stations[currentStationIndex] || stations[0] || null;

  // Resolve stream URL: if http:// and app is on https, route through server proxy
  const resolveStreamUrl = useCallback((url: string): string => {
    if (!url) return '';
    const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isHttpsPage && url.startsWith('http://') && settings.useProxyForHttp) {
      return `/api/proxy-stream?url=${encodeURIComponent(url)}`;
    }
    return url;
  }, [settings.useProxyForHttp]);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = settings.volume;
    audioRef.current = audio;

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };

    const onPause = () => {
      setIsPlaying(false);
      setIsLoading(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onPlaying = () => {
      setIsLoading(false);
      setError(null);
    };

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Napaka pri povezavi s tokom (Stream error)');
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Compute speech boost match
  const checkSpeechBoost = useCallback((title: string, station: RadioStation | null): boolean => {
    if (!settings.boostEnabled || !title || !station) return false;

    // Check station custom keywords or fallback to global keywords
    const keywordsStr = (station.customKeywords && station.customKeywords.trim().length > 0)
      ? station.customKeywords
      : settings.globalKeywords;

    if (!keywordsStr) return false;

    const keywords = keywordsStr
      .split(';')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);

    const titleLower = title.toLowerCase();
    return keywords.some(keyword => titleLower.includes(keyword));
  }, [settings.boostEnabled, settings.globalKeywords]);

  // Smoothly ramp volume to target
  const rampVolumeTo = useCallback((targetVol: number, durationMs = 600) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (volumeRampIntervalRef.current) {
      clearInterval(volumeRampIntervalRef.current);
      volumeRampIntervalRef.current = null;
    }

    const clampedTarget = Math.max(0, Math.min(1, targetVol));
    const startVol = audio.volume;
    const diff = clampedTarget - startVol;
    if (Math.abs(diff) < 0.01) {
      audio.volume = clampedTarget;
      setEffectiveVolume(clampedTarget);
      return;
    }

    const steps = 15;
    const stepDuration = durationMs / steps;
    let stepCount = 0;

    volumeRampIntervalRef.current = window.setInterval(() => {
      stepCount++;
      const progress = stepCount / steps;
      const current = startVol + diff * progress;
      const val = Math.max(0, Math.min(1, current));
      audio.volume = val;
      setEffectiveVolume(val);

      if (stepCount >= steps) {
        if (volumeRampIntervalRef.current) {
          clearInterval(volumeRampIntervalRef.current);
          volumeRampIntervalRef.current = null;
        }
        audio.volume = clampedTarget;
        setEffectiveVolume(clampedTarget);
      }
    }, stepDuration);
  }, []);

  // Calculate target volume taking into account base volume, speech boost, and sleep timer fade
  useEffect(() => {
    const speechActive = checkSpeechBoost(nowPlayingTitle, currentStation);
    setIsSpeechBoostActive(speechActive);

    let targetVol = settings.volume;

    // Apply speech boost
    if (speechActive && settings.boostEnabled) {
      if (settings.boostMode === 'percentage') {
        targetVol = Math.min(1.0, settings.volume * (1 + settings.boostAmount / 100));
      } else {
        targetVol = Math.min(1.0, Math.max(settings.volume, settings.boostAmount / 100));
      }
    }

    // Apply 60s fade out if timer is ending
    if (timerRemaining !== null && timerRemaining <= 60 && settings.fadeLast60s) {
      const fadeRatio = Math.max(0, timerRemaining / 60);
      targetVol = targetVol * fadeRatio;
    }

    rampVolumeTo(targetVol);
  }, [
    settings.volume,
    settings.boostEnabled,
    settings.boostAmount,
    settings.boostMode,
    settings.fadeLast60s,
    nowPlayingTitle,
    currentStation,
    timerRemaining,
    checkSpeechBoost,
    rampVolumeTo,
  ]);

  // Fetch ICY metadata periodically
  const fetchIcyMetadata = useCallback(async (station: RadioStation) => {
    if (!station || !station.url) return;
    try {
      const resp = await fetch(`/api/icy?url=${encodeURIComponent(station.url)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.title && typeof data.title === 'string') {
          setNowPlayingTitle(data.title.trim());
        }
      }
    } catch {
      // Ignore background metadata polling errors
    }
  }, []);

  // Poll ICY metadata when playing
  useEffect(() => {
    if (icyIntervalRef.current) {
      clearInterval(icyIntervalRef.current);
      icyIntervalRef.current = null;
    }

    if (isPlaying && currentStation) {
      // Initial fetch
      fetchIcyMetadata(currentStation);

      // Poll every 12 seconds
      icyIntervalRef.current = window.setInterval(() => {
        fetchIcyMetadata(currentStation);
      }, 12000);
    }

    return () => {
      if (icyIntervalRef.current) {
        clearInterval(icyIntervalRef.current);
        icyIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentStation, fetchIcyMetadata]);

  // Play / Stop controls
  const play = useCallback(async (stationToPlay?: RadioStation) => {
    const station = stationToPlay || currentStation;
    if (!station || !audioRef.current) return;

    setError(null);
    setIsLoading(true);

    const streamUrl = resolveStreamUrl(station.url);
    if (audioRef.current.src !== streamUrl) {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err: unknown) {
      console.warn('Audio play error:', err);
      // Try proxy fallback if not already using proxy
      if (!streamUrl.includes('/api/proxy-stream')) {
        try {
          const proxyUrl = `/api/proxy-stream?url=${encodeURIComponent(station.url)}`;
          audioRef.current.src = proxyUrl;
          audioRef.current.load();
          await audioRef.current.play();
          setIsPlaying(true);
          setIsLoading(false);
          return;
        } catch (e2) {
          console.error('Proxy fallback failed:', e2);
        }
      }
      setIsLoading(false);
      setIsPlaying(false);
      setError('Predvajanje ni uspelo. Preverite povezavo ali URL postaje.');
    }
  }, [currentStation, resolveStreamUrl]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  // Fast station switcher: change source and continue playing seamlessly
  const selectStation = useCallback((indexOrId: number | string, autoPlay = true) => {
    let index = 0;
    if (typeof indexOrId === 'number') {
      index = Math.max(0, Math.min(stations.length - 1, indexOrId));
    } else {
      const foundIdx = stations.findIndex(s => s.id === indexOrId);
      index = foundIdx >= 0 ? foundIdx : 0;
    }

    setCurrentStationIndex(index);
    const station = stations[index];
    setNowPlayingTitle('');
    setIsSpeechBoostActive(false);

    if (autoPlay || isPlaying) {
      play(station);
    }
  }, [stations, isPlaying, play]);

  const nextStation = useCallback(() => {
    if (stations.length === 0) return;
    const nextIdx = (currentStationIndex + 1) % stations.length;
    selectStation(nextIdx, isPlaying);
  }, [currentStationIndex, stations.length, isPlaying, selectStation]);

  const prevStation = useCallback(() => {
    if (stations.length === 0) return;
    const prevIdx = (currentStationIndex - 1 + stations.length) % stations.length;
    selectStation(prevIdx, isPlaying);
  }, [currentStationIndex, stations.length, isPlaying, selectStation]);

  // Android MediaSession setup for lock screen, bluetooth, and notification controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentStation) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlayingTitle || currentStation.name,
      artist: currentStation.name,
      album: currentStation.genre || 'Internetni Radio',
      artwork: [
        { src: currentStation.icon || '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: currentStation.icon || '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      stop();
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      stop();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      prevStation();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextStation();
    });

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      } catch {
        // ignore
      }
    };
  }, [currentStation, nowPlayingTitle, play, stop, nextStation, prevStation]);

  // Android: Auto reconnect after network loss, phone wake-up, or tab visibility change
  useEffect(() => {
    const handleOnline = () => {
      if (wasPlayingBeforeDisconnectRef.current || isPlaying) {
        console.log('Network restored: Reconnecting radio stream...');
        if (currentStation) {
          play(currentStation);
        }
      }
    };

    const handleOffline = () => {
      if (isPlaying) {
        wasPlayingBeforeDisconnectRef.current = true;
      }
    };

    const handleVisibilityChange = () => {
      // When phone wakes up or app comes to foreground
      if (document.visibilityState === 'visible' && isPlaying && audioRef.current?.paused) {
        console.log('Device woke up: resuming audio stream...');
        audioRef.current.play().catch(e => console.warn('Wake resume error:', e));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, currentStation, play]);

  // Sleep Timer countdown
  useEffect(() => {
    if (timerRemaining === null) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = window.setInterval(() => {
      setTimerRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Timer finished: stop playback
          stop();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerRemaining, stop]);

  const startSleepTimer = useCallback((minutes: number) => {
    if (minutes <= 0) {
      setTimerRemaining(null);
    } else {
      setTimerRemaining(minutes * 60);
    }
  }, []);

  const cancelSleepTimer = useCallback(() => {
    setTimerRemaining(null);
  }, []);

  // Update volume (0 to 1)
  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    onUpdateSettings({ volume: clamped });
    if (audioRef.current && !isSpeechBoostActive) {
      audioRef.current.volume = clamped;
      setEffectiveVolume(clamped);
    }
  }, [onUpdateSettings, isSpeechBoostActive]);

  // Toggle speech boost switch
  const toggleBoost = useCallback(() => {
    onUpdateSettings({ boostEnabled: !settings.boostEnabled });
  }, [settings.boostEnabled, onUpdateSettings]);

  const setBoostAmount = useCallback((amount: number) => {
    onUpdateSettings({ boostAmount: amount });
  }, [onUpdateSettings]);

  return {
    currentStation,
    currentStationIndex,
    isPlaying,
    isLoading,
    nowPlayingTitle,
    isSpeechBoostActive,
    effectiveVolume,
    timerRemaining,
    error,
    play,
    stop,
    togglePlay,
    selectStation,
    nextStation,
    prevStation,
    setVolume,
    toggleBoost,
    setBoostAmount,
    startSleepTimer,
    cancelSleepTimer,
  };
}
