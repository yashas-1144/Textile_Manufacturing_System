import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, type SelectOption } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import type { Order, ProductionPlan, ProductionStage } from '@/models';
import type { CreatePlanInput } from '@/services/productionService';
import { getActiveStage, getPlanProgress } from '@/services/productionService';

const priorityOptions: SelectOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const unitOptions: SelectOption[] = [
  { value: 'm', label: 'Metres (m)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'pcs', label: 'Pieces' },
  { value: 'rolls', label: 'Rolls' },
];

const emptyForm = {
  orderNumber: '',
  buyerName: '',
  productName: '',
  quantity: '',
  unit: 'm',
  priority: 'medium',
  startDate: '',
  endDate: '',
};

interface PlanFormModalProps {
  isOpen: boolean;
  orders: Order[];
  onClose: () => void;
  onSubmit: (input: CreatePlanInput) => void;
}

export function PlanFormModal({ isOpen, orders, onClose, onSubmit }: PlanFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const orderOptions: SelectOption[] = orders.map((o) => ({
    value: o.orderNumber,
    label: `${o.orderNumber} · ${o.buyerName}`,
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

  const handleOrderChange = (value: string) => {
    const order = orders.find((o) => o.orderNumber === value);
    setForm((prev) => ({
      ...prev,
      orderNumber: value,
      buyerName: order?.buyerName ?? prev.buyerName,
    }));
    setErrors((prev) => {
      if (!prev.orderNumber) return prev;
      const next = { ...prev };
      delete next.orderNumber;
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.orderNumber.trim()) next.orderNumber = 'Order reference is required';
    if (!form.buyerName.trim()) next.buyerName = 'Buyer name is required';
    if (!form.productName.trim()) next.productName = 'Product name is required';
    const qty = Number(form.quantity);
    if (form.quantity === '' || Number.isNaN(qty) || qty <= 0) next.quantity = 'Enter a quantity greater than zero';
    if (!form.startDate) next.startDate = 'Start date is required';
    if (!form.endDate) next.endDate = 'End date is required';
    else if (form.startDate && form.endDate < form.startDate) next.endDate = 'End date must be after start date';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      orderNumber: form.orderNumber.trim(),
      buyerName: form.buyerName.trim(),
      productName: form.productName.trim(),
      quantity: Number(form.quantity),
      unit: form.unit,
      priority: form.priority as ProductionPlan['priority'],
      startDate: form.startDate,
      endDate: form.endDate,
    });
    setForm(emptyForm);
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Production Plan"
      description="Schedule a new production run. A standard 4-stage pipeline is created automatically."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="plan-form">
            Create Plan
          </Button>
        </>
      }
    >
      <form id="plan-form" onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Customer Order"
          options={[{ value: '', label: 'Select an order…' }, ...orderOptions]}
          value={form.orderNumber}
          error={errors.orderNumber}
          onChange={(e) => handleOrderChange(e.target.value)}
        />
        <Input label="Product" placeholder="e.g. Denim 12oz Indigo" value={form.productName} error={errors.productName} onChange={(e) => update('productName', e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Quantity" type="number" min="0" value={form.quantity} error={errors.quantity} onChange={(e) => update('quantity', e.target.value)} />
          <Select label="Unit" options={unitOptions} value={form.unit} onChange={(e) => update('unit', e.target.value)} />
          <Select label="Priority" options={priorityOptions} value={form.priority} onChange={(e) => update('priority', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Start Date" type="date" value={form.startDate} error={errors.startDate} onChange={(e) => update('startDate', e.target.value)} />
          <Input label="End Date" type="date" value={form.endDate} error={errors.endDate} onChange={(e) => update('endDate', e.target.value)} />
        </div>
      </form>
    </Modal>
  );
}

const stageStatusVariant: Record<ProductionStage['status'], 'neutral' | 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'neutral',
  in_progress: 'default',
  completed: 'success',
  on_hold: 'warning',
  failed: 'danger',
};

const stageStatusLabel: Record<ProductionStage['status'], string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
  failed: 'Failed',
};

interface PlanDetailModalProps {
  isOpen: boolean;
  plan: ProductionPlan | null;
  onClose: () => void;
  onAdvance: (planId: string, stageId: string) => void;
}

export function PlanDetailModal({ isOpen, plan, onClose, onAdvance }: PlanDetailModalProps) {
  if (!plan) return null;

  const progress = getPlanProgress(plan);
  const active = getActiveStage(plan);
  const canAdvance = plan.status === 'planned' || plan.status === 'in_progress';
  const advanceLabel = active?.status === 'in_progress' ? 'Mark stage complete' : 'Start next stage';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${plan.planNumber} · ${plan.productName}`}
      description={`${plan.buyerName} · Order ${plan.orderNumber}`}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {canAdvance && active && (
            <Button onClick={() => onAdvance(plan.id, active.id)}>{advanceLabel}</Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-neutral-500">Quantity</p>
            <p className="font-medium text-neutral-900">
              {plan.quantity.toLocaleString()} {plan.unit}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Priority</p>
            <p className="font-medium capitalize text-neutral-900">{plan.priority}</p>
          </div>
          <div>
            <p className="text-neutral-500">Start</p>
            <p className="font-medium text-neutral-900">{plan.startDate}</p>
          </div>
          <div>
            <p className="text-neutral-500">End</p>
            <p className="font-medium text-neutral-900">{plan.endDate}</p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-neutral-600">Overall progress</span>
            <span className="font-medium text-neutral-900">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-primary-600" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-neutral-800">Stage pipeline</p>
          <ol className="space-y-3">
            {plan.stages.map((stage) => {
              const pct = stage.quantity > 0 ? Math.min(Math.round((stage.completedQuantity / stage.quantity) * 100), 100) : 0;
              const isActive = active?.id === stage.id;
              return (
                <li
                  key={stage.id}
                  className={cn('rounded-lg border p-3', isActive ? 'border-primary-300 bg-primary-50/50' : 'border-neutral-200')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">{stage.displayName}</span>
                      {isActive && <Badge variant="info" size="sm">Current</Badge>}
                    </div>
                    <Badge variant={stageStatusVariant[stage.status]} size="sm">
                      {stageStatusLabel[stage.status]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                    <span>{stage.startDate} → {stage.endDate}</span>
                    <span>
                      {stage.completedQuantity.toLocaleString()} / {stage.quantity.toLocaleString()}
                      {stage.rejectedQuantity > 0 && (
                        <span className="text-red-500"> · {stage.rejectedQuantity} rejected</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                  </div>
                  {stage.notes && <p className="mt-2 text-xs text-neutral-500">{stage.notes}</p>}
                </li>
              );
            })}
          </ol>
        </div>

        {plan.notes && (
          <Textarea label="Notes" value={plan.notes} readOnly className="bg-neutral-50" />
        )}
      </div>
    </Modal>
  );
}
