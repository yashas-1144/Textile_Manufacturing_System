import type { Worker, Attendance, Wage } from '@/models';
import { workerFixtures, attendanceFixtures, wageFixtures } from './fixtures/workforce';
import { cloneFixtures, delay, USE_MOCK, ApiError, apiRequest } from './apiClient';
import { mapWorker, mapAttendance, mapWage, type BackendRow } from './mappers';

const iso = (d: string): string => (d.length === 10 ? `${d}T00:00:00.000Z` : d);
const upper = (v: string): string => v.toUpperCase();

export interface RecordAttendanceInput {
  workerId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: Attendance['status'];
  overtimeHours: number;
  shift: Attendance['shift'];
  notes?: string;
}

export interface CalculateWageInput {
  workerId: string;
  periodStart: string;
  periodEnd: string;
  baseHours: number;
  overtimeHours: number;
  deductions: number;
  bonuses: number;
}

/**
 * Wage formula shown in the UI: base hours × hourly rate + overtime hours ×
 * overtime rate − deductions + bonuses = net pay.
 */
export function computeWage(w: Pick<Worker, 'hourlyRate' | 'overtimeRate'>, input: Pick<CalculateWageInput, 'baseHours' | 'overtimeHours' | 'deductions' | 'bonuses'>) {
  const basePay = input.baseHours * w.hourlyRate;
  const overtimePay = input.overtimeHours * w.overtimeRate;
  const netPay = basePay + overtimePay - input.deductions + input.bonuses;
  return { basePay, overtimePay, netPay };
}

export interface CreateWorkerInput {
  name: string;
  department: Worker['department'];
  role: string;
  shift: Worker['shift'];
  hourlyRate: number;
  overtimeRate: number;
  contactPhone: string;
  contactEmail: string;
  address: string;
}

export const workforceService = {
  /** GET /api/workforce + /attendance + /wages — workers, attendance and wages. */
  async getWorkforce(): Promise<{ workers: Worker[]; attendance: Attendance[]; wages: Wage[] }> {
    if (USE_MOCK) {
      await delay();
      return {
        workers: cloneFixtures(workerFixtures),
        attendance: cloneFixtures(attendanceFixtures),
        wages: cloneFixtures(wageFixtures),
      };
    }
    const [workers, attendance, wages] = await Promise.all([
      apiRequest<{ workers: BackendRow[]; total: number }>('/workforce?limit=200'),
      apiRequest<{ attendance: BackendRow[]; total: number }>('/workforce/attendance?limit=200'),
      apiRequest<{ wages: BackendRow[]; total: number }>('/workforce/wages?limit=200'),
    ]);
    return {
      workers: workers.workers.map(mapWorker),
      attendance: attendance.attendance.map(mapAttendance),
      wages: wages.wages.map(mapWage),
    };
  },

  /** POST /api/workforce/workers */
  async createWorker(input: CreateWorkerInput): Promise<Worker> {
    if (input.hourlyRate <= 0) throw new ApiError('Hourly rate must be greater than zero', 400);
    if (input.overtimeRate < input.hourlyRate) {
      throw new ApiError('Overtime rate cannot be lower than the hourly rate', 400);
    }
    if (USE_MOCK) {
      await delay();
      const now = new Date().toISOString().slice(0, 10);
      const worker: Worker = {
        id: `W-${String(workerFixtures.length + 1).padStart(3, '0')}`,
        employeeId: `EMP-${String(workerFixtures.length + 1).padStart(3, '0')}`,
        status: 'active',
        hireDate: now,
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      workerFixtures.push(worker);
      return { ...worker };
    }
    const created = await apiRequest<{ worker: BackendRow }>('/workforce/workers', {
      method: 'POST',
      body: {
        name: input.name.trim(),
        department: upper(input.department),
        role: input.role.trim(),
        shift: upper(input.shift),
        hourlyRate: input.hourlyRate,
        overtimeRate: input.overtimeRate,
        contactPhone: input.contactPhone.trim(),
        contactEmail: input.contactEmail.trim(),
        address: input.address.trim() || undefined,
      },
    });
    return mapWorker(created.worker);
  },

  /** POST /api/workforce/attendance */
  async recordAttendance(input: RecordAttendanceInput): Promise<Attendance> {
    if (USE_MOCK) {
      await delay();
      const worker = workerFixtures.find((w) => w.id === input.workerId);
      if (!worker) throw new ApiError('Worker not found', 404);
      if (attendanceFixtures.some((a) => a.workerId === input.workerId && a.date === input.date)) {
        throw new ApiError('An attendance record already exists for this worker on that date', 400);
      }
      const now = new Date().toISOString().slice(0, 10);
      const record: Attendance = {
        id: `ATT-${String(attendanceFixtures.length + 1).padStart(3, '0')}`,
        ...input,
        workerName: worker.name,
        createdAt: now,
        updatedAt: now,
      };
      attendanceFixtures.push(record);
      return { ...record };
    }
    const created = await apiRequest<{ attendance: BackendRow }>('/workforce/attendance', {
      method: 'POST',
      body: {
        workerId: input.workerId,
        date: iso(input.date),
        checkIn: `${input.date}T${input.checkIn || '09:00'}:00.000Z`,
        checkOut: input.checkOut ? `${input.date}T${input.checkOut}:00.000Z` : undefined,
        status: upper(input.status),
        overtimeHours: input.overtimeHours,
        shift: upper(input.shift),
        notes: input.notes || undefined,
      },
    });
    return mapAttendance(created.attendance);
  },

  /** POST /api/workforce/wages/calculate */
  async calculateWage(input: CalculateWageInput): Promise<Wage> {
    if (input.baseHours < 0 || input.overtimeHours < 0) throw new ApiError('Hours cannot be negative', 400);
    if (input.periodEnd < input.periodStart) throw new ApiError('Period end cannot be before period start', 400);
    if (USE_MOCK) {
      await delay();
      const worker = workerFixtures.find((w) => w.id === input.workerId);
      if (!worker) throw new ApiError('Worker not found', 404);
      const { basePay, overtimePay, netPay } = computeWage(worker, input);
      const now = new Date().toISOString().slice(0, 10);
      const wage: Wage = {
        id: `WG-${String(wageFixtures.length + 1).padStart(3, '0')}`,
        workerId: worker.id,
        workerName: worker.name,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        baseHours: input.baseHours,
        overtimeHours: input.overtimeHours,
        basePay,
        overtimePay,
        deductions: input.deductions,
        bonuses: input.bonuses,
        netPay,
        status: 'calculated',
        createdAt: now,
        updatedAt: now,
      };
      wageFixtures.push(wage);
      return { ...wage };
    }
    const created = await apiRequest<{ wage: BackendRow }>('/workforce/wages/calculate', {
      method: 'POST',
      body: {
        workerId: input.workerId,
        periodStart: iso(input.periodStart),
        periodEnd: iso(input.periodEnd),
        baseHours: input.baseHours,
        overtimeHours: input.overtimeHours,
        deductions: input.deductions,
        bonuses: input.bonuses,
      },
    });
    return mapWage(created.wage);
  },

  /** PATCH /api/workforce/wages/:id/approve */
  async approveWage(id: string): Promise<Wage> {
    if (USE_MOCK) {
      await delay();
      const wage = wageFixtures.find((w) => w.id === id);
      if (!wage) throw new ApiError('Wage record not found', 404);
      if (wage.status === 'paid') throw new ApiError('A paid wage cannot be re-approved', 400);
      wage.status = 'approved';
      wage.updatedAt = new Date().toISOString().slice(0, 10);
      return { ...wage };
    }
    const updated = await apiRequest<{ wage: BackendRow }>(`/workforce/wages/${id}/approve`, {
      method: 'PATCH',
    });
    return mapWage(updated.wage);
  },

  /** PATCH /api/workforce/wages/:id/paid */
  async markWagePaid(id: string): Promise<Wage> {
    if (USE_MOCK) {
      await delay();
      const wage = wageFixtures.find((w) => w.id === id);
      if (!wage) throw new ApiError('Wage record not found', 404);
      if (wage.status === 'calculated') throw new ApiError('Approve the wage before marking it paid', 400);
      wage.status = 'paid';
      wage.paidDate = new Date().toISOString().slice(0, 10);
      wage.updatedAt = wage.paidDate;
      return { ...wage };
    }
    const updated = await apiRequest<{ wage: BackendRow }>(`/workforce/wages/${id}/paid`, {
      method: 'PATCH',
    });
    return mapWage(updated.wage);
  },
};
