import React from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Video, Image, FileCode2 } from 'lucide-react';

export interface UploadProgressBarProps {
  progress: number; // 0 to 100
  fileName?: string;
  fileSizeBytes?: number;
  bytesTransferred?: number;
  statusMessage?: string;
  isComplete?: boolean;
  isError?: boolean;
  errorMessage?: string;
  type?: 'video' | 'image' | 'document' | 'cad' | 'file';
  onCancel?: () => void;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  progress,
  fileName,
  fileSizeBytes,
  bytesTransferred,
  statusMessage,
  isComplete = false,
  isError = false,
  errorMessage,
  type = 'file',
  onCancel
}) => {
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      const kb = bytes / 1024;
      return `${kb.toFixed(1)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const getIcon = () => {
    if (isError) return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
    if (isComplete || progress >= 100) return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
    
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" />;
      case 'image':
        return <Image className="w-5 h-5 text-blue-600 shrink-0 animate-pulse" />;
      case 'document':
        return <FileText className="w-5 h-5 text-purple-600 shrink-0 animate-pulse" />;
      case 'cad':
        return <FileCode2 className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />;
      default:
        return <UploadCloud className="w-5 h-5 text-blue-600 shrink-0 animate-bounce" />;
    }
  };

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2.5 transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl shrink-0 ${
            isError 
              ? 'bg-rose-50 border border-rose-100' 
              : isComplete || clampedProgress >= 100
              ? 'bg-emerald-50 border border-emerald-100'
              : 'bg-white border border-slate-200 shadow-2xs'
          }`}>
            {getIcon()}
          </div>
          <div className="min-w-0">
            {fileName && (
              <p className="text-xs font-black text-slate-800 truncate" title={fileName}>
                {fileName}
              </p>
            )}
            <p className="text-[11px] font-medium text-slate-500 truncate">
              {isError ? (
                <span className="text-rose-600 font-bold">{errorMessage || 'Error al procesar subida'}</span>
              ) : isComplete || clampedProgress >= 100 ? (
                <span className="text-emerald-700 font-bold">¡Subida completada con éxito!</span>
              ) : (
                statusMessage || 'Subiendo a la nube de alta velocidad...'
              )}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
            isError
              ? 'bg-rose-100 text-rose-700'
              : isComplete || clampedProgress >= 100
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isError ? 'ERROR' : `${clampedProgress}%`}
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden relative shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out relative ${
            isError
              ? 'bg-rose-600'
              : isComplete || clampedProgress >= 100
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500'
          }`}
          style={{ width: `${isError ? 100 : clampedProgress}%` }}
        >
          {!isError && clampedProgress < 100 && (
            <div className="absolute inset-0 bg-white/25 animate-[shimmer_1.5s_infinite] -translate-x-full" />
          )}
        </div>
      </div>

      {/* Bytes & Size status row */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>
          {bytesTransferred !== undefined && fileSizeBytes
            ? `${formatBytes(bytesTransferred)} de ${formatBytes(fileSizeBytes)}`
            : fileSizeBytes
            ? `Tamaño: ${formatBytes(fileSizeBytes)}`
            : ''}
        </span>
        {onCancel && !isComplete && !isError && clampedProgress < 100 && (
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-rose-600 transition-colors font-sans font-bold cursor-pointer"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadProgressBar;
