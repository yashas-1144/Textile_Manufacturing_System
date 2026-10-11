import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/StatCard';
import { Dropdown } from '@/components/ui/Dropdown';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { Truck, Package, Clock, CheckCircle, AlertTriangle, Plus, MapPin as MapPinIcon, ChevronRight, Undo2, MoreVertical } from 'lucide-react';
import type { Dispatch } from '@/models';
import { useServiceData } from '@/hooks/useServiceData';
import { dispatchService, type CreateDispatchInput } from '@/services/dispatchService';
import { DISPATCH_STATUS_SEQUENCE } from '@/services/fixtures/dispatch';
import { NewDispatchModal } from './DispatchModals';

const statusConfig = {
  planned: { label: 'Planned', variant: 'neutral' as const, icon: <Clock className="h-3.5 w-3.5" /> },
  packed: { label: 'Packed', variant: 'info' as const, icon: <Package className="h-3.5 w-3.5" /> },
  loaded: { label: 'Loaded', variant: 'info' as const, icon: <Truck className="h-3.5 w-3.5" /> },
  in_transit: { label: 'In Transit', variant: 'warning' as const, icon: <MapPinIcon className="h-3.5 w-3.5 animate-pulse" /> },
  delivered: { label: 'Delivered', variant: 'success' as const, icon: <CheckCircle className="h-3.5 w-3.5" /> },
  returned: { label: 'Returned', variant: 'danger' as const, icon: <AlertTriangle className="h-3.5 w-3.5" /> },
} as const;

const nextStatus: Record<Dispatch['status'], string | null> = {
  planned: 'Mark Packed',
  packed: 'Mark Loaded',
  loaded: 'Mark In Transit',
  in_transit: 'Confirm Delivery',
  delivered: null,
  returned: null,
};

export function DispatchPage() {
  const { data, setData, loading, error } = useServiceData(dispatchService.getDispatchBoard);
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Dispatch['status'] | 'all'>('all');
  const [newDispatchOpen, setNewDispatchOpen] = useState(false);

  const dispatches = data?.dispatches ?? [];

  const query = search.trim().toLowerCase();
  const filtered = dispatches.filter((d) => {
    if (status !== 'all' && d.status !== status) return false;
    if (!query) return true;
    return (
      d.dispatchNumber.toLowerCase().includes(query) ||
      d.buyerName.toLowerCase().includes(query) ||
      d.orderNumber.toLowerCase().includes(query) ||
      d.vehicleNumber.toLowerCase().includes(query)
    );
  });

  const pending = dispatches.filter((d) => ['planned', 'packed', 'loaded'].includes(d.status)).length;
  const inTransit = dispatches.filter((d) => d.status === 'in_transit').length;
  const delivered = dispatches.filter((d) => d.status === 'delivered').length;
  const readyRolls = data?.rolls.length ?? 0;

  const replaceDispatch = (updated: Dispatch) => {
    setData((prev) => (prev ? { ...prev, dispatches: prev.dispatches.map((d) => (d.id === updated.id ? updated : d)) } : prev));
  };

  const handleAdvance = async (d: Dispatch) => {
    const idx = DISPATCH_STATUS_SEQUENCE.indexOf(d.status);
    const next = DISPATCH_STATUS_SEQUENCE[idx + 1];
    if (!next) return;
    try {
      const updated = await dispatchService.updateDispatchStatus(d.id, next);
      replaceDispatch(updated);
      addToast({
        type: 'success',
        title: `${d.dispatchNumber} · ${statusConfig[next].label}`,
        message: `Status advanced from ${statusConfig[d.status].label}.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not update dispatch', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleReturn = async (d: Dispatch) => {
    try {
      const updated = await dispatchService.updateDispatchStatus(d.id, 'returned');
      replaceDispatch(updated);
      addToast({ type: 'warning', title: `${d.dispatchNumber} returned`, message: 'Shipment marked as returned to warehouse.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not return dispatch', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleCreate = async (input: CreateDispatchInput) => {
    try {
      const created = await dispatchService.createDispatch(input);
      setData((prev) =>
        prev
          ? {
              ...prev,
              dispatches: [created, ...prev.dispatches],
              rolls: prev.rolls.filter((r) => !input.rollIds.includes(r.id)),
            }
          : prev
      );
      setNewDispatchOpen(false);
      addToast({
        type: 'success',
        title: `${created.dispatchNumber} created`,
        message: `${created.items.length} roll(s) allocated to ${created.orderNumber}.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not create dispatch', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const columns: Column<Dispatch>[] = [
    {
      key: 'dispatchNumber',
      header: 'Dispatch #',
      width: '160px',
      accessor: (row) => (
        <div>
          <p className="font-medium text-neutral-900">{row.dispatchNumber}</p>
          <p className="text-xs text-neutral-500">{row.vehicleNumber} · {row.driverName}</p>
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      width: '220px',
      accessor: (row) => (
        <div>
          <p className="text-neutral-900">{row.orderNumber}</p>
          <p className="text-xs text-neutral-500">{row.buyerName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      accessor: (row) => {
        const config = statusConfig[row.status];
        return (
          <Badge variant={config.variant} className="gap-1.5">
            {config.icon} {config.label}
          </Badge>
        );
      },
    },
    { key: 'dispatchDate', header: 'Dispatch Date', width: '130px', accessor: 'dispatchDate' },
    {
      key: 'expectedDeliveryDate',
      header: 'Expected Delivery',
      width: '160px',
      accessor: (row) => (
        <div>
          <p>{row.expectedDeliveryDate}</p>
          {row.actualDeliveryDate && <p className="text-xs text-green-600">Delivered {row.actualDeliveryDate}</p>}
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Rolls',
      width: '120px',
      align: 'center',
      accessor: (row) => `${row.items.length} roll(s) · ${row.items.reduce((sum, i) => sum + i.length, 0)} m`,
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      accessor: (row) => (
        <Dropdown
          trigger={<MoreVertical className="h-4 w-4" />}
          triggerButtonProps={{ 'aria-label': `Actions for ${row.dispatchNumber}` }}
          items={[
            {
              label: nextStatus[row.status] ?? 'Delivered',
              icon: <ChevronRight className="h-4 w-4" />,
              disabled: nextStatus[row.status] === null,
              onClick: () => void handleAdvance(row),
            },
            {
              label: 'Mark Returned',
              icon: <Undo2 className="h-4 w-4" />,
              danger: true,
              disabled: row.status !== 'in_transit',
              onClick: () => void handleReturn(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <PageLayout
      title="Dispatch Management"
      description="Allocate QC-ready rolls, track shipments, and confirm customer deliveries"
      actions={
        <Button onClick={() => setNewDispatchOpen(true)}>
          <Plus className="h-4 w-4" />
          New Dispatch
        </Button>
      }
      showSearch
      onSearch={setSearch}
    >
      {loading ? (
        <LoadingState text="Loading dispatch board…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <StatCard label="Total Dispatches" value={dispatches.length} icon={<Truck className="h-5 w-5" />} accent="primary" />
            <StatCard label="Awaiting Shipment" value={pending} icon={<Package className="h-5 w-5" />} accent="neutral" hint="Planned · packed · loaded" onClick={() => setStatus('planned')} />
            <StatCard label="In Transit" value={inTransit} icon={<MapPinIcon className="h-5 w-5" />} accent="warning" onClick={() => setStatus('in_transit')} />
            <StatCard label="Delivered" value={delivered} icon={<CheckCircle className="h-5 w-5" />} accent="success" onClick={() => setStatus('delivered')} />
            <StatCard label="QC-Ready Rolls" value={readyRolls} icon={<Clock className="h-5 w-5" />} accent="info" hint="Available for new dispatch" />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(['all', 'planned', 'packed', 'loaded', 'in_transit', 'delivered', 'returned'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors ' +
                  (status === s ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200')
                }
              >
                {s === 'all' ? 'All Status' : statusConfig[s].label}
              </button>
            ))}
            <span className="ml-auto text-sm text-neutral-500">
              {filtered.length} of {dispatches.length} dispatches
            </span>
          </div>

          <Table columns={columns} data={filtered} keyAccessor="id" striped hoverable emptyMessage="No dispatches match the current filters" />
        </>
      )}

      {newDispatchOpen && (
        <NewDispatchModal
          isOpen
          orders={data?.orders ?? []}
          rolls={data?.rolls ?? []}
          onClose={() => setNewDispatchOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </PageLayout>
  );
}
