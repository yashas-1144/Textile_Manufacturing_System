export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Buyer {
  id: string;
  name: string;
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: 'active' | 'inactive' | 'pending';
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  status: 'draft' | 'confirmed' | 'in_production' | 'completed' | 'dispatched' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderDate: string;
  deliveryDate: string;
  totalQuantity: number;
  totalValue: number;
  currency: string;
  items: OrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'in_production' | 'completed' | 'cancelled';
}

export interface RawMaterial {
  id: string;
  name: string;
  category: 'yarn' | 'chemical' | 'dye' | 'accessory';
  specification: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitCost: number;
  supplier: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionPlan {
  id: string;
  planNumber: string;
  orderId: string;
  orderNumber: string;
  buyerName: string;
  productName: string;
  quantity: number;
  unit: string;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  stages: ProductionStage[];
  assignedMachines: string[];
  assignedWorkers: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionStage {
  id: string;
  planId: string;
  name: 'spinning' | 'weaving' | 'dyeing' | 'finishing' | 'inspection';
  displayName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'failed';
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  quantity: number;
  completedQuantity: number;
  rejectedQuantity: number;
  machineId?: string;
  operatorId?: string;
  notes?: string;
}

export interface Machine {
  id: string;
  name: string;
  type: 'spinning' | 'weaving' | 'dyeing' | 'finishing' | 'inspection' | 'other';
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: 'idle' | 'running' | 'maintenance' | 'breakdown' | 'offline';
  location: string;
  capacity: number;
  unit: string;
  currentOutput: number;
  efficiency: number;
  lastMaintenance: string;
  nextMaintenance: string;
  totalRuntime: number;
  createdAt: string;
  updatedAt: string;
}

export interface QualityInspection {
  id: string;
  inspectionNumber: string;
  productionPlanId: string;
  productionPlanNumber: string;
  stage: 'spinning' | 'weaving' | 'dyeing' | 'finishing' | 'final';
  inspectorId: string;
  inspectorName: string;
  sampleSize: number;
  passedCount: number;
  failedCount: number;
  status: 'passed' | 'failed' | 'conditional' | 'pending';
  defects: Defect[];
  notes?: string;
  inspectedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Defect {
  id: string;
  inspectionId: string;
  type: 'hole' | 'stain' | 'color_mismatch' | 'dimension' | 'weaving_fault' | 'other';
  severity: 'minor' | 'major' | 'critical';
  location: string;
  description: string;
  count: number;
  images?: string[];
}

export interface FinishedRoll {
  id: string;
  rollNumber: string;
  productionPlanId: string;
  productionPlanNumber: string;
  productName: string;
  specification: string;
  length: number;
  width: number;
  weight: number;
  unit: string;
  qualityGrade: 'A' | 'B' | 'C' | 'reject';
  location: string;
  status: 'available' | 'allocated' | 'dispatched' | 'returned';
  orderId?: string;
  orderNumber?: string;
  dispatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dispatch {
  id: string;
  dispatchNumber: string;
  orderId: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  status: 'planned' | 'packed' | 'loaded' | 'in_transit' | 'delivered' | 'returned';
  dispatchDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  items: DispatchItem[];
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchItem {
  id: string;
  dispatchId: string;
  finishedRollId: string;
  rollNumber: string;
  productName: string;
  quantity: number;
  length: number;
  weight: number;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  category: 'raw_material' | 'labor' | 'utility' | 'maintenance' | 'transport' | 'admin' | 'other';
  description: string;
  amount: number;
  currency: string;
  date: string;
  orderId?: string;
  orderNumber?: string;
  productionPlanId?: string;
  productionPlanNumber?: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'cash' | 'cheque' | 'card' | 'online';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  id: string;
  employeeId: string;
  name: string;
  department: 'spinning' | 'weaving' | 'dyeing' | 'finishing' | 'quality' | 'maintenance' | 'admin' | 'warehouse';
  role: string;
  shift: 'morning' | 'evening' | 'night' | 'general';
  hourlyRate: number;
  overtimeRate: number;
  status: 'active' | 'inactive' | 'on_leave';
  hireDate: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  overtimeHours: number;
  shift: 'morning' | 'evening' | 'night' | 'general';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wage {
  id: string;
  workerId: string;
  workerName: string;
  periodStart: string;
  periodEnd: string;
  baseHours: number;
  overtimeHours: number;
  basePay: number;
  overtimePay: number;
  deductions: number;
  bonuses: number;
  netPay: number;
  status: 'calculated' | 'approved' | 'paid';
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type StatusType = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'in_progress' | 'on_hold' | 'failed';

export const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-green-700', bgColor: 'bg-green-100' },
  inactive: { label: 'Inactive', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  completed: { label: 'Completed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
  in_progress: { label: 'In Progress', color: 'text-primary-700', bgColor: 'bg-primary-100' },
  on_hold: { label: 'On Hold', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  failed: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  medium: { label: 'Medium', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  high: { label: 'High', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  urgent: { label: 'Urgent', color: 'text-red-700', bgColor: 'bg-red-100' },
} as const;