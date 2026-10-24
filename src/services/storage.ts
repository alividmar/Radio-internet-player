import { AppSettings, RadioStation } from '../types/radio';
import { DEFAULT_STATIONS } from './defaultStations';

const STATIONS_KEY = 'radio_stations_v1';
const SETTINGS_KEY = 'radio_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  volume: 0.75,
  boostEnabled: true,
  boostAmount: 25, // +25% boost
  boostMode: 'percentage',
  globalKeywords: 'govorna;glasovanje;pogovor;poročila;dnevnik;novice;oddaja;studio;debata;informativni;talk;news;speech;interview',
  timerMinutes: 30,
  fadeLast60s: true,
  language: 'sl',
  theme: 'dark',
  useProxyForHttp: true,
};

export function loadStations(): RadioStation[] {
  try {
    const raw = localStorage.getItem(STATIONS_KEY);
    if (!raw) return DEFAULT_STATIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load stations from localStorage:', e);
  }
  return DEFAULT_STATIONS;
}

export function saveStations(stations: RadioStation[]): void {
  try {
    localStorage.setItem(STATIONS_KEY, JSON.stringify(stations));
  } catch (e) {
    console.error('Failed to save stations to localStorage:', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// Export utilities
export function exportStationsAsJson(stations: RadioStation[], includeIcons: boolean): string {
  const exportData = stations.map(s => {
    if (includeIcons) return s;
    const { icon, ...rest } = s;
    return rest;
  });
  return JSON.stringify(exportData, null, 2);
}

export function exportStationsAsTxt(stations: RadioStation[]): string {
  // Simple "Name = URL" format line-by-line
  return stations.map(s => `${s.name} = ${s.url}`).join('\n');
}

// Import utilities
export function parseImportData(rawText: string): Partial<RadioStation>[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // Try JSON first
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr
        .filter((item: any) => item && (item.name || item.url))
        .map((item: any, idx: number) => ({
          id: item.id || `custom_${Date.now()}_${idx}`,
          name: item.name || `Station ${idx + 1}`,
          url: item.url || '',
          icon: item.icon || '',
          customKeywords: item.customKeywords || '',
          genre: item.genre || '',
          country: item.country || '',
        }));
    } catch {
      // Fall through to TXT parsing
    }
  }

  // Parse TXT lines: "Name = URL" or "Name, URL"
  const lines = trimmed.split('\n');
  const result: Partial<RadioStation>[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    if (line.includes('=')) {
      const parts = line.split('=');
      const name = parts[0].trim();
      const url = parts.slice(1).join('=').trim();
      if (name && url) {
        result.push({
          id: `custom_${Date.now()}_${i}`,
          name,
          url,
          icon: '',
        });
      }
    } else if (line.includes(',')) {
      const parts = line.split(',');
      const name = parts[0].trim();
      const url = parts.slice(1).join(',').trim();
      if (name && url.startsWith('http')) {
        result.push({
          id: `custom_${Date.now()}_${i}`,
          name,
          url,
          icon: '',
        });
      }
    }
  }

  return result;
}
