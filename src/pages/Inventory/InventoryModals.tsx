import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, type SelectOption } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { RawMaterial } from '@/models';
import type { CreateMaterialInput } from '@/services/inventoryService';

const categoryOptions: SelectOption[] = [
  { value: 'yarn', label: 'Yarn' },
  { value: 'dye', label: 'Dye' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'accessory', label: 'Accessory' },
];

const unitOptions: SelectOption[] = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'L', label: 'Litres (L)' },
  { value: 'm', label: 'Metres (m)' },
  { value: 'rolls', label: 'Rolls' },
  { value: 'pcs', label: 'Pieces' },
];

const emptyForm = {
  name: '',
  category: 'yarn',
  specification: '',
  unit: 'kg',
  currentStock: '',
  minimumStock: '',
  maximumStock: '',
  unitCost: '',
  supplier: '',
  location: '',
};

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateMaterialInput) => void;
}

export function MaterialFormModal({ isOpen, onClose, onSubmit }: MaterialFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!form.name.trim()) next.name = 'Material name is required';
    if (!form.specification.trim()) next.specification = 'Specification is required';
    if (!form.supplier.trim()) next.supplier = 'Supplier is required';
    if (!form.location.trim()) next.location = 'Storage location is required';
    const current = Number(form.currentStock);
    const min = Number(form.minimumStock);
    const max = Number(form.maximumStock);
    const cost = Number(form.unitCost);
    if (form.currentStock === '' || Number.isNaN(current) || current < 0) next.currentStock = 'Enter a valid quantity';
    if (form.minimumStock === '' || Number.isNaN(min) || min <= 0) next.minimumStock = 'Enter a reorder threshold';
    if (form.maximumStock === '' || Number.isNaN(max) || max <= 0) next.maximumStock = 'Enter a maximum stock';
    else if (!Number.isNaN(min) && max < min) next.maximumStock = 'Max must be ≥ reorder threshold';
    if (form.unitCost === '' || Number.isNaN(cost) || cost < 0) next.unitCost = 'Enter a valid unit cost';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: form.name.trim(),
      category: form.category as RawMaterial['category'],
      specification: form.specification.trim(),
      unit: form.unit,
      currentStock: Number(form.currentStock),
      minimumStock: Number(form.minimumStock),
      maximumStock: Number(form.maximumStock),
      unitCost: Number(form.unitCost),
      supplier: form.supplier.trim(),
      location: form.location.trim(),
    });
    setForm(emptyForm);
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Raw Material"
      description="Register a new material. This demo stores the entry in local UI state only."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="material-form">
            Add Material
          </Button>
        </>
      }
    >
      <form id="material-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Material Name" placeholder="e.g. Cotton Yarn NE 30/1" value={form.name} error={errors.name} onChange={(e) => update('name', e.target.value)} />
          <Select label="Category" options={categoryOptions} value={form.category} onChange={(e) => update('category', e.target.value)} />
        </div>
        <Input label="Specification" placeholder="e.g. 100% Cotton, Ring Spun" value={form.specification} error={errors.specification} onChange={(e) => update('specification', e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Select label="Unit" options={unitOptions} value={form.unit} onChange={(e) => update('unit', e.target.value)} />
          <Input label="Current Stock" type="number" min="0" value={form.currentStock} error={errors.currentStock} onChange={(e) => update('currentStock', e.target.value)} />
          <Input label="Reorder Threshold" type="number" min="0" value={form.minimumStock} error={errors.minimumStock} onChange={(e) => update('minimumStock', e.target.value)} />
          <Input label="Max Stock" type="number" min="0" value={form.maximumStock} error={errors.maximumStock} onChange={(e) => update('maximumStock', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Unit Cost ($)" type="number" min="0" step="0.01" value={form.unitCost} error={errors.unitCost} onChange={(e) => update('unitCost', e.target.value)} />
          <Input label="Supplier" placeholder="e.g. Cotton Mills Inc." value={form.supplier} error={errors.supplier} onChange={(e) => update('supplier', e.target.value)} />
        </div>
        <Input label="Storage Location" placeholder="e.g. Warehouse A-1" value={form.location} error={errors.location} onChange={(e) => update('location', e.target.value)} />
      </form>
    </Modal>
  );
}

interface ReorderModalProps {
  isOpen: boolean;
  material: RawMaterial | null;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

export function ReorderModal({ isOpen, material, onClose, onConfirm }: ReorderModalProps) {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');

  if (!material) return null;

  const suggested = Math.max(material.minimumStock * 2 - material.currentStock, material.minimumStock);
  const resolved = quantity === '' ? suggested : Number(quantity);
  const projected = material.currentStock + (Number.isNaN(resolved) ? 0 : resolved);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (quantity !== '' && (Number.isNaN(Number(quantity)) || Number(quantity) <= 0)) {
      setError('Enter a quantity greater than zero');
      return;
    }
    onConfirm(Number.isNaN(resolved) ? suggested : resolved);
    setQuantity('');
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reorder ${material.name}`}
      description="Create a purchase order to replenish this material. Demo action only."
      size="md"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="reorder-form">
            Confirm Reorder
          </Button>
        </>
      }
    >
      <form id="reorder-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-neutral-50 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-neutral-600">Current stock</span>
            <span className="font-medium text-neutral-900">
              {material.currentStock.toLocaleString()} {material.unit}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-600">Reorder threshold</span>
            <span className="font-medium text-neutral-900">
              {material.minimumStock.toLocaleString()} {material.unit}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-600">Suggested quantity</span>
            <span className="font-medium text-primary-700">
              {suggested.toLocaleString()} {material.unit}
            </span>
          </div>
        </div>
        <Input
          label="Reorder Quantity"
          type="number"
          min="1"
          placeholder={String(suggested)}
          value={quantity}
          error={error}
          onChange={(e) => {
            setQuantity(e.target.value);
            setError('');
          }}
        />
        <p className="text-sm text-neutral-500">
          Projected stock after reorder:{' '}
          <span className="font-medium text-neutral-800">
            {Math.min(projected, material.maximumStock).toLocaleString()} {material.unit}
          </span>{' '}
          (capped at max stock {material.maximumStock.toLocaleString()})
        </p>
      </form>
    </Modal>
  );
}
