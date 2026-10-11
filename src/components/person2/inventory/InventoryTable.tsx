/**
 * @file components/person2/inventory/InventoryTable.tsx
 * Raw Material Inventory Table (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React from 'react';
import { RawMaterial } from '../../../types/person2/inventory';
import { btnEdit, btnSecondaryCompact } from '../../../lib/person2/ui-styles';

interface InventoryTableProps {
  materials: RawMaterial[];
  onReceiveStock: (material: RawMaterial) => void;
  onViewHistory: (material: RawMaterial) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  materials,
  onReceiveStock,
  onViewHistory,
}) => {
  if (materials.length === 0) {
    return (
      <div className="bg-white border border-slate-300 rounded p-8 text-center text-slate-500 text-xs">
        No inventory materials match the query.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold text-[11px] uppercase tracking-wide">
              <th className="py-2.5 px-3">Material ID</th>
              <th className="py-2.5 px-3">Material Name</th>
              <th className="py-2.5 px-3">Colour</th>
              <th className="py-2.5 px-3 text-right">Available Quantity</th>
              <th className="py-2.5 px-3 text-right">Minimum Stock</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {materials.map((mat) => {
              const isBelowMin = mat.availableQuantity <= mat.minimumStockLevel;
              const isOut = mat.availableQuantity <= 0;

              return (
                <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                    {mat.id}
                  </td>

                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {mat.name}
                  </td>

                  <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                    {mat.colour}
                  </td>

                  <td className="py-2.5 px-3 text-right font-medium whitespace-nowrap">
                    <span className={isOut ? 'text-red-700 font-bold' : isBelowMin ? 'text-amber-800 font-bold' : 'text-slate-900'}>
                      {mat.availableQuantity.toLocaleString()}
                    </span>{' '}
                    <span className="text-slate-500 text-[11px]">{mat.unit}</span>
                  </td>

                  <td className="py-2.5 px-3 text-right text-slate-700 font-mono text-[11px] whitespace-nowrap">
                    {mat.minimumStockLevel.toLocaleString()} {mat.unit}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {mat.status === 'Available' && (
                      <span className="text-slate-700 font-medium">Available</span>
                    )}
                    {mat.status === 'Low Stock' && (
                      <span className="text-amber-800 font-semibold">Low Stock</span>
                    )}
                    {mat.status === 'Out of Stock' && (
                      <span className="text-red-700 font-semibold">Out of Stock</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onReceiveStock(mat)}
                        className={btnEdit}
                      >
                        Receive
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewHistory(mat)}
                        className={btnSecondaryCompact}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
