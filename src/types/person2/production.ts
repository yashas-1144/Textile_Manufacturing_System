import type { FabricUnit, ProductionStage } from './orders';

export type MachineStatus = 'Running' | 'Idle' | 'Maintenance' | 'Breakdown';
export type ProductionProcess = 'Spinning' | 'Weaving' | 'Dyeing' | 'Finishing';
export type ProductionShift = 'Morning Shift A (06:00 - 14:00)' | 'Evening Shift B (14:00 - 22:00)' | 'Night Shift C (22:00 - 06:00)';

export interface Machine {
  id: string;
  name: string;
  model: string;
  process: ProductionProcess;
  section: string;
  status: MachineStatus;
  currentOrderId?: string;
  currentOperator: string;
  totalRunHours: number;
  lastMaintenanceDate: string;
}

export interface ProductionLogEntry {
  id: string;
  orderId: string;
  machineId: string;
  productionStage: ProductionProcess;
  quantityProduced: number;
  unit: FabricUnit;
  productionDate: string;
  shift: ProductionShift;
  operatorName: string;
  targetQuantityForBatch: number;
  notes?: string;
}

export interface MachineDowntimeEvent {
  id: string;
  machineId: string;
  machineName?: string;
  process?: ProductionProcess;
  reason: string;
  durationMinutes?: number;
  startTime?: string;
  technician?: string;
  correctiveAction?: string;
  resolved?: boolean;
  reportedAt?: string;
  reportedBy?: string;
  status?: 'Open' | 'Resolved';
  resolvedAt?: string;
  resolutionNotes?: string;
}
