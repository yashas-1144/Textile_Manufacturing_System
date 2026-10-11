import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, type SelectOption } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { CreateRollInput } from '@/services/finishedGoodsService';
import type { ProductionPlan } from '@/models';
import type { QcStatus, RollRecord } from '@/services/fixtures/finishedGoods';

const gradeOptions: SelectOption[] = [
  { value: 'A', label: 'Grade A — premium' },
  { value: 'B', label: 'Grade B — standard' },
  { value: 'C', label: 'Grade C — economy' },
  { value: 'reject', label: 'Reject' },
];

const emptyForm = {
  productName: '',
  specification: '',
  productionPlanNumber: '',
  length: '',
  width: '',
  weight: '',
  qualityGrade: 'A',
  location: '',
};

interface RollFormModalProps {
  isOpen: boolean;
  plans: ProductionPlan[];
  onClose: () => void;
  onSubmit: (input: CreateRollInput) => void;
}

export function RollFormModal({ isOpen, plans, onClose, onSubmit }: RollFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const planOptions: SelectOption[] = plans.map((p) => ({
    value: p.planNumber,
    label: `${p.planNumber} · ${p.productName}`,
  }));

  const update = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const positiveNumber = (value: string, label: string, next: Record<string, string>) => {
    const n = Number(value);
    if (value === '' || Number.isNaN(n) || n <= 0) next[label] = `Enter a ${label} greater than zero`;
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.productName.trim()) next.productName = 'Product is required';
    if (!form.specification.trim()) next.specification = 'Specification is required';
    if (!form.productionPlanNumber) next.productionPlanNumber = 'Select a production plan';
    if (!form.location.trim()) next.location = 'Location is required';
    positiveNumber(form.length, 'length', next);
    positiveNumber(form.width, 'width', next);
    positiveNumber(form.weight, 'weight', next);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      productName: form.productName.trim(),
      specification: form.specification.trim(),
      productionPlanNumber: form.productionPlanNumber.trim() || undefined,
      length: Number(form.length),
      width: Number(form.width),
      weight: Number(form.weight),
      qualityGrade: form.qualityGrade as RollRecord['qualityGrade'],
      location: form.location.trim(),
    });
    setForm(emptyForm);
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Fabric Roll"
      description="Register a new roll from the warehouse. It starts with QC pending. Demo action only."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="roll-form">
            Add Roll
          </Button>
        </>
      }
    >
      <form id="roll-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Product" placeholder="e.g. Combed Cotton Poplin" value={form.productName} error={errors.productName} onChange={(e) => update('productName', e.target.value)} />
          <Input label="Specification" placeholder="e.g. 100% Cotton, 120 GSM" value={form.specification} error={errors.specification} onChange={(e) => update('specification', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Production Plan"
            options={[{ value: '', label: 'Select a plan…' }, ...planOptions]}
            value={form.productionPlanNumber}
            error={errors.productionPlanNumber}
            onChange={(e) => update('productionPlanNumber', e.target.value)}
          />
          <Select label="Quality Grade" options={gradeOptions} value={form.qualityGrade} onChange={(e) => update('qualityGrade', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Length (m)" type="number" min="0" step="0.1" value={form.length} error={errors.length} onChange={(e) => update('length', e.target.value)} />
          <Input label="Width (m)" type="number" min="0" step="0.01" value={form.width} error={errors.width} onChange={(e) => update('width', e.target.value)} />
          <Input label="Weight (kg)" type="number" min="0" step="0.1" value={form.weight} error={errors.weight} onChange={(e) => update('weight', e.target.value)} />
        </div>
        <Input label="Warehouse Location" placeholder="e.g. Warehouse F-1" value={form.location} error={errors.location} onChange={(e) => update('location', e.target.value)} />
      </form>
    </Modal>
  );
}

interface QcResultModalProps {
  isOpen: boolean;
  roll: RollRecord | null;
  onClose: () => void;
  onSubmit: (roll: RollRecord, qcStatus: QcStatus, inspectionNumber: string) => void;
}

export function QcResultModal({ isOpen, roll, onClose, onSubmit }: QcResultModalProps) {
  const [result, setResult] = useState<'passed' | 'failed'>('passed');
  const [inspectionNumber, setInspectionNumber] = useState('');
  const [error, setError] = useState('');

  if (!roll) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inspectionNumber.trim() && !/^[A-Za-z0-9-]{3,}$/.test(inspectionNumber.trim())) {
      setError('Use a valid reference, e.g. QI-2026-0205');
      return;
    }
    onSubmit(roll, result, inspectionNumber.trim());
    setResult('passed');
    setInspectionNumber('');
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record QC Result · ${roll.rollNumber}`}
      description="Only rolls that pass QC can be dispatched. Demo action only."
      size="md"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="qc-form">
            Save Result
          </Button>
        </>
      }
    >
      <form id="qc-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-neutral-50 p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-600">Product</span>
            <span className="font-medium text-neutral-900">{roll.productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Dimensions</span>
            <span className="font-medium text-neutral-900">{roll.length} m × {roll.width} m · {roll.weight} kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Current QC</span>
            <Badge variant={roll.qcStatus === 'passed' ? 'success' : roll.qcStatus === 'pending' ? 'warning' : 'danger'} size="sm" dot>
              {roll.qcStatus}
            </Badge>
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-neutral-700">Inspection result</legend>
          <div className="flex gap-3">
            <label className={`flex-1 cursor-pointer rounded-lg border p-3 text-sm transition-colors ${result === 'passed' ? 'border-green-500 bg-green-50 text-green-800' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}>
              <input type="radio" name="qc-result" value="passed" checked={result === 'passed'} onChange={() => setResult('passed')} className="mr-2" />
              Pass — ready for dispatch
            </label>
            <label className={`flex-1 cursor-pointer rounded-lg border p-3 text-sm transition-colors ${result === 'failed' ? 'border-red-500 bg-red-50 text-red-800' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}>
              <input type="radio" name="qc-result" value="failed" checked={result === 'failed'} onChange={() => setResult('failed')} className="mr-2" />
              Fail — hold for rework
            </label>
          </div>
        </fieldset>

        <Input
          label="Inspection Reference (optional)"
          placeholder="e.g. QI-2026-0205"
          value={inspectionNumber}
          error={error}
          onChange={(e) => {
            setInspectionNumber(e.target.value);
            setError('');
          }}
        />
      </form>
    </Modal>
  );
}
