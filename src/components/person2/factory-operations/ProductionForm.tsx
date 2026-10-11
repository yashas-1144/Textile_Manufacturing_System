/**
 * @file components/person2/factory-operations/ProductionForm.tsx
 * Production Batch Output Entry Form (Person 2 - Factory Operations)
 * Everest Textile Mills
 *
 * Implements stage-wise tracking and sequential validation:
 * SPINNING -> WEAVING -> DYEING -> FINISHED FABRIC
 */

import React, { useState, useEffect } from 'react';
import {
  Machine,
  ProductionLogEntry,
  ProductionProcess,
  ProductionShift,
} from '../../../types/person2/production';
import { ProductionOrder } from '../../../types/person2/orders';
import {
  getStageAvailabilityInfo,
  validateStageProduction,
  getOrderStageQuantities,
} from '../../../lib/person2/production-calculations';
import { btnPrimary, btnSecondary } from '../../../lib/person2/ui-styles';

interface ProductionFormProps {
  isOpen: boolean;
  onClose: () => void;
  targetMachine?: Machine | null;
  machines: Machine[];
  orders: ProductionOrder[];
  preselectedOrderId?: string;
  onSubmitLog: (newLog: ProductionLogEntry) => void;
}

export const ProductionForm: React.FC<ProductionFormProps> = ({
  isOpen,
  onClose,
  targetMachine,
  machines,
  orders,
  preselectedOrderId,
  onSubmitLog,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [stage, setStage] = useState<ProductionProcess>('Spinning');
  const [incrementalQuantity, setIncrementalQuantity] = useState<number>(500);
  const [unit, setUnit] = useState<string>('Meters');
  const [shift, setShift] = useState<ProductionShift>('Morning Shift A (06:00 - 14:00)');
  const [date, setDate] = useState<string>('2026-10-10');
  const [operatorName, setOperatorName] = useState<string>('Deepak Thapa');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    setError('');
    setSuccessMessage('');

    if (preselectedOrderId) {
      setSelectedOrderId(preselectedOrderId);
      const ord = orders.find((o) => o.id === preselectedOrderId);
      if (ord) setUnit(ord.unit);
    } else if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
      setUnit(orders[0].unit);
    }

    if (targetMachine) {
      setSelectedMachineId(targetMachine.id);
      setStage(targetMachine.process);
      setOperatorName(targetMachine.currentOperator || 'Floor Operator');
      if (!preselectedOrderId && targetMachine.currentOrderId) {
        setSelectedOrderId(targetMachine.currentOrderId);
      }
    } else if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
      setStage(machines[0].process);
      setOperatorName(machines[0].currentOperator);
      if (!preselectedOrderId && machines[0].currentOrderId) {
        setSelectedOrderId(machines[0].currentOrderId);
      }
    }
  }, [targetMachine, machines, preselectedOrderId, orders]);

  if (!isOpen) return null;

  const currentOrder = orders.find((o) => o.id === selectedOrderId);
  const currentMachine = machines.find((m) => m.id === selectedMachineId);

  // Compute stage-wise context for selected order and stage
  const stageInfo = currentOrder
    ? getStageAvailabilityInfo(currentOrder, stage)
    : null;
  const stageTotals = currentOrder
    ? getOrderStageQuantities(currentOrder)
    : null;

  const handleMachineChange = (machId: string) => {
    setSelectedMachineId(machId);
    setError('');
    const m = machines.find((mach) => mach.id === machId);
    if (m) {
      setStage(m.process);
      setOperatorName(m.currentOperator);
      if (!preselectedOrderId && m.currentOrderId) {
        setSelectedOrderId(m.currentOrderId);
      }
    }
  };

  const handleOrderChange = (ordId: string) => {
    setSelectedOrderId(ordId);
    setError('');
    const ord = orders.find((o) => o.id === ordId);
    if (ord) setUnit(ord.unit);
  };

  const handleStageChange = (newStage: ProductionProcess) => {
    setStage(newStage);
    setError('');
    // If current machine's process doesn't match newStage, switch to first matching machine
    const matchingMach = machines.find((m) => m.process === newStage);
    if (matchingMach && (!currentMachine || currentMachine.process !== newStage)) {
      setSelectedMachineId(matchingMach.id);
      setOperatorName(matchingMach.currentOperator);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!currentOrder) {
      setError('Please select a valid production order.');
      return;
    }
    if (!selectedMachineId) {
      setError('Please select a machine.');
      return;
    }

    const qty = Number(incrementalQuantity);

    // Enforce production sequence rules
    const validation = validateStageProduction(currentOrder, stage, qty);
    if (!validation.valid) {
      setError(validation.error || 'Invalid production update.');
      return;
    }

    const newLog: ProductionLogEntry = {
      id: `LOG-${Math.floor(5100 + Math.random() * 800)}`,
      orderId: currentOrder.id,
      machineId: selectedMachineId,
      productionStage: stage,
      quantityProduced: qty,
      unit: unit,
      shift: shift,
      productionDate: date,
      operatorName: operatorName.trim() || 'Floor Operator',
      targetQuantityForBatch: currentOrder.requiredQuantity,
      notes: notes.trim() || `Incremental output logged for ${stage} stage`,
    };

    onSubmitLog(newLog);
    setSuccessMessage(
      `Successfully recorded +${qty.toLocaleString()} m in ${stage} for order ${currentOrder.id}.`
    );

    // Auto-close after short delay or let user dismiss
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded border border-slate-300 shadow-lg w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-xs">
        <div className="px-5 py-3 border-b border-slate-300 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Update Production</h2>
            <p className="text-[11px] text-slate-500">
              Stage-wise batch entry: Spinning → Weaving → Dyeing → Finished Fabric
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

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 rounded text-xs font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs font-medium">
              {successMessage}
            </div>
          )}

          {/* 1. Order and Machine Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Production Order *</label>
              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
              >
                <option value="">-- Select Order --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} ({o.requiredQuantity.toLocaleString()} m - {o.fabricType}) [{o.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Machine *</label>
              <select
                value={selectedMachineId}
                onChange={(e) => handleMachineChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.name} ({m.process})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentOrder?.status === 'Rework Required' && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded text-[11px] font-medium flex items-center gap-1.5">
              <span>⚠️ <strong>Rework Order</strong>: {currentOrder.id} had quality failure (<strong>{currentOrder.defectReason || 'Colour mismatch'}</strong>). Recording this batch will log rework output. Subsequent re-inspection is required before completion.</span>
            </div>
          )}

          {/* 2. Manufacturing Stage Selector */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Production Stage *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Spinning', 'Weaving', 'Dyeing'] as ProductionProcess[]).map((stg) => (
                <button
                  key={stg}
                  type="button"
                  onClick={() => handleStageChange(stg)}
                  className={`py-1.5 px-2 rounded border text-xs font-medium transition-colors ${
                    stage === stg
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {stg === 'Spinning' ? '1. Spinning' : stg === 'Weaving' ? '2. Weaving' : '3. Dyeing'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Stage Context & Previous Stage Availability Display */}
          {currentOrder && stageInfo && stageTotals && (
            <div className="bg-slate-50 border border-slate-300 rounded p-3 text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                <span className="font-semibold text-slate-900">
                  Order {currentOrder.id} Target: {currentOrder.requiredQuantity.toLocaleString()} {currentOrder.unit}
                </span>
                <span className="text-slate-500 font-mono">
                  Finished (Dyeing): {stageTotals.finishedQuantity.toLocaleString()} m ({stageTotals.progressPercentage}%)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-500 block">Spinning Done:</span>
                  <strong className="text-slate-900">{stageTotals.spinningQuantity.toLocaleString()} m</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Weaving Done:</span>
                  <strong className="text-slate-900">{stageTotals.weavingQuantity.toLocaleString()} m</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Dyeing Done:</span>
                  <strong className="text-slate-900">{stageTotals.dyeingQuantity.toLocaleString()} m</strong>
                </div>
              </div>

              {/* Sequential Constraint Indicator */}
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-600">
                  Available from {stageInfo.previousStageLabel}:
                </span>
                <span
                  className={`font-mono font-bold ${
                    stageInfo.isStageBlocked ? 'text-amber-800' : 'text-emerald-800'
                  }`}
                >
                  {stageInfo.availableFromPrevious.toLocaleString()} {currentOrder.unit}
                </span>
              </div>

              {stageInfo.blockReason && (
                <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-1.5">
                  Notice: {stageInfo.blockReason}
                </div>
              )}
            </div>
          )}

          {/* 4. Incremental Quantity Input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Incremental Quantity Produced *
              </label>
              <div className="flex">
                <input
                  type="number"
                  min="1"
                  required
                  value={incrementalQuantity}
                  onChange={(e) => {
                    setIncrementalQuantity(Number(e.target.value));
                    setError('');
                  }}
                  className="w-full bg-white border border-slate-300 rounded-l px-2.5 py-1.5 text-slate-900 font-mono font-medium focus:outline-none focus:border-blue-600"
                />
                <span className="bg-slate-100 border border-l-0 border-slate-300 px-3 py-1.5 text-slate-600 rounded-r font-medium text-[11px]">
                  {unit}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Additional amount produced in this batch
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Production Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-xs"
              />
            </div>
          </div>

          {/* 5. Shift and Operator */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Shift Selection</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as ProductionShift)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Morning Shift A (06:00 - 14:00)">Morning Shift A (06:00 - 14:00)</option>
                <option value="Evening Shift B (14:00 - 22:00)">Evening Shift B (14:00 - 22:00)</option>
                <option value="Night Shift C (22:00 - 06:00)">Night Shift C (22:00 - 06:00)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Lead Operator</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Shift Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Warp tension regular, speed held at 920 RPM, zero stop flaws"
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
              className={btnPrimary}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
