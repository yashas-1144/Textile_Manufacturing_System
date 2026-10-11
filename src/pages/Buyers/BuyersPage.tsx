import { PageLayout } from '@/components/layout/PageLayout';
import { useMockAction } from '@/hooks/useMockAction';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { type Buyer, STATUS_CONFIG } from '@/models';
import { buyers as buyerFixtures } from '@/services/fixtures/orders';
import { ordersService, type CreateBuyerInput } from '@/services/ordersService';
import { NewBuyerModal } from './BuyersModals';

const getColumns = (notify: (feature: string) => void): Column<Buyer>[] => [
  { key: 'name', header: 'Buyer', accessor: 'name', width: '200px' },
  { key: 'company', header: 'Company', accessor: 'company', width: '200px' },
  { key: 'contactPerson', header: 'Contact', accessor: 'contactPerson' },
  { key: 'email', header: 'Email', accessor: 'email', width: '220px' },
  { key: 'country', header: 'Country', accessor: 'country', width: '120px' },
  { key: 'status', header: 'Status', accessor: (row) => <Badge variant={row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'neutral'}>{STATUS_CONFIG[row.status].label}</Badge> },
  { key: 'totalOrders', header: 'Orders', accessor: 'totalOrders', align: 'center', width: '80px' },
  { key: 'totalRevenue', header: 'Revenue', accessor: (row) => `₹${row.totalRevenue.toLocaleString()}`, align: 'right', width: '140px' },
  { key: 'actions', header: '', accessor: (row) => (
    <div className="flex items-center gap-1">
      <button onClick={() => notify(`View Buyer · ${row.name}`)} className="p-1.5 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="View buyer"><Eye className="h-4 w-4" /></button>
      <button onClick={() => notify(`Edit Buyer · ${row.name}`)} className="p-1.5 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Edit buyer"><Edit className="h-4 w-4" /></button>
      <button onClick={() => notify(`Delete Buyer · ${row.name}`)} className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" aria-label="Delete buyer"><Trash2 className="h-4 w-4" /></button>
    </div>
  ), width: '100px', align: 'right' },
];

export function BuyersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [buyers, setBuyers] = useState<Buyer[]>(buyerFixtures);
  const [createOpen, setCreateOpen] = useState(false);
  const { addToast } = useToast();
  const notify = useMockAction();
  const columns = getColumns(notify);

  const loadBuyers = useCallback(async () => {
    try {
      setBuyers(await ordersService.getBuyers());
    } catch {
      // Keep the bundled fixtures if the backend is unreachable.
    }
  }, []);

  // Live buyer directory (order counts update as orders are created).
  useEffect(() => {
    void loadBuyers();
  }, [loadBuyers]);

  const handleCreateBuyer = async (input: CreateBuyerInput) => {
    try {
      const buyer = await ordersService.createBuyer(input);
      await loadBuyers();
      addToast({
        type: 'success',
        title: 'Buyer created',
        message: `${buyer.name} added to the directory and available when creating orders.`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not create buyer',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  const filteredBuyers = buyers.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout
      title="Buyer Orders"
      description="Manage buyers and track customer orders"
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Buyer
        </Button>
      }
      showSearch
      onSearch={setSearchQuery}
    >
      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={filteredBuyers}
            keyAccessor="id"
            striped
            hoverable
            emptyMessage="No buyers found"
          />
        </CardContent>
      </Card>

      <NewBuyerModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateBuyer} />
    </PageLayout>
  );
}
