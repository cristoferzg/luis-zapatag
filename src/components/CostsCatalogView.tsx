import React, { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Users, Truck } from 'lucide-react';

interface CostItem {
  id: string;
  name: string;
  unitCost: number;
  provider?: string;
  category: 'material' | 'labor' | 'operational';
}

export const CostsCatalogView: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [activeTab, setActiveTab] = useState<'material' | 'labor' | 'operational'>('material');
  const [newCost, setNewCost] = useState({ name: '', unitCost: 0, provider: '' });

  const loadCosts = () => {
    const saved = localStorage.getItem('innova_costs_catalog');
    if (saved) {
      try {
        setCosts(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando costos:', e);
      }
    }
  };

  useEffect(() => {
    if (isAdmin) loadCosts();
  }, [isAdmin]);

  const saveCosts = (updated: CostItem[]) => {
    localStorage.setItem('innova_costs_catalog', JSON.stringify(updated));
    setCosts(updated);
  };

  const addCost = () => {
    if (!newCost.name || newCost.unitCost <= 0) return;
    const item: CostItem = {
      id: Date.now().toString(),
      name: newCost.name,
      unitCost: newCost.unitCost,
      provider: newCost.provider,
      category: activeTab
    };
    saveCosts([...costs, item]);
    setNewCost({ name: '', unitCost: 0, provider: '' });
  };

  const deleteCost = (id: string) => {
    saveCosts(costs.filter(c => c.id !== id));
  };

  const filteredCosts = costs.filter(c => c.category === activeTab);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 p-3 sm:p-6 bg-slate-50">
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Catálogos de Costos</h3>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('material')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-bold whitespace-nowrap transition-all ${
              activeTab === 'material'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Materiales
          </button>
          <button
            onClick={() => setActiveTab('labor')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-bold whitespace-nowrap transition-all ${
              activeTab === 'labor'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Mano de Obra
          </button>
          <button
            onClick={() => setActiveTab('operational')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-bold whitespace-nowrap transition-all ${
              activeTab === 'operational'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            Gastos Operativos
          </button>
        </div>

        {/* FORM AGREGAR */}
        <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
            <input
              type="text"
              placeholder={activeTab === 'material' ? 'Acero, Concreto...' : activeTab === 'labor' ? 'Maestro, Soldador...' : 'Grúa, Transporte...'}
              value={newCost.name}
              onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            {activeTab === 'material' && (
              <input
                type="text"
                placeholder="Proveedor"
                value={newCost.provider}
                onChange={(e) => setNewCost({ ...newCost, provider: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            )}
            <input
              type="number"
              placeholder="Costo"
              value={newCost.unitCost || ''}
              onChange={(e) => setNewCost({ ...newCost, unitCost: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <button
              onClick={addCost}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* LISTA */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCosts.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-6">Sin elementos</p>
          ) : (
            filteredCosts.map(cost => (
              <div
                key={cost.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{cost.name}</p>
                  {cost.provider && <p className="text-xs text-slate-500">{cost.provider}</p>}
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className="font-bold text-slate-900 text-sm">S/ {cost.unitCost.toFixed(2)}</span>
                  <button
                    onClick={() => deleteCost(cost.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
