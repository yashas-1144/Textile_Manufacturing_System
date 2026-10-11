/**
 * @file components/person2/quality-control/QualityControlModule.tsx
 * Quality Control Module Root (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React, { useState, useMemo } from 'react';
import {
  FabricRollInspection,
  InspectionResult,
} from '../../../types/person2/quality';
import { ProductionOrder } from '../../../types/person2/orders';
import { Machine } from '../../../types/person2/production';
import { InspectionTable } from './InspectionTable';
import { InspectionForm } from './InspectionForm';
import { QualityReports } from './QualityReports';
import { getApprovedGoodsForDispatch } from '../../../data/person2/inspections';
import {
  checkOrderInspectionEligibility,
  isInspectionEligible,
  getInspectionIneligibilityReason,
} from '../../../lib/person2/quality-calculations';
import {
  btnPrimary,
  btnPrimaryCompact,
  btnSecondary,
} from '../../../lib/person2/ui-styles';

interface QualityControlModuleProps {
  inspections: FabricRollInspection[];
  orders: ProductionOrder[];
  machines: Machine[];
  onUpdateInspections: (updated: FabricRollInspection[]) => void;
  onAddInspection: (newInspection: FabricRollInspection) => void;
  onUpdateOrders?: (updatedOrders: ProductionOrder[]) => void;
}

export const QualityControlModule: React.FC<QualityControlModuleProps> = ({
  inspections,
  orders,
  machines,
  onUpdateInspections,
  onAddInspection,
  onUpdateOrders,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'inspections' | 'reports' | 'dispatch'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<InspectionResult | 'ALL'>('ALL');
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedOrderForInspection, setSelectedOrderForInspection] = useState<string | undefined>(undefined);
  const [selectedRoll, setSelectedRoll] = useState<FabricRollInspection | null>(null);
  const [ineligibleAttemptAlert, setIneligibleAttemptAlert] = useState<string | null>(null);

  // Group orders by inspection eligibility (REQUIREMENT 1)
  const eligibleOrders = useMemo(() => {
    return orders.filter((o) => checkOrderInspectionEligibility(o).isEligible);
  }, [orders]);

  const ineligibleOrders = useMemo(() => {
    return orders.filter((o) => !checkOrderInspectionEligibility(o).isEligible);
  }, [orders]);

  const validInspectionsCount = useMemo(() => {
    return inspections.filter((i) => isInspectionEligible(i, orders)).length;
  }, [inspections, orders]);

  const filteredInspections = useMemo(() => {
    return inspections.filter((roll) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        roll.rollId.toLowerCase().includes(q) ||
        roll.productionOrderId.toLowerCase().includes(q) ||
        roll.fabricType.toLowerCase().includes(q) ||
        roll.defectType.toLowerCase().includes(q);

      const matchesResult = resultFilter === 'ALL' || roll.inspectionResult === resultFilter;
      return matchesSearch && matchesResult;
    });
  }, [inspections, searchQuery, resultFilter]);

  const updateOrderStatusFromInspection = (orderId: string, result: InspectionResult, defectType?: string) => {
    if (!onUpdateOrders) return;
    const targetOrder = orders.find((o) => o.id === orderId);
    // Safety check: do not update order if order has 0 production
    if (!targetOrder || (targetOrder.completedQuantity ?? 0) === 0) return;

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        if (result === 'Rework Required') {
          return {
            ...o,
            status: 'Rework Required' as const,
            defectReason: defectType || 'Colour mismatch',
            latestInspectionResult: 'Rework Required' as const,
            qualityApproved: false,
          };
        }
        if (result === 'Rejected') {
          return {
            ...o,
            status: 'Rejected' as const,
            defectReason: defectType || 'Severe defect',
            latestInspectionResult: 'Rejected' as const,
            qualityApproved: false,
          };
        }
        if (result === 'Passed') {
          const isTargetReached = (o.completedQuantity ?? 0) >= o.requiredQuantity;
          return {
            ...o,
            status: isTargetReached ? ('Completed' as const) : o.status,
            defectReason: undefined,
            latestInspectionResult: 'Passed' as const,
            qualityApproved: true,
          };
        }
      }
      return o;
    });
    onUpdateOrders(updated);
  };

  const handleUpdateResult = (rollId: string, result: InspectionResult) => {
    const targetRoll = inspections.find((roll) => roll.rollId === rollId);
    if (!targetRoll) return;

    // Verify roll is eligible before updating
    if (!isInspectionEligible(targetRoll, orders)) {
      setIneligibleAttemptAlert(
        'Production in progress. Inspection unavailable.'
      );
      return;
    }

    const updated = inspections.map((roll) => {
      if (roll.rollId === rollId) {
        return {
          ...roll,
          inspectionResult: result,
          readyForDispatch: result === 'Passed',
        };
      }
      return roll;
    });
    onUpdateInspections(updated);

    updateOrderStatusFromInspection(targetRoll.productionOrderId, result, targetRoll.defectType);
  };

  const handleCreateInspection = (newInspection: FabricRollInspection) => {
    onAddInspection(newInspection);
    updateOrderStatusFromInspection(
      newInspection.productionOrderId,
      newInspection.inspectionResult,
      newInspection.defectType
    );
  };

  const approvedDispatchGoods = useMemo(() => {
    return getApprovedGoodsForDispatch(inspections);
  }, [inspections]);

  const handleOpenInspectForOrder = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;

    const elig = checkOrderInspectionEligibility(ord);
    if (!elig.isEligible) {
      setIneligibleAttemptAlert(elig.message);
      return;
    }

    setSelectedOrderForInspection(orderId);
    setIsInspectionModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-300">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Quality Control</h1>
          <p className="text-xs text-slate-500">
            Fabric roll grading, defect tracking, and dispatch approval
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => {
              setSelectedOrderForInspection(undefined);
              setIsInspectionModalOpen(true);
            }}
            className={btnPrimaryCompact}
          >
            + Inspect
          </button>
        </div>
      </div>

      {ineligibleAttemptAlert && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">{ineligibleAttemptAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => setIneligibleAttemptAlert(null)}
            className="text-amber-700 hover:text-amber-950 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-300 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`py-2 px-3 font-medium border-b-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-blue-700 text-blue-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Inspection Queue ({eligibleOrders.length} Ready)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inspections')}
          className={`py-2 px-3 font-medium border-b-2 transition-colors ${
            activeTab === 'inspections'
              ? 'border-blue-700 text-blue-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Roll Inspections ({validInspectionsCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`py-2 px-3 font-medium border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-blue-700 text-blue-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Quality Reports
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          className={`py-2 px-3 font-medium border-b-2 transition-colors ${
            activeTab === 'dispatch'
              ? 'border-blue-700 text-blue-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Approved for Dispatch ({approvedDispatchGoods.length})
        </button>
      </div>

      {/* Tab 0: Inspection Queue (REQUIREMENT 1: Show eligible orders only when production is completed) */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-300 rounded p-3 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-900">
                Production-to-Quality Eligibility Gate:
              </span>{' '}
              Orders enter Quality Check only when the required fabric quantity has been completed through Dyeing.
            </div>
            <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {eligibleOrders.length} Eligible · {ineligibleOrders.length} In Production
            </span>
          </div>

          {/* Section 1: Eligible Orders Ready for Quality Inspection */}
          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Eligible Orders Ready for Inspection ({eligibleOrders.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Target quantity completed & finished fabric ready for roll inspection
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wide">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Fabric</th>
                    <th className="py-2.5 px-3 text-right">Target</th>
                    <th className="py-2.5 px-3 text-right">Produced</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {eligibleOrders.map((ord) => {
                    const isRework = ord.status === 'Rework Required';
                    const isCompleted = ord.status === 'Completed';

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                          {ord.id}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {ord.clientName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">
                          {ord.fabricType} · {ord.colour}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                          {ord.requiredQuantity.toLocaleString()} m
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                          {(ord.completedQuantity ?? 0).toLocaleString()} m (100%)
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isRework
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isCompleted
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenInspectForOrder(ord.id)}
                            className={btnPrimaryCompact}
                          >
                            {isRework ? 'Reinspect' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Ineligible Orders (Production in progress) */}
          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-300">
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
                Not Ready for Inspection ({ineligibleOrders.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Complete production before inspection.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wide">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Fabric</th>
                    <th className="py-2.5 px-3 text-right">Target</th>
                    <th className="py-2.5 px-3 text-right">Produced</th>
                    <th className="py-2.5 px-3">Eligibility Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ineligibleOrders.map((ord) => {
                    const elig = checkOrderInspectionEligibility(ord);
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 text-slate-600">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                          {ord.id}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">
                          {ord.clientName}
                        </td>
                        <td className="py-2.5 px-3">
                          {ord.fabricType} · {ord.colour}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {ord.requiredQuantity.toLocaleString()} m
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-amber-700">
                          {(ord.completedQuantity ?? 0).toLocaleString()} m ({elig.progressPercent}%)
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                            title={elig.message}
                          >
                            <span>⚠️</span>
                            <span>{elig.message}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setIneligibleAttemptAlert(elig.message)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-500 rounded text-xs cursor-not-allowed font-medium"
                            title={elig.message}
                          >
                            Unavailable
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Inspection Table */}
      {activeTab === 'inspections' && (
        <div className="space-y-3">
          {/* Simple Filter Bar */}
          <div className="bg-white border border-slate-300 rounded p-2.5 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between text-xs">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search inspections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-xs">Result:</span>
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value as InspectionResult | 'ALL')}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">All Results</option>
                <option value="Passed">Passed</option>
                <option value="Rework Required">Rework Required</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <InspectionTable
            inspections={filteredInspections}
            orders={orders}
            onSelectRoll={(roll) => setSelectedRoll(roll)}
            onUpdateResult={handleUpdateResult}
          />
        </div>
      )}

      {/* Tab 2: Quality Reports Section */}
      {activeTab === 'reports' && (
        <QualityReports inspections={inspections} orders={orders} />
      )}

      {/* Tab 3: Dispatch Staging for Person 3 */}
      {activeTab === 'dispatch' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-300 rounded p-2.5 text-xs text-slate-600">
            Approved fabric rolls cleared by QC inspection, staged for logistics and dispatch.
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold text-[11px] uppercase tracking-wide">
                    <th className="py-2.5 px-3">Roll ID</th>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Fabric</th>
                    <th className="py-2.5 px-3 text-right">Approved Quantity</th>
                    <th className="py-2.5 px-3">QC Release Date</th>
                    <th className="py-2.5 px-3">Inspector</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {approvedDispatchGoods.map((item) => (
                    <tr key={item.rollId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                        {item.rollId}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                        {item.orderId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        {item.fabricType} · {item.colour}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                        {item.approvedMeters.toLocaleString()} m
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {item.inspectedDate}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.inspectorName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-800">
                        Approved for Dispatch
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Selected Roll Details Modal */}
      {selectedRoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-300 shadow-lg w-full max-w-md p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-300 mb-3">
              <div>
                <span className="font-mono text-sm font-bold text-slate-900">
                  Roll {selectedRoll.rollId}
                </span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span className="font-mono font-medium text-slate-700">{selectedRoll.productionOrderId}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoll(null)}
                className="text-slate-500 hover:text-slate-800 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {!isInspectionEligible(selectedRoll, orders) && (
              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs">
                <strong>⚠️ Order Not Eligible:</strong>{' '}
                {getInspectionIneligibilityReason(selectedRoll, orders)}
              </div>
            )}

            <div className="space-y-2.5 border border-slate-300 rounded p-3 bg-white">
              <div className="flex justify-between">
                <span className="text-slate-500">Fabric:</span>
                <span className="font-medium text-slate-900">{selectedRoll.fabricType} ({selectedRoll.colour})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Length:</span>
                <span className="font-mono text-slate-900">{selectedRoll.rollLengthMeters} m ({selectedRoll.rollWeightKg} kg)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Defect:</span>
                <span className="font-medium text-slate-900">
                  {!isInspectionEligible(selectedRoll, orders)
                    ? 'Ineligible (0 m produced)'
                    : selectedRoll.defectType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Result:</span>
                <span className="font-semibold text-slate-900">
                  {!isInspectionEligible(selectedRoll, orders)
                    ? 'Ineligible (Draft)'
                    : selectedRoll.inspectionResult}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inspector:</span>
                <span className="text-slate-700">{selectedRoll.inspectorName} ({selectedRoll.inspectionDate})</span>
              </div>
              {selectedRoll.remarks && (
                <div className="pt-2 border-t border-slate-200 text-slate-600">
                  Notes: {selectedRoll.remarks}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-300 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRoll(null)}
                className={btnSecondary}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Roll Inspection Form Modal */}
      <InspectionForm
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedOrderForInspection(undefined);
        }}
        orders={orders}
        machines={machines}
        inspections={inspections}
        initialOrderId={selectedOrderForInspection}
        onSubmitInspection={handleCreateInspection}
      />
    </div>
  );
};

