import type { Buyer, Order, OrderItem } from '@/models';

export interface OrderOption {
  value: string;
  label: string;
}

/**
 * Shared buyer + order fixtures for Stage 5 (Finished Goods, Dispatch, Finance).
 *
 * These are front-end demonstration records only — there is no backend API yet.
 * They intentionally reuse the same buyer names and ORD-2026-xxxx order numbers
 * used by the dashboard and production/quality modules so that finished rolls,
 * dispatches, invoices, payments, and expenses all reference the same orders.
 */

export const buyers: Buyer[] = [
  { id: '1', name: 'Global Textiles Inc.', company: 'Global Textiles Inc.', contactPerson: 'Sarah Johnson', email: 'sarah@globaltextiles.com', phone: '+1-555-0123', address: '123 Textile Ave', city: 'New York', country: 'USA', status: 'active', totalOrders: 45, totalRevenue: 2850000, createdAt: '2023-01-15', updatedAt: '2024-01-10' },
  { id: '2', name: 'EuroFabric Ltd.', company: 'EuroFabric Ltd.', contactPerson: 'Hans Mueller', email: 'hans@eurofabric.de', phone: '+49-30-1234567', address: '456 Fabric Strasse', city: 'Berlin', country: 'Germany', status: 'active', totalOrders: 32, totalRevenue: 1920000, createdAt: '2023-03-22', updatedAt: '2024-01-08' },
  { id: '3', name: 'Asia Pacific Garments', company: 'Asia Pacific Garments', contactPerson: 'Li Wei', email: 'liwei@apgarments.cn', phone: '+86-21-87654321', address: '789 Silk Road', city: 'Shanghai', country: 'China', status: 'active', totalOrders: 28, totalRevenue: 1560000, createdAt: '2023-06-10', updatedAt: '2024-01-05' },
  { id: '4', name: 'Mediterranean Textiles', company: 'Mediterranean Textiles', contactPerson: 'Giovanni Rossi', email: 'giovanni@medtextiles.it', phone: '+39-02-555555', address: 'Via della Seta 12', city: 'Milan', country: 'Italy', status: 'pending', totalOrders: 12, totalRevenue: 680000, createdAt: '2023-11-05', updatedAt: '2024-01-12' },
  { id: '5', name: 'Southern Cotton Co.', company: 'Southern Cotton Co.', contactPerson: 'James Wilson', email: 'james@southerncotton.us', phone: '+1-555-0987', address: '555 Cotton Blvd', city: 'Atlanta', country: 'USA', status: 'inactive', totalOrders: 8, totalRevenue: 340000, createdAt: '2022-08-14', updatedAt: '2023-12-01' },
];

function item(id: string, orderId: string, product: string, specification: string, quantity: number, unitPrice: number, unit = 'm', status: OrderItem['status'] = 'pending'): OrderItem {
  return { id, orderId, productName: product, specification, quantity, unit, unitPrice, totalPrice: quantity * unitPrice, status };
}

export const orders: Order[] = [
  {
    id: 'O-0184', orderNumber: 'ORD-2026-0184', buyerId: '1', buyerName: 'Global Textiles Inc.',
    status: 'in_production', priority: 'medium', orderDate: '2026-09-28', deliveryDate: '2026-10-16',
    totalQuantity: 12000, totalValue: 38400, currency: 'INR',
    items: [item('O-0184-I1', 'O-0184', 'Combed Cotton Poplin', '100% Cotton, 120 GSM', 12000, 3.2, 'm', 'in_production')],
    notes: 'Deliver in two equal lots', createdAt: '2026-09-28', updatedAt: '2026-10-08',
  },
  {
    id: 'O-0183', orderNumber: 'ORD-2026-0183', buyerId: '2', buyerName: 'EuroFabric Ltd.',
    status: 'confirmed', priority: 'medium', orderDate: '2026-10-01', deliveryDate: '2026-10-18',
    totalQuantity: 8500, totalValue: 23800, currency: 'INR',
    items: [item('O-0183-I1', 'O-0183', 'Poly-Cotton Twill', '65/35 Poly-Cotton, 180 GSM', 8500, 2.8, 'm', 'pending')],
    createdAt: '2026-10-01', updatedAt: '2026-10-08',
  },
  {
    id: 'O-0181', orderNumber: 'ORD-2026-0181', buyerId: '3', buyerName: 'Asia Pacific Garments',
    status: 'in_production', priority: 'high', orderDate: '2026-09-20', deliveryDate: '2026-10-14',
    totalQuantity: 15000, totalValue: 67500, currency: 'INR',
    items: [item('O-0181-I1', 'O-0181', 'Denim 12oz Indigo', '100% Cotton, 12oz', 15000, 4.5, 'm', 'in_production')],
    notes: 'Indigo shade must match approved swatch', createdAt: '2026-09-20', updatedAt: '2026-10-09',
  },
  {
    id: 'O-0179', orderNumber: 'ORD-2026-0179', buyerId: '4', buyerName: 'Mediterranean Textiles',
    status: 'confirmed', priority: 'urgent', orderDate: '2026-09-18', deliveryDate: '2026-10-12',
    totalQuantity: 6400, totalValue: 25600, currency: 'INR',
    items: [item('O-0179-I1', 'O-0179', 'Rayon Challis', '100% Rayon, 110 GSM', 6400, 4.0, 'm', 'pending')],
    notes: 'Awaiting final shade approval', createdAt: '2026-09-18', updatedAt: '2026-10-10',
  },
  {
    id: 'O-0176', orderNumber: 'ORD-2026-0176', buyerId: '5', buyerName: 'Southern Cotton Co.',
    status: 'draft', priority: 'low', orderDate: '2026-09-15', deliveryDate: '2026-10-11',
    totalQuantity: 9800, totalValue: 35280, currency: 'INR',
    items: [item('O-0176-I1', 'O-0176', 'Cotton Canvas 10oz', '100% Cotton, 10oz', 9800, 3.6, 'm', 'pending')],
    createdAt: '2026-09-15', updatedAt: '2026-09-15',
  },
  {
    id: 'O-0172', orderNumber: 'ORD-2026-0172', buyerId: '1', buyerName: 'Global Textiles Inc.',
    status: 'completed', priority: 'high', orderDate: '2026-09-05', deliveryDate: '2026-10-09',
    totalQuantity: 5200, totalValue: 15600, currency: 'INR',
    items: [item('O-0172-I1', 'O-0172', 'Cotton Voile', '100% Cotton, 90 GSM', 5200, 3.0, 'm', 'completed')],
    createdAt: '2026-09-05', updatedAt: '2026-10-09',
  },
];

export const orderOptions: OrderOption[] = orders.map((o) => ({
  value: o.id,
  label: `${o.orderNumber} · ${o.buyerName} · ${o.items[0]?.productName ?? ''}`,
}));
