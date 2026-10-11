import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, type SelectOption } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Machine } from '@/models';
import type { CreateMachineInput } from '@/services/machineService';
import type { MachineRecord } from '@/services/fixtures/machines';

const typeOptions: SelectOption[] = [
  { value: 'spinning', label: 'Spinning' },
  { value: 'weaving', label: 'Weaving' },
  { value: 'dyeing', label: 'Dyeing' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'other', label: 'Other' },
];

const unitOptions: SelectOption[] = [
  { value: 'm/day', label: 'Metres / day' },
  { value: 'kg/day', label: 'Kilograms / day' },
  { value: 'samples/hr', label: 'Samples / hour' },
];

const emptyForm = {
  name: '',
  type: 'spinning',
  model: '',
  manufacturer: '',
  location: '',
  capacity: '',
  unit: 'kg/day',
};

interface MachineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateMachineInput) => void;
}

export function MachineFormModal({ isOpen, onClose, onSubmit }: MachineFormModalProps) {
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
    if (!form.name.trim()) next.name = 'Machine code is required';
    if (!form.model.trim()) next.model = 'Model is required';
    if (!form.manufacturer.trim()) next.manufacturer = 'Manufacturer is required';
    if (!form.location.trim()) next.location = 'Location is required';
    const capacity = Number(form.capacity);
    if (form.capacity === '' || Number.isNaN(capacity) || capacity <= 0) next.capacity = 'Enter a capacity greater than zero';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: form.name.trim(),
      type: form.type as Machine['type'],
      model: form.model.trim(),
      manufacturer: form.manufacturer.trim(),
      location: form.location.trim(),
      capacity: Number(form.capacity),
      unit: form.unit,
    });
    setForm(emptyForm);
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Machine"
      description="Register a new machine on the shop floor. Demo action only."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="machine-form">
            Add Machine
          </Button>
        </>
      }
    >
      <form id="machine-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Machine Code" placeholder="e.g. WM-08" value={form.name} error={errors.name} onChange={(e) => update('name', e.target.value)} />
          <Select label="Type" options={typeOptions} value={form.type} onChange={(e) => update('type', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Model" placeholder="e.g. Picanol OmniPlus" value={form.model} error={errors.model} onChange={(e) => update('model', e.target.value)} />
          <Input label="Manufacturer" placeholder="e.g. Picanol" value={form.manufacturer} error={errors.manufacturer} onChange={(e) => update('manufacturer', e.target.value)} />
        </div>
        <Input label="Location" placeholder="e.g. Floor 2 - Zone A" value={form.location} error={errors.location} onChange={(e) => update('location', e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Capacity" type="number" min="0" value={form.capacity} error={errors.capacity} onChange={(e) => update('capacity', e.target.value)} />
          <Select label="Capacity Unit" options={unitOptions} value={form.unit} onChange={(e) => update('unit', e.target.value)} />
        </div>
      </form>
    </Modal>
  );
}

interface MaintenanceModalProps {
  isOpen: boolean;
  machine: MachineRecord | null;
  onClose: () => void;
  onSchedule: (date: string, notes: string) => void;
}

export function MaintenanceModal({ isOpen, machine, onClose, onSchedule }: MaintenanceModalProps) {
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!machine) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError('Pick a maintenance date');
      return;
    }
    onSchedule(date, notes.trim());
    setDate('');
    setNotes('');
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule Maintenance · ${machine.name}`}
      description="Plan the next service. Demo action only — no work order is created."
      size="md"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="maintenance-form">
            Schedule
          </Button>
        </>
      }
    >
      <form id="maintenance-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-neutral-50 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-neutral-600">Current status</span>
            <span className="font-medium capitalize text-neutral-900">{machine.status}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-600">Last maintenance</span>
            <span className="font-medium text-neutral-900">{machine.lastMaintenance}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-600">Next due</span>
            <span className="font-medium text-neutral-900">{machine.nextMaintenance}</span>
          </div>
        </div>
        <Input label="Maintenance Date" type="date" value={date} error={error} onChange={(e) => { setDate(e.target.value); setError(''); }} />
        <Textarea label="Notes" placeholder="Describe the planned service or parts to replace" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  );
}
