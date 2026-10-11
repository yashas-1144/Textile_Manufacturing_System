import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { Plus, Factory, PlayCircle, CalendarClock, CheckCircle2, PauseCircle, Eye } from 'lucide-react';
import type { Order, ProductionPlan } from '@/models';
import { useServiceData } from '@/hooks/useServiceData';
import { productionService, getPlanProgress } from '@/services/productionService';
import { ordersService } from '@/services/ordersService';
import { PlanFormModal, PlanDetailModal } from './ProductionModals';

const statusVariant: Record<ProductionPlan['status'], 'neutral' | 'default' | 'success' | 'warning' | 'danger'> = {
  planned: 'neutral',
  in_progress: 'default',
  completed: 'success',
  on_hold: 'warning',
  cancelled: 'danger',
};

const statusLabel: Record<ProductionPlan['status'], string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

const priorityVariant: Record<ProductionPlan['priority'], 'neutral' | 'info' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const statusFilters: { value: ProductionPlan['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
];

export function ProductionPage() {
  const { data, setData, loading, error } = useServiceData(productionService.getPlans);
  const { data: orders } = useServiceData<Order[]>(ordersService.getOrders);
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProductionPlan['status'] | 'all'>('all');
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [detailPlanId, setDetailPlanId] = useState<string | null>(null);

  const plans = data ?? [];
  const detailPlan = plans.find((p) => p.id === detailPlanId) ?? null;

  const query = search.trim().toLowerCase();
  const filtered = plans.filter((p) => {
    if (status !== 'all' && p.status !== status) return false;
    if (!query) return true;
    return (
      p.planNumber.toLowerCase().includes(query) ||
      p.productName.toLowerCase().includes(query) ||
      p.buyerName.toLowerCase().includes(query) ||
      p.orderNumber.toLowerCase().includes(query)
    );
  });

  const summary = {
    total: plans.length,
    inProgress: plans.filter((p) => p.status === 'in_progress').length,
    planned: plans.filter((p) => p.status === 'planned').length,
    completed: plans.filter((p) => p.status === 'completed').length,
    onHold: plans.filter((p) => p.status === 'on_hold').length,
  };

  const handleCreatePlan = async (input: Parameters<typeof productionService.createPlan>[0]) => {
    try {
      const order = (orders ?? []).find((o) => o.orderNumber === input.orderNumber.trim());
      const plan = await productionService.createPlan({ ...input, orderId: order?.id });
      setData((prev) => (prev ? [plan, ...prev] : [plan]));
      setPlanFormOpen(false);
      addToast({
        type: 'success',
        title: 'Production plan created',
        message: `${plan.planNumber} for ${plan.productName} was created.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not create plan',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleAdvance = async (planId: string, stageId: string) => {
    const plan = (data ?? []).find((p) => p.id === planId);
    const stage = plan?.stages.find((s) => s.id === stageId);
    if (!plan || !stage) return;
    const completing = stage.status === 'in_progress';
    try {
      await productionService.advanceStage(planId, stageId, completing ? { completedQuantity: stage.quantity } : {});
      const fresh = await productionService.getPlans();
      setData(fresh);
      addToast({
        type: 'success',
        title: completing ? 'Stage completed' : 'Stage started',
        message: `${stage.displayName} on ${plan.planNumber} ${completing ? 'completed' : 'started'}.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not update stage',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const columns: Column<ProductionPlan>[] = [
    {
      key: 'planNumber',
      header: 'Plan',
      width: '150px',
      accessor: (row) => <span className="font-medium text-neutral-900">{row.planNumber}</span>,
    },
    {
      key: 'product',
      header: 'Product',
      width: '200px',
      accessor: (row) => (
        <div>
          <p className="font-medium text-neutral-900">{row.productName}</p>
          <p className="text-xs text-neutral-500">{row.buyerName}</p>
        </div>
      ),
    },
    { key: 'orderNumber', header: 'Order', width: '140px', accessor: 'orderNumber' },
    {
      key: 'quantity',
      header: 'Quantity',
      width: '120px',
      align: 'right',
      accessor: (row) => `${row.quantity.toLocaleString()} ${row.unit}`,
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '100px',
      accessor: (row) => (
        <Badge variant={priorityVariant[row.priority]} size="sm">
          {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      width: '170px',
      accessor: (row) => {
        const pct = getPlanProgress(row);
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-primary-600" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-medium text-neutral-600">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: 'stages',
      header: 'Stages',
      width: '90px',
      align: 'center',
      accessor: (row) => `${row.stages.filter((s) => s.status === 'completed').length}/${row.stages.length}`,
    },
    {
      key: 'dates',
      header: 'Timeline',
      width: '190px',
      accessor: (row) => (
        <span className="text-sm text-neutral-600">
          {row.startDate} → {row.endDate}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      accessor: (row) => <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      width: '110px',
      align: 'right',
      accessor: (row) => (
        <Button variant="outline" size="sm" onClick={() => setDetailPlanId(row.id)}>
          <Eye className="h-3.5 w-3.5" />
          Details
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Production Planning"
      description="Track production runs across spinning, weaving, dyeing, and finishing stages"
      actions={
        <Button onClick={() => setPlanFormOpen(true)}>
          <Plus className="h-4 w-4" />
          New Plan
        </Button>
      }
      showSearch
      onSearch={setSearch}
    >
      {loading ? (
        <LoadingState text="Loading production plans…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <StatCard label="Total Plans" value={summary.total} icon={<Factory className="h-5 w-5" />} accent="primary" />
            <StatCard label="In Progress" value={summary.inProgress} icon={<PlayCircle className="h-5 w-5" />} accent="info" onClick={() => setStatus('in_progress')} />
            <StatCard label="Planned" value={summary.planned} icon={<CalendarClock className="h-5 w-5" />} accent="neutral" onClick={() => setStatus('planned')} />
            <StatCard label="Completed" value={summary.completed} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" onClick={() => setStatus('completed')} />
            <StatCard label="On Hold" value={summary.onHold} icon={<PauseCircle className="h-5 w-5" />} accent="warning" onClick={() => setStatus('on_hold')} />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                className={
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors ' +
                  (status === f.value ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200')
                }
              >
                {f.label}
              </button>
            ))}
            <span className="text-sm text-neutral-500 ml-auto">
              {filtered.length} of {plans.length} plans
            </span>
          </div>

          <Table columns={columns} data={filtered} keyAccessor="id" striped hoverable emptyMessage="No production plans match the current filters" />
        </>
      )}

      {planFormOpen && <PlanFormModal isOpen orders={orders ?? []} onClose={() => setPlanFormOpen(false)} onSubmit={handleCreatePlan} />}
      <PlanDetailModal isOpen={detailPlan !== null} plan={detailPlan} onClose={() => setDetailPlanId(null)} onAdvance={handleAdvance} />
    </PageLayout>
  );
}
