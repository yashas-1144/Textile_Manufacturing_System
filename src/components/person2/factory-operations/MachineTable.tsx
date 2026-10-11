/**
 * @file components/person2/factory-operations/MachineTable.tsx
 * Machine Fleet Table (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React from 'react';
import { Machine, MachineStatus, ProductionLogEntry } from '../../../types/person2/production';
import { ProductionOrder } from '../../../types/person2/orders';
import { btnSecondaryCompact, btnDelete } from '../../../lib/person2/ui-styles';

interface MachineTableProps {
  machines: Machine[];
  orders: ProductionOrder[];
  logs: ProductionLogEntry[];
  onSelectMachine: (machine: Machine) => void;
  onUpdateMachineStatus: (machineId: string, status: MachineStatus) => void;
  onReportBreakdown: (machine: Machine) => void;
}

export const MachineTable: React.FC<MachineTableProps> = ({
  machines,
  orders,
  logs,
  onSelectMachine,
  onUpdateMachineStatus,
  onReportBreakdown,
}) => {
  if (machines.length === 0) {
    return (
      <div className="bg-white border border-slate-300 rounded p-8 text-center text-slate-500 text-xs">
        No machines match the selected filters.
      </div>
    );
  }

  // Calculate today's output per machine
  const getTodayOutput = (machineId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const total = logs
      .filter((l) => l.machineId === machineId)
      .reduce((sum, l) => sum + l.quantityProduced, 0);
    return total > 0 ? `${total.toLocaleString()} m` : '—';
  };

  return (
    <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold text-[11px] uppercase tracking-wide">
              <th className="py-2.5 px-3">Machine ID</th>
              <th className="py-2.5 px-3">Machine</th>
              <th className="py-2.5 px-3">Process</th>
              <th className="py-2.5 px-3">Current Order</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Today's Output</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {machines.map((machine) => {
              const assignedOrder = machine.currentOrderId
                ? orders.find((o) => o.id === machine.currentOrderId)
                : null;

              return (
                <tr key={machine.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                    {machine.id}
                  </td>

                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {machine.name}
                  </td>

                  <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                    {machine.process}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {assignedOrder ? (
                      <span className="font-mono text-slate-900 font-medium">
                        {assignedOrder.id}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <select
                      value={machine.status}
                      onChange={(e) =>
                        onUpdateMachineStatus(machine.id, e.target.value as MachineStatus)
                      }
                      className="bg-white border border-slate-300 text-slate-800 text-xs rounded px-2 py-1 font-medium focus:outline-none focus:border-blue-600"
                    >
                      <option value="Running">Running</option>
                      <option value="Idle">Idle</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Breakdown">Breakdown</option>
                    </select>
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 whitespace-nowrap">
                    {getTodayOutput(machine.id)}
                  </td>

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectMachine(machine)}
                        className={btnSecondaryCompact}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onReportBreakdown(machine)}
                        className={btnDelete}
                        title="Report machine stoppage or breakdown"
                      >
                        Breakdown
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
