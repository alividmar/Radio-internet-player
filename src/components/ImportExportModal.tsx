import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, FileText, Code2, AlertCircle } from 'lucide-react';
import { RadioStation } from '../types/radio';
import { translations } from '../i18n/translations';
import { exportStationsAsJson, exportStationsAsTxt, parseImportData } from '../services/storage';
import { generateStationSvg } from '../services/defaultStations';

interface ImportExportModalProps {
  lang: 'sl' | 'en';
  isOpen: boolean;
  stations: RadioStation[];
  onClose: () => void;
  onImportStations: (newStations: RadioStation[], mode: 'append' | 'replace') => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  lang,
  isOpen,
  stations,
  onClose,
  onImportStations,
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'txt'>('json');
  const [includeIcons, setIncludeIcons] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Import state
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate current export string
  const exportContent =
    exportFormat === 'json'
      ? exportStationsAsJson(stations, includeIcons)
      : exportStationsAsTxt(stations);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = exportFormat === 'json' ? 'radio-stations.json' : 'radio-stations.txt';
    const mimeType = exportFormat === 'json' ? 'application/json' : 'text/plain';
    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content || '');
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    setImportError(null);
    setImportSuccessMsg(null);

    const parsed = parseImportData(importText);
    if (parsed.length === 0) {
      setImportError(t.importError);
      return;
    }

    const completeStations: RadioStation[] = parsed.map((item, idx) => ({
      id: item.id || `imported_${Date.now()}_${idx}`,
      name: item.name || `Station ${idx + 1}`,
      url: item.url || '',
      icon: item.icon || generateStationSvg(item.name || 'Rad', '#06b6d4', '#3b82f6', (item.name || 'RAD').substring(0, 3).toUpperCase()),
      customKeywords: item.customKeywords || '',
      genre: item.genre || '',
      country: item.country || '',
    }));

    onImportStations(completeStations, importMode);
    setImportSuccessMsg(`${t.importSuccess} (${completeStations.length})`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-400" />
              <span>{t.importExport}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              JSON ali TXT (Ime = URL) • Dodaj ali zamenjaj vse
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'export'
                ? 'border-amber-400 text-amber-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Izvoz</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'import'
                ? 'border-emerald-400 text-emerald-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Uvoz</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              {/* Format selection */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExportFormat('json')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    exportFormat === 'json'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>JSON (Vsi podatki)</span>
                </button>
                <button
                  onClick={() => setExportFormat('txt')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    exportFormat === 'txt'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>TXT (Ime = URL)</span>
                </button>
              </div>

              {/* JSON without icons option */}
              {exportFormat === 'json' && (
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!includeIcons}
                    onChange={(e) => setIncludeIcons(!e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700"
                  />
                  <span>{t.withoutIcons}</span>
                </label>
              )}

              {/* Export Textarea */}
              <textarea
                readOnly
                value={exportContent}
                rows={9}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none"
              />

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs transition active:scale-95"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>{t.copyToClipboard}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.downloadFile}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Import Mode: Append or Replace */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  {t.importMode}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition ${
                      importMode === 'append'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block font-bold">Dodaj (Append)</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      Ohrani obstoječe in dodaj nove
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition ${
                      importMode === 'replace'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block font-bold">Zamenjaj vse</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      Prepiši celoten seznam
                    </span>
                  </button>
                </div>
              </div>

              {/* File upload picker */}
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-medium cursor-pointer transition">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Izberi datoteko (.json / .txt)</span>
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Paste textarea */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t.pasteOrUpload}
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Val 202 = https://mp3.rtvslo.si/val202\nRadio City = https://stream.radiocity.si/CityMp3\nali prilepite JSON zapis...`}
                  rows={7}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {importError && (
                <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccessMsg && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{importSuccessMsg}</span>
                </div>
              )}

              {/* Execute Import */}
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!importText.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>{t.importData}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
