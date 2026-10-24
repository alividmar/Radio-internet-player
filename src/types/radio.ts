export interface RadioStation {
  id: string;
  name: string;
  url: string;
  icon: string;
  customKeywords?: string; // Optional station override for speech boost keywords
  genre?: string;
  country?: string;
}

export type BoostMode = 'percentage' | 'fixed';

export interface AppSettings {
  volume: number; // 0 to 1 (e.g. 0.8)
  boostEnabled: boolean; // Speech boost switch (true = on, false = off)
  boostAmount: number; // e.g. 25 (%) or 0.25
  boostMode: BoostMode; // 'percentage' or 'fixed'
  globalKeywords: string; // semicolon separated, e.g. "govorna;glasovanje;pogovor;poročila;dnevnik;novice;oddaja;studio"
  timerMinutes: number; // Default sleep timer minutes
  fadeLast60s: boolean; // Gradual fade out in last 60 seconds of timer
  language: 'sl' | 'en';
  theme: 'dark' | 'light' | 'system';
  useProxyForHttp: boolean; // Route http:// via proxy
}

export interface RadioBrowserStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  url: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  votes: number;
  codec: string;
  bitrate: number;
}
