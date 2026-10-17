import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Apple, 
  Monitor, 
  Share, 
  PlusSquare, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Sparkles,
  Layers
} from 'lucide-react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import { safeStorage } from '../../lib/storageManager';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose, isAdmin = false }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, install } = usePWAInstall();
  
  // Default tab based on current device
  const defaultTab = isIOS ? 'ios' : isAndroid ? 'android' : 'pc';
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc'>(defaultTab);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [installing, setInstalling] = useState(false);

  const [exeUrl, setExeUrl] = useState(() => safeStorage.getItem('innova_exe_url', ''));
  const [inputExeUrl, setInputExeUrl] = useState(exeUrl);
  const [savedExeSuccess, setSavedExeSuccess] = useState(false);

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentAppUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleSaveExeUrl = (e: React.FormEvent) => {
    e.preventDefault();
    safeStorage.setItem('innova_exe_url', inputExeUrl.trim());
    setExeUrl(inputExeUrl.trim());
    setSavedExeSuccess(true);
    setTimeout(() => setSavedExeSuccess(false), 2500);
  };

  const handleTriggerInstall = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <img src="/icon.svg" alt="Innova Logo" className="w-full h-full rounded-[10px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Instalar Innova Contratistas</h3>
                {isInstalled && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Instalada
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Disponible para Android, iPhone/iPad (iOS) y PC / Windows (.exe)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'android'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Android (APK / PWA)</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ios'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="w-4 h-4 text-slate-200" />
            <span>iPhone / iPad (iOS)</span>
          </button>

          <button
            onClick={() => setActiveTab('pc')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pc'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>PC Windows / .exe</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          
          {/* TAB: ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Instalación Nativa en Android</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      La app se guardará en tu pantalla de inicio y en el cajón de aplicaciones de tu móvil, funcionando sin barras de navegador.
                    </p>
                  </div>
                </div>

                {isInstallable ? (
                  <button
                    onClick={handleTriggerInstall}
                    disabled={installing}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    {installing ? 'Instalando...' : 'Instalar en este Android'}
                  </button>
                ) : isInstalled ? (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    ✓ Ya está instalada
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg">
                    Sigue los pasos abajo
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pasos para instalar en Android (Google Chrome):</h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">1</span>
                      Abre en Chrome
                    </div>
                    <p className="text-xs text-slate-400">
                      Abre este enlace desde Google Chrome en tu teléfono Android.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">2</span>
                      Menú de Opciones
                    </div>
                    <p className="text-xs text-slate-400">
                      Toca los tres puntos verticales <strong className="text-white">⋮</strong> en la esquina superior derecha del navegador.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">3</span>
                      Instalar Aplicación
                    </div>
                    <p className="text-xs text-slate-400">
                      Selecciona <strong className="text-white">"Instalar aplicación"</strong> o <strong className="text-white">"Agregar a la pantalla principal"</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <strong className="text-white block">¿Quieres compartir el enlace para instalar en otro Android?</strong>
                  Copia el enlace directo de la aplicación para enviarlo por WhatsApp.
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedUrl ? 'Enlace Copiado' : 'Copiar Enlace'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: IOS (IPHONE / IPAD) */}
          {activeTab === 'ios' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Instalación en iPhone y iPad (Apple Safari)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Apple requiere instalar a través del navegador <strong>Safari</strong> mediante la opción "Agregar a inicio". La aplicación se ejecutará a pantalla completa sin la barra de Safari.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Guía paso a paso para iOS Safari:</h5>
                
                <div className="space-y-2.5">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                    <div className="text-xs">
                      <strong className="text-white block font-medium">Abre en Safari de Apple</strong>
                      Asegúrate de estar navegando desde <strong>Safari</strong> (no desde Chrome ni desde navegadores internos de redes sociales).
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                    <div className="text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        Toca el botón <strong>Compartir</strong> <Share className="w-3.5 h-3.5 text-blue-400 inline" />
                      </div>
                      En la barra inferior de Safari en iPhone (o superior en iPad), presiona el ícono del cuadrado con la flecha hacia arriba.
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                    <div className="text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        Selecciona <strong>"Agregar a pantalla de inicio"</strong> <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" />
                      </div>
                      Desplaza la lista de opciones hacia abajo hasta encontrar el ícono del signo más con el recuadro.
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">4</div>
                    <div className="text-xs">
                      <strong className="text-white block font-medium">Presiona "Agregar"</strong>
                      En la esquina superior derecha de la pantalla, pulsa <strong>Agregar</strong>. ¡Listo! El icono de Innova se creará en tu pantalla de inicio junto a tus demás apps.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PC WINDOWS / .EXE */}
          {activeTab === 'pc' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Opcion 1: PWA Desktop */}
              <div className="bg-gradient-to-r from-blue-600/15 to-indigo-600/15 border border-blue-500/30 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white text-sm">Instalación en Windows (PC)</h4>
                        <span className="text-[10px] uppercase font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">Rápido</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Instala la aplicación en tu computadora con acceso directo en el Escritorio.
                      </p>
                    </div>
                  </div>

                  {isInstallable && isDesktop ? (
                    <button
                      onClick={handleTriggerInstall}
                      disabled={installing}
                      className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      {installing ? 'Instalando...' : 'Instalar en esta PC'}
                    </button>
                  ) : (
                    <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
                      Desde Chrome o Edge en tu PC
                    </div>
                  )}
                </div>

                <div className="bg-slate-950/80 rounded-lg p-3 text-xs text-slate-400 border border-slate-800/80">
                  <strong className="text-slate-200">¿Cómo hacerlo desde tu navegador en PC?</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                    <li>En <strong className="text-white">Google Chrome</strong> o <strong className="text-white">Microsoft Edge</strong>: haz clic en el icono de instalación en la barra de direcciones o en los 3 puntos <strong className="text-white">⋮</strong> &gt; <strong className="text-white">"Instalar Innova Contratistas"</strong>.</li>
                  </ul>
                </div>
              </div>

              {/* Descarga de Instalador .exe (Visible para usuarios y administradores) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">Descargar Archivo Ejecutable `.exe` de Windows</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Descarga el instalador directo para ejecutar la plataforma como aplicación de escritorio independiente.
                    </p>
                  </div>
                </div>

                {exeUrl ? (
                  <div className="pt-2">
                    <a
                      href={exeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Innova Contratistas Setup (.exe)
                      <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                    </a>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400 space-y-2">
                    <p className="text-slate-300">
                      ⚠️ El administrador aún no ha publicado el enlace del archivo ejecutable `.exe`. Puedes utilizar la instalación directa desde el navegador haciendo clic en "Instalar en esta PC".
                    </p>
                    {isAdmin && (
                      <p className="text-emerald-400 font-medium">
                        💡 Como administrador, puedes configurar el enlace del `.exe` abajo en el panel de control.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ADMIN PANEL FOR .EXE & BUILDER TOOLS (ONLY WHEN isAdmin IS TRUE) */}
              {isAdmin && (
                <div className="bg-indigo-950/30 border border-indigo-500/40 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider">Panel de Administración: Enlace e Instalador .exe</h4>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">Solo Admin</span>
                  </div>

                  <form onSubmit={handleSaveExeUrl} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        URL de descarga directa del `.exe` (Google Drive, OneDrive, GitHub, etc.):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={inputExeUrl}
                          onChange={e => setInputExeUrl(e.target.value)}
                          placeholder="https://ejemplo.com/InnovaContratistas-Setup.exe"
                          className="flex-1 bg-slate-900 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                        >
                          Guardar Enlace
                        </button>
                      </div>
                      {savedExeSuccess && (
                        <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3" /> ¡Enlace del .exe guardado correctamente para todos los usuarios!
                        </p>
                      )}
                    </div>
                  </form>

                  {/* Nativefier / PWABuilder builder guide for Admin */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3 mt-2">
                    <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" /> Herramientas de Compilación (Admin)
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Puedes compilar tu archivo <code className="text-purple-300 font-mono text-[10px]">Innova.exe</code> usando Nativefier:
                    </p>
                    <div className="bg-slate-900 p-2 rounded text-[10px] font-mono text-slate-300 border border-slate-800 break-all select-all">
                      npx nativefier --name "Innova" --icon "public/pwa-512x512.png" "{currentAppUrl || 'https://...'}"
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href="https://www.pwabuilder.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Abrir PWABuilder <ExternalLink className="w-3 h-3" />
                      </a>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{currentAppUrl}</span>
                        <button
                          type="button"
                          onClick={handleCopyUrl}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                        >
                          {copiedUrl ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                          {copiedUrl ? 'Copiado' : 'Copiar URL'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Benefits summary */}
          <div className="border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Sin App Store:</strong> Se instala al instante sin descargas pesadas ni registros.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Pantalla Completa:</strong> Experiencia 100% nativa sin barras de navegación.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Auto-actualizable:</strong> Siempre tendrás la última versión de tus presupuestos y diseños.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Innova Contratistas PWA Engine v2.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
