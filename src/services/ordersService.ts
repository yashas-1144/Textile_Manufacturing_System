import type { Buyer, Order } from '@/models';
import { apiRequest, cloneFixtures, delay, USE_MOCK } from './apiClient';
import { buyers as buyerFixtures, orders as orderFixtures } from './fixtures/orders';
import { mapBuyer, mapOrder, type BackendRow } from './mappers';

export interface CreateOrderItemInput {
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface CreateOrderInput {
  buyerId: string;
  priority: Order['priority'];
  orderDate: string;
  deliveryDate: string;
  currency: string;
  items: CreateOrderItemInput[];
  notes?: string;
}

export interface CreateBuyerInput {
  name: string;
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

const upper = (v: string): string => v.toUpperCase();
const iso = (d: string): string => (d.length === 10 ? `${d}T00:00:00.000Z` : d);

function cloneOrder(o: Order): Order {
  return { ...o, items: o.items.map((i) => ({ ...i })) };
}

export const ordersService = {
  /** GET /api/orders */
  async getOrders(): Promise<Order[]> {
    if (USE_MOCK) {
      await delay();
      return orderFixtures.map(cloneOrder);
    }
    const data = await apiRequest<{ orders: BackendRow[]; total: number }>('/orders?limit=200');
    return data.orders.map(mapOrder);
  },

  /** GET /api/orders/buyers */
  async getBuyers(): Promise<Buyer[]> {
    if (USE_MOCK) {
      await delay();
      return cloneFixtures(buyerFixtures);
    }
    const data = await apiRequest<{ buyers: BackendRow[]; total: number }>('/orders/buyers?limit=200');
    return data.buyers.map(mapBuyer);
  },

  /** POST /api/orders/buyers — registers a real buyer in the directory. */
  async createBuyer(input: CreateBuyerInput): Promise<Buyer> {
    if (USE_MOCK) {
      await delay();
      const now = new Date().toISOString().slice(0, 10);
      const buyer: Buyer = {
        id: `B-${buyerFixtures.length + 1}`,
        name: input.name,
        company: input.company,
        contactPerson: input.contactPerson,
        email: input.email.toLowerCase(),
        phone: input.phone,
        address: input.address,
        city: input.city,
        country: input.country,
        status: 'active',
        totalOrders: 0,
        totalRevenue: 0,
        createdAt: now,
        updatedAt: now,
      };
      buyerFixtures.push(buyer);
      return { ...buyer };
    }

    const created = await apiRequest<{ buyer: BackendRow }>('/orders/buyers', {
      method: 'POST',
      body: { ...input, email: input.email.trim().toLowerCase() },
    });
    return mapBuyer(created.buyer);
  },

  /** POST /api/orders — persists a real order (status starts as draft). */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    if (USE_MOCK) {
      await delay();
      const buyer = buyerFixtures.find((b) => b.id === input.buyerId);
      const seq = 185 + orderFixtures.length;
      const now = new Date().toISOString();
      const totalQuantity = input.items.reduce((sum, i) => sum + i.quantity, 0);
      const totalValue = input.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const order: Order = {
        id: `O-${seq}`,
        orderNumber: `ORD-2026-${String(seq).padStart(4, '0')}`,
        buyerId: input.buyerId,
        buyerName: buyer?.name ?? '',
        status: 'draft',
        priority: input.priority,
        orderDate: input.orderDate,
        deliveryDate: input.deliveryDate,
        totalQuantity,
        totalValue,
        currency: input.currency,
        items: input.items.map((item, index) => ({
          id: `${index + 1}`,
          orderId: `O-${seq}`,
          productName: item.productName,
          specification: item.specification,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          status: 'pending',
        })),
        notes: input.notes,
        createdAt: now.slice(0, 10),
        updatedAt: now.slice(0, 10),
      };
      orderFixtures.push(order);
      return cloneOrder(order);
    }

    const created = await apiRequest<{ order: BackendRow }>('/orders', {
      method: 'POST',
      body: {
        buyerId: input.buyerId,
        priority: upper(input.priority),
        orderDate: iso(input.orderDate),
        deliveryDate: iso(input.deliveryDate),
        currency: input.currency,
        items: input.items.map((item) => ({ ...item })),
        notes: input.notes || undefined,
      },
    });
    return mapOrder(created.order);
  },
};
