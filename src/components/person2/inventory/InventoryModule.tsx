/**
 * @file components/person2/inventory/InventoryModule.tsx
 * Inventory Management Module Root (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React, { useState, useMemo } from 'react';
import {
  RawMaterial,
  InventoryTransaction,
  MaterialCategory,
  StockHealthStatus,
} from '../../../types/person2/inventory';
import { ProductionOrder } from '../../../types/person2/orders';
import { StockAlerts } from './StockAlerts';
import { InventoryTable } from './InventoryTable';
import { InventoryForm } from './InventoryForm';
import { btnPrimary, btnSecondary } from '../../../lib/person2/ui-styles';

interface InventoryModuleProps {
  materials: RawMaterial[];
  transactions: InventoryTransaction[];
  orders: ProductionOrder[];
  onUpdateMaterials: (updatedMaterials: RawMaterial[]) => void;
  onAddTransaction: (newTx: InventoryTransaction) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  materials,
  transactions,
  orders,
  onUpdateMaterials,
  onAddTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | 'ALL'>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockHealthStatus | 'ALL'>('ALL');

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [targetMaterialForRestock, setTargetMaterialForRestock] = useState<RawMaterial | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedMaterialHistory, setSelectedMaterialHistory] = useState<RawMaterial | null>(null);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.colour.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      const matchesStatus = stockStatusFilter === 'ALL' || m.status === stockStatusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [materials, searchQuery, categoryFilter, stockStatusFilter]);

  const handleReceiveComplete = (
    updatedMat: RawMaterial,
    newTxn: InventoryTransaction
  ) => {
    const updated = materials.map((m) => (m.id === updatedMat.id ? updatedMat : m));
    onUpdateMaterials(updated);
    onAddTransaction(newTxn);
  };

  const handleQuickRestock = (mat: RawMaterial) => {
    setTargetMaterialForRestock(mat);
    setIsReceiveModalOpen(true);
  };

  const handleViewHistory = (mat: RawMaterial) => {
    setSelectedMaterialHistory(mat);
    setIsHistoryDrawerOpen(true);
  };

  const activeTransactions = useMemo(() => {
    if (selectedMaterialHistory) {
      return transactions.filter((t) => t.materialId === selectedMaterialHistory.id);
    }
    return transactions;
  }, [transactions, selectedMaterialHistory]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-300">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-xs text-slate-500">
            Raw materials, yarn stocks, dye chemicals, and minimum stock buffers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedMaterialHistory(null);
              setIsHistoryDrawerOpen(true);
            }}
            className={btnSecondary}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetMaterialForRestock(null);
              setIsReceiveModalOpen(true);
            }}
            className={btnPrimary}
          >
            Receive Stock
          </button>
        </div>
      </div>

      {/* Warning Banner (only shown if stock below minimum) */}
      <StockAlerts
        materials={materials}
        onQuickRestock={handleQuickRestock}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-300 rounded p-2.5 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between text-xs">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-xs">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as MaterialCategory | 'ALL')}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Categories</option>
              <option value="Raw Fiber">Raw Fiber</option>
              <option value="Yarn">Yarn</option>
              <option value="Dyestuff">Dyestuff</option>
              <option value="Finishing Chemical">Finishing Chemical</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-xs">Status:</span>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as StockHealthStatus | 'ALL')}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clean Inventory Table */}
      <InventoryTable
        materials={filteredMaterials}
        onReceiveStock={handleQuickRestock}
        onViewHistory={handleViewHistory}
      />

      {/* Receive Stock Modal Form */}
      <InventoryForm
        isOpen={isReceiveModalOpen}
        onClose={() => {
          setIsReceiveModalOpen(false);
          setTargetMaterialForRestock(null);
        }}
        targetMaterial={targetMaterialForRestock}
        materials={materials}
        onReceiveComplete={handleReceiveComplete}
      />

      {/* Transaction History Modal */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-300 shadow-lg w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-xs">
            <div className="px-5 py-3 border-b border-slate-300 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedMaterialHistory
                    ? `Inventory History: ${selectedMaterialHistory.name} (${selectedMaterialHistory.id})`
                    : 'Inventory Transaction History'}
                </h3>
                <p className="text-[11px] text-slate-500">Record of goods received and issued to production</p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="text-slate-500 hover:text-slate-800 text-sm font-semibold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-3 overflow-y-auto divide-y divide-slate-200">
              {activeTransactions.length === 0 ? (
                <p className="text-center text-slate-500 py-6">No transaction logs recorded.</p>
              ) : (
                activeTransactions.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{tx.materialName}</span>
                        <span className="text-[11px] text-slate-500">({tx.type})</span>
                        {tx.referenceId && (
                          <span className="font-mono text-slate-500 text-[10px]">Ref: {tx.referenceId}</span>
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{tx.notes}</p>
                      <div className="text-[10px] text-slate-400 mt-0.5">{tx.timestamp} · {tx.performedBy}</div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className={`font-mono font-medium ${tx.type === 'Received' ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {tx.type === 'Received' ? '+' : '-'}{Math.abs(tx.quantity).toLocaleString()} {tx.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-slate-300 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className={btnSecondary}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
