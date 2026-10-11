/**
 * @file components/person2/factory-operations/ProductionTrackingTable.tsx
 * Production Tracking Table (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React from 'react';
import { ProductionOrder } from '../../../types/person2/orders';
import { Machine } from '../../../types/person2/production';
import {
  calculateRemainingQuantity,
  getOrderStageQuantities,
} from '../../../lib/person2/production-calculations';
import { btnEdit } from '../../../lib/person2/ui-styles';

interface ProductionTrackingTableProps {
  orders: ProductionOrder[];
  machines: Machine[];
  onOpenUpdateProduction: (order: ProductionOrder, machineId?: string) => void;
}

export const ProductionTrackingTable: React.FC<ProductionTrackingTableProps> = ({
  orders,
  machines,
  onOpenUpdateProduction,
}) => {
  // Active production orders
  const activeOrders = orders.filter(
    (o) =>
      o.status === 'In Production' ||
      o.status === 'Ready' ||
      o.status === 'Material Check' ||
      o.status === 'Quality Check'
  );

  return (
    <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 flex items-center justify-between">
        <span>
          <strong className="text-slate-900 font-semibold">Stage-Wise Pipeline:</strong>{' '}
          1. Spinning → 2. Weaving → 3. Dyeing → Finished Fabric.
        </span>
        <span className="text-slate-500 font-mono">
          *Finished Fabric = Final Dyeing Output (Non-additive)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold text-[11px] uppercase tracking-wide">
              <th className="py-2.5 px-3">Order ID</th>
              <th className="py-2.5 px-3">Customer & Fabric</th>
              <th className="py-2.5 px-3 text-right">Target</th>
              <th className="py-2.5 px-3 text-right text-slate-800">1. Spinning</th>
              <th className="py-2.5 px-3 text-right text-slate-800">2. Weaving</th>
              <th className="py-2.5 px-3 text-right text-slate-800">3. Dyeing</th>
              <th className="py-2.5 px-3 text-right text-blue-900 bg-blue-50/50">Finished Fabric</th>
              <th className="py-2.5 px-3 text-right">Remaining</th>
              <th className="py-2.5 px-3 text-center">Progress</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {activeOrders.map((order) => {
              const stages = getOrderStageQuantities(order);
              const remaining = calculateRemainingQuantity(
                order.requiredQuantity,
                stages.finishedQuantity
              );

              // Primary assigned machine
              const primaryMachineId = order.assignedMachines[0] || 'M001';

              return (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                    <div>{order.id}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-sans">
                        {order.currentStage}
                      </span>
                      {order.status === 'Rework Required' && (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9px] font-sans font-semibold">
                          Rework
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-slate-800 max-w-[200px]">
                    <div className="font-medium truncate text-slate-900">{order.clientName}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {order.fabricType} · {order.colour}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 whitespace-nowrap font-medium">
                    {order.requiredQuantity.toLocaleString()} m
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {stages.spinningQuantity.toLocaleString()} m
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {stages.weavingQuantity.toLocaleString()} m
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {stages.dyeingQuantity.toLocaleString()} m
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900 bg-blue-50/40 whitespace-nowrap">
                    {stages.finishedQuantity.toLocaleString()} m
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                    {remaining.toLocaleString()} m
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-slate-200 rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${
                            stages.progressPercentage === 100
                              ? 'bg-emerald-600'
                              : stages.progressPercentage > 50
                              ? 'bg-blue-600'
                              : 'bg-amber-600'
                          }`}
                          style={{ width: `${stages.progressPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-medium text-slate-700">
                        {stages.progressPercentage}%
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenUpdateProduction(order, primaryMachineId)}
                      className={btnEdit}
                    >
                      Update
                    </button>
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

