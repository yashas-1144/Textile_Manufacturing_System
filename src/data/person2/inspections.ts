import type { FabricRollInspection } from '../../types/person2/quality';
export const INITIAL_INSPECTIONS: FabricRollInspection[] = [{ rollId: 'ROLL-1001', productionOrderId: 'ORD-1001', orderId: 'ORD-1001', machineId: 'MCH-301', fabricType: '100% Combed Cotton Poplin', colour: 'Royal Navy', inspectionDate: '2026-10-08', inspectorName: 'Priya Shah', inspectionResult: 'Passed', defectType: 'None (Flawless)', quantity: 1200, rollLengthMeters: 1200, rollWeightKg: 220, gsmMeasured: 110, gsmStandard: 110, readyForDispatch: true, barcode: 'TX-ROLL-1001', unit: 'Meters', remarks: 'Approved for dispatch.' }];
export function getApprovedGoodsForDispatch(inspections: FabricRollInspection[]) {
  const latestByLineage = new Map<string, FabricRollInspection>();
  for (const inspection of inspections) {
    const lineage = `${inspection.orderId}:${inspection.reinspectionOf ?? inspection.rollId}`;
    const existing = latestByLineage.get(lineage);
    if (!existing || existing.inspectionDate <= inspection.inspectionDate) latestByLineage.set(lineage, inspection);
  }
  // Failed and rework-required records never become approved goods; a rework line
  // appears here only after a later reinspection record passes.
  return [...latestByLineage.values()].filter((inspection) => inspection.inspectionResult === 'Passed').map((inspection) => ({ orderId: inspection.productionOrderId, rollId: inspection.rollId, fabricType: inspection.fabricType, colour: inspection.colour, approvedMeters: inspection.rollLengthMeters, inspectedDate: inspection.inspectionDate, inspectorName: inspection.inspectorName }));
}
