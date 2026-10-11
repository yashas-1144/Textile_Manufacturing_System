import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/StatCard';
import { Dropdown } from '@/components/ui/Dropdown';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { Box, Package, CheckCircle2, ClipboardCheck, AlertTriangle, Plus, MoreVertical } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useServiceData } from '@/hooks/useServiceData';
import { finishedGoodsService, type CreateRollInput } from '@/services/finishedGoodsService';
import { productionService } from '@/services/productionService';
import type { QcStatus, RollRecord } from '@/services/fixtures/finishedGoods';
import { RollFormModal, QcResultModal } from './FinishedGoodsModals';

const gradeColors = { A: 'success' as const, B: 'info' as const, C: 'warning' as const, reject: 'danger' as const };
const statusColors = { available: 'success' as const, allocated: 'info' as const, dispatched: 'neutral' as const, returned: 'warning' as const };
const qcColors: Record<QcStatus, 'success' | 'warning' | 'danger'> = { passed: 'success', pending: 'warning', failed: 'danger' };
const qcLabels: Record<QcStatus, string> = { passed: 'QC Passed', pending: 'QC Pending', failed: 'QC Failed' };

const statusFilters = ['all', 'available', 'allocated', 'dispatched'] as const;
const gradeFilters = ['all', 'A', 'B', 'C', 'reject'] as const;

export function FinishedGoodsPage() {
  const { data, setData, loading, error } = useServiceData(finishedGoodsService.getRolls);
  const { data: plans } = useServiceData(productionService.getPlans);
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof statusFilters)[number]>('all');
  const [grade, setGrade] = useState<(typeof gradeFilters)[number]>('all');
  const [rollFormOpen, setRollFormOpen] = useState(false);
  const [qcTarget, setQcTarget] = useState<RollRecord | null>(null);

  const rolls = data ?? [];

  const query = search.trim().toLowerCase();
  const filtered = rolls.filter((r) => {
    if (status !== 'all' && r.status !== status) return false;
    if (grade !== 'all' && r.qualityGrade !== grade) return false;
    if (!query) return true;
    return (
      r.rollNumber.toLowerCase().includes(query) ||
      r.productName.toLowerCase().includes(query) ||
      r.location.toLowerCase().includes(query) ||
      (r.orderNumber ?? '').toLowerCase().includes(query)
    );
  });

  const availableMeters = rolls.filter((r) => r.status === 'available').reduce((sum, r) => sum + r.length, 0);
  const readyCount = rolls.filter((r) => r.readyForDispatch && r.status === 'available').length;
  const qcPending = rolls.filter((r) => r.qcStatus === 'pending').length;
  const allocatedMeters = rolls.filter((r) => r.status === 'allocated').reduce((sum, r) => sum + r.length, 0);

  const handleQcResult = async (roll: RollRecord, qcStatus: QcStatus, inspectionNumber: string) => {
    try {
      const updated = await finishedGoodsService.updateQcStatus(roll.id, qcStatus, inspectionNumber || undefined);
      setData((prev) => (prev ? prev.map((r) => (r.id === roll.id ? updated : r)) : prev));
      setQcTarget(null);
      addToast({
        type: qcStatus === 'passed' ? 'success' : 'warning',
        title: `${roll.rollNumber} · ${qcStatus === 'passed' ? 'QC passed' : 'QC failed'}`,
        message:
          qcStatus === 'passed'
            ? 'Roll is now ready for dispatch.'
            : 'Roll placed on QC hold — re-inspect before dispatch.',
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not record QC result', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleMarkReady = async (roll: RollRecord) => {
    try {
      const updated = await finishedGoodsService.markReadyForDispatch(roll.id);
      setData((prev) => (prev ? prev.map((r) => (r.id === roll.id ? updated : r)) : prev));
      addToast({ type: 'success', title: `${roll.rollNumber} marked ready`, message: 'It can now be selected for a dispatch.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not mark roll ready', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleCreateRoll = async (input: CreateRollInput) => {
    try {
      const roll = await finishedGoodsService.createRoll(input);
      setData((prev) => (prev ? [roll, ...prev] : [roll]));
      setRollFormOpen(false);
      addToast({ type: 'success', title: 'Roll added', message: `${roll.rollNumber} created with QC pending.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not add roll', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const columns: Column<RollRecord>[] = [
    {
      key: 'rollNumber',
      header: 'Roll #',
      width: '150px',
      accessor: (row) => (
        <div>
          <p className="font-medium text-neutral-900">{row.rollNumber}</p>
          <p className="text-xs text-neutral-500">{row.productionPlanNumber}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      width: '200px',
      accessor: (row) => (
        <div>
          <p className="text-neutral-900">{row.productName}</p>
          <p className="text-xs text-neutral-500">{row.specification}</p>
        </div>
      ),
    },
    {
      key: 'dimensions',
      header: 'Dimensions',
      width: '170px',
      accessor: (row) => `${row.length} ${row.unit} × ${row.width}m · ${row.weight}kg`,
    },
    { key: 'qualityGrade', header: 'Grade', width: '80px', align: 'center', accessor: (row) => <Badge variant={gradeColors[row.qualityGrade]} size="sm">{row.qualityGrade}</Badge> },
    { key: 'qc', header: 'Quality', width: '120px', accessor: (row) => <Badge variant={qcColors[row.qcStatus]} size="sm" dot>{qcLabels[row.qcStatus]}</Badge> },
    {
      key: 'ready',
      header: 'Dispatch Ready',
      width: '130px',
      accessor: (row) =>
        row.readyForDispatch && row.status === 'available' ? (
          <Badge variant="success" size="sm"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
        ) : (
          <Badge variant="neutral" size="sm">Hold</Badge>
        ),
    },
    { key: 'status', header: 'Status', width: '110px', accessor: (row) => <Badge variant={statusColors[row.status]} size="sm">{row.status.charAt(0).toUpperCase() + row.status.slice(1)}</Badge> },
    { key: 'location', header: 'Location', width: '140px', accessor: 'location' },
    { key: 'orderNumber', header: 'Order', width: '150px', accessor: (row) => row.orderNumber || '—' },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      accessor: (row) => (
        <Dropdown
          trigger={<MoreVertical className="h-4 w-4" />}
          triggerButtonProps={{ 'aria-label': `Actions for ${row.rollNumber}` }}
          items={[
            {
              label: 'Record QC Result',
              icon: <ClipboardCheck className="h-4 w-4" />,
              disabled: row.qcStatus === 'passed',
              onClick: () => setQcTarget(row),
            },
            {
              label: 'Mark Ready for Dispatch',
              icon: <CheckCircle2 className="h-4 w-4" />,
              disabled: !(row.qcStatus === 'passed' && row.status === 'available' && !row.readyForDispatch),
              onClick: () => void handleMarkReady(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <PageLayout
      title="Finished Goods"
      description="Track fabric roll inventory, quality results, and dispatch readiness"
      actions={
        <Button onClick={() => setRollFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Roll
        </Button>
      }
      showSearch
      onSearch={setSearch}
    >
      {loading ? (
        <LoadingState text="Loading finished goods…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <StatCard label="Total Rolls" value={rolls.length} icon={<Package className="h-5 w-5" />} accent="primary" />
            <StatCard label="Available" value={`${availableMeters.toLocaleString()} m`} icon={<Box className="h-5 w-5" />} accent="success" onClick={() => setStatus('available')} />
            <StatCard label="Dispatch Ready" value={readyCount} icon={<CheckCircle2 className="h-5 w-5" />} accent="info" hint="QC passed · available" />
            <StatCard label="QC Pending" value={qcPending} icon={<ClipboardCheck className="h-5 w-5" />} accent="warning" hint="Needs inspection" />
            <StatCard label="Allocated" value={`${allocatedMeters.toLocaleString()} m`} icon={<AlertTriangle className="h-5 w-5" />} accent="neutral" onClick={() => setStatus('allocated')} />
          </div>

          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {statusFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors capitalize',
                    status === s ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {s === 'all' ? 'All Status' : s}
                </button>
              ))}
              <span className="ml-auto text-sm text-neutral-500">
                {filtered.length} of {rolls.length} rolls
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {gradeFilters.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    grade === g ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {g === 'all' ? 'All Grades' : `Grade ${g}`}
                </button>
              ))}
            </div>
          </div>

          <Table columns={columns} data={filtered} keyAccessor="id" striped hoverable emptyMessage="No rolls match the current filters" />
        </>
      )}

      {rollFormOpen && <RollFormModal isOpen plans={plans ?? []} onClose={() => setRollFormOpen(false)} onSubmit={handleCreateRoll} />}
      <QcResultModal isOpen={qcTarget !== null} roll={qcTarget} onClose={() => setQcTarget(null)} onSubmit={handleQcResult} />
    </PageLayout>
  );
}
