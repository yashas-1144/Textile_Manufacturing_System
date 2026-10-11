/**
 * @file components/person2/orders/OrdersTable.tsx
 * Order Management Table (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React from 'react';
import { ProductionOrder, OrderStatus } from '../../../types/person2/orders';
import { FabricRollInspection } from '../../../types/person2/quality';
import { calculateOrderProgress, getAvailableOrderStatuses } from '../../../lib/person2/order-calculations';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  btnSecondaryCompact,
  btnEdit,
  btnDelete,
  getOrderStatusBadgeClass,
} from '../../../lib/person2/ui-styles';

interface OrdersTableProps {
  orders: ProductionOrder[];
  inspections?: FabricRollInspection[];
  onSelectOrder: (order: ProductionOrder) => void;
  onEditOrder: (order: ProductionOrder) => void;
  onDeleteOrder: (order: ProductionOrder) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  inspections = [],
  onSelectOrder,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
}) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white border border-slate-300 rounded p-8 text-center text-slate-500 text-xs">
        No orders found matching the filter criteria.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold text-[11px] uppercase tracking-wide">
              <th className="py-2.5 px-3">Order ID</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Fabric</th>
              <th className="py-2.5 px-3 text-right">Quantity</th>
              <th className="py-2.5 px-3">Produced</th>
              <th className="py-2.5 px-3">Deadline</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((order) => {
              const progress = calculateOrderProgress(order);

              return (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                    {order.id}
                  </td>

                  <td className="py-2.5 px-3 text-slate-900 font-medium truncate max-w-[180px]">
                    {order.clientName}
                  </td>

                  <td className="py-2.5 px-3 text-slate-800 truncate max-w-[220px]">
                    {order.fabricType} · {order.colour}
                  </td>

                  <td className="py-2.5 px-3 text-right font-medium text-slate-900 whitespace-nowrap">
                    {order.requiredQuantity.toLocaleString()} {order.unit === 'Meters' ? 'm' : order.unit}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 text-[11px] w-24">
                        {order.completedQuantity.toLocaleString()} / {order.requiredQuantity.toLocaleString()} m
                      </span>
                      <div className="w-16 h-1.5 bg-slate-200 rounded-sm overflow-hidden hidden sm:block">
                        <div
                          className={`h-full ${
                            progress === 100
                              ? 'bg-emerald-600'
                              : progress > 50
                              ? 'bg-blue-600'
                              : 'bg-amber-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 w-8 text-right font-mono">
                        {progress}%
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-mono text-[11px]">
                    {order.deadline}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {(() => {
                      const availableStatuses = getAvailableOrderStatuses(order, inspections);
                      // Ensure current status is at least present in the options
                      const hasCurrentStatus = availableStatuses.some((opt) => opt.status === order.status);
                      const displayOptions = hasCurrentStatus
                        ? availableStatuses
                        : [{ status: order.status, label: order.status }, ...availableStatuses];

                      const isRework = order.status === 'Rework Required';
                      const isRejected = order.status === 'Rejected';
                      const isCompleted = order.status === 'Completed';
                      const isQC = order.status === 'Quality Check';

                      const badgeClass = getOrderStatusBadgeClass(order.status);

                      return (
                        <div className="flex flex-col gap-1">
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                            className={`border text-[11px] font-semibold rounded-[6px] px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-2xs ${badgeClass}`}
                            title={`Status: ${order.status}`}
                          >
                            {displayOptions.map((opt) => (
                              <option key={opt.status} value={opt.status}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          {isRework && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-[5px] border border-amber-300 font-medium">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate max-w-[130px]">
                                Defect: {order.defectReason || 'Colour mismatch'}
                              </span>
                            </div>
                          )}

                          {isRejected && (
                            <div className="flex items-center gap-1 text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded-[5px] border border-red-200 font-medium">
                              <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                              <span className="truncate max-w-[130px]">
                                Defect: {order.defectReason || 'Rejected'}
                              </span>
                            </div>
                          )}

                          {isQC && (
                            <span className="text-[10px] text-purple-700 font-medium">
                              Awaiting inspection
                            </span>
                          )}

                          {isCompleted && (
                            <span className="text-[10px] text-emerald-700 font-medium">
                              QC Passed
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectOrder(order)}
                        className={btnSecondaryCompact}
                        title="View order details"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditOrder(order)}
                        className={btnEdit}
                        title="Edit order"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteOrder(order)}
                        className={btnDelete}
                        title="Delete order"
                      >
                        Delete
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
