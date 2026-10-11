/**
 * @file components/person2/factory-operations/MachineDetails.tsx
 * Machine Details View (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React from 'react';
import {
  Machine,
  MachineStatus,
  ProductionLogEntry,
  MachineDowntimeEvent,
} from '../../../types/person2/production';
import { ProductionOrder } from '../../../types/person2/orders';
import { calculateRemainingQuantity } from '../../../lib/person2/production-calculations';
import { btnSecondary } from '../../../lib/person2/ui-styles';

interface MachineDetailsProps {
  machine: Machine | null;
  onClose: () => void;
  orders: ProductionOrder[];
  logs: ProductionLogEntry[];
  downtimes: MachineDowntimeEvent[];
  onUpdateStatus: (machineId: string, status: MachineStatus) => void;
  onAssignOrder: (machineId: string, orderId?: string) => void;
}

export const MachineDetails: React.FC<MachineDetailsProps> = ({
  machine,
  onClose,
  orders,
  logs,
  downtimes,
  onUpdateStatus,
  onAssignOrder,
}) => {
  if (!machine) return null;

  const assignedOrder = machine.currentOrderId
    ? orders.find((o) => o.id === machine.currentOrderId)
    : null;

  const remaining = assignedOrder
    ? calculateRemainingQuantity(assignedOrder.requiredQuantity, assignedOrder.completedQuantity)
    : 0;

  const machineLogs = logs.filter((l) => l.machineId === machine.id);
  const machineDowntimes = downtimes.filter((d) => d.machineId === machine.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded border border-slate-300 shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-xs text-slate-800">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-300 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">{machine.id}</span>
              <span className="text-slate-400">·</span>
              <span className="font-medium text-slate-800">{machine.name}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {machine.section} · Process: <strong>{machine.process}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-sm font-semibold px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto space-y-4">
          {/* Controls */}
          <div className="bg-slate-50 border border-slate-300 rounded p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Status:</span>
              <select
                value={machine.status}
                onChange={(e) => onUpdateStatus(machine.id, e.target.value as MachineStatus)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
              >
                <option value="Running">Running</option>
                <option value="Idle">Idle</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Breakdown">Breakdown</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Current Order:</span>
              <select
                value={machine.currentOrderId || ''}
                onChange={(e) => onAssignOrder(machine.id, e.target.value || undefined)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="">-- No Order Assigned --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} ({o.fabricType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Machine Info */}
          <div>
            <h4 className="font-semibold text-slate-900 text-xs mb-2 uppercase tracking-wide text-[11px]">
              Equipment Details
            </h4>
            <div className="grid grid-cols-2 gap-2 border border-slate-300 rounded p-3 bg-white text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Model / Specs:</span>
                <span className="font-medium text-slate-900">{machine.model}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Operator:</span>
                <span className="font-medium text-slate-900">{machine.currentOperator}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Last Maintenance:</span>
                <span className="font-mono text-slate-900">{machine.lastMaintenanceDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Lifetime Operating Hours:</span>
                <span className="font-mono text-slate-900">{machine.totalRunHours.toLocaleString()} hrs</span>
              </div>
            </div>
          </div>

          {/* Current Order Summary */}
          {assignedOrder && (
            <div>
              <h4 className="font-semibold text-slate-900 text-xs mb-2 uppercase tracking-wide text-[11px]">
                Active Production Job
              </h4>
              <div className="border border-slate-300 rounded p-3 bg-white space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-900">
                    {assignedOrder.id} — {assignedOrder.clientName}
                  </span>
                  <span className="font-mono font-medium text-slate-800">
                    {assignedOrder.completedQuantity.toLocaleString()} / {assignedOrder.requiredQuantity.toLocaleString()} m
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Fabric: {assignedOrder.fabricType} · {assignedOrder.colour}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Remaining to produce: <strong>{remaining.toLocaleString()} m</strong> · Due: {assignedOrder.deadline}
                </div>
              </div>
            </div>
          )}

          {/* Recent Production Batches */}
          <div>
            <h4 className="font-semibold text-slate-900 text-xs mb-2 uppercase tracking-wide text-[11px]">
              Recent Batches Logged
            </h4>
            {machineLogs.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No production logs recorded for this machine today.</p>
            ) : (
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-[11px] border-b border-slate-300">
                      <th className="py-2 px-3">Log ID</th>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Shift</th>
                      <th className="py-2 px-3 text-right">Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {machineLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2 px-3 font-mono">{log.id}</td>
                        <td className="py-2 px-3 font-mono">{log.orderId}</td>
                        <td className="py-2 px-3 text-slate-600">{log.shift}</td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                          {log.quantityProduced.toLocaleString()} {log.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Downtime Records */}
          <div>
            <h4 className="font-semibold text-slate-900 text-xs mb-2 uppercase tracking-wide text-[11px]">
              Maintenance & Breakdown History
            </h4>
            {machineDowntimes.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No stoppages recorded for this equipment.</p>
            ) : (
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-[11px] border-b border-slate-300">
                      <th className="py-2 px-3">Event</th>
                      <th className="py-2 px-3">Reason</th>
                      <th className="py-2 px-3">Duration</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {machineDowntimes.map((dt) => (
                      <tr key={dt.id}>
                        <td className="py-2 px-3 font-mono">{dt.id}</td>
                        <td className="py-2 px-3">{dt.reason}</td>
                        <td className="py-2 px-3 font-mono">{dt.durationMinutes} mins</td>
                        <td className="py-2 px-3">
                          {dt.resolved ? (
                            <span className="text-emerald-700">Resolved</span>
                          ) : (
                            <span className="text-red-700 font-medium">Active Stoppage</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-300 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={btnSecondary}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
