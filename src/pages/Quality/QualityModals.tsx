import { useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, type SelectOption } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Defect, ProductionPlan } from '@/models';
import type { CreateInspectionInput } from '@/services/qualityService';
import { deriveInspectionStatus, REWORK_CONFIG } from '@/services/qualityService';
import type { QualityRecord, ReworkStatus } from '@/services/fixtures/quality';

const stageOptions: SelectOption[] = [
  { value: 'spinning', label: 'Spinning' },
  { value: 'weaving', label: 'Weaving' },
  { value: 'dyeing', label: 'Dyeing' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'final', label: 'Final Inspection' },
];

const statusVariant: Record<QualityRecord['status'], 'success' | 'danger' | 'warning' | 'neutral'> = {
  passed: 'success',
  failed: 'danger',
  conditional: 'warning',
  pending: 'neutral',
};

const emptyForm = {
  productionPlanNumber: '',
  stage: 'weaving',
  inspectorName: '',
  sampleSize: '',
  passedCount: '',
  failedCount: '',
  notes: '',
};

interface InspectionFormModalProps {
  isOpen: boolean;
  plans: ProductionPlan[];
  onClose: () => void;
  onSubmit: (input: CreateInspectionInput) => void;
}

export function InspectionFormModal({ isOpen, plans, onClose, onSubmit }: InspectionFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const plan = plans.find((p) => p.planNumber === form.productionPlanNumber);
  const planOptions: SelectOption[] = plans.map((p) => ({
    value: p.planNumber,
    label: `${p.planNumber} · ${p.productName}`,
  }));
  const stageOpts: SelectOption[] = plan
    ? plan.stages.map((s) => ({ value: s.name, label: s.displayName }))
    : stageOptions;

  const update = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const passed = Number(form.passedCount);
  const failed = Number(form.failedCount);
  const sample = Number(form.sampleSize);
  const validNumbers = form.passedCount !== '' && form.failedCount !== '' && !Number.isNaN(passed) && !Number.isNaN(failed);
  const derived = validNumbers ? deriveInspectionStatus(passed, failed) : null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.productionPlanNumber.trim()) next.productionPlanNumber = 'Plan reference is required';
    if (!form.inspectorName.trim()) next.inspectorName = 'Inspector name is required';
    if (form.sampleSize === '' || Number.isNaN(sample) || sample <= 0) next.sampleSize = 'Enter a sample size';
    if (form.passedCount === '' || Number.isNaN(passed) || passed < 0) next.passedCount = 'Enter passed count';
    if (form.failedCount === '' || Number.isNaN(failed) || failed < 0) next.failedCount = 'Enter failed count';
    if (!Number.isNaN(sample) && sample > 0 && !Number.isNaN(passed) && !Number.isNaN(failed) && passed + failed > sample) {
      next.failedCount = 'Passed + failed cannot exceed sample size';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      productionPlanNumber: form.productionPlanNumber.trim(),
      stage: form.stage as QualityRecord['stage'],
      inspectorName: form.inspectorName.trim(),
      sampleSize: Number(form.sampleSize),
      passedCount: Number(form.passedCount),
      failedCount: Number(form.failedCount),
      notes: form.notes.trim(),
    });
    setForm(emptyForm);
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Quality Inspection"
      description="Record an inspection result. Status is derived automatically from the counts."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="inspection-form">
            Record Inspection
          </Button>
        </>
      }
    >
      <form id="inspection-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Production Plan"
            options={[{ value: '', label: 'Select a plan…' }, ...planOptions]}
            value={form.productionPlanNumber}
            error={errors.productionPlanNumber}
            onChange={(e) => update('productionPlanNumber', e.target.value)}
          />
          <Select label="Stage" options={stageOpts} value={form.stage} onChange={(e) => update('stage', e.target.value)} />
        </div>
        <Input label="Inspector" placeholder="e.g. Maria Garcia" value={form.inspectorName} error={errors.inspectorName} onChange={(e) => update('inspectorName', e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Sample Size" type="number" min="0" value={form.sampleSize} error={errors.sampleSize} onChange={(e) => update('sampleSize', e.target.value)} />
          <Input label="Passed" type="number" min="0" value={form.passedCount} error={errors.passedCount} onChange={(e) => update('passedCount', e.target.value)} />
          <Input label="Failed" type="number" min="0" value={form.failedCount} error={errors.failedCount} onChange={(e) => update('failedCount', e.target.value)} />
        </div>
        {derived && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span>Derived status:</span>
            <Badge variant={statusVariant[derived]} size="sm">
              {derived.charAt(0).toUpperCase() + derived.slice(1)}
            </Badge>
          </div>
        )}
        <Textarea label="Notes" placeholder="Observations, disposition, or corrective actions" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </form>
    </Modal>
  );
}

const severityVariant: Record<Defect['severity'], 'neutral' | 'warning' | 'danger'> = {
  minor: 'neutral',
  major: 'warning',
  critical: 'danger',
};

const defectTypeLabel = (type: Defect['type']) =>
  type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

interface InspectionDetailModalProps {
  isOpen: boolean;
  inspection: QualityRecord | null;
  onClose: () => void;
  onUpdateRework: (id: string, status: ReworkStatus) => void;
}

export function InspectionDetailModal({ isOpen, inspection, onClose, onUpdateRework }: InspectionDetailModalProps) {
  if (!inspection) return null;

  const rework = REWORK_CONFIG[inspection.rework.status];

  let reworkAction: ReactNode = null;
  if (inspection.rework.status === 'pending') {
    reworkAction = <Button onClick={() => onUpdateRework(inspection.id, 'in_progress')}>Start rework</Button>;
  } else if (inspection.rework.status === 'in_progress') {
    reworkAction = <Button onClick={() => onUpdateRework(inspection.id, 'completed')}>Mark rework complete</Button>;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${inspection.inspectionNumber} · ${inspection.stage.charAt(0).toUpperCase() + inspection.stage.slice(1)}`}
      description={`Plan ${inspection.productionPlanNumber} · Inspected by ${inspection.inspectorName}`}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {reworkAction}
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-neutral-500">Sample Size</p>
            <p className="font-medium text-neutral-900">{inspection.sampleSize}</p>
          </div>
          <div>
            <p className="text-neutral-500">Passed</p>
            <p className="font-medium text-green-700">{inspection.passedCount}</p>
          </div>
          <div>
            <p className="text-neutral-500">Failed</p>
            <p className="font-medium text-red-700">{inspection.failedCount}</p>
          </div>
          <div>
            <p className="text-neutral-500">Status</p>
            <Badge variant={statusVariant[inspection.status]} size="sm">
              {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">Rework</p>
            <p className="text-xs text-neutral-500">
              {inspection.rework.quantity > 0 ? `${inspection.rework.quantity} units flagged` : 'No rework required'}
              {inspection.rework.notes ? ` · ${inspection.rework.notes}` : ''}
            </p>
          </div>
          <Badge variant={rework.variant}>{rework.label}</Badge>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-neutral-800">Defects ({inspection.defects.length})</p>
          {inspection.defects.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-500">
              No defects recorded for this inspection.
            </p>
          ) : (
            <ul className="space-y-2">
              {inspection.defects.map((defect) => (
                <li key={defect.id} className="rounded-lg border border-neutral-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-900">{defectTypeLabel(defect.type)}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={severityVariant[defect.severity]} size="sm">
                        {defect.severity.charAt(0).toUpperCase() + defect.severity.slice(1)}
                      </Badge>
                      <span className="text-xs text-neutral-500">×{defect.count}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {defect.location} · {defect.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {inspection.notes && <Textarea label="Notes" value={inspection.notes} readOnly className="bg-neutral-50" />}
      </div>
    </Modal>
  );
}
