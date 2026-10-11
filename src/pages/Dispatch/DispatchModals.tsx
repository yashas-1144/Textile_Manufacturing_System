import { useMemo, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, type SelectOption } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Order } from '@/models';
import type { CreateDispatchInput } from '@/services/dispatchService';
import type { RollRecord } from '@/services/fixtures/finishedGoods';
import { buyers } from '@/services/fixtures/orders';

const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  dispatchDate: today,
  expectedDeliveryDate: '',
  vehicleNumber: '',
  driverName: '',
  driverPhone: '',
  deliveryAddress: '',
  notes: '',
};

interface NewDispatchModalProps {
  isOpen: boolean;
  orders: Order[];
  rolls: RollRecord[];
  onClose: () => void;
  onSubmit: (input: CreateDispatchInput) => void;
}

export function NewDispatchModal({ isOpen, orders, rolls, onClose, onSubmit }: NewDispatchModalProps) {
  const [orderId, setOrderId] = useState('');
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const order = orders.find((o) => o.id === orderId);

  const selectableRolls = useMemo(() => {
    if (!order) return [];
    const products = order.items.map((i) => i.productName);
    return rolls.filter((r) => r.readyForDispatch && r.status === 'available' && products.includes(r.productName));
  }, [order, rolls]);

  const selectedRolls = selectableRolls.filter((r) => selectedRollIds.includes(r.id));
  const selectedMeters = selectedRolls.reduce((sum, r) => sum + r.length, 0);

  const orderOptions: SelectOption[] = orders.map((o) => ({
    value: o.id,
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
    setOrderId(value);
    setSelectedRollIds([]);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.orderId;
      delete next.rollIds;
      return next;
    });
    const nextOrder = orders.find((o) => o.id === value);
    const buyer = nextOrder ? buyers.find((b) => b.id === nextOrder.buyerId) : undefined;
    if (buyer) {
      setForm((prev) => ({ ...prev, deliveryAddress: `${buyer.address}, ${buyer.city}, ${buyer.country}` }));
    }
  };

  const toggleRoll = (id: string) => {
    setSelectedRollIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
    setErrors((prev) => {
      if (!prev.rollIds) return prev;
      const next = { ...prev };
      delete next.rollIds;
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!orderId) next.orderId = 'Select a customer order';
    if (selectedRollIds.length === 0) next.rollIds = 'Select at least one QC-ready roll';
    if (!form.dispatchDate) next.dispatchDate = 'Dispatch date is required';
    if (!form.expectedDeliveryDate) next.expectedDeliveryDate = 'Expected delivery date is required';
    if (form.dispatchDate && form.expectedDeliveryDate && form.expectedDeliveryDate < form.dispatchDate) {
      next.expectedDeliveryDate = 'Delivery cannot be before dispatch';
    }
    if (!form.vehicleNumber.trim()) next.vehicleNumber = 'Vehicle number is required';
    if (!form.driverName.trim()) next.driverName = 'Driver name is required';
    if (!form.driverPhone.trim()) next.driverPhone = 'Driver phone is required';
    if (!form.deliveryAddress.trim()) next.deliveryAddress = 'Delivery address is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      orderId,
      rollIds: selectedRollIds,
      dispatchDate: form.dispatchDate,
      expectedDeliveryDate: form.expectedDeliveryDate,
      vehicleNumber: form.vehicleNumber.trim(),
      driverName: form.driverName.trim(),
      driverPhone: form.driverPhone.trim(),
      deliveryAddress: form.deliveryAddress.trim(),
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Dispatch"
      description="Allocate QC-ready rolls to a customer order and schedule the shipment."
      size="xl"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="dispatch-form">
            Create Dispatch
          </Button>
        </>
      }
    >
      <form id="dispatch-form" onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Customer Order"
          options={[{ value: '', label: 'Select an order…' }, ...orderOptions]}
          value={orderId}
          error={errors.orderId}
          onChange={(e) => handleOrderChange(e.target.value)}
        />

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-neutral-700">
            Rolls to ship
            {selectedRolls.length > 0 && (
              <span className="ml-2 font-normal text-neutral-500">
                {selectedRolls.length} selected · {selectedMeters} m
              </span>
            )}
          </legend>

          {errors.rollIds && <p className="mb-2 text-xs text-red-600">{errors.rollIds}</p>}

          {!orderId ? (
            <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
              Select a customer order to see its QC-ready rolls.
            </p>
          ) : selectableRolls.length === 0 ? (
            <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              No QC-passed rolls are available for {order?.orderNumber}&apos;s products yet. Mark rolls ready on the Finished
              Goods page first.
            </p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 p-3">
              {selectableRolls.map((r) => (
                <label
                  key={r.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                    selectedRollIds.includes(r.id) ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input type="checkbox" checked={selectedRollIds.includes(r.id)} onChange={() => toggleRoll(r.id)} className="h-4 w-4 accent-primary-600" />
                  <span className="flex-1">
                    <span className="font-medium text-neutral-900">{r.rollNumber}</span>
                    <span className="text-neutral-500"> · {r.productName}</span>
                  </span>
                  <span className="text-neutral-500">{r.length} m · {r.weight} kg</span>
                  <Badge variant="outline" size="sm">Grade {r.qualityGrade}</Badge>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Dispatch Date" type="date" value={form.dispatchDate} error={errors.dispatchDate} onChange={(e) => update('dispatchDate', e.target.value)} />
          <Input label="Expected Delivery" type="date" value={form.expectedDeliveryDate} error={errors.expectedDeliveryDate} onChange={(e) => update('expectedDeliveryDate', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Vehicle Number" placeholder="e.g. TRK-2210" value={form.vehicleNumber} error={errors.vehicleNumber} onChange={(e) => update('vehicleNumber', e.target.value)} />
          <Input label="Driver Name" placeholder="e.g. Robert Chen" value={form.driverName} error={errors.driverName} onChange={(e) => update('driverName', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Driver Phone" placeholder="e.g. +1-555-0198" value={form.driverPhone} error={errors.driverPhone} onChange={(e) => update('driverPhone', e.target.value)} />
          <Input label="Delivery Address" placeholder="Street, city, country" value={form.deliveryAddress} error={errors.deliveryAddress} onChange={(e) => update('deliveryAddress', e.target.value)} />
        </div>
        <Textarea label="Notes (optional)" placeholder="e.g. Delivery by 3 PM, fragile handling" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </form>
    </Modal>
  );
}
