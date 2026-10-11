/**
 * @file components/person2/orders/OrderForm.tsx
 * Order Creation Modal Form (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React, { useState, useEffect } from 'react';
import { ProductionOrder, FabricUnit } from '../../../types/person2/orders';
import { RawMaterial } from '../../../types/person2/inventory';
import { formatINR } from '../../../lib/person2/order-calculations';
import { AlertCircle } from 'lucide-react';
import { btnPrimary, btnSecondary } from '../../../lib/person2/ui-styles';

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: ProductionOrder) => void;
  inventory: RawMaterial[];
  initialOrder?: ProductionOrder | null;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  inventory,
  initialOrder,
}) => {
  const isEditMode = Boolean(initialOrder);

  const [clientName, setClientName] = useState('');
  const [fabricType, setFabricType] = useState('100% Combed Cotton Poplin');
  const [colour, setColour] = useState('Royal Navy');
  const [colourHex, setColourHex] = useState('#1E3A8A');
  const [requiredQuantity, setRequiredQuantity] = useState<number>(3000);
  const [unitPrice, setUnitPrice] = useState<number>(9.5);
  const [unit, setUnit] = useState<FabricUnit>('Meters');
  const [deadline, setDeadline] = useState('2026-10-30');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form fields on open or when initialOrder changes
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    if (initialOrder) {
      setClientName(initialOrder.clientName);
      setFabricType(initialOrder.fabricType);
      setColour(initialOrder.colour);
      setColourHex(initialOrder.colourHex || '#1E3A8A');
      setRequiredQuantity(initialOrder.requiredQuantity);
      setUnitPrice(initialOrder.unitPrice || 9.5);
      setUnit(initialOrder.unit);
      setDeadline(initialOrder.deadline);
      setPriority(initialOrder.priority);
      setNotes(initialOrder.notes || '');
    } else {
      setClientName('');
      setFabricType('100% Combed Cotton Poplin');
      setColour('Royal Navy');
      setColourHex('#1E3A8A');
      setRequiredQuantity(3000);
      setUnitPrice(9.5);
      setUnit('Meters');
      setDeadline(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
      setPriority('Normal');
      setNotes('');
    }
  }, [isOpen, initialOrder]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!clientName.trim()) {
      setErrorMessage('Please provide a client name.');
      return;
    }
    if (!requiredQuantity || requiredQuantity <= 0) {
      setErrorMessage('Target quantity must be greater than zero.');
      return;
    }

    const price = Number(unitPrice) || 9.5;
    const reqQty = Number(requiredQuantity);

    if (isEditMode && initialOrder) {
      // Validate that target quantity is not reduced below already processed stages
      const maxProcessed = Math.max(
        initialOrder.spinningQuantity ?? 0,
        initialOrder.weavingQuantity ?? 0,
        initialOrder.dyeingQuantity ?? 0,
        initialOrder.completedQuantity ?? 0
      );

      if (reqQty < maxProcessed) {
        setErrorMessage(
          `Validation Warning: Target quantity (${reqQty.toLocaleString()} ${unit}) cannot be reduced below the quantity already processed in production (${maxProcessed.toLocaleString()} ${unit}).`
        );
        return;
      }

      const updatedOrder: ProductionOrder = {
        ...initialOrder,
        clientName: clientName.trim(),
        fabricType,
        colour,
        colourHex,
        requiredQuantity: reqQty,
        unitPrice: price,
        totalValue: Math.round(reqQty * price * 100) / 100,
        unit,
        deadline,
        priority,
        notes: notes.trim(),
        // Preserve all existing production and operational records:
        spinningQuantity: initialOrder.spinningQuantity ?? 0,
        weavingQuantity: initialOrder.weavingQuantity ?? 0,
        dyeingQuantity: initialOrder.dyeingQuantity ?? 0,
        completedQuantity: initialOrder.completedQuantity ?? 0,
      };

      onSubmit(updatedOrder);
      onClose();
      return;
    }

    // CREATE MODE: Generate new unique order
    const orderNumber = Math.floor(100 + Math.random() * 900);
    const newOrderId = `ORD-${orderNumber}`;

    // Auto-detect matching raw materials from inventory based on fabric/color
    const matchingMaterials = inventory
      .slice(0, 2)
      .map((mat) => ({
        materialId: mat.id,
        materialName: mat.name,
        requiredAmount: Math.round(reqQty * 0.25),
        availableAmount: mat.availableQuantity,
        unit: mat.unit,
        isAvailable: mat.availableQuantity >= Math.round(reqQty * 0.25),
      }));

    const hasShortage = matchingMaterials.some((m) => !m.isAvailable);

    const newOrder: ProductionOrder = {
      id: newOrderId,
      clientName: clientName.trim(),
      fabricType,
      colour,
      colourHex,
      requiredQuantity: reqQty,
      spinningQuantity: 0,
      weavingQuantity: 0,
      dyeingQuantity: 0,
      completedQuantity: 0, // Finished fabric starts at 0m
      unitPrice: price,
      totalValue: Math.round(reqQty * price * 100) / 100,
      unit,
      deadline,
      startDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      materialAvailability: hasShortage ? 'Partial Stock' : 'Available',
      materialsRequired: matchingMaterials,
      assignedMachines: ['M001'],
      currentStage: 'Queue',
      priority,
      notes: notes.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSubmit(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded border border-slate-300 shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden text-xs">
        <div className="px-5 py-3 border-b border-slate-300 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {isEditMode ? `Edit Order: ${initialOrder?.id}` : 'Create Production Order'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {isEditMode
                ? 'Update specifications and target quantities (Order ID remains locked)'
                : 'Register new textile production contract'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-sm font-semibold px-2 py-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isEditMode && initialOrder && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs text-slate-600">
              <span className="font-mono font-medium text-slate-900">Order ID: {initialOrder.id}</span>
              <span>
                Processed:{' '}
                <strong className="text-slate-900">
                  {initialOrder.completedQuantity.toLocaleString()} / {initialOrder.requiredQuantity.toLocaleString()} m
                </strong>
              </span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Client / Brand Name *</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Nordic Apparel Group"
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Fabric Type *</label>
              <select
                value={fabricType}
                onChange={(e) => setFabricType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="100% Combed Cotton Poplin">100% Combed Cotton Poplin</option>
                <option value="Polyester-Cotton Blend 65/35 Heavy Twill">Polyester-Cotton Blend 65/35 Heavy Twill</option>
                <option value="Heavy Denim Twill 14.5oz Selvedge">Heavy Denim Twill 14.5oz Selvedge</option>
                <option value="100% Organic Linen Sheeting">100% Organic Linen Sheeting</option>
                <option value="Silk-Visrose Georgette Draped Chiffon">Silk-Viscose Georgette Draped Chiffon</option>
                <option value="Viscose Rayon Satin 80 GSM">Viscose Rayon Satin 80 GSM</option>
                <option value="Heavy Duck Canvas 18oz Duck">Heavy Duck Canvas 18oz Duck</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Colour & Shade *</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colourHex}
                  onChange={(e) => setColourHex(e.target.value)}
                  className="w-10 h-8 rounded border border-slate-300 p-0.5 cursor-pointer"
                  title="Choose hex colour"
                />
                <input
                  type="text"
                  required
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  placeholder="e.g. Royal Navy"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={requiredQuantity}
                onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Unit Price (₹/m) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as FabricUnit)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Meters">Meters</option>
                <option value="Kg">Kg</option>
                <option value="Bolts">Bolts</option>
              </select>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs text-slate-600">
            <span>Estimated Contract Value:</span>
            <strong className="font-mono text-slate-900 text-xs">
              {formatINR((Number(requiredQuantity) || 0) * (Number(unitPrice) || 0))}
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Delivery Deadline *</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Order Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'Normal' | 'High' | 'Urgent')}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Production Notes & Specifications</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Weft counts, finishing standards, chemical tolerances..."
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-300 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={btnPrimary}
            >
              {isEditMode ? 'Save' : '+ New Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
