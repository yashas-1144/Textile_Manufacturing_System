/**
 * @file components/person2/inventory/StockAlerts.tsx
 * Low Stock Warning Banner (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React from 'react';
import { RawMaterial } from '../../../types/person2/inventory';

interface StockAlertsProps {
  materials: RawMaterial[];
  onQuickRestock: (material: RawMaterial) => void;
}

export const StockAlerts: React.FC<StockAlertsProps> = ({
  materials,
  onQuickRestock,
}) => {
  const belowMinMaterials = materials.filter(
    (m) => m.availableQuantity <= m.minimumStockLevel
  );

  if (belowMinMaterials.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-300 rounded px-3 py-2 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-amber-950">Low Stock Warning:</span>
        <span className="text-amber-800">
          {belowMinMaterials
            .map(
              (m) =>
                `${m.name} (${m.availableQuantity.toLocaleString()} / ${m.minimumStockLevel.toLocaleString()} ${m.unit})`
            )
            .join('; ')}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onQuickRestock(belowMinMaterials[0])}
        className="px-2.5 py-1 text-xs font-medium text-amber-900 bg-white border border-amber-300 rounded hover:bg-amber-100/50 shrink-0 self-start sm:self-center transition-colors"
      >
        Receive Stock
      </button>
    </div>
  );
};
