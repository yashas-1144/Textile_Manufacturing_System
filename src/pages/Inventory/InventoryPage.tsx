import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { Plus, Package, AlertTriangle, PackageX, DollarSign, Boxes, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { RawMaterial } from '@/models';
import { useServiceData } from '@/hooks/useServiceData';
import { inventoryService, getReorderIndicator } from '@/services/inventoryService';
import { MaterialFormModal, ReorderModal } from './InventoryModals';

const categoryFilters: { value: RawMaterial['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'yarn', label: 'Yarn' },
  { value: 'dye', label: 'Dye' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'accessory', label: 'Accessory' },
];

const statusFilters: { value: RawMaterial['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const statusLabels: Record<RawMaterial['status'], string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

const statusVariant: Record<RawMaterial['status'], 'success' | 'warning' | 'danger'> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'danger',
};

const barColor: Record<string, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

export function InventoryPage() {
  const { data, setData, loading, error } = useServiceData(inventoryService.getMaterials);
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RawMaterial['category'] | 'all'>('all');
  const [status, setStatus] = useState<RawMaterial['status'] | 'all'>('all');
  const [materialOpen, setMaterialOpen] = useState(false);
  const [reorderTarget, setReorderTarget] = useState<RawMaterial | null>(null);

  const materials = data ?? [];

  const query = search.trim().toLowerCase();
  const filtered = materials.filter((m) => {
    if (category !== 'all' && m.category !== category) return false;
    if (status !== 'all' && m.status !== status) return false;
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      m.specification.toLowerCase().includes(query) ||
      m.supplier.toLowerCase().includes(query)
    );
  });

  const summary = {
    inStock: materials.filter((m) => m.status === 'in_stock').length,
    low: materials.filter((m) => m.status === 'low_stock').length,
    out: materials.filter((m) => m.status === 'out_of_stock').length,
    value: materials.reduce((sum, m) => sum + m.currentStock * m.unitCost, 0),
  };

  const handleAddMaterial = async (input: Parameters<typeof inventoryService.createMaterial>[0]) => {
    try {
      const material = await inventoryService.createMaterial(input);
      setData((prev) => (prev ? [material, ...prev] : [material]));
      setMaterialOpen(false);
      addToast({
        type: 'success',
        title: 'Material added',
        message: `${material.name} was added to the inventory list.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not add material', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleConfirmReorder = async (quantity: number) => {
    const target = reorderTarget;
    if (!target) return;
    try {
      await inventoryService.reorderMaterial(target.id, quantity);
      const fresh = await inventoryService.getMaterials();
      setData(fresh);
      setReorderTarget(null);
      addToast({
        type: 'success',
        title: 'Reorder received',
        message: `${quantity.toLocaleString()} ${target.unit} of ${target.name} added to stock.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not reorder', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const columns: Column<RawMaterial>[] = [
    {
      key: 'name',
      header: 'Material',
      width: '240px',
      accessor: (row) => (
        <div>
          <p className="font-medium text-neutral-900">{row.name}</p>
          <p className="text-xs text-neutral-500">{row.specification}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: '110px',
      accessor: (row) => (
        <Badge variant="outline" size="sm">
          {row.category.charAt(0).toUpperCase() + row.category.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      width: '170px',
      accessor: (row) => {
        const indicator = getReorderIndicator(row);
        const pct = row.maximumStock > 0 ? Math.min(Math.round((row.currentStock / row.maximumStock) * 100), 100) : 0;
        return (
          <div>
            <p className={cn('font-mono font-medium', row.status !== 'in_stock' && 'text-amber-600')}>
              {row.currentStock.toLocaleString()} {row.unit}
            </p>
            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
              <div className={cn('h-full rounded-full', barColor[indicator.variant])} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'reorder',
      header: 'Reorder',
      width: '140px',
      accessor: (row) => {
        const indicator = getReorderIndicator(row);
        return <Badge variant={indicator.variant}>{indicator.label}</Badge>;
      },
    },
    {
      key: 'minMax',
      header: 'Min / Max',
      width: '150px',
      accessor: (row) => (
        <span className="text-neutral-600">
          {row.minimumStock.toLocaleString()} / {row.maximumStock.toLocaleString()} {row.unit}
        </span>
      ),
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      width: '110px',
      align: 'right',
      accessor: (row) => `$${row.unitCost.toFixed(2)}`,
    },
    {
      key: 'stockValue',
      header: 'Stock Value',
      width: '120px',
      align: 'right',
      accessor: (row) => <span className="font-medium text-neutral-900">${(row.currentStock * row.unitCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>,
    },
    { key: 'supplier', header: 'Supplier', width: '180px', accessor: 'supplier' },
    { key: 'location', header: 'Location', width: '140px', accessor: 'location' },
    {
      key: 'lastRestocked',
      header: 'Last Restocked',
      width: '140px',
      accessor: (row) => <span className="text-neutral-600">{row.lastRestocked}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      accessor: (row) => <Badge variant={statusVariant[row.status]}>{statusLabels[row.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      align: 'right',
      accessor: (row) => (
        <Button variant="outline" size="sm" onClick={() => setReorderTarget(row)}>
          <RefreshCw className="h-3.5 w-3.5" />
          Reorder
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Raw Material Inventory"
      description="Monitor yarn, chemical, and dye stock levels with reorder alerts"
      actions={
        <Button onClick={() => setMaterialOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Material
        </Button>
      }
      showSearch
      onSearch={setSearch}
    >
      {loading ? (
        <LoadingState text="Loading inventory…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <StatCard label="Total Materials" value={materials.length} icon={<Boxes className="h-5 w-5" />} accent="primary" />
            <StatCard label="In Stock" value={summary.inStock} icon={<Package className="h-5 w-5" />} accent="success" onClick={() => setStatus('in_stock')} />
            <StatCard label="Low Stock" value={summary.low} icon={<AlertTriangle className="h-5 w-5" />} accent="warning" hint="At or below reorder level" onClick={() => setStatus('low_stock')} />
            <StatCard label="Out of Stock" value={summary.out} icon={<PackageX className="h-5 w-5" />} accent="danger" onClick={() => setStatus('out_of_stock')} />
            <StatCard label="Stock Value" value={`$${summary.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<DollarSign className="h-5 w-5" />} accent="info" hint="Current on-hand value" />
          </div>

          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {categoryFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setCategory(f.value)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    category === f.value ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
                {filtered.length} of {materials.length} materials
              </span>
            </div>
          </div>

          <Table columns={columns} data={filtered} keyAccessor="id" striped hoverable emptyMessage="No materials match the current filters" />
        </>
      )}

      {materialOpen && <MaterialFormModal isOpen onClose={() => setMaterialOpen(false)} onSubmit={handleAddMaterial} />}
      <ReorderModal isOpen={reorderTarget !== null} material={reorderTarget} onClose={() => setReorderTarget(null)} onConfirm={handleConfirmReorder} />
    </PageLayout>
  );
}
