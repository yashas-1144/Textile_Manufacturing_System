/**
 * Mock data for the TexFlow Overview Dashboard.
 *
 * NOTE: This is front-end demonstration data only. No backend API exists yet,
 * so these values are static mock fixtures and are NOT persisted anywhere.
 * When real API endpoints are available, replace this module with query hooks;
 * the presentation components consume the shapes defined here.
 */

export type ProductionRange = '7d' | '30d' | '90d';

export type ProductionPoint = {
  label: string;
  output: number;
  target: number;
};

export type ProcessOutput = {
  process: string;
  output: number;
  capacity: number;
};

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'in_production'
  | 'completed'
  | 'dispatched'
  | 'cancelled';

export interface DashboardOrder {
  id: string;
  orderNumber: string;
  buyer: string;
  product: string;
  quantity: number;
  unit: string;
  dueDate: string;
  status: OrderStatus;
}

export type StockSeverity = 'critical' | 'low';

export interface LowStockItem {
  id: string;
  material: string;
  category: string;
  available: number;
  unit: string;
  reorderThreshold: number;
  severity: StockSeverity;
}

export type MachineStatusKind = 'running' | 'idle' | 'maintenance' | 'breakdown';

export interface MachineAttention {
  id: string;
  name: string;
  type: string;
  location: string;
  status: MachineStatusKind;
  note: string;
}

export interface MachineSummary {
  total: number;
  running: number;
  idle: number;
  maintenance: number;
  breakdown: number;
  attention: MachineAttention[];
}

export interface PendingInspection {
  id: string;
  planNumber: string;
  stage: string;
  inspector: string;
  waitingFor: string;
}

export interface DispatchDue {
  id: string;
  dispatchNumber: string;
  buyer: string;
  destination: string;
  vehicle: string;
  eta: string;
  atRisk: boolean;
}

export type ActivityKind =
  | 'order'
  | 'production'
  | 'quality'
  | 'inventory'
  | 'dispatch'
  | 'machine';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  time: string;
  actor: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  in_production: { label: 'In Production', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
  dispatched: { label: 'Dispatched', variant: 'info' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

export const RANGE_OPTIONS: { value: ProductionRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

/** Daily production (metres) for the short 7-day window. */
export const productionByRange: Record<ProductionRange, ProductionPoint[]> = {
  '7d': [
    { label: 'Mon', output: 11200, target: 11000 },
    { label: 'Tue', output: 11850, target: 11500 },
    { label: 'Wed', output: 12040, target: 11800 },
    { label: 'Thu', output: 11680, target: 11800 },
    { label: 'Fri', output: 12480, target: 12000 },
    { label: 'Sat', output: 9920, target: 10000 },
    { label: 'Sun', output: 6140, target: 6000 },
  ],
  '30d': [
    { label: 'Wk 1', output: 78400, target: 77000 },
    { label: 'Wk 2', output: 82100, target: 80000 },
    { label: 'Wk 3', output: 80650, target: 80000 },
    { label: 'Wk 4', output: 84200, target: 82000 },
  ],
  '90d': [
    { label: 'Aug', output: 342000, target: 330000 },
    { label: 'Sep', output: 356400, target: 345000 },
    { label: 'Oct', output: 118900, target: 115000 },
  ],
};

export const processOutput: ProcessOutput[] = [
  { process: 'Spinning', output: 42600, capacity: 45000 },
  { process: 'Weaving', output: 38200, capacity: 41000 },
  { process: 'Dyeing', output: 29400, capacity: 33000 },
  { process: 'Finishing', output: 26850, capacity: 30000 },
];

/** Highest reading in the primary range, surfaced as "today's" output in the KPI. */
export const todaysOutput = productionByRange['7d'][4];

/** Active = orders not yet completed/cancelled (O-0184, O-0183, O-0181, O-0179, O-0176). */
export const activeOrderStats = { active: 5, delta: 0 };

export const recentOrders: DashboardOrder[] = [
  { id: 'o1', orderNumber: 'ORD-2026-0184', buyer: 'Global Textiles Inc.', product: 'Combed Cotton Poplin', quantity: 12000, unit: 'm', dueDate: '2026-10-16', status: 'in_production' },
  { id: 'o2', orderNumber: 'ORD-2026-0183', buyer: 'EuroFabric Ltd.', product: 'Poly-Cotton Twill', quantity: 8500, unit: 'm', dueDate: '2026-10-18', status: 'confirmed' },
  { id: 'o3', orderNumber: 'ORD-2026-0181', buyer: 'Asia Pacific Garments', product: 'Denim 12oz Indigo', quantity: 15000, unit: 'm', dueDate: '2026-10-14', status: 'in_production' },
  { id: 'o4', orderNumber: 'ORD-2026-0179', buyer: 'Mediterranean Textiles', product: 'Rayon Challis', quantity: 6400, unit: 'm', dueDate: '2026-10-12', status: 'confirmed' },
  { id: 'o5', orderNumber: 'ORD-2026-0176', buyer: 'Southern Cotton Co.', product: 'Cotton Canvas 10oz', quantity: 9800, unit: 'm', dueDate: '2026-10-11', status: 'draft' },
  { id: 'o6', orderNumber: 'ORD-2026-0172', buyer: 'Global Textiles Inc.', product: 'Cotton Voile', quantity: 5200, unit: 'm', dueDate: '2026-10-09', status: 'completed' },
];

export const lowStockItems: LowStockItem[] = [
  { id: 's1', material: 'Cotton Yarn NE 30/1', category: 'Yarn', available: 450, unit: 'kg', reorderThreshold: 500, severity: 'low' },
  { id: 's2', material: 'Viscose Yarn 30S', category: 'Yarn', available: 720, unit: 'kg', reorderThreshold: 800, severity: 'low' },
  { id: 's3', material: 'Reactive Dye - Scarlet', category: 'Dye', available: 40, unit: 'kg', reorderThreshold: 60, severity: 'low' },
  { id: 's4', material: 'Acetic Acid 80%', category: 'Chemical', available: 45, unit: 'L', reorderThreshold: 100, severity: 'critical' },
  { id: 's5', material: 'Elastic Tape 10mm', category: 'Accessory', available: 0, unit: 'm', reorderThreshold: 5000, severity: 'critical' },
];

export const machineSummary: MachineSummary = {
  total: 12,
  running: 8,
  idle: 2,
  maintenance: 1,
  breakdown: 1,
  attention: [
    { id: 'm1', name: 'WM-04', type: 'Weaving', location: 'Floor 2 - Zone A', status: 'maintenance', note: 'Scheduled service today' },
    { id: 'm2', name: 'WM-07', type: 'Weaving', location: 'Floor 2 - Zone B', status: 'breakdown', note: 'Under repair' },
  ],
};

/**
 * Awaiting-inspection items. Every entry references a real production plan and a
 * stage that is complete, in progress, or on hold, and that has no matching
 * record in `src/services/fixtures/quality.ts`.
 */
export const pendingInspections: PendingInspection[] = [
  { id: 'q1', planNumber: 'PP-2026-0155', stage: 'Spinning', inspector: 'John Smith', waitingFor: 'Yarn count check' },
  { id: 'q2', planNumber: 'PP-2026-0155', stage: 'Weaving', inspector: 'Maria Garcia', waitingFor: 'Sample batch' },
  { id: 'q3', planNumber: 'PP-2026-0155', stage: 'Final', inspector: 'Priya Patel', waitingFor: 'Final inspection' },
  { id: 'q4', planNumber: 'PP-2026-0157', stage: 'Spinning', inspector: 'John Smith', waitingFor: 'Yarn count check' },
  { id: 'q5', planNumber: 'PP-2026-0159', stage: 'Weaving', inspector: 'Maria Garcia', waitingFor: 'Shade approval' },
  { id: 'q6', planNumber: 'PP-2026-0159', stage: 'Final', inspector: 'Priya Patel', waitingFor: 'Roll inspection' },
];

export const dispatchesDueToday: DispatchDue[] = [
  { id: 'd1', dispatchNumber: 'DIS-2026-0091', buyer: 'Global Textiles Inc.', destination: 'New York, USA', vehicle: 'TRK-2210', eta: '11:30', atRisk: false },
  { id: 'd2', dispatchNumber: 'DIS-2026-0092', buyer: 'EuroFabric Ltd.', destination: 'Berlin, Germany', vehicle: 'TRK-8890', eta: '14:00', atRisk: false },
  { id: 'd3', dispatchNumber: 'DIS-2026-0093', buyer: 'Asia Pacific Garments', destination: 'Shanghai, China', vehicle: 'TRK-3345', eta: '16:15', atRisk: true },
  { id: 'd4', dispatchNumber: 'DIS-2026-0094', buyer: 'Southern Cotton Co.', destination: 'Atlanta, USA', vehicle: 'TRK-5521', eta: '17:45', atRisk: false },
];

export const activityFeed: ActivityItem[] = [
  { id: 'a1', kind: 'order', title: 'Order ORD-2026-0183 confirmed', detail: 'EuroFabric Ltd. · 8,500 m Poly-Cotton Twill', time: '12 min ago', actor: 'Sales Desk' },
  { id: 'a2', kind: 'production', title: 'Production completed on PP-2026-0155', detail: 'Spinning stage · 5,200 m output', time: '48 min ago', actor: 'Spin Hall B' },
  { id: 'a3', kind: 'quality', title: 'Quality inspection recorded', detail: 'QI-2026-0204 conditional · PP-2026-0156 weaving', time: '1 hr ago', actor: 'Maria Garcia' },
  { id: 'a4', kind: 'inventory', title: 'Raw material received', detail: 'Polyester Yarn 150D/48F · 500 kg', time: '2 hr ago', actor: 'Warehouse Team' },
  { id: 'a5', kind: 'machine', title: 'Machine efficiency improved', detail: 'WM-05 raised to 96% efficiency', time: '3 hr ago', actor: 'Maintenance Team' },
  { id: 'a6', kind: 'dispatch', title: 'Dispatch delivered', detail: 'DIS-2026-0090 · New York, USA', time: '4 hr ago', actor: 'Logistics Team' },
];

/** Options used by the Create Order form (front-end only). */
export const buyerOptions = [
  { value: 'Global Textiles Inc.', label: 'Global Textiles Inc.' },
  { value: 'EuroFabric Ltd.', label: 'EuroFabric Ltd.' },
  { value: 'Asia Pacific Garments', label: 'Asia Pacific Garments' },
  { value: 'Mediterranean Textiles', label: 'Mediterranean Textiles' },
  { value: 'Southern Cotton Co.', label: 'Southern Cotton Co.' },
];

export const productOptions = [
  { value: 'Combed Cotton Poplin', label: 'Combed Cotton Poplin' },
  { value: 'Poly-Cotton Twill', label: 'Poly-Cotton Twill' },
  { value: 'Denim 12oz Indigo', label: 'Denim 12oz Indigo' },
  { value: 'Rayon Challis', label: 'Rayon Challis' },
  { value: 'Cotton Canvas 10oz', label: 'Cotton Canvas 10oz' },
  { value: 'Cotton Voile', label: 'Cotton Voile' },
];

export const unitOptions = [
  { value: 'm', label: 'Metres (m)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'rolls', label: 'Rolls' },
];

export const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];
