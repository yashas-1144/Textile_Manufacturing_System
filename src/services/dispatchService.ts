import type { Dispatch } from '@/models';
import { dispatchFixtures, DISPATCH_STATUS_SEQUENCE } from './fixtures/dispatch';
import { finishedRollFixtures } from './fixtures/finishedGoods';
import { orders } from './fixtures/orders';
import { cloneFixtures, delay, USE_MOCK, ApiError, apiRequest } from './apiClient';
import { mapDispatch, mapOrder, mapRoll, type BackendRow } from './mappers';

export interface CreateDispatchInput {
  orderId: string;
  rollIds: string[];
  dispatchDate: string;
  expectedDeliveryDate: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  deliveryAddress: string;
  notes?: string;
}

function cloneDispatch(d: Dispatch): Dispatch {
  return { ...d, items: d.items.map((item) => ({ ...item })) };
}

const iso = (d: string): string => (d.length === 10 ? `${d}T00:00:00.000Z` : d);
const upper = (v: string): string => v.toUpperCase();

export const dispatchService = {
  /** GET /api/dispatches */
  async getDispatches(): Promise<Dispatch[]> {
    if (USE_MOCK) {
      await delay();
      return dispatchFixtures.map(cloneDispatch);
    }
    const data = await apiRequest<{ dispatches: BackendRow[]; total: number }>('/dispatches?limit=100');
    return data.dispatches.map(mapDispatch);
  },

  /**
   * GET /api/dispatches/board — dispatches plus the orders and QC-ready rolls
   * needed to create a new shipment from a single service call.
   */
  async getDispatchBoard(): Promise<{ dispatches: Dispatch[]; orders: typeof orders; rolls: typeof finishedRollFixtures }> {
    if (USE_MOCK) {
      await delay();
      return {
        dispatches: dispatchFixtures.map(cloneDispatch),
        orders: orders.map((o) => ({ ...o })),
        rolls: cloneFixtures(finishedRollFixtures).filter((r) => r.readyForDispatch && r.status === 'available'),
      };
    }
    const data = await apiRequest<{ dispatches: BackendRow[]; orders: BackendRow[]; rolls: BackendRow[] }>(
      '/dispatches/board'
    );
    return {
      dispatches: data.dispatches.map(mapDispatch),
      orders: data.orders.map(mapOrder),
      rolls: data.rolls.map(mapRoll),
    };
  },

  /** POST /api/dispatches — creates a shipment and allocates its rolls. */
  async createDispatch(input: CreateDispatchInput): Promise<Dispatch> {
    if (USE_MOCK) {
      await delay();
    const order = orders.find((o) => o.id === input.orderId);
    if (!order) throw new ApiError('Order not found', 404);
    if (input.rollIds.length === 0) throw new ApiError('Select at least one roll', 400);
    if (input.expectedDeliveryDate < input.dispatchDate) {
      throw new ApiError('Expected delivery date cannot be before the dispatch date', 400);
    }

    const selected = input.rollIds.map((id) => {
      const roll = finishedRollFixtures.find((r) => r.id === id);
      if (!roll) throw new ApiError(`Roll ${id} not found`, 404);
      if (!roll.readyForDispatch || roll.status !== 'available') {
        throw new ApiError(`${roll.rollNumber} is not ready for dispatch`, 400);
      }
      return roll;
    });

    const seq = 90 + dispatchFixtures.length;
    const id = `DIS-${String(seq).padStart(4, '0')}`;
    const dispatch: Dispatch = {
      id,
      dispatchNumber: `DIS-2026-${String(seq).padStart(4, '0')}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      buyerName: order.buyerName,
      status: 'planned',
      dispatchDate: input.dispatchDate,
      expectedDeliveryDate: input.expectedDeliveryDate,
      items: selected.map((roll) => ({
        id: `${id}-${roll.id}`,
        dispatchId: id,
        finishedRollId: roll.id,
        rollNumber: roll.rollNumber,
        productName: roll.productName,
        quantity: 1,
        length: roll.length,
        weight: roll.weight,
      })),
      vehicleNumber: input.vehicleNumber,
      driverName: input.driverName,
      driverPhone: input.driverPhone,
      deliveryAddress: input.deliveryAddress,
      notes: input.notes,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    for (const roll of selected) {
      roll.status = 'allocated';
      roll.dispatchId = id;
      roll.orderId = order.id;
      roll.orderNumber = order.orderNumber;
      roll.updatedAt = dispatch.updatedAt;
    }
    dispatchFixtures.push(dispatch);
      return cloneDispatch(dispatch);
    }

    const created = await apiRequest<{ dispatch: BackendRow }>('/dispatches', {
      method: 'POST',
      body: {
        orderId: input.orderId,
        rollIds: input.rollIds,
        dispatchDate: iso(input.dispatchDate),
        expectedDeliveryDate: iso(input.expectedDeliveryDate),
        vehicleNumber: input.vehicleNumber,
        driverName: input.driverName,
        driverPhone: input.driverPhone,
        deliveryAddress: input.deliveryAddress,
        notes: input.notes || undefined,
      },
    });
    return mapDispatch(created.dispatch);
  },

  /** PATCH /api/dispatches/:id/status — advances a shipment along its lifecycle. */
  async updateDispatchStatus(id: string, status: Dispatch['status']): Promise<Dispatch> {
    if (USE_MOCK) {
      await delay();
    const dispatch = dispatchFixtures.find((d) => d.id === id);
    if (!dispatch) throw new ApiError('Dispatch not found', 404);

    const current = DISPATCH_STATUS_SEQUENCE.indexOf(dispatch.status);
    const next = DISPATCH_STATUS_SEQUENCE.indexOf(status);
    if (status === 'returned') {
      if (dispatch.status !== 'in_transit') {
        throw new ApiError('Only an in-transit shipment can be returned', 400);
      }
    } else if (current === -1 || next !== current + 1) {
      throw new ApiError(`Cannot move from ${dispatch.status} to ${status}`, 400);
    }

    dispatch.status = status;
      dispatch.updatedAt = new Date().toISOString().slice(0, 10);
      if (status === 'delivered') dispatch.actualDeliveryDate = dispatch.updatedAt;
      if (status === 'in_transit' || status === 'delivered') {
        for (const item of dispatch.items) {
          const roll = finishedRollFixtures.find((r) => r.id === item.finishedRollId);
          if (roll) roll.status = 'dispatched';
        }
      }
      return cloneDispatch(dispatch);
    }

    const updated = await apiRequest<{ dispatch: BackendRow }>(`/dispatches/${id}/status`, {
      method: 'PATCH',
      body: { status: upper(status) },
    });
    return mapDispatch(updated.dispatch);
  },
};
