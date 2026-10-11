export type InspectionResult = 'Passed' | 'Failed' | 'Rejected' | 'Rework Required';
export type DefectType = 'None (Flawless)' | 'Colour Mismatch' | 'Weaving Defect' | 'Stain' | 'Hole' | 'Other';

export interface FabricRollInspection {
  rollId: string;
  productionOrderId: string;
  orderId?: string;
  machineId: string;
  fabricType: string;
  colour: string;
  inspectionDate: string;
  inspectorName: string;
  inspectionResult: InspectionResult;
  defectType: DefectType;
  quantity?: number;
  rollLengthMeters: number;
  rollWeightKg: number;
  gsmMeasured: number;
  gsmStandard: number;
  readyForDispatch: boolean;
  barcode: string;
  unit?: string;
  remarks: string;
  reinspectionOf?: string;
}
