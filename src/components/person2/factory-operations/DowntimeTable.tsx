/**
 * @file components/person2/factory-operations/DowntimeTable.tsx
 * Machine Downtime & Incident Tracker (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React, { useState } from 'react';
import {
  MachineDowntimeEvent,
  Machine,
} from '../../../types/person2/production';
import { btnPrimary, btnPrimaryCompact, btnSecondary, btnEdit } from '../../../lib/person2/ui-styles';

interface DowntimeTableProps {
  downtimes: MachineDowntimeEvent[];
  machines: Machine[];
  onAddDowntime: (event: MachineDowntimeEvent) => void;
  onResolveDowntime: (eventId: string, actionNote: string) => void;
}

export const DowntimeTable: React.FC<DowntimeTableProps> = ({
  downtimes,
  machines,
  onAddDowntime,
  onResolveDowntime,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || 'M001');
  const [reason, setReason] = useState<MachineDowntimeEvent['reason']>('Mechanical Breakdown');
  const [technician, setTechnician] = useState('N. Dangol');
  const [actionNotes, setActionNotes] = useState('');
  const [duration, setDuration] = useState(60);

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveAction, setResolveAction] = useState('Spare part replaced and test verified');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const mach = machines.find((m) => m.id === selectedMachineId);
    const newEvent: MachineDowntimeEvent = {
      id: `DT-${Math.floor(210 + Math.random() * 80)}`,
      machineId: selectedMachineId,
      machineName: mach ? mach.name : 'Equipment',
      process: mach ? mach.process : 'Weaving',
      reason,
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      durationMinutes: Number(duration),
      resolved: false,
      technician: technician.trim() || 'Floor Tech',
      correctiveAction: actionNotes.trim() || 'Under inspection',
    };
    onAddDowntime(newEvent);
    setIsModalOpen(false);
  };

  const handleResolveSubmit = (id: string) => {
    onResolveDowntime(id, resolveAction);
    setResolvingId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600 font-medium">
          Logged Stoppages and Maintenance Events ({downtimes.length})
        </span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={btnPrimaryCompact}
        >
          + Log Stoppage
        </button>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold text-[11px] uppercase tracking-wide">
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Machine</th>
                <th className="py-2.5 px-3">Process</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3 text-right">Duration</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Technician / Action</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {downtimes.map((dt) => (
                <tr key={dt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                    {dt.id}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-mono font-medium text-slate-900">{dt.machineId}</span>{' '}
                    <span className="text-slate-500 text-[11px]">({dt.machineName})</span>
                  </td>

                  <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                    {dt.process}
                  </td>

                  <td className="py-2.5 px-3 text-slate-900 font-medium whitespace-nowrap">
                    {dt.reason}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                    {dt.durationMinutes} mins
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                    {dt.startTime}
                  </td>

                  <td className="py-2.5 px-3 max-w-[200px] truncate text-[11px] text-slate-600">
                    {dt.technician}: {dt.correctiveAction || 'Pending review'}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                    {dt.resolved ? (
                      <span className="text-emerald-700">Resolved</span>
                    ) : (
                      <span className="text-red-700 font-semibold">Active</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {!dt.resolved && (
                      <button
                        type="button"
                        onClick={() => setResolvingId(dt.id)}
                        className={btnEdit}
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-300 shadow-lg w-full max-w-md p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-300 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Log Stoppage Event</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Machine *</label>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} — {m.name} ({m.process})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Stoppage Reason *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="Mechanical Breakdown">Mechanical Breakdown</option>
                  <option value="Thread / Warp Breakage">Thread / Warp Breakage</option>
                  <option value="Electrical / Power Fluctuation">Electrical / Power Fluctuation</option>
                  <option value="Scheduled Preventative Maintenance">Scheduled Preventative Maintenance</option>
                  <option value="Dye Bath Cleaning & Purge">Dye Bath Cleaning & Purge</option>
                  <option value="Awaiting Yarn Lot">Awaiting Yarn Lot</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Technician</label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Corrective Action</label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. Tension regulator replaced"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
      )}

      {/* Resolve Dialog */}
      {resolvingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-300 shadow-lg w-full max-w-sm p-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">Resolve Stoppage Event</h4>
            <p className="text-slate-500 text-[11px] mb-3">
              Confirm corrective action taken to restore equipment.
            </p>
            <input
              type="text"
              value={resolveAction}
              onChange={(e) => setResolveAction(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolvingId(null)}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolveSubmit(resolvingId)}
                className={btnPrimary}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
