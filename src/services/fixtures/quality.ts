import type { QualityInspection } from '@/models';

export type ReworkStatus = 'not_required' | 'pending' | 'in_progress' | 'completed';

export interface ReworkInfo {
  status: ReworkStatus;
  quantity: number;
  notes?: string;
}

/**
 * Quality inspection fixture extended with rework tracking, which the core
 * QualityInspection model does not carry yet.
 */
export interface QualityRecord extends QualityInspection {
  rework: ReworkInfo;
}

/**
 * Mock quality inspection fixtures for the Quality Control module.
 * Replace with `GET /api/quality/inspections` when the backend is available.
 */
export const qualityFixtures: QualityRecord[] = [
  {
    id: 'QI-001', inspectionNumber: 'QI-2026-0204', productionPlanId: 'PP-1', productionPlanNumber: 'PP-2026-0156', stage: 'weaving', inspectorId: 'W-002', inspectorName: 'Maria Garcia',
    sampleSize: 50, passedCount: 47, failedCount: 3, status: 'conditional',
    defects: [
      { id: 'D-1', inspectionId: 'QI-001', type: 'weaving_fault', severity: 'minor', location: 'Section A', description: 'Minor warp misalignment', count: 2, images: [] },
      { id: 'D-2', inspectionId: 'QI-001', type: 'hole', severity: 'minor', location: 'Section C', description: 'Small hole near selvedge', count: 1, images: [] },
    ],
    notes: 'Within acceptable limits for Grade B', inspectedAt: '2026-10-10T10:15:00', createdAt: '2026-10-10T10:15:00', updatedAt: '2026-10-10T10:15:00',
    rework: { status: 'pending', quantity: 3, notes: 'Rework flagged pieces before finishing' },
  },
  {
    id: 'QI-002', inspectionNumber: 'QI-2026-0203', productionPlanId: 'PP-3', productionPlanNumber: 'PP-2026-0155', stage: 'dyeing', inspectorId: 'W-003', inspectorName: 'Ahmed Hassan',
    sampleSize: 30, passedCount: 30, failedCount: 0, status: 'passed', defects: [],
    notes: 'Perfect color match', inspectedAt: '2026-10-09T14:30:00', createdAt: '2026-10-09T14:30:00', updatedAt: '2026-10-09T14:30:00',
    rework: { status: 'not_required', quantity: 0 },
  },
  {
    id: 'QI-003', inspectionNumber: 'QI-2026-0202', productionPlanId: 'PP-5', productionPlanNumber: 'PP-2026-0159', stage: 'spinning', inspectorId: 'W-001', inspectorName: 'John Smith',
    sampleSize: 40, passedCount: 33, failedCount: 7, status: 'failed',
    defects: [
      { id: 'D-3', inspectionId: 'QI-003', type: 'dimension', severity: 'major', location: 'Batch 3', description: 'Yarn count variation beyond tolerance', count: 4 },
      { id: 'D-4', inspectionId: 'QI-003', type: 'color_mismatch', severity: 'critical', location: 'Batch 3', description: 'Shade variation between cones', count: 3 },
    ],
    notes: 'Batch rejected, re-spinning required', inspectedAt: '2026-10-08T09:00:00', createdAt: '2026-10-08T09:00:00', updatedAt: '2026-10-08T09:00:00',
    rework: { status: 'in_progress', quantity: 7, notes: 'Re-spinning Batch 3' },
  },
  {
    id: 'QI-004', inspectionNumber: 'QI-2026-0201', productionPlanId: 'PP-3', productionPlanNumber: 'PP-2026-0155', stage: 'finishing', inspectorId: 'W-004', inspectorName: 'Priya Patel',
    sampleSize: 25, passedCount: 25, failedCount: 0, status: 'passed', defects: [],
    notes: 'Excellent finish quality', inspectedAt: '2026-10-07T16:45:00', createdAt: '2026-10-07T16:45:00', updatedAt: '2026-10-07T16:45:00',
    rework: { status: 'not_required', quantity: 0 },
  },
  {
    id: 'QI-005', inspectionNumber: 'QI-2026-0200', productionPlanId: 'PP-2', productionPlanNumber: 'PP-2026-0157', stage: 'final', inspectorId: 'W-004', inspectorName: 'Priya Patel',
    sampleSize: 60, passedCount: 58, failedCount: 2, status: 'conditional',
    defects: [
      { id: 'D-5', inspectionId: 'QI-005', type: 'stain', severity: 'minor', location: 'Roll 12', description: 'Light oil stain', count: 2 },
    ],
    notes: 'Conditional pass - stains within tolerance', inspectedAt: '2026-10-06T11:20:00', createdAt: '2026-10-06T11:20:00', updatedAt: '2026-10-06T11:20:00',
    rework: { status: 'completed', quantity: 2, notes: 'Stain removal completed' },
  },
  {
    id: 'QI-006', inspectionNumber: 'QI-2026-0199', productionPlanId: 'PP-1', productionPlanNumber: 'PP-2026-0156', stage: 'spinning', inspectorId: 'W-001', inspectorName: 'John Smith',
    sampleSize: 45, passedCount: 44, failedCount: 1, status: 'passed',
    defects: [
      { id: 'D-6', inspectionId: 'QI-006', type: 'other', severity: 'minor', location: 'Cone 8', description: 'Minor slub', count: 1 },
    ],
    notes: 'Accepted', inspectedAt: '2026-10-04T08:30:00', createdAt: '2026-10-04T08:30:00', updatedAt: '2026-10-04T08:30:00',
    rework: { status: 'not_required', quantity: 0 },
  },
  {
    id: 'QI-007', inspectionNumber: 'QI-2026-0198', productionPlanId: 'PP-2', productionPlanNumber: 'PP-2026-0157', stage: 'weaving', inspectorId: 'W-002', inspectorName: 'Maria Garcia',
    sampleSize: 50, passedCount: 41, failedCount: 9, status: 'failed',
    defects: [
      { id: 'D-7', inspectionId: 'QI-007', type: 'weaving_fault', severity: 'critical', location: 'Loom 3', description: 'Repeated weft breaks', count: 5 },
      { id: 'D-8', inspectionId: 'QI-007', type: 'hole', severity: 'major', location: 'Loom 3', description: 'Fabric tears', count: 4 },
    ],
    notes: 'Loom stopped for repair', inspectedAt: '2026-10-03T13:10:00', createdAt: '2026-10-03T13:10:00', updatedAt: '2026-10-03T13:10:00',
    rework: { status: 'pending', quantity: 9, notes: 'Awaiting loom repair before rework' },
  },
  {
    id: 'QI-008', inspectionNumber: 'QI-2026-0197', productionPlanId: 'PP-4', productionPlanNumber: 'PP-2026-0158', stage: 'final', inspectorId: 'W-004', inspectorName: 'Priya Patel',
    sampleSize: 20, passedCount: 20, failedCount: 0, status: 'passed', defects: [],
    notes: 'Pre-production sample approved', inspectedAt: '2026-10-02T15:00:00', createdAt: '2026-10-02T15:00:00', updatedAt: '2026-10-02T15:00:00',
    rework: { status: 'not_required', quantity: 0 },
  },
];
