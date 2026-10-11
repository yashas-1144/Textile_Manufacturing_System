/**
 * @file components/person2/inventory/InventoryForm.tsx
 * Receive Stock Form (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React, { useState, useEffect } from 'react';
import { RawMaterial, InventoryTransaction } from '../../../types/person2/inventory';
import { determineStockStatus } from '../../../lib/person2/inventory-calculations';
import { btnPrimary, btnSecondary } from '../../../lib/person2/ui-styles';

interface InventoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  targetMaterial?: RawMaterial | null;
  materials: RawMaterial[];
  onReceiveComplete: (updatedMaterial: RawMaterial, transaction: InventoryTransaction) => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
  isOpen,
  onClose,
  targetMaterial,
  materials,
  onReceiveComplete,
}) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(500);
  const [date, setDate] = useState<string>('2026-10-10');
  const [referenceNotes, setReferenceNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (targetMaterial) {
      setSelectedMaterialId(targetMaterial.id);
    } else if (materials.length > 0) {
      setSelectedMaterialId(materials[0].id);
    }
    setDate(new Date().toISOString().split('T')[0]);
  }, [targetMaterial, materials]);

  if (!isOpen) return null;

  const currentMat = materials.find((m) => m.id === selectedMaterialId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMat) {
      setError('Please select a material.');
      return;
    }
    if (!quantity || quantity <= 0) {
      setError('Quantity received must be greater than zero.');
      return;
    }

    const newAvailable = currentMat.availableQuantity + Number(quantity);
    const newStatus = determineStockStatus(newAvailable, currentMat.minimumStockLevel);

    const updatedMaterial: RawMaterial = {
      ...currentMat,
      availableQuantity: newAvailable,
      status: newStatus,
      lastRestockedDate: date,
    };

    const newTransaction: InventoryTransaction = {
      id: `TXN-${Math.floor(910 + Math.random() * 80)}`,
      materialId: currentMat.id,
      materialName: currentMat.name,
      type: 'Received',
      quantity: Number(quantity),
      unit: currentMat.unit,
      referenceId: referenceNotes.trim() ? referenceNotes.trim().split(' ')[0] : 'GRN-REC',
      timestamp: `${date} 09:00`,
      performedBy: 'Factory Warehouse Store',
      notes: referenceNotes.trim() || 'Received into factory storage',
    };

    onReceiveComplete(updatedMaterial, newTransaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded border border-slate-300 shadow-lg w-full max-w-md flex flex-col overflow-hidden text-xs">
        <div className="px-5 py-3 border-b border-slate-300 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Receive Stock</h2>
            <p className="text-[11px] text-slate-500">Record incoming raw material shipment</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-sm font-semibold px-2 py-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Material *</label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.name} ({m.availableQuantity.toLocaleString()} {m.unit} on hand)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Quantity Received *</label>
            <div className="flex">
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-l px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
              />
              <span className="bg-slate-100 border border-l-0 border-slate-300 px-3 py-1.5 text-slate-600 rounded-r font-medium text-[11px]">
                {currentMat?.unit || 'kg'}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reference or Notes</label>
            <input
              type="text"
              value={referenceNotes}
              onChange={(e) => setReferenceNotes(e.target.value)}
              placeholder="e.g. PO-8821, Supplier invoice, Batch lot #"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-300 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={btnPrimary}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
