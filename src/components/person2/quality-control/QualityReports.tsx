/**
 * @file components/person2/quality-control/QualityReports.tsx
 * Quality Reports & Defect Summary (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React from 'react';
import { FabricRollInspection } from '../../../types/person2/quality';
import { ProductionOrder } from '../../../types/person2/orders';
import {
  calculateQualityMetrics,
  calculateDefectDistribution,
} from '../../../lib/person2/quality-calculations';

interface QualityReportsProps {
  inspections: FabricRollInspection[];
  orders?: ProductionOrder[];
}

export const QualityReports: React.FC<QualityReportsProps> = ({ inspections, orders }) => {
  const metrics = calculateQualityMetrics(inspections, orders);
  const defectCounts = calculateDefectDistribution(inspections, orders);
  const totalDefects = Object.values(defectCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4 text-xs">
      {/* Metrics Summary Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-300 rounded p-3">
          <span className="text-slate-500 text-[11px] block">Quality Pass Rate</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            {metrics.passRatePercentage}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {metrics.approvedCount} of {metrics.totalInspected} rolls passed
          </span>
        </div>

        <div className="bg-white border border-slate-300 rounded p-3">
          <span className="text-slate-500 text-[11px] block">Approved Length</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            {metrics.approvedMeters.toLocaleString()} m
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Of {metrics.totalMetersInspected.toLocaleString()} m total inspected
          </span>
        </div>

        <div className="bg-white border border-slate-300 rounded p-3">
          <span className="text-slate-500 text-[11px] block">Rework Required</span>
          <span className="text-xl font-bold text-amber-800 mt-1 block">
            {metrics.reworkCount} rolls
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Requires trim or shade equalization
          </span>
        </div>

        <div className="bg-white border border-slate-300 rounded p-3">
          <span className="text-slate-500 text-[11px] block">Rejected Rolls</span>
          <span className="text-xl font-bold text-red-700 mt-1 block">
            {metrics.rejectedCount} rolls
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {metrics.rejectedMeters.toLocaleString()} m quarantined
          </span>
        </div>
      </div>

      {metrics.ineligibleCount > 0 && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs flex items-center justify-between">
          <span>
            ℹ️ <strong>{metrics.ineligibleCount} unverified / ineligible inspection records</strong> (orders with 0 m produced fabric) are excluded from active quality pass rate and defect analysis.
          </span>
          <span className="text-[11px] font-mono text-amber-800">
            Audit-clean QA
          </span>
        </div>
      )}

      {/* Defect Analysis Table */}
      <div className="bg-white border border-slate-300 rounded overflow-hidden">
        <div className="px-3 py-2 bg-slate-100 border-b border-slate-300 font-semibold text-slate-700 text-[11px] uppercase tracking-wide">
          Defect Classification Breakdown
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
              <th className="py-2 px-3">Defect Category</th>
              <th className="py-2 px-3 text-right">Incidents</th>
              <th className="py-2 px-3 text-right">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {Object.entries(defectCounts).map(([type, count]) => {
              const pct = totalDefects > 0 ? Math.round((count / totalDefects) * 100) : 0;
              return (
                <tr key={type} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-900 font-medium">{type}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-800">{count}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
