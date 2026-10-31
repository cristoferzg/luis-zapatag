import { precioBarraPerfil } from '../../lib/catalogoPrecios';
import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { PERFILES_CATALOGO } from './herreriaCatalog';

interface PerfilSelectorProps {
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
  categoryFilter?: string;
  title?: string;
}

export const HerreriaPerfilesSelector: React.FC<PerfilSelectorProps> = ({
  selectedProfileId,
  onSelectProfile,
  categoryFilter = '',
  title = 'Seleccionar Perfil'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProfiles = PERFILES_CATALOGO.filter(p => {
    const matchesCategory = !categoryFilter || p.categoria === categoryFilter;
    const matchesSearch = !searchTerm ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dimensiones.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedProfile = PERFILES_CATALOGO.find(p => p.id === selectedProfileId);

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-700 block">{title}</label>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
        >
          <span className="truncate text-left text-[11px]">
            {selectedProfile ? `${selectedProfile.dimensiones}` : 'Seleccionar...'}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl">
            <div className="p-2 border-b border-slate-200">
              <input
                type="text"
                placeholder="Buscar perfil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 p-2">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      onSelectProfile(profile.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                      selectedProfileId === profile.id
                        ? 'bg-blue-100 border border-blue-300 text-blue-900 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="font-mono font-bold text-[10px]">{profile.dimensiones}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5 line-clamp-2">{profile.nombre}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      Peso: {profile.pesoKgPorMetro.toFixed(2)} kg/m
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Sin resultados</p>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedProfile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-[10px] space-y-1">
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="text-blue-700 font-bold block">{selectedProfile.dimensiones}</span>
              <span className="text-blue-600 text-[9px]">{selectedProfile.nombre}</span>
            </div>
          </div>
          <div className="text-blue-700">
            <strong>Peso:</strong> {selectedProfile.pesoKgPorMetro.toFixed(2)} kg/m
          </div>
          <div className="text-blue-700 text-[9px]">
            <strong>Precio:</strong> S/ {precioBarraPerfil(selectedProfile, selectedProfile.precioPorBarra6m).toFixed(2)} (barra 6 m · Catálogo de precios)
          </div>
        </div>
      )}
    </div>
  );
};

interface PerfilesGrupalesEditorProps {
  titulo: string;
  perfiles: { id: string; nombre: string; perfilId: string }[];
  onUpdatePerfil: (id: string, perfilId: string) => void;
  onAddPerfil?: () => void;
  onDeletePerfil?: (id: string) => void;
}

export const HerreriaPerfilesGrupalesEditor: React.FC<PerfilesGrupalesEditorProps> = ({
  titulo,
  perfiles,
  onUpdatePerfil,
  onAddPerfil,
  onDeletePerfil
}) => {
  return (
    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-slate-700">{titulo}</h3>
        {onAddPerfil && (
          <button
            onClick={onAddPerfil}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors"
            title="Agregar nuevo perfil"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        )}
      </div>

      {perfiles.length > 0 ? (
        <div className="space-y-2">
          {perfiles.map((perf) => {
            const profileInfo = PERFILES_CATALOGO.find(p => p.id === perf.perfilId);
            return (
              <div key={perf.id} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 flex-1 truncate">{perf.nombre}</span>
                  {onDeletePerfil && (
                    <button
                      onClick={() => onDeletePerfil(perf.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Eliminar perfil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <HerreriaPerfilesSelector
                  selectedProfileId={perf.perfilId}
                  onSelectProfile={(newId) => onUpdatePerfil(perf.id, newId)}
                  title="Perfil"
                />

                {profileInfo && (
                  <div className="text-[9px] text-slate-600 italic">
                    {profileInfo.dimensiones} • {profileInfo.nombre}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-2 italic">Sin perfiles agregados</p>
      )}
    </div>
  );
};
