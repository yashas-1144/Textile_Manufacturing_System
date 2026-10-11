import { cloneFixtures, delay, USE_MOCK, apiRequest, ApiError } from './apiClient';
import { qualityFixtures, type QualityRecord, type ReworkStatus } from './fixtures/quality';
import { mapInspection, type BackendRow } from './mappers';

const upper = (v: string): string => v.toUpperCase();

export type InspectionStatus = QualityRecord['status'];

/** Derives the inspection status from pass/fail counts. */
export function deriveInspectionStatus(passed: number, failed: number): InspectionStatus {
  const total = passed + failed;
  if (total === 0) return 'pending';
  if (failed === 0) return 'passed';
  const passRate = passed / total;
  if (passRate >= 0.9) return 'conditional';
  return 'failed';
}

export interface CreateInspectionInput {
  productionPlanNumber: string;
  stage: QualityRecord['stage'];
  inspectorName: string;
  sampleSize: number;
  passedCount: number;
  failedCount: number;
  notes: string;
  productionPlanId?: string;
  stageId?: string;
}

export const REWORK_CONFIG: Record<ReworkStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  not_required: { label: 'Not required', variant: 'neutral' },
  pending: { label: 'Rework pending', variant: 'warning' },
  in_progress: { label: 'Rework in progress', variant: 'info' },
  completed: { label: 'Rework done', variant: 'success' },
};

export const qualityService = {
  /** GET /api/quality/inspections */
  async getInspections(): Promise<QualityRecord[]> {
    if (USE_MOCK) {
      await delay();
      return cloneFixtures(qualityFixtures).map((r) => ({ ...r, defects: r.defects.map((d) => ({ ...d })), rework: { ...r.rework } }));
    }
    const data = await apiRequest<{ inspections: BackendRow[]; total: number }>('/quality/inspections?limit=100');
    return data.inspections.map(mapInspection);
  },

  /** POST /api/quality/inspections */
  async createInspection(input: CreateInspectionInput): Promise<QualityRecord> {
    if (USE_MOCK) {
      await delay();
      const now = new Date().toISOString();
      const status = deriveInspectionStatus(input.passedCount, input.failedCount);
      return {
        id: `QI-${Date.now()}`,
        inspectionNumber: `QI-2026-0${String(Math.floor(Math.random() * 900) + 100)}`,
        productionPlanId: input.productionPlanNumber,
        productionPlanNumber: input.productionPlanNumber,
        stage: input.stage,
        inspectorId: 'W-000',
        inspectorName: input.inspectorName,
        sampleSize: input.sampleSize,
        passedCount: input.passedCount,
        failedCount: input.failedCount,
        status,
        defects: [],
        notes: input.notes,
        inspectedAt: now,
        createdAt: now,
        updatedAt: now,
        rework: {
          status: status === 'passed' ? 'not_required' : 'pending',
          quantity: input.failedCount,
        },
      };
    }

    let planId = input.productionPlanId;
    let stageId = input.stageId;
    if (!planId || !stageId) {
      const plans = await apiRequest<{ plans: BackendRow[] }>('/production/plans?limit=200');
      const plan = plans.plans.find((p) => String(p.planNumber).trim() === input.productionPlanNumber.trim());
      if (!plan) throw new ApiError(`Production plan ${input.productionPlanNumber} not found`, 404);
      planId = String(plan.id);
      const stageRows = Array.isArray(plan.stages) ? plan.stages : [];
      const stage = stageRows.find((s) => String(s?.name ?? '').toUpperCase() === input.stage.toUpperCase());
      if (!stage) throw new ApiError(`Stage ${input.stage} not found on ${input.productionPlanNumber}`, 404);
      stageId = String(stage.id);
    }

    const created = await apiRequest<{ inspection: BackendRow }>('/quality/inspections', {
      method: 'POST',
      body: {
        productionPlanId: planId,
        stageId,
        stage: upper(input.stage),
        inspectorId: 'W-000',
        inspectorName: input.inspectorName,
        sampleSize: input.sampleSize,
        passedCount: input.passedCount,
        failedCount: input.failedCount,
        notes: input.notes || undefined,
      },
    });
    return mapInspection(created.inspection);
  },

  /** PATCH /api/quality/inspections/:id/rework */
  async updateRework(id: string, status: ReworkStatus): Promise<{ id: string; status: ReworkStatus }> {
    if (USE_MOCK) {
      await delay();
      return { id, status };
    }
    await apiRequest(`/quality/inspections/${id}/rework`, {
      method: 'PATCH',
      body: { status: upper(status) },
    });
    return { id, status };
  },
};
