import React, { useState } from 'react';
import { X, Smartphone, Download, Copy, Check, AlertTriangle, Github, PlayCircle } from 'lucide-react';
import { translations } from '../i18n/translations';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInfoModalProps {
  lang: 'sl' | 'en';
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInfoModal: React.FC<AndroidInfoModalProps> = ({
  lang,
  isOpen,
  onClose,
}) => {
  const t = translations[lang];
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyAppUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const gitCommands = `git init
git add .
git commit -m "Internetni radio za Android"
git branch -M main
git remote add origin https://github.com/alividmar/Internetni-radio-za-Android.git
git push -u origin main`;

  const copyGitCommands = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedCommands(true);
    setTimeout(() => setCopiedCommands(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span>Namestitev na Android & GitHub APK</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Samodejna namestitev na telefon ali GitHub Actions gradnja APK-ja
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Method 1: Instant Native Android Installation (WebAPK) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-950/80 border border-emerald-500/50 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                Možnost 1 (Najhitreje na telefonu)
              </span>
            </div>
            <h3 className="font-bold text-sm text-white mb-1">
              Namestite neposredno preko telefona (brez orodij)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Odprite to spletno stran na svojem telefonu v brskalniku <strong>Chrome</strong> in pritisnite:
            </p>

            <div className="mt-2.5 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="font-mono text-cyan-300 truncate text-[11px] max-w-[260px]">
                {currentUrl}
              </span>
              <button
                onClick={copyAppUrl}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10px] flex items-center gap-1 shrink-0"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Kopirano' : 'Kopiraj'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Nato v Chromu tapnite <strong>tri pike (⋮) → »Namesti aplikacijo«</strong>. Android sam ustvari polnopravno aplikacijo.
            </p>

            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Namesti zdaj na ta telefon</span>
              </button>
            )}
          </div>

          {/* Method 2: GitHub Actions Automated APK Builder */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                Možnost 2 (Preko GitHuba)
              </span>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Github className="w-4 h-4" />
                <span>Samodejna gradnja APK-ja z GitHub Actions</span>
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              V projekt sem že vgradil <strong>GitHub Actions delovni tok</strong> (<code>.github/workflows/build-apk.yml</code>). Ko kodo prenesete in naložite na svoj GitHub, bo GitHub v oblaku <strong>samodejno zgradil pravo .APK datoteko</strong>!
            </p>

            {/* Step 1: Download code archive */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white block">
                1. korak: Prenesite celotno kodo aplikacije (ZIP)
              </span>
              <a
                href="/api/download-zip"
                download="radio-android.zip"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Prenesi projekt kot ZIP (radio-android.zip)</span>
              </a>
              <span className="text-[10px] text-slate-400 block text-center">
                Standardna ZIP datoteka, ki jo v Windows ali Mac odprete z dvojnim klikom (Brez ukazov in brez napak).
              </span>
            </div>

            {/* Step 2: Push to GitHub */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  2. korak: Ustvarite repozitorij na GitHubu in potisnite kodo
                </span>
                <button
                  onClick={copyGitCommands}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {copiedCommands ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Kopiraj ukaze</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-2.5 rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto select-all leading-relaxed">
                {gitCommands}
              </pre>
            </div>

            {/* Step 3: Download APK from Actions */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-xs text-slate-300">
              <span className="font-bold text-white block">
                3. korak: Prenos APK-ja iz GitHub Actions
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Takoj po prenosu na GitHub kliknite zavihek <strong>»Actions«</strong> v vašem repozitoriju. Videli boste opravilo <strong>»Zgradi Android APK«</strong>. Po 2 minutah se spodaj prikaže datoteka <strong>radio-slovenija-android-apk</strong> za neposreden prenos!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
