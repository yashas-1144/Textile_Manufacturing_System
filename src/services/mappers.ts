/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Backend → frontend mappers.
 *
 * The REST API returns Prisma rows: UPPERCASE enums, full ISO timestamps,
 * relational `buyer`/`order`/`productionPlan` objects, and list envelopes such
 * as `{ materials, total }`. The UI models expect lowercase snake_case enums,
 * `YYYY-MM-DD` dates, and flattened name fields. Every live service read goes
 * through these mappers so components keep receiving plain UI models.
 */
import type {
  Attendance,
  Buyer,
  Defect,
  Dispatch,
  DispatchItem,
  Expense,
  FinishedRoll,
  Invoice,
  InvoiceItem,
  Machine,
  Order,
  OrderItem,
  Payment,
  ProductionPlan,
  ProductionStage,
  QualityInspection,
  RawMaterial,
  Wage,
  Worker,
} from '@/models';
import type { MachineRecord } from './fixtures/machines';
import type { QualityRecord, ReworkStatus } from './fixtures/quality';
import type { QcStatus, RollRecord } from './fixtures/finishedGoods';

type Row = Record<string, any>;

/** Loosely-typed backend row handed to the map* helpers. */
export type BackendRow = Row;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const lower = (v: unknown): string => (typeof v === 'string' ? v.toLowerCase() : '');
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const day = (v: unknown): string => str(v).slice(0, 10);
const dayTime = (v: unknown): string => str(v).slice(0, 19);
const timeOfDay = (v: unknown): string => {
  const s = str(v);
  return s.length >= 16 ? s.slice(11, 16) : '';
};
const optStr = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);
const optDay = (v: unknown): string | undefined => (typeof v === 'string' && v ? v.slice(0, 10) : undefined);
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

export function mapMaterial(r: Row): RawMaterial {
  const currentStock = num(r.currentStock);
  const minimumStock = num(r.minimumStock);
  return {
    id: str(r.id),
    name: str(r.name),
    category: lower(r.category) as RawMaterial['category'],
    specification: str(r.specification),
    unit: str(r.unit),
    currentStock,
    minimumStock,
    maximumStock: num(r.maximumStock),
    unitCost: num(r.unitCost),
    supplier: str(r.supplier?.name),
    location: str(r.location),
    status: currentStock <= 0 ? 'out_of_stock' : currentStock <= minimumStock ? 'low_stock' : 'in_stock',
    lastRestocked: day(r.lastRestocked),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

export function mapMachine(r: Row): MachineRecord {
  return {
    id: str(r.id),
    name: str(r.name),
    type: lower(r.type) as Machine['type'],
    model: str(r.model),
    manufacturer: str(r.manufacturer),
    serialNumber: str(r.serialNumber),
    status: lower(r.status) as Machine['status'],
    location: str(r.location),
    capacity: num(r.capacity),
    unit: str(r.unit),
    currentOutput: num(r.currentOutput),
    efficiency: num(r.efficiency),
    utilization: num(r.utilization),
    downtimeHours: num(r.downtimeHours),
    lastMaintenance: day(r.lastMaintenance),
    nextMaintenance: day(r.nextMaintenance),
    totalRuntime: num(r.totalRuntime),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

export function mapStage(r: Row): ProductionStage {
  return {
    id: str(r.id),
    planId: str(r.planId),
    name: lower(r.name) as ProductionStage['name'],
    displayName: str(r.displayName),
    status: lower(r.status) as ProductionStage['status'],
    startDate: day(r.startDate),
    endDate: day(r.endDate),
    actualStartDate: optDay(r.actualStartDate),
    actualEndDate: optDay(r.actualEndDate),
    quantity: num(r.quantity),
    completedQuantity: num(r.completedQuantity),
    rejectedQuantity: num(r.rejectedQuantity),
    machineId: optStr(r.machineId),
    operatorId: optStr(r.operatorId),
    notes: optStr(r.notes),
  };
}

export function mapPlan(r: Row): ProductionPlan {
  return {
    id: str(r.id),
    planNumber: str(r.planNumber),
    orderId: str(r.orderId),
    orderNumber: str(r.order?.orderNumber),
    buyerName: str(r.order?.buyer?.name),
    productName: str(r.productName),
    quantity: num(r.quantity),
    unit: str(r.unit),
    status: lower(r.status) as ProductionPlan['status'],
    priority: lower(r.priority) as ProductionPlan['priority'],
    startDate: day(r.startDate),
    endDate: day(r.endDate),
    actualStartDate: optDay(r.actualStartDate),
    actualEndDate: optDay(r.actualEndDate),
    stages: rows(r.stages).map(mapStage),
    assignedMachines: rows(r.machineAssignments)
      .map((a) => str(a?.machine?.name))
      .filter(Boolean),
    assignedWorkers: rows(r.workerAssignments)
      .map((a) => str(a?.worker?.id))
      .filter(Boolean),
    notes: optStr(r.notes),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

function parseImages(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string' && v) {
    try {
      const parsed: unknown = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as string[]) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function mapDefect(r: Row): Defect {
  return {
    id: str(r.id),
    inspectionId: str(r.inspectionId),
    type: lower(r.type) as Defect['type'],
    severity: lower(r.severity) as Defect['severity'],
    location: str(r.location),
    description: str(r.description),
    count: num(r.count),
    images: parseImages(r.images),
  };
}

export function mapInspection(r: Row): QualityRecord {
  const rework = (r.rework ?? null) as Row | null;
  return {
    id: str(r.id),
    inspectionNumber: str(r.inspectionNumber),
    productionPlanId: str(r.productionPlanId),
    productionPlanNumber: str(r.productionPlan?.planNumber) || str(r.productionPlanId),
    stage: lower(r.stage) as QualityInspection['stage'],
    inspectorId: str(r.inspectorId),
    inspectorName: str(r.inspectorName),
    sampleSize: num(r.sampleSize),
    passedCount: num(r.passedCount),
    failedCount: num(r.failedCount),
    status: lower(r.status) as QualityInspection['status'],
    defects: rows(r.defects).map(mapDefect),
    notes: optStr(r.notes),
    inspectedAt: dayTime(r.inspectedAt) || dayTime(r.createdAt),
    createdAt: dayTime(r.createdAt),
    updatedAt: dayTime(r.updatedAt),
    rework: {
      status: (lower(rework?.status) as ReworkStatus) || 'not_required',
      quantity: num(rework?.quantity),
      notes: optStr(rework?.notes),
    },
  };
}

export function mapRoll(r: Row): RollRecord {
  const grade = lower(r.qualityGrade) === 'reject' ? 'reject' : str(r.qualityGrade);
  return {
    id: str(r.id),
    rollNumber: str(r.rollNumber),
    productionPlanId: str(r.productionPlanId),
    productionPlanNumber: str(r.productionPlan?.planNumber) || str(r.productionPlanId),
    productName: str(r.productName),
    specification: str(r.specification),
    length: num(r.length),
    width: num(r.width),
    weight: num(r.weight),
    unit: str(r.unit) || 'meters',
    qualityGrade: (grade || 'B') as FinishedRoll['qualityGrade'],
    location: str(r.location),
    status: lower(r.status) as FinishedRoll['status'],
    orderId: optStr(r.orderId),
    orderNumber: str(r.order?.orderNumber) || optStr(r.orderNumber),
    dispatchId: optStr(r.dispatchId),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
    qcStatus: lower(r.qcStatus) as QcStatus,
    readyForDispatch: Boolean(r.readyForDispatch),
    inspectionNumber: optStr(r.inspectionNumber),
  };
}

export function mapDispatchItem(r: Row): DispatchItem {
  return {
    id: str(r.id),
    dispatchId: str(r.dispatchId),
    finishedRollId: str(r.rollId),
    rollNumber: str(r.rollNumber),
    productName: str(r.productName),
    quantity: num(r.quantity),
    length: num(r.length),
    weight: num(r.weight),
  };
}

export function mapDispatch(r: Row): Dispatch {
  return {
    id: str(r.id),
    dispatchNumber: str(r.dispatchNumber),
    orderId: str(r.orderId),
    orderNumber: str(r.order?.orderNumber) || str(r.orderNumber),
    buyerId: str(r.buyerId),
    buyerName: str(r.buyer?.name),
    status: lower(r.status) as Dispatch['status'],
    dispatchDate: day(r.dispatchDate),
    expectedDeliveryDate: day(r.expectedDeliveryDate),
    actualDeliveryDate: optDay(r.actualDeliveryDate),
    items: rows(r.items).map(mapDispatchItem),
    vehicleNumber: str(r.vehicleNumber),
    driverName: str(r.driverName),
    driverPhone: str(r.driverPhone),
    deliveryAddress: str(r.deliveryAddress),
    notes: optStr(r.notes),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

export function mapBuyer(r: Row): Buyer {
  return {
    id: str(r.id),
    name: str(r.name),
    company: str(r.company),
    contactPerson: str(r.contactPerson),
    email: str(r.email),
    phone: str(r.phone),
    address: str(r.address),
    city: str(r.city),
    country: str(r.country),
    status: (lower(r.status) || 'active') as Buyer['status'],
    totalOrders: num(r.totalOrders),
    totalRevenue: num(r.totalRevenue),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

export function mapOrderItem(r: Row): OrderItem {
  return {
    id: str(r.id),
    orderId: str(r.orderId),
    productName: str(r.productName),
    specification: str(r.specification),
    quantity: num(r.quantity),
    unit: str(r.unit),
    unitPrice: num(r.unitPrice),
    totalPrice: num(r.totalPrice),
    status: lower(r.status) as OrderItem['status'],
  };
}

export function mapOrder(r: Row): Order {
  return {
    id: str(r.id),
    orderNumber: str(r.orderNumber),
    buyerId: str(r.buyerId),
    buyerName: str(r.buyer?.name),
    status: lower(r.status) as Order['status'],
    priority: lower(r.priority) as Order['priority'],
    orderDate: day(r.orderDate),
    deliveryDate: day(r.deliveryDate),
    totalQuantity: num(r.totalQuantity),
    totalValue: num(r.totalValue),
    currency: str(r.currency) || 'INR',
    items: rows(r.items).map(mapOrderItem),
    notes: optStr(r.notes),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

export function mapExpense(r: Row): Expense {
  return {
    id: str(r.id),
    expenseNumber: str(r.expenseNumber),
    category: lower(r.category) as Expense['category'],
    description: str(r.description),
    amount: num(r.amount),
    currency: str(r.currency) || 'INR',
    date: day(r.date),
    orderId: optStr(r.orderId),
    orderNumber: str(r.order?.orderNumber) || optStr(r.orderNumber),
    productionPlanId: optStr(r.productionPlanId),
    productionPlanNumber: str(r.productionPlan?.planNumber) || optStr(r.productionPlanNumber),
    approvedBy: optStr(r.approvedBy),
    status: lower(r.status) as Expense['status'],
    receiptUrl: optStr(r.receiptUrl),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

export function mapInvoiceItem(r: Row): InvoiceItem {
  return {
    id: str(r.id),
    invoiceId: str(r.invoiceId),
    description: str(r.description),
    quantity: num(r.quantity),
    unit: str(r.unit),
    unitPrice: num(r.unitPrice),
    totalPrice: num(r.totalPrice),
  };
}

export function mapInvoice(r: Row): Invoice {
  return {
    id: str(r.id),
    invoiceNumber: str(r.invoiceNumber),
    orderId: str(r.orderId),
    orderNumber: str(r.order?.orderNumber) || str(r.orderNumber),
    buyerId: str(r.buyerId),
    buyerName: str(r.buyer?.name),
    issueDate: day(r.issueDate),
    dueDate: day(r.dueDate),
    status: lower(r.status) as Invoice['status'],
    items: rows(r.items).map(mapInvoiceItem),
    subtotal: num(r.subtotal),
    tax: num(r.tax),
    discount: num(r.discount),
    total: num(r.total),
    currency: str(r.currency) || 'INR',
    notes: optStr(r.notes),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

export function mapPayment(r: Row): Payment {
  return {
    id: str(r.id),
    paymentNumber: str(r.paymentNumber),
    invoiceId: str(r.invoiceId),
    invoiceNumber: str(r.invoice?.invoiceNumber) || str(r.invoiceNumber),
    buyerId: str(r.buyerId),
    buyerName: str(r.buyer?.name),
    amount: num(r.amount),
    currency: str(r.currency) || 'INR',
    method: lower(r.method) as Payment['method'],
    status: lower(r.status) as Payment['status'],
    paymentDate: day(r.paymentDate),
    reference: optStr(r.reference),
    notes: optStr(r.notes),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

export function mapWorker(r: Row): Worker {
  return {
    id: str(r.id),
    employeeId: str(r.employeeId),
    name: str(r.name),
    department: lower(r.department) as Worker['department'],
    role: str(r.role),
    shift: lower(r.shift) as Worker['shift'],
    hourlyRate: num(r.hourlyRate),
    overtimeRate: num(r.overtimeRate),
    status: lower(r.status) as Worker['status'],
    hireDate: day(r.hireDate),
    contactPhone: str(r.contactPhone),
    contactEmail: str(r.contactEmail),
    address: str(r.address),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

export function mapAttendance(r: Row): Attendance {
  return {
    id: str(r.id),
    workerId: str(r.workerId),
    workerName: str(r.worker?.name) || str(r.workerName),
    date: day(r.date),
    checkIn: timeOfDay(r.checkIn) || '09:00',
    checkOut: r.checkOut ? timeOfDay(r.checkOut) : undefined,
    status: lower(r.status) as Attendance['status'],
    overtimeHours: num(r.overtimeHours),
    shift: lower(r.shift) as Attendance['shift'],
    notes: optStr(r.notes),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}

export function mapWage(r: Row): Wage {
  return {
    id: str(r.id),
    workerId: str(r.workerId),
    workerName: str(r.worker?.name) || str(r.workerName),
    periodStart: day(r.periodStart),
    periodEnd: day(r.periodEnd),
    baseHours: num(r.baseHours),
    overtimeHours: num(r.overtimeHours),
    basePay: num(r.basePay),
    overtimePay: num(r.overtimePay),
    deductions: num(r.deductions),
    bonuses: num(r.bonuses),
    netPay: num(r.netPay),
    status: lower(r.status) as Wage['status'],
    paidDate: optDay(r.paidDate),
    createdAt: day(r.createdAt),
    updatedAt: day(r.updatedAt),
  };
}
