import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, ArrowUp, ArrowDown, GripVertical, CheckSquare, Square, Save, RotateCcw } from 'lucide-react';
import { RadioStation } from '../types/radio';
import { translations } from '../i18n/translations';
import { generateStationSvg } from '../services/defaultStations';

interface StationManagerModalProps {
  lang: 'sl' | 'en';
  stations: RadioStation[];
  isOpen: boolean;
  onClose: () => void;
  onSaveStations: (stations: RadioStation[]) => void;
  onResetToDefault: () => void;
}

export const StationManagerModal: React.FC<StationManagerModalProps> = ({
  lang,
  stations,
  isOpen,
  onClose,
  onSaveStations,
  onResetToDefault,
}) => {
  const t = translations[lang];

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingStation, setEditingStation] = useState<RadioStation | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formCustomKeywords, setFormCustomKeywords] = useState('');
  const [formGenre, setFormGenre] = useState('');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const toggleSelectStation = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === stations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(stations.map(s => s.id)));
    }
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(t.confirmDeleteSelected)) {
      const updated = stations.filter(s => !selectedIds.has(s.id));
      onSaveStations(updated);
      setSelectedIds(new Set());
    }
  };

  const deleteSingle = (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      const updated = stations.filter(s => s.id !== id);
      onSaveStations(updated);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...stations];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    onSaveStations(copy);
  };

  const moveDown = (index: number) => {
    if (index >= stations.length - 1) return;
    const copy = [...stations];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    onSaveStations(copy);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const copy = [...stations];
    const [moved] = copy.splice(draggedIndex, 1);
    copy.splice(targetIndex, 0, moved);
    onSaveStations(copy);
    setDraggedIndex(null);
  };

  const startEdit = (station: RadioStation) => {
    setEditingStation(station);
    setFormName(station.name);
    setFormUrl(station.url);
    setFormIcon(station.icon || '');
    setFormCustomKeywords(station.customKeywords || '');
    setFormGenre(station.genre || '');
    setIsAddingNew(false);
  };

  const startAddNew = () => {
    setEditingStation(null);
    setFormName('');
    setFormUrl('');
    setFormIcon('');
    setFormCustomKeywords('');
    setFormGenre('');
    setIsAddingNew(true);
  };

  const cancelForm = () => {
    setEditingStation(null);
    setIsAddingNew(false);
  };

  const saveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;

    // If icon is empty, generate a colorful SVG badge automatically!
    const finalIcon = formIcon.trim() || generateStationSvg(formName, '#10b981', '#0284c7', formName.substring(0, 3).toUpperCase());

    if (isAddingNew) {
      const newStation: RadioStation = {
        id: `station_${Date.now()}`,
        name: formName.trim(),
        url: formUrl.trim(),
        icon: finalIcon,
        customKeywords: formCustomKeywords.trim(),
        genre: formGenre.trim(),
      };
      onSaveStations([...stations, newStation]);
    } else if (editingStation) {
      const updated = stations.map(s => {
        if (s.id === editingStation.id) {
          return {
            ...s,
            name: formName.trim(),
            url: formUrl.trim(),
            icon: finalIcon,
            customKeywords: formCustomKeywords.trim(),
            genre: formGenre.trim(),
          };
        }
        return s;
      });
      onSaveStations(updated);
    }

    cancelForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-5">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{t.stationManager}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                {stations.length} {t.stationsCount}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.dragToReorder}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startAddNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addStation}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar for Bulk selection */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-slate-950/50 border-b border-slate-800/80 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 hover:text-white font-medium transition"
            >
              {selectedIds.size === stations.length && stations.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {selectedIds.size === stations.length && stations.length > 0
                  ? t.deselectAll
                  : t.selectAll}
              </span>
            </button>
            {selectedIds.size > 0 && (
              <span className="font-bold text-emerald-400">
                ({selectedIds.size} izbranih)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.deleteSelected} ({selectedIds.size})</span>
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm('Ali želite ponastaviti seznam postaj na privzetih 16 postaj?')) {
                  onResetToDefault();
                }
              }}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 transition"
              title="Ponastavi na privzeto"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Ponastavi</span>
            </button>
          </div>
        </div>

        {/* Add / Edit Form Drawer */}
        {(isAddingNew || editingStation) && (
          <form
            onSubmit={saveForm}
            className="p-4 bg-slate-950 border-b border-slate-800 space-y-3 shrink-0"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {isAddingNew ? t.addStation : t.editStation}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t.stationName} *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="npr. Val 202"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t.streamUrl} *
                </label>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://... / http://..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t.iconUrl} (opcijsko)
                </label>
                <input
                  type="text"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="Prazno za samodejni barvni logotip"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Žanr / Opis
                </label>
                <input
                  type="text"
                  value={formGenre}
                  onChange={(e) => setFormGenre(e.target.value)}
                  placeholder="npr. Pop / Rock"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {t.customKeywords}
              </label>
              <input
                type="text"
                value={formCustomKeywords}
                onChange={(e) => setFormCustomKeywords(e.target.value)}
                placeholder="npr. govorna;poročila;dnevnik;studio (ločeno s ;)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={cancelForm}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t.save}</span>
              </button>
            </div>
          </form>
        )}

        {/* Station List with Drag & Drop */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2">
          {stations.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              {t.emptyStationList}
            </div>
          ) : (
            stations.map((station, index) => {
              const isSelected = selectedIds.has(station.id);
              const isTop16 = index < 16;

              return (
                <div
                  key={station.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  className={`flex items-center gap-2 sm:gap-3 p-2.5 rounded-2xl border transition-all duration-150 ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/70'
                      : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/90'
                  }`}
                >
                  {/* Drag Handle */}
                  <div
                    className="cursor-grab text-slate-500 hover:text-slate-300 p-1 shrink-0"
                    title="Povleci za spremembo vrstnega reda"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Multi-select checkbox */}
                  <button
                    onClick={() => toggleSelectStation(station.id)}
                    className="p-1 text-slate-400 hover:text-white shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Rank / Index badge */}
                  <span
                    className={`w-6 text-center text-xs font-mono font-bold shrink-0 ${
                      isTop16 ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {index + 1}.
                  </span>

                  {/* Station Icon */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {station.icon ? (
                      <img
                        src={station.icon}
                        alt={station.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        {station.name.substring(0, 3)}
                      </span>
                    )}
                  </div>

                  {/* Station Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white truncate">
                        {station.name}
                      </h4>
                      {isTop16 && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Mreža 1-16
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate font-mono">
                      {station.url}
                    </p>
                    {station.customKeywords && (
                      <p className="text-[10px] text-cyan-400 truncate">
                        Dvig: {station.customKeywords}
                      </p>
                    )}
                  </div>

                  {/* Quick up / down arrows for mobile */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t.moveUp}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === stations.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t.moveDown}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit & Delete buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(station)}
                      className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white"
                      title={t.editStation}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSingle(station.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                      title={t.deleteStation}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
