import { RadioStation } from '../types/radio';

// Function to generate high quality SVG badges with station initials & vibrant color
export function generateStationSvg(name: string, bg1: string, bg2: string, text: string): string {
  const initials = text || name.substring(0, 3).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="grad_${name.replace(/\s+/g, '_')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="44" fill="url(#grad_${name.replace(/\s+/g, '_')})" />
    <circle cx="100" cy="100" r="76" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6" />
    <text x="100" y="112" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">${initials}</text>
    <circle cx="100" cy="155" r="4" fill="#ffffff" opacity="0.8" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_STATIONS: RadioStation[] = [
  {
    id: 'val202',
    name: 'Val 202',
    url: 'https://mp3.rtvslo.si/val202',
    icon: generateStationSvg('val202', '#0284c7', '#0369a1', 'VAL 202'),
    genre: 'Pop / Rock / Govor',
    country: 'Slovenija',
    customKeywords: 'novice;dnevnik;oddaja;govor;debata;glasovanje;spored',
  },
  {
    id: 'prvi',
    name: 'Radio Prvi',
    url: 'https://mp3.rtvslo.si/ra1',
    icon: generateStationSvg('prvi', '#dc2626', '#991b1b', 'PRVI'),
    genre: 'Informativni / Kultura',
    country: 'Slovenija',
    customKeywords: 'dnevnik;dogodki;poročila;oddaja;govor;pogovor;studio;studio ob 17h',
  },
  {
    id: 'radiosi',
    name: 'Radio SI',
    url: 'https://mp3.rtvslo.si/rsi',
    icon: generateStationSvg('radiosi', '#0d9488', '#115e59', 'RADIO SI'),
    genre: 'Mednarodni / Pop',
    country: 'Slovenija',
    customKeywords: 'news;traffic;oddaja;poročila;talk',
  },
  {
    id: 'ars',
    name: 'Radio ARS',
    url: 'https://mp3.rtvslo.si/ars',
    icon: generateStationSvg('ars', '#7c3aed', '#5b21b6', 'ARS'),
    genre: 'Klasika / Kultura',
    country: 'Slovenija',
    customKeywords: 'oddaja;literatura;pogovor;esej;dramatika',
  },
  {
    id: 'city',
    name: 'Radio City',
    url: 'https://stream.radiocity.si/CityMp3',
    icon: generateStationSvg('city', '#ea580c', '#c2410c', 'CITY'),
    genre: 'Pop / Zabava / Maribor',
    country: 'Slovenija',
    customKeywords: 'reporter milan;novice;jutro;pogovor',
  },
  {
    id: 'aktual',
    name: 'Radio Aktual',
    url: 'https://live.aktual.si/Aktual',
    icon: generateStationSvg('aktual', '#e11d48', '#be123c', 'AKTUAL'),
    genre: 'Zabavna / Mediteran',
    country: 'Slovenija',
    customKeywords: 'glasovanje;poročila;oddaja;klepet',
  },
  {
    id: 'center',
    name: 'Radio Center',
    url: 'https://stream.radiocenter.si/Center',
    icon: generateStationSvg('center', '#f59e0b', '#d97706', 'CENTER'),
    genre: 'Hit / Pop',
    country: 'Slovenija',
    customKeywords: 'show;novice;glasovanje;hit dneva',
  },
  {
    id: 'radio1',
    name: 'Radio 1',
    url: 'https://live.radio1.si/Radio1',
    icon: generateStationSvg('radio1', '#2563eb', '#1d4ed8', 'RADIO 1'),
    genre: 'Komercijalni / Pop',
    country: 'Slovenija',
    customKeywords: 'denis avdić;jutranji program;novice;oddaja;glasovanje',
  },
  {
    id: 'student',
    name: 'Radio Študent',
    url: 'https://kruljo.radiostudent.si:8000/live',
    icon: generateStationSvg('student', '#16a34a', '#15803d', 'RŠ 89.3'),
    genre: 'Alternativa / Študentski',
    country: 'Slovenija',
    customKeywords: 'tolpa bumov;oddaja;debata;poročila;recenzija',
  },
  {
    id: 'bob',
    name: 'Radio Bob',
    url: 'https://live.radiobob.si/Bob',
    icon: generateStationSvg('bob', '#475569', '#1e293b', 'BOB ROCK'),
    genre: 'Rock / Metal',
    country: 'Slovenija',
    customKeywords: 'rock novice;oddaja;rock intervju',
  },
  {
    id: 'capris',
    name: 'Radio Capris',
    url: 'https://stream.radiocapris.si/capris',
    icon: generateStationSvg('capris', '#0284c7', '#0e7490', 'CAPRIS'),
    genre: 'Obalni / Pop / Hits',
    country: 'Slovenija',
    customKeywords: 'obala;novice;poročila;oddaja',
  },
  {
    id: 'antena',
    name: 'Radio Antena',
    url: 'https://live.radioantena.si/Antena',
    icon: generateStationSvg('antena', '#9333ea', '#7e22ce', 'ANTENA'),
    genre: 'Mladinski / Dance',
    country: 'Slovenija',
    customKeywords: 'antena show;novice;oddaja',
  },
  {
    id: 'veseljak',
    name: 'Radio Veseljak',
    url: 'https://live.veseljak.si/Veseljak',
    icon: generateStationSvg('veseljak', '#15803d', '#14532d', 'VESELJAK'),
    genre: 'Slovenska / Narodnozabavna',
    country: 'Slovenija',
    customKeywords: 'pozdravi;oddaja;poročila;klepet',
  },
  {
    id: 'ognjisce',
    name: 'Radio Ognjišče',
    url: 'https://radio.ognjisce.si/stream',
    icon: generateStationSvg('ognjisce', '#4f46e5', '#3730a3', 'OGNJIŠČE'),
    genre: 'Družinski / Duhovni',
    country: 'Slovenija',
    customKeywords: 'poročila;oddaja;pogovor;molitev;komentar',
  },
  {
    id: 'bbcworld',
    name: 'BBC World Service',
    url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
    icon: generateStationSvg('bbcworld', '#b91c1c', '#7f1d1d', 'BBC'),
    genre: 'News / World / Talk',
    country: 'United Kingdom',
    customKeywords: 'news;bulletin;newshour;interview;debate;reporting',
  },
  {
    id: 'kexp',
    name: 'KEXP 90.3 FM',
    url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3',
    icon: generateStationSvg('kexp', '#d97706', '#b45309', 'KEXP'),
    genre: 'Indie / Eclectic / Live',
    country: 'United States',
    customKeywords: 'live;interview;session;talk',
  },
];
