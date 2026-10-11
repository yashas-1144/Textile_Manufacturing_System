import type { Expense, Invoice, Payment, Order } from '@/models';
import { expenseFixtures, invoiceFixtures, paymentFixtures } from './fixtures/finance';
import { orders } from './fixtures/orders';
import { cloneFixtures, delay, USE_MOCK, ApiError, apiRequest } from './apiClient';
import { mapExpense, mapInvoice, mapPayment, mapOrder, type BackendRow } from './mappers';

const iso = (d: string): string => (d.length === 10 ? `${d}T00:00:00.000Z` : d);
const upper = (v: string): string => v.toUpperCase();

export interface CreateExpenseInput {
  category: Expense['category'];
  description: string;
  amount: number;
  date: string;
  orderId?: string;
  status: Expense['status'];
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  method: Payment['method'];
  status: Payment['status'];
  paymentDate: string;
  reference?: string;
  notes?: string;
}

export interface FinanceSnapshot {
  expenses: Expense[];
  invoices: Invoice[];
  payments: Payment[];
  orders: Order[];
}

/** One row of the order-profitability report. */
export interface OrderFinancials {
  orderId: string;
  orderNumber: string;
  buyerName: string;
  orderStatus: string;
  contracted: number;
  invoiced: number;
  received: number;
  outstanding: number;
  expenses: number;
  estimatedProfit: number;
  marginPct: number;
  currency: string;
}

/**
 * Per-order profitability: invoiced value minus approved expenses, with cash
 * actually received tracked separately from what is still outstanding. Only
 * completed payments count as received; only approved expenses count as cost.
 */
export function computeOrderFinancials(snapshot?: Pick<FinanceSnapshot, 'orders' | 'invoices' | 'payments' | 'expenses'>): OrderFinancials[] {
  const src = snapshot ?? { orders, invoices: invoiceFixtures, payments: paymentFixtures, expenses: expenseFixtures };
  return src.orders.map((o) => {
    const orderInvoices = src.invoices.filter((i) => i.orderId === o.id);
    const invoiced = orderInvoices.reduce((sum, i) => sum + i.total, 0);
    const received = orderInvoices.reduce(
      (sum, i) => sum + src.payments.filter((p) => p.invoiceId === i.id && p.status === 'completed').reduce((s, p) => s + p.amount, 0),
      0
    );
    const expenses = src.expenses.filter((e) => e.orderId === o.id && e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
    const estimatedProfit = invoiced - expenses;
    return {
      orderId: o.id,
      orderNumber: o.orderNumber,
      buyerName: o.buyerName,
      orderStatus: o.status,
      contracted: o.totalValue,
      invoiced,
      received,
      outstanding: invoiced - received,
      expenses,
      estimatedProfit,
      marginPct: invoiced > 0 ? Math.round((estimatedProfit / invoiced) * 1000) / 10 : 0,
      currency: o.currency,
    };
  });
}

/** Sum of completed payments recorded against an invoice (fixture path). */
function receivedFor(invoiceId: string): number {
  return paymentFixtures
    .filter((p) => p.invoiceId === invoiceId && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
}

export const financeService = {
  /** GET /api/finance — expenses, invoices, payments and orders in one call. */
  async getFinance(): Promise<FinanceSnapshot> {
    if (USE_MOCK) {
      await delay();
      return {
        expenses: cloneFixtures(expenseFixtures),
        invoices: cloneFixtures(invoiceFixtures),
        payments: cloneFixtures(paymentFixtures),
        orders: orders.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) })),
      };
    }
    const data = await apiRequest<{
      expenses: BackendRow[];
      invoices: BackendRow[];
      payments: BackendRow[];
      orders: BackendRow[];
    }>('/finance');
    return {
      expenses: data.expenses.map(mapExpense),
      invoices: data.invoices.map(mapInvoice),
      payments: data.payments.map(mapPayment),
      orders: data.orders.map(mapOrder),
    };
  },

  /** POST /api/finance/expenses */
  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    if (input.amount <= 0) throw new ApiError('Amount must be greater than zero', 400);
    if (input.description.trim().length < 3) throw new ApiError('Description is too short', 400);
    if (USE_MOCK) {
      await delay();
      const order = input.orderId ? orders.find((o) => o.id === input.orderId) : undefined;
      if (input.orderId && !order) throw new ApiError('Order not found', 404);
      const seq = expenseFixtures.length + 45;
      const now = new Date().toISOString().slice(0, 10);
      const expense: Expense = {
        id: `EXP-${String(seq).padStart(4, '0')}`,
        expenseNumber: `EXP-2026-${String(seq).padStart(4, '0')}`,
        category: input.category,
        description: input.description.trim(),
        amount: input.amount,
        currency: 'INR',
        date: input.date,
        orderId: order?.id,
        orderNumber: order?.orderNumber,
        approvedBy: input.status === 'approved' ? 'Admin' : undefined,
        status: input.status,
        createdAt: now,
        updatedAt: now,
      };
      expenseFixtures.push(expense);
      return { ...expense };
    }

    const created = await apiRequest<{ expense: BackendRow }>('/finance/expenses', {
      method: 'POST',
      body: {
        category: upper(input.category),
        description: input.description.trim(),
        amount: input.amount,
        currency: 'INR',
        date: iso(input.date),
        orderId: input.orderId || undefined,
        status: upper(input.status),
      },
    });
    return mapExpense(created.expense);
  },

  /** POST /api/finance/expenses/:id/approve */
  async approveExpense(id: string): Promise<Expense> {
    if (USE_MOCK) {
      await delay();
      const expense = expenseFixtures.find((e) => e.id === id);
      if (!expense) throw new ApiError('Expense not found', 404);
      if (expense.status === 'approved') throw new ApiError('Expense is already approved', 400);
      expense.status = 'approved';
      expense.approvedBy = 'Admin';
      expense.updatedAt = new Date().toISOString().slice(0, 10);
      return { ...expense };
    }
    const updated = await apiRequest<{ expense: BackendRow }>(`/finance/expenses/${id}/approve`, {
      method: 'POST',
    });
    return mapExpense(updated.expense);
  },

  /** POST /api/finance/payments — records cash received against an invoice. */
  async recordPayment(input: RecordPaymentInput): Promise<Payment> {
    if (input.amount <= 0) throw new ApiError('Amount must be greater than zero', 400);
    if (USE_MOCK) {
      await delay();
      const invoice = invoiceFixtures.find((i) => i.id === input.invoiceId);
      if (!invoice) throw new ApiError('Invoice not found', 404);
      const alreadyReceived = receivedFor(invoice.id);
      if (input.status === 'completed' && alreadyReceived + input.amount > invoice.total) {
        throw new ApiError(
          `Payment exceeds the invoice balance of ₹${(invoice.total - alreadyReceived).toLocaleString()}`,
          400
        );
      }
      const seq = paymentFixtures.length + 67;
      const now = new Date().toISOString().slice(0, 10);
      const payment: Payment = {
        id: `PAY-${String(seq).padStart(4, '0')}`,
        paymentNumber: `PAY-2026-${String(seq).padStart(4, '0')}`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        buyerId: invoice.buyerId,
        buyerName: invoice.buyerName,
        amount: input.amount,
        currency: invoice.currency,
        method: input.method,
        status: input.status,
        paymentDate: input.paymentDate,
        reference: input.reference,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      };
      paymentFixtures.push(payment);
      if (receivedFor(invoice.id) >= invoice.total) {
        invoice.status = 'paid';
        invoice.updatedAt = now;
      }
      return { ...payment };
    }

    const created = await apiRequest<{ payment: BackendRow }>('/finance/payments', {
      method: 'POST',
      body: {
        invoiceId: input.invoiceId,
        amount: input.amount,
        method: upper(input.method),
        status: upper(input.status),
        paymentDate: iso(input.paymentDate),
        reference: input.reference || undefined,
        notes: input.notes || undefined,
      },
    });
    return mapPayment(created.payment);
  },
};
