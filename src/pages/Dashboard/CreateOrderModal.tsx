import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, type SelectOption } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { productOptions, unitOptions, priorityOptions } from './dashboardData';

export interface NewOrderInput {
  buyer: string;
  product: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  dueDate: string;
  priority: string;
  notes: string;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: NewOrderInput) => Promise<void>;
  /** Live buyer directory so newly created buyers are selectable. */
  buyerOptions: SelectOption[];
}

const emptyForm = {
  buyer: '',
  product: '',
  quantity: '',
  unit: 'm',
  unitPrice: '250',
  dueDate: '',
  priority: 'medium',
  notes: '',
};

export function CreateOrderModal({ isOpen, onClose, onCreate, buyerOptions }: CreateOrderModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const update = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.buyer) next.buyer = 'Select a buyer';
    if (!form.product) next.product = 'Select a fabric / product';
    const qty = Number(form.quantity);
    if (!form.quantity) next.quantity = 'Enter a quantity';
    else if (Number.isNaN(qty) || qty <= 0) next.quantity = 'Quantity must be greater than zero';
    const price = Number(form.unitPrice);
    if (!form.unitPrice) next.unitPrice = 'Enter a unit price';
    else if (Number.isNaN(price) || price <= 0) next.unitPrice = 'Unit price must be greater than zero';
    if (!form.dueDate) next.dueDate = 'Choose a due date';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    try {
      await onCreate({
        buyer: form.buyer,
        product: form.product,
        quantity: Number(form.quantity),
        unit: form.unit,
        unitPrice: Number(form.unitPrice),
        dueDate: form.dueDate,
        priority: form.priority,
        notes: form.notes.trim(),
      });
      setForm(emptyForm);
      onClose();
    } catch {
      // The parent surfaces the error as a toast and the modal stays open.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Buyer Order"
      description="Saved to the TexFlow database and available across every module."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="create-order-form" loading={busy}>
            Create Order
          </Button>
        </>
      }
    >
      <form id="create-order-form" onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Buyer"
          placeholder="Select a buyer"
          options={buyerOptions}
          value={form.buyer}
          error={errors.buyer}
          onChange={(e) => update('buyer', e.target.value)}
        />

        <Select
          label="Fabric / Product"
          placeholder="Select a fabric"
          options={productOptions}
          value={form.product}
          error={errors.product}
          onChange={(e) => update('product', e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="Quantity"
            type="number"
            min="1"
            placeholder="e.g. 5000"
            value={form.quantity}
            error={errors.quantity}
            onChange={(e) => update('quantity', e.target.value)}
          />
          <Select
            label="Unit"
            options={unitOptions}
            value={form.unit}
            onChange={(e) => update('unit', e.target.value)}
          />
          <Input
            label="Unit Price (₹)"
            type="number"
            min="1"
            placeholder="e.g. 250"
            value={form.unitPrice}
            error={errors.unitPrice}
            onChange={(e) => update('unitPrice', e.target.value)}
          />
          <Input
            label="Due Date"
            type="date"
            value={form.dueDate}
            error={errors.dueDate}
            onChange={(e) => update('dueDate', e.target.value)}
          />
        </div>

        <Select
          label="Priority"
          options={priorityOptions}
          value={form.priority}
          onChange={(e) => update('priority', e.target.value)}
        />

        <Textarea
          label="Notes (optional)"
          placeholder="Delivery instructions, colour references, packing requirements..."
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
        />
      </form>
    </Modal>
  );
}
