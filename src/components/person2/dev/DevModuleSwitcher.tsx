/**
 * @file components/person2/dev/DevModuleSwitcher.tsx
 * TEMPORARY DEVELOPMENT MODULE RUNNER FOR PERSON 2 (FACTORY OPERATIONS)
 * Everest Textile Mills
 *
 * =========================================================================
 * INTEGRATION INSTRUCTIONS FOR PERSON 1 (FRONTEND & DASHBOARD LEAD):
 * =========================================================================
 * This component is a standalone preview wrapper for testing Person 2's modules.
 * When integrating into the shared application:
 * 1. Import individual modules from `@/src/components/person2`:
 *    - OrdersModule
 *    - InventoryModule
 *    - FactoryOperationsModule
 *    - QualityControlModule
 * 2. Mount them directly under your shared layout & router routes:
 *    - /orders              -> <OrdersModule ... />
 *    - /inventory           -> <InventoryModule ... />
 *    - /factory-operations  -> <FactoryOperationsModule ... />
 *    - /quality-control     -> <QualityControlModule ... />
 * 3. Person 3 can consume approved goods for dispatch via:
 *    `import { getApprovedGoodsForDispatch } from '@/src/data/person2/inspections';`
 * =========================================================================
 */

import React, { useState } from 'react';
import { OrdersModule } from '../orders/OrdersModule';
import { InventoryModule } from '../inventory/InventoryModule';
import { FactoryOperationsModule } from '../factory-operations/FactoryOperationsModule';
import { QualityControlModule } from '../quality-control/QualityControlModule';

// Mock datasets
import { INITIAL_ORDERS } from '../../../data/person2/orders';
import { INITIAL_RAW_MATERIALS, INITIAL_INVENTORY_TRANSACTIONS } from '../../../data/person2/inventory';
import { INITIAL_MACHINES } from '../../../data/person2/machines';
import { INITIAL_PRODUCTION_LOGS, INITIAL_DOWNTIME_EVENTS } from '../../../data/person2/production';
import { INITIAL_INSPECTIONS } from '../../../data/person2/inspections';

// Types
import { ProductionOrder } from '../../../types/person2/orders';
import { RawMaterial, InventoryTransaction } from '../../../types/person2/inventory';
import { Machine, ProductionLogEntry, MachineDowntimeEvent } from '../../../types/person2/production';
import { FabricRollInspection } from '../../../types/person2/quality';

export type ActiveModuleKey = 'orders' | 'inventory' | 'factory' | 'quality';

export const DevModuleSwitcher: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModuleKey>('orders');

  // Shared state connecting all 4 factory operations modules
  const [orders, setOrders] = useState<ProductionOrder[]>(INITIAL_ORDERS);
  const [materials, setMaterials] = useState<RawMaterial[]>(INITIAL_RAW_MATERIALS);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(INITIAL_INVENTORY_TRANSACTIONS);
  const [machines, setMachines] = useState<Machine[]>(INITIAL_MACHINES);
  const [productionLogs, setProductionLogs] = useState<ProductionLogEntry[]>(INITIAL_PRODUCTION_LOGS);
  const [downtimes, setDowntimes] = useState<MachineDowntimeEvent[]>(INITIAL_DOWNTIME_EVENTS);
  const [inspections, setInspections] = useState<FabricRollInspection[]>(INITIAL_INSPECTIONS);

  // Handlers
  const handleAddTransaction = (newTx: InventoryTransaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleAddProductionLog = (newLog: ProductionLogEntry) => {
    setProductionLogs((prev) => [newLog, ...prev]);
  };

  const handleAddDowntime = (event: MachineDowntimeEvent) => {
    setDowntimes((prev) => [event, ...prev]);
    // Also mark machine status as Breakdown or Maintenance
    setMachines((prev) =>
      prev.map((m) =>
        m.id === event.machineId
          ? { ...m, status: event.reason === 'Scheduled Preventative Maintenance' ? 'Maintenance' : 'Breakdown' }
          : m
      )
    );
  };

  const handleResolveDowntime = (eventId: string, actionNote: string) => {
    setDowntimes((prev) =>
      prev.map((d) =>
        d.id === eventId
          ? {
              ...d,
              resolved: true,
              endTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
              correctiveAction: actionNote,
            }
          : d
      )
    );
  };

  const handleAddInspection = (newInspection: FabricRollInspection) => {
    setInspections((prev) => [newInspection, ...prev]);

    // PROBLEM 1: Quality inspection result affects order status
    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.id === newInspection.productionOrderId) {
          if (newInspection.inspectionResult === 'Rework Required') {
            return {
              ...ord,
              status: 'Rework Required' as const,
              defectReason: newInspection.defectType || 'Colour mismatch',
              latestInspectionResult: 'Rework Required' as const,
              qualityApproved: false,
            };
          }
          if (newInspection.inspectionResult === 'Rejected') {
            return {
              ...ord,
              status: 'Rejected' as const,
              defectReason: newInspection.defectType || 'Severe defect',
              latestInspectionResult: 'Rejected' as const,
              qualityApproved: false,
            };
          }
          if (newInspection.inspectionResult === 'Passed') {
            const isTargetReached = (ord.completedQuantity ?? 0) >= ord.requiredQuantity;
            return {
              ...ord,
              status: isTargetReached ? ('Completed' as const) : ord.status,
              defectReason: undefined,
              latestInspectionResult: 'Passed' as const,
              qualityApproved: true,
            };
          }
        }
        return ord;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased">
      {/* Module Navigation Tabs */}
      <header className="bg-white border-b border-slate-300 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm tracking-tight">
                  EVEREST TEXTILE MILLS
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-xs text-slate-600 font-medium">Factory Operations</span>
              </div>

              <nav className="flex items-center gap-1 h-14" aria-label="Modules">
                <button
                  type="button"
                  onClick={() => setActiveModule('orders')}
                  className={`h-full px-4 text-xs font-medium transition-colors border-b-2 ${
                    activeModule === 'orders'
                      ? 'border-blue-700 text-blue-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  Orders
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModule('inventory')}
                  className={`h-full px-4 text-xs font-medium transition-colors border-b-2 ${
                    activeModule === 'inventory'
                      ? 'border-blue-700 text-blue-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  Inventory
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModule('factory')}
                  className={`h-full px-4 text-xs font-medium transition-colors border-b-2 ${
                    activeModule === 'factory'
                      ? 'border-blue-700 text-blue-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  Production
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModule('quality')}
                  className={`h-full px-4 text-xs font-medium transition-colors border-b-2 ${
                    activeModule === 'quality'
                      ? 'border-blue-700 text-blue-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  Quality
                </button>
              </nav>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Desktop Console · System V2.4
            </div>
          </div>
        </div>
      </header>

      {/* Main Module Content Canvas */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {activeModule === 'orders' && (
          <OrdersModule
            orders={orders}
            inventory={materials}
            productionLogs={productionLogs}
            inspections={inspections}
            onUpdateOrders={setOrders}
          />
        )}

        {activeModule === 'inventory' && (
          <InventoryModule
            materials={materials}
            transactions={transactions}
            orders={orders}
            onUpdateMaterials={setMaterials}
            onAddTransaction={handleAddTransaction}
          />
        )}

        {activeModule === 'factory' && (
          <FactoryOperationsModule
            machines={machines}
            orders={orders}
            productionLogs={productionLogs}
            downtimes={downtimes}
            onUpdateMachines={setMachines}
            onUpdateOrders={setOrders}
            onAddProductionLog={handleAddProductionLog}
            onAddDowntime={handleAddDowntime}
            onResolveDowntime={handleResolveDowntime}
          />
        )}

        {activeModule === 'quality' && (
          <QualityControlModule
            inspections={inspections}
            orders={orders}
            machines={machines}
            onUpdateInspections={setInspections}
            onAddInspection={handleAddInspection}
            onUpdateOrders={setOrders}
          />
        )}
      </main>
    </div>
  );
};
