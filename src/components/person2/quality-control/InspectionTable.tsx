/**
 * @file components/person2/quality-control/InspectionTable.tsx
 * Fabric Roll Inspection Table (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React, { useState } from 'react';
import { FabricRollInspection, InspectionResult } from '../../../types/person2/quality';
import { ProductionOrder } from '../../../types/person2/orders';
import { isInspectionEligible, getInspectionIneligibilityReason } from '../../../lib/person2/quality-calculations';
import {
  btnSecondaryCompact,
  getQualityResultBadgeClass,
} from '../../../lib/person2/ui-styles';

interface InspectionTableProps {
  inspections: FabricRollInspection[];
  orders?: ProductionOrder[];
  onSelectRoll: (roll: FabricRollInspection) => void;
  onUpdateResult: (rollId: string, result: InspectionResult) => void;
}

export const InspectionTable: React.FC<InspectionTableProps> = ({
  inspections,
  orders = [],
  onSelectRoll,
  onUpdateResult,
}) => {
  const [filterView, setFilterView] = useState<'ALL' | 'VALID' | 'INELIGIBLE'>('ALL');

  if (inspections.length === 0) {
    return (
      <div className="bg-white border border-slate-300 rounded p-8 text-center text-slate-500 text-xs">
        No inspection records found.
      </div>
    );
  }

  const eligibleCount = inspections.filter((i) => isInspectionEligible(i, orders)).length;
  const ineligibleCount = inspections.length - eligibleCount;

  const displayedInspections = inspections.filter((roll) => {
    if (filterView === 'VALID') return isInspectionEligible(roll, orders);
    if (filterView === 'INELIGIBLE') return !isInspectionEligible(roll, orders);
    return true;
  });

  return (
    <div className="space-y-2">
      {/* View Filter Pill Bar & Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-slate-300 rounded p-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-slate-500 mr-1 text-[11px]">Filter:</span>
          <button
            type="button"
            onClick={() => setFilterView('ALL')}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              filterView === 'ALL'
                ? 'bg-blue-700 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Records ({inspections.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('VALID')}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              filterView === 'VALID'
                ? 'bg-blue-700 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Valid Inspections ({eligibleCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('INELIGIBLE')}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              filterView === 'INELIGIBLE'
                ? 'bg-amber-600 text-white font-medium'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Ineligible Historical ({ineligibleCount})
          </button>
        </div>

        {ineligibleCount > 0 && (
          <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            ⚠️ {ineligibleCount} records linked to orders with 0m produced fabric (excluded from pass rate)
          </span>
        )}
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold text-[11px] uppercase tracking-wide">
                <th className="py-2.5 px-3">Roll ID</th>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Fabric</th>
                <th className="py-2.5 px-3">Inspection Date</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Defect</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedInspections.map((roll) => {
                const isEligible = isInspectionEligible(roll, orders);
                const ineligibilityReason = getInspectionIneligibilityReason(roll, orders);
                const defectLabel =
                  roll.defectType === 'None (Flawless)' ? 'None' : roll.defectType;

                return (
                  <tr
                    key={roll.rollId}
                    className={`transition-colors ${
                      !isEligible ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {roll.rollId}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{roll.productionOrderId}</span>
                        {!isEligible && (
                          <span
                            className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded border border-amber-300"
                            title={ineligibilityReason}
                          >
                            Ineligible
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-800 truncate max-w-[200px]">
                      {roll.fabricType} · {roll.colour}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-700">
                      {roll.inspectionDate}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isEligible ? (
                        <select
                          value={roll.inspectionResult}
                          onChange={(e) =>
                            onUpdateResult(roll.rollId, e.target.value as InspectionResult)
                          }
                          className={`border text-[11px] font-semibold rounded-[6px] px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs transition-colors ${getQualityResultBadgeClass(
                            roll.inspectionResult
                          )}`}
                        >
                          <option value="Passed">Passed</option>
                          <option value="Rework Required">Rework Required</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      ) : (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 text-[11px] rounded-[6px] font-semibold border border-amber-300 cursor-not-allowed"
                          title="Production in progress. Inspection unavailable."
                        >
                          <span>Ineligible (0 m)</span>
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isEligible ? (
                        roll.inspectionResult === 'Passed' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {defectLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                            {defectLabel}
                          </span>
                        )
                      ) : (
                        <span
                          className="text-amber-800 text-[11px] font-medium italic"
                          title={ineligibilityReason}
                        >
                          Production in progress
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectRoll(roll)}
                        className={btnSecondaryCompact}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

