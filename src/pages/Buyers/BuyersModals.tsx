import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { CreateBuyerInput } from '@/services/ordersService';

const emptyForm = {
  name: '',
  company: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
};

interface NewBuyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateBuyerInput) => Promise<void>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewBuyerModal({ isOpen, onClose, onCreate }: NewBuyerModalProps) {
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
    if (!form.name.trim()) next.name = 'Buyer name is required';
    if (!form.company.trim()) next.company = 'Company is required';
    if (!form.contactPerson.trim()) next.contactPerson = 'Contact person is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.phone.trim()) next.phone = 'Phone is required';
    if (!form.address.trim()) next.address = 'Address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.country.trim()) next.country = 'Country is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    try {
      await onCreate({
        name: form.name.trim(),
        company: form.company.trim(),
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
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
      title="New Buyer"
      description="Saved to the buyer directory and immediately available when creating orders."
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="new-buyer-form" loading={busy}>
            Create Buyer
          </Button>
        </>
      }
    >
      <form id="new-buyer-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Buyer Name"
            placeholder="e.g. Sunrise Exports"
            value={form.name}
            error={errors.name}
            onChange={(e) => update('name', e.target.value)}
          />
          <Input
            label="Company"
            placeholder="e.g. Sunrise Textiles Pvt Ltd"
            value={form.company}
            error={errors.company}
            onChange={(e) => update('company', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contact Person"
            placeholder="e.g. Anita Rao"
            value={form.contactPerson}
            error={errors.contactPerson}
            onChange={(e) => update('contactPerson', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="e.g. anita@sunrise.com"
            value={form.email}
            error={errors.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone"
            placeholder="e.g. +91-9876543210"
            value={form.phone}
            error={errors.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <Input
            label="Address"
            placeholder="e.g. 12 Industrial Estate"
            value={form.address}
            error={errors.address}
            onChange={(e) => update('address', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            placeholder="e.g. Tiruppur"
            value={form.city}
            error={errors.city}
            onChange={(e) => update('city', e.target.value)}
          />
          <Input
            label="Country"
            placeholder="e.g. India"
            value={form.country}
            error={errors.country}
            onChange={(e) => update('country', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
