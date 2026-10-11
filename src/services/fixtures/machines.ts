import type { Machine } from '@/models';

/**
 * Machine fixture extended with module-specific metrics (utilisation and
 * downtime) that are not part of the core Machine model yet.
 */
export interface MachineRecord extends Machine {
  utilization: number;
  downtimeHours: number;
}

/**
 * Mock machine fixtures for the Machine module.
 * Replace with `GET /api/machines` when the backend is available.
 */
export const machineFixtures: MachineRecord[] = [
  { id: 'MC-001', name: 'SP-01', type: 'spinning', model: 'Rieter K 45', manufacturer: 'Rieter', serialNumber: 'RT-2023-001', status: 'running', location: 'Floor 1 - Zone A', capacity: 500, unit: 'kg/day', currentOutput: 485, efficiency: 97, utilization: 94, downtimeHours: 6, lastMaintenance: '2026-09-05', nextMaintenance: '2026-10-05', totalRuntime: 17820, createdAt: '2024-01-15', updatedAt: '2026-10-10' },
  { id: 'MC-002', name: 'SP-02', type: 'spinning', model: 'Rieter K 45', manufacturer: 'Rieter', serialNumber: 'RT-2023-002', status: 'running', location: 'Floor 1 - Zone A', capacity: 500, unit: 'kg/day', currentOutput: 492, efficiency: 98, utilization: 96, downtimeHours: 3, lastMaintenance: '2026-09-03', nextMaintenance: '2026-10-03', totalRuntime: 17460, createdAt: '2024-01-15', updatedAt: '2026-10-10' },
  { id: 'MC-003', name: 'SP-03', type: 'spinning', model: 'LMW LR 60', manufacturer: 'LMW', serialNumber: 'LM-2022-011', status: 'idle', location: 'Floor 1 - Zone B', capacity: 460, unit: 'kg/day', currentOutput: 0, efficiency: 0, utilization: 41, downtimeHours: 22, lastMaintenance: '2026-08-28', nextMaintenance: '2026-09-28', totalRuntime: 15230, createdAt: '2024-02-01', updatedAt: '2026-10-10' },
  { id: 'MC-004', name: 'WM-04', type: 'weaving', model: 'Picanol OmniPlus', manufacturer: 'Picanol', serialNumber: 'PC-2023-004', status: 'maintenance', location: 'Floor 2 - Zone A', capacity: 1200, unit: 'm/day', currentOutput: 0, efficiency: 0, utilization: 0, downtimeHours: 48, lastMaintenance: '2026-10-10', nextMaintenance: '2026-10-12', totalRuntime: 12980, createdAt: '2024-02-20', updatedAt: '2026-10-10' },
  { id: 'MC-005', name: 'WM-05', type: 'weaving', model: 'Picanol OmniPlus', manufacturer: 'Picanol', serialNumber: 'PC-2023-005', status: 'running', location: 'Floor 2 - Zone A', capacity: 1200, unit: 'm/day', currentOutput: 1156, efficiency: 96, utilization: 91, downtimeHours: 9, lastMaintenance: '2026-09-28', nextMaintenance: '2026-10-28', totalRuntime: 14110, createdAt: '2024-02-20', updatedAt: '2026-10-10' },
  { id: 'MC-006', name: 'WM-06', type: 'weaving', model: 'Toyota JAT810', manufacturer: 'Toyota', serialNumber: 'TY-2023-021', status: 'running', location: 'Floor 2 - Zone B', capacity: 1100, unit: 'm/day', currentOutput: 1042, efficiency: 95, utilization: 89, downtimeHours: 11, lastMaintenance: '2026-09-30', nextMaintenance: '2026-10-30', totalRuntime: 12650, createdAt: '2024-03-05', updatedAt: '2026-10-10' },
  { id: 'MC-007', name: 'WM-07', type: 'weaving', model: 'Toyota JAT810', manufacturer: 'Toyota', serialNumber: 'TY-2023-022', status: 'breakdown', location: 'Floor 2 - Zone B', capacity: 1100, unit: 'm/day', currentOutput: 0, efficiency: 0, utilization: 12, downtimeHours: 36, lastMaintenance: '2026-09-12', nextMaintenance: '2026-10-12', totalRuntime: 11220, createdAt: '2024-03-05', updatedAt: '2026-10-10' },
  { id: 'MC-008', name: 'DM-02', type: 'dyeing', model: 'Fongs Airflow', manufacturer: 'Fongs', serialNumber: 'FG-2023-002', status: 'running', location: 'Dye House 2', capacity: 800, unit: 'kg/day', currentOutput: 768, efficiency: 96, utilization: 92, downtimeHours: 8, lastMaintenance: '2026-10-08', nextMaintenance: '2026-11-08', totalRuntime: 9870, createdAt: '2024-03-10', updatedAt: '2026-10-10' },
  { id: 'MC-009', name: 'DM-03', type: 'dyeing', model: 'Fongs Airflow', manufacturer: 'Fongs', serialNumber: 'FG-2023-003', status: 'running', location: 'Dye House 2', capacity: 800, unit: 'kg/day', currentOutput: 712, efficiency: 93, utilization: 87, downtimeHours: 14, lastMaintenance: '2026-10-01', nextMaintenance: '2026-11-01', totalRuntime: 9210, createdAt: '2024-03-10', updatedAt: '2026-10-10' },
  { id: 'MC-010', name: 'FM-01', type: 'finishing', model: 'Monforts Stenter', manufacturer: 'Monforts', serialNumber: 'MF-2023-001', status: 'running', location: 'Floor 3 - Zone D', capacity: 1500, unit: 'm/day', currentOutput: 1440, efficiency: 96, utilization: 90, downtimeHours: 10, lastMaintenance: '2026-09-20', nextMaintenance: '2026-10-20', totalRuntime: 10440, createdAt: '2024-04-05', updatedAt: '2026-10-10' },
  { id: 'MC-011', name: 'CF-01', type: 'finishing', model: 'Brückner Calender', manufacturer: 'Brückner', serialNumber: 'BK-2023-007', status: 'idle', location: 'Floor 3 - Zone D', capacity: 1600, unit: 'm/day', currentOutput: 0, efficiency: 0, utilization: 38, downtimeHours: 26, lastMaintenance: '2026-09-15', nextMaintenance: '2026-10-15', totalRuntime: 8420, createdAt: '2024-04-05', updatedAt: '2026-10-10' },
  { id: 'MC-012', name: 'QC-01', type: 'inspection', model: 'Uster Tester 6', manufacturer: 'Uster', serialNumber: 'US-2023-001', status: 'running', location: 'Floor 4 - QC Lab', capacity: 200, unit: 'samples/hr', currentOutput: 195, efficiency: 98, utilization: 95, downtimeHours: 2, lastMaintenance: '2026-10-02', nextMaintenance: '2026-11-02', totalRuntime: 6210, createdAt: '2024-05-15', updatedAt: '2026-10-10' },
];
