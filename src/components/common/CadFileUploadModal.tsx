import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Download, 
  Sparkles, 
  Layers,
  Loader2
} from 'lucide-react';
import { parseDxfContent, DxfParsedModel } from '../../lib/dxfParser';

export interface CadImportResult {
  fileName: string;
  fileType: 'dxf' | 'json';
  dxfModel?: DxfParsedModel;
  jsonData?: any;
  customScale: number; // Factor to multiply coordinates to get meters
  layerFilter?: string[];
}

interface CadFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: 'techos' | 'herreria';
  onImportDxf: (result: CadImportResult) => void;
  onImportJson?: (jsonData: any, fileName: string) => void;
  onExportDxf?: () => void;
}

export const CadFileUploadModal: React.FC<CadFileUploadModalProps> = ({
  isOpen,
  onClose,
  moduleName,
  onImportDxf,
  onImportJson,
  onExportDxf
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedDxf, setParsedDxf] = useState<DxfParsedModel | null>(null);
  const [parsedJson, setParsedJson] = useState<any | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [scaleOverride, setScaleOverride] = useState<'auto' | 'm' | 'cm' | 'mm'>('auto');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setFileError(null);
    setSelectedFile(file);
    setIsProcessing(true);

    const ext = file.name.split('.').pop()?.toLowerCase();

    // En Android, un archivo elegido desde WhatsApp, Drive o la galería a veces
    // no se deja leer con FileReader: se prueban varias formas antes de fallar.
    const leerTexto = async (): Promise<string> => {
      try { if (typeof file.text === 'function') return await file.text(); } catch { /* siguiente forma */ }
      try { if (typeof file.arrayBuffer === 'function') return new TextDecoder('utf-8').decode(await file.arrayBuffer()); } catch { /* siguiente forma */ }
      return await new Promise<string>((ok, mal) => {
        const reader = new FileReader();
        reader.onload = () => ok(String(reader.result ?? ''));
        reader.onerror = () => mal(reader.error);
        reader.readAsText(file);
      });
    };

    leerTexto().then(texto => {
      const content = texto.replace(/^\uFEFF/, '');
      try {
        if (!content.trim()) throw new Error('el archivo llegó vacío. Descárgalo completo al teléfono y vuelve a elegirlo.');
        if (ext === 'dxf') {
          const parsed = parseDxfContent(content);
          if (parsed.entities.length === 0) {
            setFileError('El archivo DXF no contiene entidades vectoriales reconocibles (LINE, POLYLINE, ARC). Asegúrate de exportarlo como AutoCAD DXF.');
            setParsedDxf(null);
          } else {
            setParsedDxf(parsed);
            setParsedJson(null);
          }
        } else if (ext === 'json') {
          const json = JSON.parse(content);
          setParsedJson(json);
          setParsedDxf(null);
        } else {
          // Intentar parsear como DXF o JSON según el contenido
          if (content.trim().startsWith('{')) {
            const json = JSON.parse(content);
            setParsedJson(json);
            setParsedDxf(null);
          } else {
            const parsed = parseDxfContent(content);
            if (parsed.entities.length > 0) {
              setParsedDxf(parsed);
              setParsedJson(null);
            } else {
              setFileError('Formato no reconocido. Sube un archivo .dxf (AutoCAD) o .json (Proyecto CAD).');
            }
          }
        }
      } catch (err: any) {
        setFileError('Error al leer el archivo: ' + (err.message || 'Contenido inválido'));
      } finally {
        setIsProcessing(false);
      }
    }).catch(() => {
      setFileError('No se pudo abrir el archivo en este teléfono. Si lo recibiste por WhatsApp o Drive, primero descárgalo (queda en "Descargas") y vuelve a elegirlo desde Archivos › Descargas.');
      setIsProcessing(false);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyImport = () => {
    if (!selectedFile) return;

    if (parsedDxf) {
      let finalScale = parsedDxf.unitScaleToMeters;
      if (scaleOverride === 'm') finalScale = 1.0;
      else if (scaleOverride === 'cm') finalScale = 0.01;
      else if (scaleOverride === 'mm') finalScale = 0.001;

      onImportDxf({
        fileName: selectedFile.name,
        fileType: 'dxf',
        dxfModel: parsedDxf,
        customScale: finalScale
      });
      onClose();
    } else if (parsedJson) {
      if (onImportJson) {
        onImportJson(parsedJson, selectedFile.name);
      }
      onClose();
    }
  };

  const totalLines = parsedDxf ? parsedDxf.entities.filter(e => e.type === 'LINE' || e.type === 'LWPOLYLINE' || e.type === 'POLYLINE').length : 0;
  const totalArcs = parsedDxf ? parsedDxf.entities.filter(e => e.type === 'ARC' || e.type === 'CIRCLE').length : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl text-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* CABECERA */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Importar / Subir Archivo AutoCAD & CAD
              </h3>
              <p className="text-xs text-slate-500">
                Compatible con archivos <strong>.DXF (AutoCAD)</strong> y <strong>.JSON</strong> para {moduleName === 'techos' ? 'Techos Metálicos' : 'Carpintería Metálica'}.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6 overflow-y-auto space-y-5">

          {/* DROPZONE DE CARGA */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-amber-500 bg-amber-50/60 scale-[0.99]' 
                : selectedFile 
                  ? 'border-emerald-500/60 bg-emerald-50/30' 
                  : 'border-slate-300 hover:border-amber-500 hover:bg-slate-50/80 bg-slate-50/40'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".dxf,.json,.txt,application/json,application/dxf,image/vnd.dxf,text/plain,application/octet-stream"
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto text-amber-600 mb-3">
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              ) : (
                <UploadCloud className="w-6 h-6 animate-bounce" />
              )}
            </div>

            <div className="font-extrabold text-sm text-slate-800">
              {selectedFile ? selectedFile.name : 'Arrastra tu archivo AutoCAD (.DXF) o Proyecto (.JSON) aquí'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              o haz clic para explorar en tu computadora o teléfono
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[11px] font-bold">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                📐 AutoCAD .DXF (R12 - 2024)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                📁 Proyecto .JSON
              </span>
            </div>
          </div>

          {/* ERROR */}
          {fileError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No se pudo procesar el archivo:</p>
                <p className="mt-0.5">{fileError}</p>
              </div>
            </div>
          )}

          {/* RESUMEN DE ELEMENTOS DETECTADOS EN DXF */}
          {parsedDxf && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Geometría AutoCAD Detectada ({parsedDxf.entities.length} entidades)
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  {parsedDxf.layers.length} capas / layers
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Líneas / Trazos</span>
                  <span className="text-base font-black text-slate-900">{totalLines}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Arcos / Curvas</span>
                  <span className="text-base font-black text-amber-600">{totalArcs}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Ancho (X)</span>
                  <span className="text-base font-black text-slate-900">{parsedDxf.bounds.width.toFixed(1)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Alto (Y/Z)</span>
                  <span className="text-base font-black text-slate-900">{parsedDxf.bounds.height.toFixed(1)}</span>
                </div>
              </div>

              {/* SELECTOR DE ESCALA DE UNIDADES */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Unidad de Dibujo del Plano:</span>
                  <span className="text-[11px] text-slate-500">
                    Auto-detectado: <strong>{parsedDxf.detectedUnit === 'mm' ? 'Milímetros (mm)' : parsedDxf.detectedUnit === 'cm' ? 'Centímetros (cm)' : 'Metros (m)'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 font-bold text-xs">
                  <button
                    type="button"
                    onClick={() => setScaleOverride('auto')}
                    className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${scaleOverride === 'auto' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setScaleOverride('m')}
                    className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${scaleOverride === 'm' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Metros
                  </button>
                  <button
                    type="button"
                    onClick={() => setScaleOverride('mm')}
                    className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${scaleOverride === 'mm' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Milímetros
                  </button>
                </div>
              </div>

              {/* LISTA DE CAPAS / LAYERS */}
              {parsedDxf.layers.length > 0 && (
                <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Capas:
                  </span>
                  {parsedDxf.layers.slice(0, 6).map((l, idx) => (
                    <span key={idx} className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                      {l}
                    </span>
                  ))}
                  {parsedDxf.layers.length > 6 && (
                    <span className="text-slate-400 text-[10px]">+{parsedDxf.layers.length - 6} más</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RESUMEN DE PROYECTO JSON */}
          {parsedJson && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs">
              <span className="font-black uppercase text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Archivo de Proyecto CAD Válido
              </span>
              <p className="text-slate-600 font-medium">
                Nombre: <strong>{parsedJson.nombre || 'Diseño CAD'}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Se cargarán automáticamente todas las barras, nodos, despieces y cotizaciones asociadas.
              </p>
            </div>
          )}

          {/* GUÍA RÁPIDA AUTOCAD */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-xs space-y-1.5 text-amber-900">
            <span className="font-bold flex items-center gap-1.5 text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              ¿Cómo guardar desde AutoCAD para subir aquí?
            </span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              1. En AutoCAD, escribe en la consola el comando <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono font-bold text-amber-800">DXFOUT</code> o ve a <strong>Archivo &gt; Guardar Como</strong> y selecciona <strong>AutoCAD R12/2018 DXF (*.dxf)</strong>.<br />
              2. Sube el archivo aquí y podrás editarlo, mover nodos, calcular el despiece de perfiles y cotizar en Soles al instante.
            </p>
          </div>
        </div>

        {/* BOTONES INFERIORES */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {onExportDxf && (
            <button
              type="button"
              onClick={onExportDxf}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Descargar diseño actual como archivo .DXF de AutoCAD"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Exportar a AutoCAD (.DXF)</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!parsedDxf && !parsedJson}
              onClick={handleApplyImport}
              className={`px-5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                parsedDxf || parsedJson
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Cargar y Editar en Lienzo CAD</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CadFileUploadModal;
