import type { QcStatus, RollRecord } from './fixtures/finishedGoods';
import { finishedRollFixtures } from './fixtures/finishedGoods';
import { cloneFixtures, delay, USE_MOCK, ApiError, apiRequest } from './apiClient';
import { mapRoll, type BackendRow } from './mappers';

const upper = (v: string): string => v.toUpperCase();

export interface CreateRollInput {
  productName: string;
  specification: string;
  productionPlanNumber?: string;
  length: number;
  width: number;
  weight: number;
  qualityGrade: RollRecord['qualityGrade'];
  location: string;
}

export const finishedGoodsService = {
  /** GET /api/finished-goods/rolls */
  async getRolls(): Promise<RollRecord[]> {
    if (USE_MOCK) {
      await delay();
      return cloneFixtures(finishedRollFixtures);
    }
    const data = await apiRequest<{ rolls: BackendRow[]; total: number }>('/finished-goods/rolls?limit=200');
    return data.rolls.map(mapRoll);
  },

  /** POST /api/finished-goods/rolls */
  async createRoll(input: CreateRollInput): Promise<RollRecord> {
    if (input.length <= 0 || input.width <= 0 || input.weight <= 0) {
      throw new ApiError('Length, width and weight must be greater than zero', 400);
    }
    if (USE_MOCK) {
      await delay();
      const seq = finishedRollFixtures.length + 101;
      const now = new Date().toISOString().slice(0, 10);
      const roll: RollRecord = {
        id: `FR-${String(seq).padStart(4, '0')}`,
        rollNumber: `FR-2026-${String(seq).padStart(4, '0')}`,
        productionPlanId: input.productionPlanNumber ?? '',
        productionPlanNumber: input.productionPlanNumber ?? '—',
        productName: input.productName.trim(),
        specification: input.specification.trim(),
        length: input.length,
        width: input.width,
        weight: input.weight,
        unit: 'meters',
        qualityGrade: input.qualityGrade,
        location: input.location.trim(),
        status: 'available',
        createdAt: now,
        updatedAt: now,
        qcStatus: 'pending',
        readyForDispatch: false,
      };
      finishedRollFixtures.push(roll);
      return { ...roll };
    }

    const planNumber = input.productionPlanNumber;
    if (!planNumber) throw new ApiError('Select a production plan', 400);
    const plans = await apiRequest<{ plans: BackendRow[] }>('/production/plans?limit=200');
    const plan = plans.plans.find((p) => String(p.planNumber).trim() === planNumber.trim());
    if (!plan) throw new ApiError(`Production plan ${planNumber} not found`, 404);

    const created = await apiRequest<{ roll: BackendRow }>('/finished-goods/rolls', {
      method: 'POST',
      body: {
        productionPlanId: String(plan.id),
        productName: input.productName.trim(),
        specification: input.specification.trim(),
        length: input.length,
        width: input.width,
        weight: input.weight,
        qualityGrade: upper(input.qualityGrade),
        location: input.location.trim(),
      },
    });
    return mapRoll(created.roll);
  },

  /** PATCH /api/finished-goods/rolls/:id/qc */
  async updateQcStatus(rollId: string, qcStatus: QcStatus, inspectionNumber?: string): Promise<RollRecord> {
    if (USE_MOCK) {
      await delay();
      const roll = finishedRollFixtures.find((r) => r.id === rollId);
      if (!roll) throw new ApiError('Roll not found', 404);
      roll.qcStatus = qcStatus;
      roll.readyForDispatch = roll.status === 'available' && qcStatus === 'passed';
      if (inspectionNumber) roll.inspectionNumber = inspectionNumber;
      roll.updatedAt = new Date().toISOString().slice(0, 10);
      return { ...roll };
    }
    const updated = await apiRequest<{ roll: BackendRow }>(`/finished-goods/rolls/${rollId}/qc`, {
      method: 'PATCH',
      body: { qcStatus: upper(qcStatus), inspectionNumber: inspectionNumber || undefined },
    });
    return mapRoll(updated.roll);
  },

  /** POST /api/finished-goods/rolls/:id/ready */
  async markReadyForDispatch(rollId: string): Promise<RollRecord> {
    if (USE_MOCK) {
      await delay();
      const roll = finishedRollFixtures.find((r) => r.id === rollId);
      if (!roll) throw new ApiError('Roll not found', 404);
      if (roll.qcStatus !== 'passed') {
        throw new ApiError('Quality inspection must pass before a roll can be marked ready', 400);
      }
      roll.readyForDispatch = true;
      roll.updatedAt = new Date().toISOString().slice(0, 10);
      return { ...roll };
    }
    const updated = await apiRequest<{ roll: BackendRow }>(`/finished-goods/rolls/${rollId}/ready`, {
      method: 'POST',
    });
    return mapRoll(updated.roll);
  },
};
