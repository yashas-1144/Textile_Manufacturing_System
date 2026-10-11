import type { Machine } from '@/models';
import { cloneFixtures, delay, USE_MOCK, apiRequest } from './apiClient';
import { machineFixtures, type MachineRecord } from './fixtures/machines';
import { mapMachine, type BackendRow } from './mappers';

const iso = (d: string): string => (d.length === 10 ? `${d}T00:00:00.000Z` : d);
const upper = (v: string): string => v.toUpperCase();

export type MachineAction = 'start' | 'stop' | 'maintenance' | 'breakdown';

export function isMaintenanceDue(machine: Pick<Machine, 'nextMaintenance'>, reference = new Date()): boolean {
  const due = new Date(machine.nextMaintenance);
  return due.getTime() <= reference.getTime();
}

export function isMaintenanceSoon(machine: Pick<Machine, 'nextMaintenance'>, reference = new Date(), withinDays = 7): boolean {
  const due = new Date(machine.nextMaintenance);
  const diffDays = (due.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= withinDays;
}

export interface CreateMachineInput {
  name: string;
  type: Machine['type'];
  model: string;
  manufacturer: string;
  location: string;
  capacity: number;
  unit: string;
}

export const machineService = {
  /** GET /api/machines */
  async getMachines(): Promise<MachineRecord[]> {
    if (USE_MOCK) {
      await delay();
      return cloneFixtures(machineFixtures);
    }
    const data = await apiRequest<{ machines: BackendRow[]; total: number }>('/machines?limit=100');
    return data.machines.map(mapMachine);
  },

  /** POST /api/machines */
  async createMachine(input: CreateMachineInput): Promise<MachineRecord> {
    if (USE_MOCK) {
      await delay();
      const now = new Date().toISOString();
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      return {
        id: `MC-${Date.now()}`,
        name: input.name,
        type: input.type,
        model: input.model,
        manufacturer: input.manufacturer,
        serialNumber: `NEW-${Date.now()}`,
        status: 'idle',
        location: input.location,
        capacity: input.capacity,
        unit: input.unit,
        currentOutput: 0,
        efficiency: 0,
        utilization: 0,
        downtimeHours: 0,
        lastMaintenance: now.slice(0, 10),
        nextMaintenance: next.toISOString().slice(0, 10),
        totalRuntime: 0,
        createdAt: now,
        updatedAt: now,
      };
    }
    const created = await apiRequest<{ machine: BackendRow }>('/machines', {
      method: 'POST',
      body: {
        name: input.name.trim(),
        type: upper(input.type),
        model: input.model.trim(),
        manufacturer: input.manufacturer.trim(),
        serialNumber: `SN-${Date.now()}`,
        location: input.location.trim(),
        capacity: input.capacity,
        unit: input.unit.trim(),
      },
    });
    return mapMachine(created.machine);
  },

  /** PATCH /api/machines/:id/status */
  async setStatus(id: string, status: Machine['status']): Promise<{ id: string; status: Machine['status'] }> {
    if (USE_MOCK) {
      await delay();
      const machine = machineFixtures.find((m) => m.id === id);
      if (machine) machine.status = status;
      return { id, status };
    }
    await apiRequest(`/machines/${id}/status`, {
      method: 'PATCH',
      body: { status: upper(status) },
    });
    return { id, status };
  },

  /** POST /api/machines/:id/maintenance */
  async scheduleMaintenance(id: string, date: string, notes: string): Promise<{ id: string; date: string; notes: string }> {
    if (USE_MOCK) {
      await delay();
      const machine = machineFixtures.find((m) => m.id === id);
      if (machine) machine.nextMaintenance = date;
      return { id, date, notes };
    }
    await apiRequest(`/machines/${id}/maintenance`, {
      method: 'POST',
      body: {
        type: 'scheduled',
        description: notes.trim() || 'Scheduled maintenance',
        startDate: iso(date),
      },
    });
    return { id, date, notes };
  },
};
