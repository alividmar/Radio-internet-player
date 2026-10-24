import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Globe, Music, ThumbsUp, Plus, Check, Play, Square, Loader2 } from 'lucide-react';
import { RadioBrowserStation, RadioStation } from '../types/radio';
import { translations } from '../i18n/translations';
import { generateStationSvg } from '../services/defaultStations';

interface RadioBrowserModalProps {
  lang: 'sl' | 'en';
  isOpen: boolean;
  userStations: RadioStation[];
  onClose: () => void;
  onAddStation: (station: RadioStation) => void;
}

const POPULAR_COUNTRIES = [
  { code: 'SI', name: 'Slovenija' },
  { code: 'HR', name: 'Hrvaška' },
  { code: 'AT', name: 'Avstrija' },
  { code: 'IT', name: 'Italija' },
  { code: 'DE', name: 'Nemčija' },
  { code: 'GB', name: 'Velika Britanija' },
  { code: 'US', name: 'ZDA' },
  { code: '', name: 'Vse države' },
];

const POPULAR_TAGS = [
  '',
  'pop',
  'rock',
  'news',
  'hits',
  'talk',
  'electronic',
  'dance',
  'classical',
  'jazz',
  'folk',
  'metal',
  '80s',
  '90s',
];

export const RadioBrowserModal: React.FC<RadioBrowserModalProps> = ({
  lang,
  isOpen,
  userStations,
  onClose,
  onAddStation,
}) => {
  const t = translations[lang];

  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('SI');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('votes');
  const [results, setResults] = useState<RadioBrowserStation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedUuids, setAddedUuids] = useState<Set<string>>(new Set());

  // Audio preview state
  const [previewingUrl, setPreviewingUrl] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Search trigger
  const handleSearch = async (overrideParams?: { country?: string; tag?: string }) => {
    setIsSearching(true);
    const country = overrideParams?.country !== undefined ? overrideParams.country : selectedCountry;
    const tag = overrideParams?.tag !== undefined ? overrideParams.tag : selectedTag;

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('name', query.trim());
      if (country) params.append('countrycode', country);
      if (tag) params.append('tag', tag);
      params.append('order', sortBy);
      params.append('limit', '50');

      const response = await fetch(`/api/radio-browser/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setResults(data);
        }
      }
    } catch (err) {
      console.error('Radio browser search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Perform initial search on modal open (e.g. popular stations in Slovenia)
  useEffect(() => {
    if (isOpen) {
      handleSearch();
    } else {
      // Stop preview when modal closes
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
        setPreviewingUrl(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePreview = (url: string) => {
    if (previewingUrl === url) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
      }
      setPreviewingUrl(null);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
      }
      previewAudioRef.current.pause();
      previewAudioRef.current.src = url;
      previewAudioRef.current.play().catch(e => console.warn('Preview play error:', e));
      setPreviewingUrl(url);
    }
  };

  const handleAdd = (rStation: RadioBrowserStation) => {
    const streamUrl = rStation.url_resolved || rStation.url;
    const icon = rStation.favicon?.trim() || generateStationSvg(rStation.name, '#0284c7', '#0f766e', rStation.name.substring(0, 3).toUpperCase());

    const newStation: RadioStation = {
      id: `rb_${rStation.stationuuid || Date.now()}`,
      name: rStation.name.trim(),
      url: streamUrl,
      icon,
      genre: rStation.tags?.split(',').slice(0, 3).join(', ') || '',
      country: rStation.country || '',
    };

    onAddStation(newStation);
    setAddedUuids(prev => new Set(prev).add(rStation.stationuuid));
  };

  const isAlreadyAdded = (rStation: RadioBrowserStation) => {
    const streamUrl = rStation.url_resolved || rStation.url;
    return (
      addedUuids.has(rStation.stationuuid) ||
      userStations.some(s => s.url === streamUrl || s.name.toLowerCase() === rStation.name.toLowerCase())
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>{t.searchStations}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Radio-Browser API • Tisoče radijskih postaj z vsega sveta
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95 flex items-center gap-1.5"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Poišči</span>
            </button>
          </form>

          {/* Filters row: Country, Genre, Sort */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {t.countryFilter}
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  handleSearch({ country: e.target.value });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {POPULAR_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {t.genreFilter}
              </label>
              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  handleSearch({ tag: e.target.value });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Vsi žanri</option>
                {POPULAR_TAGS.filter(Boolean).map(tag => (
                  <option key={tag} value={tag}>
                    {tag.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {t.sortBy}
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="votes">{t.votes}</option>
                <option value="clickcount">{t.clicks}</option>
                <option value="name">{t.name}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2">
          {isSearching ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-xs">{t.searching}</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              {t.noResultsFound}
            </div>
          ) : (
            results.map((st) => {
              const streamUrl = st.url_resolved || st.url;
              const isAdded = isAlreadyAdded(st);
              const isPreviewing = previewingUrl === streamUrl;

              return (
                <div
                  key={st.stationuuid}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 transition"
                >
                  {/* Station Favicon */}
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {st.favicon ? (
                      <img
                        src={st.favicon}
                        alt={st.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Music className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white truncate">
                        {st.name}
                      </h4>
                      {st.country && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                          {st.country}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 truncate">
                      {st.tags && (
                        <span className="truncate max-w-[200px] text-emerald-400/90">
                          {st.tags.split(',').slice(0, 3).join(', ')}
                        </span>
                      )}
                      {st.codec && (
                        <span className="font-mono text-[10px] text-slate-500">
                          {st.codec} {st.bitrate ? `${st.bitrate}k` : ''}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-slate-400">
                        <ThumbsUp className="w-3 h-3 text-amber-400" />
                        <span>{st.votes}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions: Preview & Add */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => togglePreview(streamUrl)}
                      className={`p-2 rounded-xl transition ${
                        isPreviewing
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title={isPreviewing ? t.stopPreview : t.previewStation}
                    >
                      {isPreviewing ? (
                        <Square className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>

                    <button
                      onClick={() => handleAdd(st)}
                      disabled={isAdded}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                        isAdded
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t.alreadyAdded}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.addSelected}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
