import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, type SelectOption } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Worker, Attendance } from '@/models';
import { computeWage, type CreateWorkerInput, type RecordAttendanceInput, type CalculateWageInput } from '@/services/workforceService';

const departmentOptions: SelectOption[] = [
  { value: 'spinning', label: 'Spinning' },
  { value: 'weaving', label: 'Weaving' },
  { value: 'dyeing', label: 'Dyeing' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'quality', label: 'Quality' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'admin', label: 'Admin' },
  { value: 'warehouse', label: 'Warehouse' },
];

const shiftOptions: SelectOption[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
  { value: 'general', label: 'General' },
];

const attendanceStatusOptions: SelectOption[] = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half day' },
  { value: 'absent', label: 'Absent' },
  { value: 'on_leave', label: 'On leave' },
];

const emptyWorker = {
  name: '',
  department: 'spinning',
  role: '',
  shift: 'morning',
  hourlyRate: '',
  overtimeRate: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
};

interface WorkerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateWorkerInput) => void;
}

export function WorkerFormModal({ isOpen, onClose, onSubmit }: WorkerFormModalProps) {
  const [form, setForm] = useState(emptyWorker);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof typeof emptyWorker, value: string) => {
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
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.role.trim()) next.role = 'Role is required';
    if (!form.address.trim()) next.address = 'Address is required';
    if (!form.contactPhone.trim()) next.contactPhone = 'Phone is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) next.contactEmail = 'Enter a valid email address';
    const hourly = Number(form.hourlyRate);
    const overtime = Number(form.overtimeRate);
    if (form.hourlyRate === '' || Number.isNaN(hourly) || hourly <= 0) next.hourlyRate = 'Enter an hourly rate greater than zero';
    if (form.overtimeRate === '' || Number.isNaN(overtime) || overtime <= 0) next.overtimeRate = 'Enter an overtime rate greater than zero';
    if (!next.hourlyRate && !next.overtimeRate && overtime < hourly) next.overtimeRate = 'OT rate cannot be lower than the hourly rate';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: form.name.trim(),
      department: form.department as Worker['department'],
      role: form.role.trim(),
      shift: form.shift as Worker['shift'],
      hourlyRate: Number(form.hourlyRate),
      overtimeRate: Number(form.overtimeRate),
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim(),
      address: form.address.trim(),
    });
    setForm(emptyWorker);
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Worker"
      description="Onboard a new employee. Rates feed directly into wage calculations. Demo action only."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="worker-form">
            Add Worker
          </Button>
        </>
      }
    >
      <form id="worker-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" placeholder="e.g. Fatima Noor" value={form.name} error={errors.name} onChange={(e) => update('name', e.target.value)} />
          <Input label="Role" placeholder="e.g. Loom Operator" value={form.role} error={errors.role} onChange={(e) => update('role', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Department" options={departmentOptions} value={form.department} onChange={(e) => update('department', e.target.value)} />
          <Select label="Shift" options={shiftOptions} value={form.shift} onChange={(e) => update('shift', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Hourly Rate (₹)" type="number" min="0" step="0.5" value={form.hourlyRate} error={errors.hourlyRate} onChange={(e) => update('hourlyRate', e.target.value)} />
          <Input label="Overtime Rate (₹/h)" type="number" min="0" step="0.5" value={form.overtimeRate} error={errors.overtimeRate} onChange={(e) => update('overtimeRate', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Phone" placeholder="e.g. +1-555-0111" value={form.contactPhone} error={errors.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} />
          <Input label="Email" type="email" placeholder="e.g. name@everest.com" value={form.contactEmail} error={errors.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} />
        </div>
        <Input label="Address" placeholder="e.g. 123 Mill Road" value={form.address} error={errors.address} onChange={(e) => update('address', e.target.value)} />
      </form>
    </Modal>
  );
}

interface AttendanceFormModalProps {
  isOpen: boolean;
  workers: Worker[];
  defaultDate: string;
  onClose: () => void;
  onSubmit: (input: RecordAttendanceInput) => void;
}

export function AttendanceFormModal({ isOpen, workers, defaultDate, onClose, onSubmit }: AttendanceFormModalProps) {
  const [form, setForm] = useState({
    workerId: '',
    date: defaultDate,
    status: 'present',
    checkIn: '',
    checkOut: '',
    overtimeHours: '0',
    shift: 'morning',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const needsCheckIn = ['present', 'late', 'half_day'].includes(form.status);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleWorkerChange = (value: string) => {
    update('workerId', value);
    const worker = workers.find((w) => w.id === value);
    if (worker) setForm((prev) => ({ ...prev, workerId: value, shift: worker.shift }));
  };

  const workerOptions: SelectOption[] = [
    { value: '', label: 'Select a worker…' },
    ...workers.map((w) => ({ value: w.id, label: `${w.employeeId} · ${w.name}` })),
  ];

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.workerId) next.workerId = 'Select a worker';
    if (!form.date) next.date = 'Date is required';
    if (needsCheckIn && !form.checkIn) next.checkIn = 'Check-in time is required for this status';
    const ot = Number(form.overtimeHours);
    if (Number.isNaN(ot) || ot < 0) next.overtimeHours = 'Overtime cannot be negative';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      workerId: form.workerId,
      date: form.date,
      checkIn: needsCheckIn ? form.checkIn : '',
      checkOut: form.checkOut || undefined,
      status: form.status as Attendance['status'],
      overtimeHours: Number(form.overtimeHours),
      shift: form.shift as Attendance['shift'],
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Attendance"
      description="Log a worker's attendance for a day. One record per worker per day. Demo action only."
      size="md"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="attendance-form">
            Save Attendance
          </Button>
        </>
      }
    >
      <form id="attendance-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Worker" options={workerOptions} value={form.workerId} error={errors.workerId} onChange={(e) => handleWorkerChange(e.target.value)} />
          <Input label="Date" type="date" value={form.date} error={errors.date} onChange={(e) => update('date', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Status" options={attendanceStatusOptions} value={form.status} onChange={(e) => update('status', e.target.value)} />
          <Select label="Shift" options={shiftOptions} value={form.shift} onChange={(e) => update('shift', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Check In" type="time" value={form.checkIn} error={errors.checkIn} disabled={!needsCheckIn} onChange={(e) => update('checkIn', e.target.value)} />
          <Input label="Check Out" type="time" value={form.checkOut} onChange={(e) => update('checkOut', e.target.value)} />
          <Input label="OT Hours" type="number" min="0" step="0.5" value={form.overtimeHours} error={errors.overtimeHours} onChange={(e) => update('overtimeHours', e.target.value)} />
        </div>
        <Textarea label="Notes (optional)" placeholder="e.g. Sick leave reported" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </form>
    </Modal>
  );
}

interface WageCalculationModalProps {
  isOpen: boolean;
  workers: Worker[];
  onClose: () => void;
  onSubmit: (input: CalculateWageInput) => void;
}

export function WageCalculationModal({ isOpen, workers, onClose, onSubmit }: WageCalculationModalProps) {
  const [form, setForm] = useState({
    workerId: '',
    periodStart: '',
    periodEnd: '',
    baseHours: '64',
    overtimeHours: '4',
    deductions: '10',
    bonuses: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const worker = workers.find((w) => w.id === form.workerId);
  const preview = worker
    ? computeWage(worker, {
        baseHours: Number(form.baseHours) || 0,
        overtimeHours: Number(form.overtimeHours) || 0,
        deductions: Number(form.deductions) || 0,
        bonuses: Number(form.bonuses) || 0,
      })
    : null;

  const workerOptions: SelectOption[] = [
    { value: '', label: 'Select a worker…' },
    ...workers.map((w) => ({ value: w.id, label: `${w.employeeId} · ${w.name} · ₹${w.hourlyRate}/h` })),
  ];

  const nonNegative = (value: string) => value !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.workerId) next.workerId = 'Select a worker';
    if (!form.periodStart) next.periodStart = 'Period start is required';
    if (!form.periodEnd) next.periodEnd = 'Period end is required';
    if (form.periodStart && form.periodEnd && form.periodEnd < form.periodStart) next.periodEnd = 'End cannot be before start';
    if (!nonNegative(form.baseHours)) next.baseHours = 'Enter base hours (0 or more)';
    if (!nonNegative(form.overtimeHours)) next.overtimeHours = 'Enter OT hours (0 or more)';
    if (!nonNegative(form.deductions)) next.deductions = 'Deductions cannot be negative';
    if (!nonNegative(form.bonuses)) next.bonuses = 'Bonuses cannot be negative';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      workerId: form.workerId,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      baseHours: Number(form.baseHours),
      overtimeHours: Number(form.overtimeHours),
      deductions: Number(form.deductions),
      bonuses: Number(form.bonuses),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calculate Wage"
      description="Compute payroll from hours and the worker's agreed rates. Demo action only."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="wage-form">
            Calculate Wage
          </Button>
        </>
      }
    >
      <form id="wage-form" onSubmit={handleSubmit} className="space-y-4">
        <Select label="Worker" options={workerOptions} value={form.workerId} error={errors.workerId} onChange={(e) => update('workerId', e.target.value)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Period Start" type="date" value={form.periodStart} error={errors.periodStart} onChange={(e) => update('periodStart', e.target.value)} />
          <Input label="Period End" type="date" value={form.periodEnd} error={errors.periodEnd} onChange={(e) => update('periodEnd', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Input label="Base Hours" type="number" min="0" step="1" value={form.baseHours} error={errors.baseHours} onChange={(e) => update('baseHours', e.target.value)} />
          <Input label="OT Hours" type="number" min="0" step="0.5" value={form.overtimeHours} error={errors.overtimeHours} onChange={(e) => update('overtimeHours', e.target.value)} />
          <Input label="Deductions (₹)" type="number" min="0" step="1" value={form.deductions} error={errors.deductions} onChange={(e) => update('deductions', e.target.value)} />
          <Input label="Bonuses (₹)" type="number" min="0" step="1" value={form.bonuses} error={errors.bonuses} onChange={(e) => update('bonuses', e.target.value)} />
        </div>

        {worker && preview ? (
          <div className="rounded-lg bg-neutral-50 p-4 text-sm">
            <p className="mb-2 font-medium text-neutral-700">
              {worker.name} — ₹${worker.hourlyRate.toFixed(2)}/h regular · ₹${worker.overtimeRate.toFixed(2)}/h overtime
            </p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  Base: {form.baseHours || 0} h × ₹${worker.hourlyRate.toFixed(2)}
                </span>
                <span className="font-medium text-neutral-900">₹${preview.basePay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  Overtime: {form.overtimeHours || 0} h × ₹${worker.overtimeRate.toFixed(2)}
                </span>
                <span className="font-medium text-neutral-900">₹${preview.overtimePay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Deductions − Bonuses</span>
                <span className="font-medium text-neutral-900">
                  −₹${(Number(form.deductions) || 0).toLocaleString()} + ₹${(Number(form.bonuses) || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2">
                <span className="font-medium text-neutral-800">Net pay</span>
                <span className="font-bold text-neutral-900">₹${preview.netPay.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
            Select a worker to preview the wage calculation.
          </p>
        )}
      </form>
    </Modal>
  );
}
