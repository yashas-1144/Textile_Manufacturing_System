import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, type SelectOption } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Expense, Invoice, Order, Payment } from '@/models';
import type { CreateExpenseInput, RecordPaymentInput } from '@/services/financeService';

const today = () => new Date().toISOString().slice(0, 10);

const categoryOptions: SelectOption[] = [
  { value: 'raw_material', label: 'Raw Material' },
  { value: 'labor', label: 'Labor' },
  { value: 'utility', label: 'Utility' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'transport', label: 'Transport' },
  { value: 'admin', label: 'Admin' },
  { value: 'other', label: 'Other' },
];

const expenseStatusOptions: SelectOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
];

const methodOptions: SelectOption[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
];

const paymentStatusOptions: SelectOption[] = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
];

interface ExpenseFormModalProps {
  isOpen: boolean;
  orders: Order[];
  onClose: () => void;
  onSubmit: (input: CreateExpenseInput) => void;
}

export function ExpenseFormModal({ isOpen, orders, onClose, onSubmit }: ExpenseFormModalProps) {
  const [category, setCategory] = useState<Expense['category']>('raw_material');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState<Expense['status']>('pending');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const orderOptions: SelectOption[] = [
    { value: '', label: 'No linked order' },
    ...orders.map((o) => ({ value: o.id, label: `${o.orderNumber} · ${o.buyerName}` })),
  ];

  const reset = () => {
    setCategory('raw_material');
    setDescription('');
    setAmount('');
    setDate(today());
    setOrderId('');
    setStatus('pending');
    setErrors({});
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!description.trim()) next.description = 'Description is required';
    const amt = Number(amount);
    if (amount === '' || Number.isNaN(amt) || amt <= 0) next.amount = 'Enter an amount greater than zero';
    if (!date) next.date = 'Pick a date';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({ category, description: description.trim(), amount: amt, date, orderId: orderId || undefined, status });
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Expense"
      description="Record a factory expense. Demo action only."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="expense-form">
            Save Expense
          </Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value as Expense['category'])}
          />
          <Select
            label="Status"
            options={expenseStatusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value as Expense['status'])}
          />
        </div>
        <Input
          label="Description"
          placeholder="e.g. Cotton yarn purchase — Poplin run"
          value={description}
          error={errors.description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            error={errors.amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="Date"
            type="date"
            value={date}
            error={errors.date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Select
          label="Linked Order"
          options={orderOptions}
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
      </form>
    </Modal>
  );
}

interface PaymentFormModalProps {
  isOpen: boolean;
  invoices: Invoice[];
  payments: Payment[];
  onClose: () => void;
  onSubmit: (input: RecordPaymentInput) => void;
}

export function PaymentFormModal({ isOpen, invoices, payments, onClose, onSubmit }: PaymentFormModalProps) {
  const openInvoices = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');

  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Payment['method']>('bank_transfer');
  const [status, setStatus] = useState<Payment['status']>('completed');
  const [paymentDate, setPaymentDate] = useState(today());
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const invoiceOptions: SelectOption[] = [
    { value: '', label: 'Select an invoice' },
    ...openInvoices.map((i) => ({ value: i.id, label: `${i.invoiceNumber} · ${i.buyerName}` })),
  ];

  const receivedFor = (id: string) =>
    payments.filter((p) => p.invoiceId === id && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  const selectedInvoice = openInvoices.find((i) => i.id === invoiceId);
  const balance = selectedInvoice ? Math.max(selectedInvoice.total - receivedFor(selectedInvoice.id), 0) : 0;

  const reset = () => {
    setInvoiceId('');
    setAmount('');
    setMethod('bank_transfer');
    setStatus('completed');
    setPaymentDate(today());
    setReference('');
    setErrors({});
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!invoiceId) next.invoiceId = 'Select an invoice';
    const amt = Number(amount);
    if (amount === '' || Number.isNaN(amt) || amt <= 0) next.amount = 'Enter an amount greater than zero';
    if (!paymentDate) next.paymentDate = 'Pick a payment date';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      invoiceId,
      amount: amt,
      method,
      status,
      paymentDate,
      reference: reference.trim() || undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      description="Log cash received against an invoice. Demo action only."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="payment-form">
            Save Payment
          </Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Invoice"
          options={invoiceOptions}
          value={invoiceId}
          error={errors.invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
        />
        {selectedInvoice && (
          <div className="rounded-lg bg-neutral-50 p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-neutral-600">Invoice total</span>
              <span className="font-medium text-neutral-900">₹{selectedInvoice.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-600">Outstanding balance</span>
              <span className="font-medium text-neutral-900">₹{balance.toLocaleString()}</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            error={errors.amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            error={errors.paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Method"
            options={methodOptions}
            value={method}
            onChange={(e) => setMethod(e.target.value as Payment['method'])}
          />
          <Select
            label="Status"
            options={paymentStatusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value as Payment['status'])}
          />
        </div>
        <Input
          label="Reference"
          placeholder="e.g. SWIFT-9021"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </form>
    </Modal>
  );
}
