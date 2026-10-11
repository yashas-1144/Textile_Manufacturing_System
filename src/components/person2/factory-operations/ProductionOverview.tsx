/**
 * @file components/person2/factory-operations/ProductionOverview.tsx
 * Production Overview & Shift Output Summary (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React from 'react';
import { ProductionLogEntry, Machine } from '../../../types/person2/production';
import { ProductionOrder } from '../../../types/person2/orders';
import { calculateFleetUtilization } from '../../../lib/person2/production-calculations';
import { Activity, Gauge, Flame, CheckCircle2, Clock } from 'lucide-react';

interface ProductionOverviewProps {
  machines: Machine[];
  logs: ProductionLogEntry[];
  orders: ProductionOrder[];
}

export const ProductionOverview: React.FC<ProductionOverviewProps> = ({
  machines,
  logs,
  orders,
}) => {
  const runningCount = machines.filter((m) => m.status === 'Running').length;
  const breakdownCount = machines.filter((m) => m.status === 'Breakdown').length;
  const maintenanceCount = machines.filter((m) => m.status === 'Maintenance').length;
  const idleCount = machines.filter((m) => m.status === 'Idle').length;

  const fleetUtilization = calculateFleetUtilization(runningCount, machines.length);

  // Today's total logged output (date 2026-10-09)
  const todayLogs = logs.filter((l) => l.productionDate === '2026-10-09');
  const todayTotalOutputMeters = todayLogs.reduce((sum, l) => sum + l.quantityProduced, 0);

  // Group by process
  const spinningLogs = logs.filter((l) => l.productionStage === 'Spinning');
  const weavingLogs = logs.filter((l) => l.productionStage === 'Weaving');
  const dyeingLogs = logs.filter((l) => l.productionStage === 'Dyeing');

  const spinningOutput = spinningLogs.reduce((sum, l) => sum + l.quantityProduced, 0);
  const weavingOutput = weavingLogs.reduce((sum, l) => sum + l.quantityProduced, 0);
  const dyeingOutput = dyeingLogs.reduce((sum, l) => sum + l.quantityProduced, 0);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Machine Fleet Utilization
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1.5">
            <span>{fleetUtilization}%</span>
            <span className="text-xs font-normal text-slate-500">
              ({runningCount}/{machines.length} active)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Breakdown: <span className="font-semibold text-red-600">{breakdownCount}</span> · Maint:{' '}
            <span className="font-semibold text-amber-600">{maintenanceCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Today Output Logged
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {todayTotalOutputMeters.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">Meters</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across 3 operational shifts
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Weaving Loom Production
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {weavingOutput.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">Meters</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Airjet & Rapier loom halls
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Dye House Throughput
          </div>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            {dyeingOutput.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">Meters</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            HT Jet vessels & soft-flow
          </div>
        </div>
      </div>

      {/* Process Pipeline Status Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
          Process Stage Workload Allocation
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-900">1. Spinning Hall</span>
              <span className="text-blue-700 font-bold">{spinningOutput.toLocaleString()} m</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Ring Spinning frame active on ORD-102 & ORD-104
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-900">2. Weaving Sheds</span>
              <span className="text-blue-700 font-bold">{weavingOutput.toLocaleString()} m</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Loom L-02 online; Loom DJ-10 under maintenance overhaul
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-900">3. Wet Dyeing House</span>
              <span className="text-purple-700 font-bold">{dyeingOutput.toLocaleString()} m</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Dye Vessel D-01 running Royal Navy shade for ORD-101
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
