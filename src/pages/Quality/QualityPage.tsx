import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { Plus, ClipboardCheck, CheckCircle2, XCircle, AlertOctagon, Percent, Eye } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { QualityInspection } from '@/models';
import { useServiceData } from '@/hooks/useServiceData';
import { qualityService, REWORK_CONFIG } from '@/services/qualityService';
import { productionService } from '@/services/productionService';
import type { QualityRecord, ReworkStatus } from '@/services/fixtures/quality';
import { InspectionFormModal, InspectionDetailModal } from './QualityModals';

const stageLabel: Record<QualityInspection['stage'], string> = {
  spinning: 'Spinning',
  weaving: 'Weaving',
  dyeing: 'Dyeing',
  finishing: 'Finishing',
  final: 'Final',
};

const statusVariant: Record<QualityInspection['status'], 'success' | 'danger' | 'warning' | 'neutral'> = {
  passed: 'success',
  failed: 'danger',
  conditional: 'warning',
  pending: 'neutral',
};

const stageFilters: { value: QualityInspection['stage'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All Stages' },
  { value: 'spinning', label: 'Spinning' },
  { value: 'weaving', label: 'Weaving' },
  { value: 'dyeing', label: 'Dyeing' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'final', label: 'Final' },
];

const statusFilters: { value: QualityInspection['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'passed', label: 'Passed' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'failed', label: 'Failed' },
];

const passRate = (sampleSize: number, passed: number) => (sampleSize > 0 ? Math.round((passed / sampleSize) * 100) : 0);

export function QualityPage() {
  const { data, setData, loading, error } = useServiceData(qualityService.getInspections);
  const { data: plans } = useServiceData(productionService.getPlans);
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<QualityInspection['stage'] | 'all'>('all');
  const [status, setStatus] = useState<QualityInspection['status'] | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const inspections = data ?? [];
  const detail = inspections.find((i) => i.id === detailId) ?? null;

  const query = search.trim().toLowerCase();
  const filtered = inspections.filter((i) => {
    if (stage !== 'all' && i.stage !== stage) return false;
    if (status !== 'all' && i.status !== status) return false;
    if (!query) return true;
    return (
      i.inspectionNumber.toLowerCase().includes(query) ||
      i.productionPlanNumber.toLowerCase().includes(query) ||
      i.inspectorName.toLowerCase().includes(query)
    );
  });

  const totalSamples = inspections.reduce((s, i) => s + i.sampleSize, 0);
  const totalPassed = inspections.reduce((s, i) => s + i.passedCount, 0);
  const summary = {
    total: inspections.length,
    passed: inspections.filter((i) => i.status === 'passed').length,
    failed: inspections.filter((i) => i.status === 'failed').length,
    conditional: inspections.filter((i) => i.status === 'conditional').length,
    avgPassRate: totalSamples > 0 ? Math.round((totalPassed / totalSamples) * 100) : 0,
  };

  const handleCreateInspection = async (input: Parameters<typeof qualityService.createInspection>[0]) => {
    try {
      const plan = (plans ?? []).find((p) => p.planNumber === input.productionPlanNumber.trim());
      const inspection = await qualityService.createInspection({
        ...input,
        productionPlanId: plan?.id,
        stageId: plan?.stages.find((s) => s.name === input.stage)?.id,
      });
      setData((prev) => (prev ? [inspection, ...prev] : [inspection]));
      setFormOpen(false);
      addToast({
        type: 'success',
        title: 'Inspection recorded',
        message: `${inspection.inspectionNumber} logged with status "${inspection.status}".`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not record inspection',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleUpdateRework = async (id: string, reworkStatus: ReworkStatus) => {
    try {
      await qualityService.updateRework(id, reworkStatus);
      setData((prev) => (prev ? prev.map((i) => (i.id === id ? { ...i, rework: { ...i.rework, status: reworkStatus } } : i)) : prev));
      addToast({
        type: 'success',
        title: 'Rework updated',
        message: `Rework status set to "${REWORK_CONFIG[reworkStatus].label}".`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not update rework',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const columns: Column<QualityRecord>[] = [
    {
      key: 'inspectionNumber',
      header: 'Inspection',
      width: '170px',
      accessor: (row) => (
        <div>
          <p className="font-medium text-neutral-900">{row.inspectionNumber}</p>
          <p className="text-xs text-neutral-500">{row.productionPlanNumber}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      width: '110px',
      accessor: (row) => (
        <Badge variant="outline" size="sm">
          {stageLabel[row.stage]}
        </Badge>
      ),
    },
    { key: 'inspectorName', header: 'Inspector', width: '160px', accessor: 'inspectorName' },
    {
      key: 'sampleSize',
      header: 'Sample',
      width: '90px',
      align: 'center',
      accessor: (row) => row.sampleSize,
    },
    {
      key: 'results',
      header: 'Passed / Failed',
      width: '140px',
      align: 'center',
      accessor: (row) => (
        <span>
          <span className="font-medium text-green-700">{row.passedCount}</span>
          <span className="text-neutral-400"> / </span>
          <span className="font-medium text-red-700">{row.failedCount}</span>
        </span>
      ),
    },
    {
      key: 'passRate',
      header: 'Pass Rate',
      width: '160px',
      accessor: (row) => {
        const rate = passRate(row.sampleSize, row.passedCount);
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn('h-full rounded-full', rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-amber-500' : 'bg-red-500')}
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-xs font-medium text-neutral-600">{rate}%</span>
          </div>
        );
      },
    },
    {
      key: 'defects',
      header: 'Defects',
      width: '90px',
      align: 'center',
      accessor: (row) => (row.defects.length > 0 ? row.defects.length : '—'),
    },
    {
      key: 'rework',
      header: 'Rework',
      width: '150px',
      accessor: (row) => <Badge variant={REWORK_CONFIG[row.rework.status].variant}>{REWORK_CONFIG[row.rework.status].label}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      accessor: (row) => <Badge variant={statusVariant[row.status]}>{row.status.charAt(0).toUpperCase() + row.status.slice(1)}</Badge>,
    },
    {
      key: 'inspectedAt',
      header: 'Inspected',
      width: '120px',
      accessor: (row) => <span className="text-neutral-600">{row.inspectedAt.slice(0, 10)}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      align: 'right',
      accessor: (row) => (
        <Button variant="outline" size="sm" onClick={() => setDetailId(row.id)}>
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Quality Control"
      description="Record inspections, track pass rates, and manage rework across production stages"
      actions={
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          New Inspection
        </Button>
      }
      showSearch
      onSearch={setSearch}
    >
      {loading ? (
        <LoadingState text="Loading inspections…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <StatCard label="Total Inspections" value={summary.total} icon={<ClipboardCheck className="h-5 w-5" />} accent="primary" />
            <StatCard label="Passed" value={summary.passed} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" onClick={() => setStatus('passed')} />
            <StatCard label="Conditional" value={summary.conditional} icon={<AlertOctagon className="h-5 w-5" />} accent="warning" onClick={() => setStatus('conditional')} />
            <StatCard label="Failed" value={summary.failed} icon={<XCircle className="h-5 w-5" />} accent="danger" onClick={() => setStatus('failed')} />
            <StatCard label="Avg Pass Rate" value={`${summary.avgPassRate}%`} icon={<Percent className="h-5 w-5" />} accent="info" hint="Across all inspections" />
          </div>

          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {stageFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStage(f.value)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    stage === f.value ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatus(f.value)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    status === f.value ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-sm text-neutral-500">
                {filtered.length} of {inspections.length} inspections
              </span>
            </div>
          </div>

          <Table columns={columns} data={filtered} keyAccessor="id" striped hoverable emptyMessage="No inspections match the current filters" />
        </>
      )}

      {formOpen && <InspectionFormModal isOpen plans={plans ?? []} onClose={() => setFormOpen(false)} onSubmit={handleCreateInspection} />}
      <InspectionDetailModal isOpen={detail !== null} inspection={detail} onClose={() => setDetailId(null)} onUpdateRework={handleUpdateRework} />
    </PageLayout>
  );
}
