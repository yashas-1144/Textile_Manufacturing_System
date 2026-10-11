import type { ProductionPlan, ProductionStage } from '@/models';
import { cloneFixtures, delay, USE_MOCK, apiRequest, ApiError } from './apiClient';
import { productionFixtures, STAGE_SEQUENCE } from './fixtures/production';
import { mapPlan, type BackendRow } from './mappers';

const iso = (d: string): string => (d.length === 10 ? `${d}T00:00:00.000Z` : d);

/** Overall completion of a plan, averaged across its stages (0-100). */
export function getPlanProgress(plan: Pick<ProductionPlan, 'stages'>): number {
  if (!plan.stages.length) return 0;
  const total = plan.stages.reduce((sum, stage) => sum + stage.quantity, 0);
  if (total === 0) return 0;
  const completed = plan.stages.reduce((sum, stage) => sum + Math.min(stage.completedQuantity, stage.quantity), 0);
  return Math.round((completed / total) * 100);
}

/** The stage currently being worked on, or the next pending stage. */
export function getActiveStage(plan: Pick<ProductionPlan, 'stages'>): ProductionStage | undefined {
  return plan.stages.find((stage) => stage.status === 'in_progress') ?? plan.stages.find((stage) => stage.status === 'pending');
}

/** Builds the default 4-stage pipeline for a newly created plan. */
export function buildDefaultStages(planId: string, quantity: number, startDate: string): ProductionStage[] {
  const start = new Date(startDate);
  return STAGE_SEQUENCE.map((name, index) => {
    const stageStart = new Date(start);
    stageStart.setDate(start.getDate() + index * 3);
    const stageEnd = new Date(stageStart);
    stageEnd.setDate(stageStart.getDate() + 2);
    return {
      id: `${planId}-S${index + 1}`,
      planId,
      name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      status: 'pending',
      startDate: stageStart.toISOString().slice(0, 10),
      endDate: stageEnd.toISOString().slice(0, 10),
      quantity,
      completedQuantity: 0,
      rejectedQuantity: 0,
    };
  });
}

export interface CreatePlanInput {
  orderNumber: string;
  buyerName: string;
  productName: string;
  quantity: number;
  unit: string;
  priority: ProductionPlan['priority'];
  startDate: string;
  endDate: string;
}

export interface AdvanceStageOptions {
  completedQuantity?: number;
  rejectedQuantity?: number;
  notes?: string;
}

export const productionService = {
  /** GET /api/production/plans */
  async getPlans(): Promise<ProductionPlan[]> {
    if (USE_MOCK) {
      await delay();
      return cloneFixtures(productionFixtures).map((plan) => ({ ...plan, stages: plan.stages.map((s) => ({ ...s })) }));
    }
    const data = await apiRequest<{ plans: BackendRow[]; total: number }>('/production/plans?limit=100');
    return data.plans.map(mapPlan);
  },

  /** POST /api/production/plans */
  async createPlan(input: CreatePlanInput & { orderId?: string }): Promise<ProductionPlan> {
    if (USE_MOCK) {
      await delay();
      const id = `PP-${Date.now()}`;
      const now = new Date().toISOString();
      return {
        id,
        planNumber: `PP-2026-0${String(Math.floor(Math.random() * 900) + 100)}`,
        orderId: input.orderNumber,
        orderNumber: input.orderNumber,
        buyerName: input.buyerName,
        productName: input.productName,
        quantity: input.quantity,
        unit: input.unit,
        status: 'planned',
        priority: input.priority,
        startDate: input.startDate,
        endDate: input.endDate,
        stages: buildDefaultStages(id, input.quantity, input.startDate),
        assignedMachines: [],
        assignedWorkers: [],
        createdAt: now,
        updatedAt: now,
      };
    }

    let orderId = input.orderId;
    if (!orderId) {
      const orders = await apiRequest<{ orders: BackendRow[] }>('/orders?limit=200');
      const match = orders.orders.find((o) => String(o.orderNumber).trim() === input.orderNumber.trim());
      if (!match) throw new ApiError(`Order ${input.orderNumber} not found`, 404);
      orderId = String(match.id);
    }
    const created = await apiRequest<{ plan: BackendRow }>('/production/plans', {
      method: 'POST',
      body: {
        orderId,
        productName: input.productName,
        quantity: input.quantity,
        unit: input.unit,
        priority: input.priority.toUpperCase(),
        startDate: iso(input.startDate),
        endDate: iso(input.endDate),
      },
    });
    return mapPlan(created.plan);
  },

  /**
   * PATCH /api/production/stages/:stageId — starts a pending stage, or completes an
   * in-progress one when completedQuantity reaches the planned quantity.
   */
  async advanceStage(planId: string, stageId: string, options: AdvanceStageOptions = {}): Promise<{ planId: string; stageId: string }> {
    if (USE_MOCK) {
      await delay();
      return { planId, stageId };
    }
    await apiRequest(`/production/stages/${stageId}`, {
      method: 'PATCH',
      body: options.completedQuantity !== undefined ? { completedQuantity: options.completedQuantity } : {},
    });
    return { planId, stageId };
  },
};
