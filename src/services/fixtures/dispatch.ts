import type { Dispatch, DispatchItem } from '@/models';

function dispatchItem(id: string, dispatchId: string, finishedRollId: string, rollNumber: string, productName: string, length: number, weight: number): DispatchItem {
  return { id, dispatchId, finishedRollId, rollNumber, productName, quantity: 1, length, weight };
}

/**
 * Mock dispatch fixtures. Each dispatch links to a buyer order and to specific
 * finished rolls (by roll number), matching the finished-goods fixture.
 */
export const dispatchFixtures: Dispatch[] = [
  {
    id: 'DIS-0094', dispatchNumber: 'DIS-2026-0094', orderId: 'O-0176', orderNumber: 'ORD-2026-0176', buyerId: '5', buyerName: 'Southern Cotton Co.',
    status: 'planned', dispatchDate: '2026-10-12', expectedDeliveryDate: '2026-10-18',
    items: [], vehicleNumber: 'TRK-5521', driverName: 'James Carter', driverPhone: '+1-555-0455',
    deliveryAddress: '555 Cotton Blvd, Atlanta, USA', notes: 'Awaiting packing of Cotton Canvas rolls', createdAt: '2026-10-10', updatedAt: '2026-10-10',
  },
  {
    id: 'DIS-0093', dispatchNumber: 'DIS-2026-0093', orderId: 'O-0181', orderNumber: 'ORD-2026-0181', buyerId: '3', buyerName: 'Asia Pacific Garments',
    status: 'in_transit', dispatchDate: '2026-10-09', expectedDeliveryDate: '2026-10-14',
    items: [dispatchItem('DI-0093-1', 'DIS-0093', 'FR-0109', 'FR-2026-0109', 'Denim 12oz Indigo', 128, 32.0)],
    vehicleNumber: 'TRK-3345', driverName: 'Li Zhang', driverPhone: '+86-21-88776655',
    deliveryAddress: '789 Silk Road, Shanghai, China', notes: 'Shade swatch included', createdAt: '2026-10-09', updatedAt: '2026-10-09',
  },
  {
    id: 'DIS-0092', dispatchNumber: 'DIS-2026-0092', orderId: 'O-0183', orderNumber: 'ORD-2026-0183', buyerId: '2', buyerName: 'EuroFabric Ltd.',
    status: 'packed', dispatchDate: '2026-10-10', expectedDeliveryDate: '2026-10-18',
    items: [
      dispatchItem('DI-0092-1', 'DIS-0092', 'FR-0105', 'FR-2026-0105', 'Poly-Cotton Twill', 120, 24.0),
      dispatchItem('DI-0092-2', 'DIS-0092', 'FR-0106', 'FR-2026-0106', 'Poly-Cotton Twill', 118, 23.6),
    ],
    vehicleNumber: 'TRK-8890', driverName: 'Hans Mueller', driverPhone: '+49-30-1234567',
    deliveryAddress: '456 Fabric Strasse, Berlin, Germany', notes: 'Fragile handling', createdAt: '2026-10-10', updatedAt: '2026-10-10',
  },
  {
    id: 'DIS-0091', dispatchNumber: 'DIS-2026-0091', orderId: 'O-0184', orderNumber: 'ORD-2026-0184', buyerId: '1', buyerName: 'Global Textiles Inc.',
    status: 'loaded', dispatchDate: '2026-10-10', expectedDeliveryDate: '2026-10-16',
    items: [
      dispatchItem('DI-0091-1', 'DIS-0091', 'FR-0101', 'FR-2026-0101', 'Combed Cotton Poplin', 105, 18.9),
      dispatchItem('DI-0091-2', 'DIS-0091', 'FR-0102', 'FR-2026-0102', 'Combed Cotton Poplin', 102, 18.4),
    ],
    vehicleNumber: 'TRK-2210', driverName: 'Robert Chen', driverPhone: '+1-555-0198',
    deliveryAddress: '123 Textile Ave, New York, USA', notes: 'Delivery by 3 PM', createdAt: '2026-10-10', updatedAt: '2026-10-10',
  },
  {
    id: 'DIS-0090', dispatchNumber: 'DIS-2026-0090', orderId: 'O-0172', orderNumber: 'ORD-2026-0172', buyerId: '1', buyerName: 'Global Textiles Inc.',
    status: 'delivered', dispatchDate: '2026-10-06', expectedDeliveryDate: '2026-10-09', actualDeliveryDate: '2026-10-09',
    items: [dispatchItem('DI-0090-1', 'DIS-0090', 'FR-0110', 'FR-2026-0110', 'Cotton Voile', 110, 13.5)],
    vehicleNumber: 'TRK-4471', driverName: 'David Park', driverPhone: '+1-555-0234',
    deliveryAddress: '123 Textile Ave, New York, USA', notes: 'Delivered and signed', createdAt: '2026-10-06', updatedAt: '2026-10-09',
  },
];

/** Allowed forward transitions for a shipment, used to guard status updates. */
export const DISPATCH_STATUS_SEQUENCE: Dispatch['status'][] = ['planned', 'packed', 'loaded', 'in_transit', 'delivered'];
