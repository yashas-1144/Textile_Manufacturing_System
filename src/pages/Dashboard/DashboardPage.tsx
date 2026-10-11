import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { DropdownSelect } from '@/components/ui/Dropdown';
import { EmptyState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { KPICard, LineChart, BarChart } from '@/components/charts';
import {
  ShoppingCart,
  Factory,
  Package,
  Cpu,
  ClipboardCheck,
  Truck,
  Calendar,
  Plus,
  ArrowRight,
  Boxes,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Buyer, Order } from '@/models';
import { ordersService } from '@/services/ordersService';
import {
  productionByRange,
  processOutput,
  todaysOutput,
  activeOrderStats,
  recentOrders,
  lowStockItems,
  machineSummary,
  pendingInspections,
  dispatchesDueToday,
  activityFeed,
  ORDER_STATUS_CONFIG,
  RANGE_OPTIONS,
  buyerOptions as fallbackBuyerOptions,
  type ProductionRange,
  type DashboardOrder,
  type ActivityKind,
} from './dashboardData';
import { CreateOrderModal, type NewOrderInput } from './CreateOrderModal';

const ACTIVITY_META: Record<ActivityKind, { icon: typeof ShoppingCart; className: string }> = {
  order: { icon: ShoppingCart, className: 'bg-primary-50 text-primary-600' },
  production: { icon: Factory, className: 'bg-blue-50 text-blue-600' },
  quality: { icon: ClipboardCheck, className: 'bg-green-50 text-green-600' },
  inventory: { icon: Boxes, className: 'bg-amber-50 text-amber-600' },
  dispatch: { icon: Truck, className: 'bg-indigo-50 text-indigo-600' },
  machine: { icon: Cpu, className: 'bg-neutral-100 text-neutral-600' },
};

const MACHINE_STATUS_META: { key: 'running' | 'idle' | 'maintenance' | 'breakdown'; label: string; bar: string; dot: string }[] = [
  { key: 'running', label: 'Running', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { key: 'idle', label: 'Idle', bar: 'bg-amber-400', dot: 'bg-amber-400' },
  { key: 'maintenance', label: 'Maintenance', bar: 'bg-blue-500', dot: 'bg-blue-500' },
  { key: 'breakdown', label: 'Breakdown', bar: 'bg-red-500', dot: 'bg-red-500' },
];

const TODAY_LABEL = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Projects a database order onto the compact shape the dashboard table renders. */
function toDashboardOrder(order: Order): DashboardOrder {
  const first = order.items[0];
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    buyer: order.buyerName,
    product: first?.productName ?? '—',
    quantity: order.totalQuantity,
    unit: first?.unit ?? 'm',
    dueDate: order.deliveryDate,
    status: order.status,
  };
}

function ViewAllLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [range, setRange] = useState<ProductionRange>('7d');
  const [createOpen, setCreateOpen] = useState(false);
  const [orders, setOrders] = useState<DashboardOrder[]>(recentOrders);
  const [buyerDirectory, setBuyerDirectory] = useState<Buyer[]>([]);

  // Load real orders + the buyer directory so "Create Order" can persist.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [liveOrders, liveBuyers] = await Promise.all([ordersService.getOrders(), ordersService.getBuyers()]);
        if (!cancelled) {
          setOrders(liveOrders.map(toDashboardOrder));
          setBuyerDirectory(liveBuyers);
        }
      } catch {
        // Keep the bundled fallback so the dashboard still renders offline.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dateLabel = TODAY_LABEL;

  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label ?? '';

  const criticalStock = lowStockItems.filter((i) => i.severity === 'critical').length;
  const finalInspections = pendingInspections.filter((i) => i.stage === 'Final').length;
  const atRiskDispatches = dispatchesDueToday.filter((d) => d.atRisk).length;

  const activeOrderCount = orders.filter((o) => !['completed', 'cancelled', 'dispatched'].includes(o.status)).length;
  const liveBuyerOptions = buyerDirectory.length
    ? buyerDirectory.map((b) => ({ value: b.name, label: b.name }))
    : fallbackBuyerOptions;
  const productionChange = Math.round(((todaysOutput.output - todaysOutput.target) / todaysOutput.target) * 100);
  const ordersChange = Math.round((activeOrderStats.delta / (activeOrderStats.active - activeOrderStats.delta)) * 100);

  const handleCreateOrder = async (input: NewOrderInput) => {
    const buyer = buyerDirectory.find((b) => b.name === input.buyer);
    if (!buyer) {
      addToast({
        type: 'error',
        title: 'Buyer not found',
        message: `"${input.buyer}" is not in the buyer directory. Reload the page and try again.`,
      });
      throw new Error('Buyer not found');
    }

    try {
      const created = await ordersService.createOrder({
        buyerId: buyer.id,
        priority: input.priority as Order['priority'],
        orderDate: new Date().toISOString().slice(0, 10),
        deliveryDate: input.dueDate,
        currency: 'INR',
        items: [
          {
            productName: input.product,
            specification: 'As per buyer specification',
            quantity: input.quantity,
            unit: input.unit,
            unitPrice: input.unitPrice,
          },
        ],
        notes: input.notes || undefined,
      });
      setOrders((prev) => [toDashboardOrder(created), ...prev]);
      addToast({
        type: 'success',
        title: 'Order created',
        message: `${created.orderNumber} · ${created.buyerName} saved to the database.`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not create order',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
      throw error;
    }
  };

  const orderColumns: Column<DashboardOrder>[] = [
    {
      key: 'orderNumber',
      header: 'Order ID',
      accessor: 'orderNumber',
      width: '140px',
      render: (value) => <span className="font-mono text-xs text-neutral-700">{String(value)}</span>,
    },
    { key: 'buyer', header: 'Buyer', accessor: 'buyer', width: '180px' },
    { key: 'product', header: 'Fabric / Product', accessor: 'product' },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (row) => `${row.quantity.toLocaleString()} ${row.unit}`,
      align: 'right',
      width: '120px',
    },
    { key: 'dueDate', header: 'Due Date', accessor: (row) => formatShortDate(row.dueDate), width: '110px' },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => {
        const config = ORDER_STATUS_CONFIG[row.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
      width: '140px',
    },
  ];

  return (
    <PageLayout
      title="Overview Dashboard"
      description="Textile Manufacturing Operations"
      showSearch={false}
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Order
        </Button>
      }
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-2 font-medium text-neutral-800">
            <Calendar className="h-4 w-4 text-neutral-400" />
            {dateLabel}
          </span>
          <span className="hidden text-neutral-300 sm:inline">·</span>
          <span className="hidden sm:inline">Operations snapshot</span>
        </div>
        <div className="w-full sm:w-56">
          <DropdownSelect
            value={range}
            onChange={(value) => setRange(value as ProductionRange)}
            items={RANGE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
      title="Active Buyer Orders"
      value={activeOrderCount}
          change={ordersChange}
          changeLabel="vs last week"
          trend={ordersChange > 0 ? 'up' : ordersChange < 0 ? 'down' : 'neutral'}
          accent="primary"
          icon={<ShoppingCart className="h-6 w-6" />}
          onClick={() => navigate('/orders')}
        />
        <KPICard
          title="Today's Production Output"
          value={`${todaysOutput.output.toLocaleString()} m`}
          change={productionChange}
          changeLabel={`vs ${todaysOutput.target.toLocaleString()} m target`}
          trend="up"
          accent="success"
          icon={<Factory className="h-6 w-6" />}
          onClick={() => navigate('/production')}
        />
        <KPICard
          title="Raw Material Stock Alerts"
          value={lowStockItems.length}
          supporting={`${criticalStock} critical · ${lowStockItems.length - criticalStock} low`}
          accent="warning"
          icon={<Package className="h-6 w-6" />}
          onClick={() => navigate('/inventory')}
        />
        <KPICard
          title="Machines Requiring Attention"
          value={machineSummary.attention.length}
          supporting={`${machineSummary.maintenance} maintenance · ${machineSummary.breakdown} breakdown`}
          accent="danger"
          icon={<Cpu className="h-6 w-6" />}
          onClick={() => navigate('/machines')}
        />
        <KPICard
          title="Pending Quality Inspections"
          value={pendingInspections.length}
          supporting={`${finalInspections} awaiting final QC`}
          accent="info"
          icon={<ClipboardCheck className="h-6 w-6" />}
          onClick={() => navigate('/quality')}
        />
        <KPICard
          title="Dispatches Due Today"
          value={dispatchesDueToday.length}
          supporting={`${atRiskDispatches} at risk`}
          accent="primary"
          icon={<Truck className="h-6 w-6" />}
          onClick={() => navigate('/dispatch')}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Production Overview</h3>
                <p className="text-sm text-neutral-500">Daily output vs target · {rangeLabel}</p>
              </div>
            </div>
            <LineChart
              data={productionByRange[range]}
              xKey="label"
              height={300}
              lines={[
                { key: 'output', label: 'Output (m)', color: '#0ea5e9' },
                { key: 'target', label: 'Target (m)', color: '#94a3b8' },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Machine Status</h3>
              <p className="text-sm text-neutral-500">
                {machineSummary.running} of {machineSummary.total} machines running
              </p>
            </div>
            <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-neutral-100">
              {MACHINE_STATUS_META.map((meta) => (
                <div
                  key={meta.key}
                  className={cn(meta.bar, 'h-full')}
                  style={{ width: `${(machineSummary[meta.key] / machineSummary.total) * 100}%` }}
                  title={`${meta.label}: ${machineSummary[meta.key]}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MACHINE_STATUS_META.map((meta) => (
                <div key={meta.key} className="flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
                  <span className="text-sm text-neutral-600">{meta.label}</span>
                  <span className="ml-auto text-sm font-semibold text-neutral-900">{machineSummary[meta.key]}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-neutral-100 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Requires attention</p>
              <div className="space-y-2">
                {machineSummary.attention.map((machine) => (
                  <div key={machine.id} className="flex items-center gap-3">
                    <WrenchOrAlert status={machine.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-800">
                        {machine.name} <span className="font-normal text-neutral-500">· {machine.type}</span>
                      </p>
                      <p className="truncate text-xs text-neutral-500">{machine.note}</p>
                    </div>
                    <Badge variant={machine.status === 'breakdown' ? 'danger' : 'warning'} size="sm">
                      {machine.status === 'breakdown' ? 'Breakdown' : 'Maintenance'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Production by Process</h3>
              <p className="text-sm text-neutral-500">Output vs capacity by production stage (metres/day)</p>
            </div>
            <BarChart
              data={processOutput}
              xKey="process"
              height={300}
              bars={[
                { key: 'output', label: 'Output (m)', color: '#14b8a6' },
                { key: 'capacity', label: 'Capacity (m)', color: '#cbd5e1' },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Recent Buyer Orders</h3>
                <p className="text-sm text-neutral-500">Latest orders across active buyers</p>
              </div>
              <ViewAllLink to="/orders" label="View all" />
            </div>
            <Table
              columns={orderColumns}
              data={orders}
              keyAccessor="id"
              striped
              hoverable
              emptyMessage="No recent orders"
              onRowClick={() => navigate('/orders')}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Inventory Alerts</h3>
                <p className="text-sm text-neutral-500">Yarn & raw material below reorder level</p>
              </div>
              <ViewAllLink to="/inventory" label="View all" />
            </div>
            {lowStockItems.length === 0 ? (
              <EmptyState
                icon={<Package className="h-7 w-7" />}
                title="All stock healthy"
                description="No raw materials are below their reorder threshold right now."
              />
            ) : (
              <div className="space-y-4">
                {lowStockItems.map((item) => {
                  const percent = Math.min(100, Math.round((item.available / item.reorderThreshold) * 100));
                  const isCritical = item.severity === 'critical';
                  return (
                    <div key={item.id}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-800">{item.material}</p>
                          <p className="text-xs text-neutral-500">{item.category}</p>
                        </div>
                        <Badge variant={isCritical ? 'danger' : 'warning'} size="sm">
                          {isCritical ? 'Critical' : 'Low'}
                        </Badge>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={cn('h-full rounded-full', isCritical ? 'bg-red-500' : 'bg-amber-400')}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        <span className="font-medium text-neutral-700">
                          {item.available.toLocaleString()} {item.unit}
                        </span>{' '}
                        available · {item.reorderThreshold.toLocaleString()} {item.unit} reorder at
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
              <p className="text-sm text-neutral-500">Latest events across plant operations</p>
            </div>
            <div className="space-y-1">
              {activityFeed.map((item) => {
                const meta = ACTIVITY_META[item.kind];
                const Icon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-50"
                  >
                    <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full', meta.className)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-800">{item.title}</p>
                      <p className="truncate text-xs text-neutral-500">{item.detail}</p>
                      <p className="text-xs text-neutral-400">{item.actor}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-neutral-400">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {createOpen && (
        <CreateOrderModal
          isOpen
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateOrder}
          buyerOptions={liveBuyerOptions}
        />
      )}
    </PageLayout>
  );
}

function WrenchOrAlert({ status }: { status: 'running' | 'idle' | 'maintenance' | 'breakdown' }) {
  const isBreakdown = status === 'breakdown';
  const variant: BadgeProps['variant'] = isBreakdown ? 'danger' : 'warning';
  return (
    <span
      className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
        variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
      )}
    >
      {isBreakdown ? <AlertTriangle className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
    </span>
  );
}
