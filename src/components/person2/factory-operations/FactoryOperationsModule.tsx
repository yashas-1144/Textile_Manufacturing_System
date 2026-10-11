/**
 * @file components/person2/factory-operations/FactoryOperationsModule.tsx
 * Factory Operations Module Root (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React, { useState, useMemo } from 'react';
import {
  Machine,
  MachineStatus,
  ProductionLogEntry,
  MachineDowntimeEvent,
  ProductionProcess,
} from '../../../types/person2/production';
import { ProductionOrder, OrderStatus } from '../../../types/person2/orders';
import { MachineTable } from './MachineTable';
import { ProductionTrackingTable } from './ProductionTrackingTable';
import { MachineDetails } from './MachineDetails';
import { ProductionForm } from './ProductionForm';
import { DowntimeTable } from './DowntimeTable';
import { btnPrimary } from '../../../lib/person2/ui-styles';

interface FactoryOperationsModuleProps {
  machines: Machine[];
  orders: ProductionOrder[];
  productionLogs: ProductionLogEntry[];
  downtimes: MachineDowntimeEvent[];
  onUpdateMachines: (updated: Machine[]) => void;
  onUpdateOrders: (updated: ProductionOrder[]) => void;
  onAddProductionLog: (newLog: ProductionLogEntry) => void;
  onAddDowntime: (event: MachineDowntimeEvent) => void;
  onResolveDowntime: (eventId: string, actionNote: string) => void;
}

export const FactoryOperationsModule: React.FC<FactoryOperationsModuleProps> = ({
  machines,
  orders,
  productionLogs,
  downtimes,
  onUpdateMachines,
  onUpdateOrders,
  onAddProductionLog,
  onAddDowntime,
  onResolveDowntime,
}) => {
  const [activeTab, setActiveTab] = useState<'machines' | 'tracking' | 'downtime'>('machines');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // Filters for Machine Table
  const [statusFilter, setStatusFilter] = useState<MachineStatus | 'ALL'>('ALL');
  const [processFilter, setProcessFilter] = useState<ProductionProcess | 'ALL'>('ALL');

  // Modal states
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [targetMachineForLog, setTargetMachineForLog] = useState<Machine | null>(null);
  const [preselectedOrderId, setPreselectedOrderId] = useState<string | undefined>();

  // Filtered machines
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      const matchProcess = processFilter === 'ALL' || m.process === processFilter;
      return matchStatus && matchProcess;
    });
  }, [machines, statusFilter, processFilter]);

  const handleUpdateMachineStatus = (machineId: string, status: MachineStatus) => {
    const updated = machines.map((m) => (m.id === machineId ? { ...m, status } : m));
    onUpdateMachines(updated);
    if (selectedMachine && selectedMachine.id === machineId) {
      setSelectedMachine((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleAssignOrder = (machineId: string, orderId?: string) => {
    const updated = machines.map((m) =>
      m.id === machineId ? { ...m, currentOrderId: orderId } : m
    );
    onUpdateMachines(updated);
    if (selectedMachine && selectedMachine.id === machineId) {
      setSelectedMachine((prev) => (prev ? { ...prev, currentOrderId: orderId } : null));
    }
  };

  const handleLogBatchSubmit = (newLog: ProductionLogEntry) => {
    onAddProductionLog(newLog);

    // Stage-wise update: Maintain spinning, weaving, and dyeing quantities separately.
    // Completed quantity represents finished fabric from the final Dyeing stage,
    // NOT the sum of spinning, weaving, and dyeing!
    const updatedOrders = orders.map((o) => {
      if (o.id === newLog.orderId) {
        const currentSpinning = o.spinningQuantity ?? 0;
        const currentWeaving = o.weavingQuantity ?? 0;
        const currentDyeing = o.dyeingQuantity ?? 0;

        const newSpinning =
          newLog.productionStage === 'Spinning'
            ? currentSpinning + newLog.quantityProduced
            : currentSpinning;
        const newWeaving =
          newLog.productionStage === 'Weaving'
            ? currentWeaving + newLog.quantityProduced
            : currentWeaving;
        const newDyeing =
          newLog.productionStage === 'Dyeing'
            ? currentDyeing + newLog.quantityProduced
            : currentDyeing;

        // Finished fabric quantity is derived strictly from the cumulative completed Dyeing stage!
        const finishedFabric = Math.min(o.requiredQuantity, newDyeing);
        const isOrderComplete = finishedFabric >= o.requiredQuantity;

        // Quality Control Integration:
        // Production quantity reaching target moves to Quality Check, NEVER directly to Completed!
        // If order had Rework Required, logging production/rework moves it to Quality Check (ready for re-inspection)
        let newStatus: OrderStatus = o.status;
        if (o.status === 'Rework Required') {
          newStatus = 'Quality Check'; // Ready for re-inspection after rework
        } else if (isOrderComplete) {
          newStatus = 'Quality Check';
        } else if (o.status === 'Ready' || o.status === 'Pending' || o.status === 'Material Check') {
          newStatus = 'In Production';
        }

        // Determine current active stage
        let activeStage = o.currentStage;
        if (isOrderComplete) {
          activeStage = 'Finishing';
        } else if (newDyeing > 0) {
          activeStage = 'Dyeing';
        } else if (newWeaving > 0) {
          activeStage = 'Weaving';
        } else if (newSpinning > 0) {
          activeStage = 'Spinning';
        }

        return {
          ...o,
          spinningQuantity: newSpinning,
          weavingQuantity: newWeaving,
          dyeingQuantity: newDyeing,
          completedQuantity: finishedFabric,
          status: newStatus,
          currentStage: activeStage,
        };
      }
      return o;
    });
    onUpdateOrders(updatedOrders);
  };

  const handleReportBreakdown = (machine: Machine) => {
    handleUpdateMachineStatus(machine.id, 'Breakdown');
    const newEvent: MachineDowntimeEvent = {
      id: `DT-${Math.floor(220 + Math.random() * 80)}`,
      machineId: machine.id,
      machineName: machine.name,
      process: machine.process,
      reason: 'Mechanical Breakdown',
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      durationMinutes: 60,
      resolved: false,
      technician: 'On-Duty Mechanical Technician',
      correctiveAction: 'Breakdown reported by floor supervisor; inspection underway.',
    };
    onAddDowntime(newEvent);
  };

  const handleOpenUpdateProduction = (order: ProductionOrder, machineId?: string) => {
    const mach = machineId ? machines.find((m) => m.id === machineId) || null : null;
    setTargetMachineForLog(mach);
    setPreselectedOrderId(order.id);
    setIsProductionModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-300">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Factory Operations</h1>
          <p className="text-xs text-slate-500">
            Machine fleet status, daily production tracking, and maintenance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTargetMachineForLog(null);
              setPreselectedOrderId(undefined);
              setIsProductionModalOpen(true);
            }}
            className={btnPrimary}
          >
            Update Production
          </button>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-300 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('machines')}
          className={`py-2 px-3 font-medium border-b-2 transition-colors ${
            activeTab === 'machines'
              ? 'border-blue-700 text-blue-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Machines ({machines.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tracking')}
          className={`py-2 px-3 font-medium border-b-2 transition-colors ${
            activeTab === 'tracking'
              ? 'border-blue-700 text-blue-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Production Tracking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('downtime')}
          className={`py-2 px-3 font-medium border-b-2 transition-colors ${
            activeTab === 'downtime'
              ? 'border-blue-700 text-blue-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Downtime Logs ({downtimes.length})
        </button>
      </div>

      {/* Tab 1: Machine Fleet Table */}
      {activeTab === 'machines' && (
        <div className="space-y-3">
          {/* Essential Filters */}
          <div className="bg-white border border-slate-300 rounded p-2.5 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-xs">Machine Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MachineStatus | 'ALL')}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="Running">Running</option>
                <option value="Idle">Idle</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Breakdown">Breakdown</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-xs">Process:</span>
              <select
                value={processFilter}
                onChange={(e) => setProcessFilter(e.target.value as ProductionProcess | 'ALL')}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">All Processes</option>
                <option value="Spinning">Spinning</option>
                <option value="Weaving">Weaving</option>
                <option value="Dyeing">Dyeing</option>
              </select>
            </div>
          </div>

          <MachineTable
            machines={filteredMachines}
            orders={orders}
            logs={productionLogs}
            onSelectMachine={(mach) => setSelectedMachine(mach)}
            onUpdateMachineStatus={handleUpdateMachineStatus}
            onReportBreakdown={handleReportBreakdown}
          />
        </div>
      )}

      {/* Tab 2: Production Tracking Table */}
      {activeTab === 'tracking' && (
        <ProductionTrackingTable
          orders={orders}
          machines={machines}
          onOpenUpdateProduction={handleOpenUpdateProduction}
        />
      )}

      {/* Tab 3: Downtime Logs */}
      {activeTab === 'downtime' && (
        <DowntimeTable
          downtimes={downtimes}
          machines={machines}
          onAddDowntime={onAddDowntime}
          onResolveDowntime={onResolveDowntime}
        />
      )}

      {/* Machine Details Modal */}
      <MachineDetails
        machine={selectedMachine}
        onClose={() => setSelectedMachine(null)}
        orders={orders}
        logs={productionLogs}
        downtimes={downtimes}
        onUpdateStatus={handleUpdateMachineStatus}
        onAssignOrder={handleAssignOrder}
      />

      {/* Update Production Batch Form */}
      <ProductionForm
        isOpen={isProductionModalOpen}
        onClose={() => {
          setIsProductionModalOpen(false);
          setTargetMachineForLog(null);
          setPreselectedOrderId(undefined);
        }}
        targetMachine={targetMachineForLog}
        machines={machines}
        orders={orders}
        preselectedOrderId={preselectedOrderId}
        onSubmitLog={handleLogBatchSubmit}
      />
    </div>
  );
};
