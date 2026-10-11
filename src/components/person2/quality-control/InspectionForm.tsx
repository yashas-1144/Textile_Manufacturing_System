/**
 * @file components/person2/quality-control/InspectionForm.tsx
 * Fabric Roll QC Inspection Form (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React, { useState, useEffect } from 'react';
import {
  FabricRollInspection,
  DefectType,
  InspectionResult,
} from '../../../types/person2/quality';
import { ProductionOrder } from '../../../types/person2/orders';
import { Machine } from '../../../types/person2/production';
import {
  checkOrderInspectionEligibility,
  validateInspectionSubmission,
} from '../../../lib/person2/quality-calculations';
import { btnPrimary, btnSecondary } from '../../../lib/person2/ui-styles';

interface InspectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  orders: ProductionOrder[];
  machines: Machine[];
  inspections: FabricRollInspection[];
  initialOrderId?: string;
  onSubmitInspection: (newInspection: FabricRollInspection) => void;
}

export const InspectionForm: React.FC<InspectionFormProps> = ({
  isOpen,
  onClose,
  orders,
  machines,
  inspections,
  initialOrderId,
  onSubmitInspection,
}) => {
  // Find first eligible order or fallback
  const firstEligibleOrder = orders.find(
    (o) => checkOrderInspectionEligibility(o).isEligible
  );

  const [rollId, setRollId] = useState<string>(`R0${Math.floor(10 + Math.random() * 89)}`);
  const [orderId, setOrderId] = useState<string>(
    initialOrderId || firstEligibleOrder?.id || orders[0]?.id || 'ORD-103'
  );
  const [machineId, setMachineId] = useState<string>(machines[1]?.id || 'M002');
  const [rollLengthMeters, setRollLengthMeters] = useState<number>(500);
  const [result, setResult] = useState<InspectionResult>('Passed');
  const [defectType, setDefectType] = useState<DefectType>('None (Flawless)');
  const [remarks, setRemarks] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialOrderId) {
      setOrderId(initialOrderId);
    } else if (firstEligibleOrder) {
      setOrderId(firstEligibleOrder.id);
    }
  }, [initialOrderId, isOpen]);

  if (!isOpen) return null;

  const currentOrder = orders.find((o) => o.id === orderId);
  const eligibility = currentOrder ? checkOrderInspectionEligibility(currentOrder) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // REQUIREMENT 3: VALIDATE BEFORE SAVING AN INSPECTION
    const validation = validateInspectionSubmission({
      order: currentOrder,
      rollId: rollId.trim(),
      rollLengthMeters: Number(rollLengthMeters),
      existingInspections: inspections,
    });

    if (!validation.isValid) {
      setError(validation.errorMessage || 'Inspection validation failed.');
      return;
    }

    const isPassed = result === 'Passed';
    const meters = Number(rollLengthMeters);
    const weightKg = Math.round(meters * 0.15 * 10) / 10;

    const newInspection: FabricRollInspection = {
      rollId: rollId.trim(),
      productionOrderId: orderId,
      machineId: machineId,
      fabricType: currentOrder ? currentOrder.fabricType : '100% Combed Cotton Poplin',
      colour: currentOrder ? currentOrder.colour : 'Royal Navy',
      rollLengthMeters: meters,
      rollWeightKg: weightKg,
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorName: 'Quality Control Lead',
      defectType: isPassed ? 'None (Flawless)' : defectType,
      inspectionResult: result,
      gsmMeasured: 120,
      gsmStandard: 120,
      remarks: remarks.trim() || (isPassed ? 'Standard visual and pick test passed' : 'Defect logged'),
      readyForDispatch: isPassed,
      barcode: `EVM-${rollId}-${orderId}-${isPassed ? 'PASS' : 'HOLD'}`,
    };

    onSubmitInspection(newInspection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded border border-slate-300 shadow-lg w-full max-w-md flex flex-col overflow-hidden text-xs">
        <div className="px-5 py-3 border-b border-slate-300 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">New Quality Inspection</h2>
            <p className="text-[11px] text-slate-500">Record fabric roll quality inspection & grading</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-sm font-semibold px-2 py-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-medium">
              {error}
            </div>
          )}

          {/* REQUIREMENT 1: Ineligibility Alert Warning Banners */}
          {eligibility && !eligibility.isEligible && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️ Order Not Eligible for Inspection</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {eligibility.message}
              </p>
              <div className="text-[10px] text-amber-800 font-mono mt-1">
                Produced: {eligibility.producedQuantity.toLocaleString()} m / Target: {eligibility.requiredQuantity.toLocaleString()} m ({eligibility.progressPercent}%)
              </div>
            </div>
          )}

          {currentOrder?.status === 'Rework Required' && (
            <div className="p-2 bg-amber-50 border border-amber-300 text-amber-900 rounded text-[11px] font-medium flex items-center gap-1.5">
              <span>⚠️ Order {currentOrder.id} logged rework for defect: <strong>{currentOrder.defectReason || 'Colour mismatch'}</strong>. Re-inspection required after rework.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Roll ID *</label>
              <input
                type="text"
                required
                value={rollId}
                onChange={(e) => setRollId(e.target.value)}
                placeholder="e.g. R014"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Order ID *</label>
              <select
                value={orderId}
                onChange={(e) => {
                  setOrderId(e.target.value);
                  setError('');
                }}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
              >
                {orders.map((o) => {
                  const elig = checkOrderInspectionEligibility(o);
                  return (
                    <option key={o.id} value={o.id}>
                      {o.id} ({o.fabricType}) — {elig.isEligible ? `[Eligible · ${o.status}]` : `[Ineligible · ${o.completedQuantity || 0}m]`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Roll Length (meters) *</label>
              <input
                type="number"
                required
                min={1}
                max={currentOrder?.completedQuantity || 10000}
                value={rollLengthMeters}
                onChange={(e) => setRollLengthMeters(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Available fabric: {(currentOrder?.completedQuantity ?? 0).toLocaleString()} m
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Machine *</label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Inspection Result *</label>
              <select
                value={result}
                onChange={(e) => {
                  const val = e.target.value as InspectionResult;
                  setResult(val);
                  if (val === 'Passed') setDefectType('None (Flawless)');
                }}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
              >
                <option value="Passed">Passed</option>
                <option value="Rework Required">Rework Required</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Defect Type</label>
              <select
                value={defectType}
                disabled={result === 'Passed'}
                onChange={(e) => setDefectType(e.target.value as DefectType)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="None (Flawless)">None</option>
                <option value="Holes">Holes</option>
                <option value="Colour mismatch">Colour mismatch</option>
                <option value="Uneven weaving">Uneven weaving</option>
                <option value="Fabric damage">Fabric damage</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Selvage straight, no pick flaws"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600 text-xs"
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
              disabled={eligibility ? !eligibility.isEligible : false}
              className={btnPrimary}
              title={
                eligibility && !eligibility.isEligible
                  ? eligibility.message
                  : 'Record Inspection'
              }
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

