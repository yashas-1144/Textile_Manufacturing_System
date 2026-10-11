import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, type Column, Tabs, TabList, Tab, TabPanel } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/StatCard';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input, Select, type SelectOption } from '@/components/ui/Input';
import { LoadingState, ErrorState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { BarChart, PieChart } from '@/components/charts';
import { Plus, DollarSign, TrendingUp, Receipt, CreditCard, Wallet, CheckCircle, MoreVertical, Banknote, AlertCircle, RotateCcw } from 'lucide-react';
import type { Expense, Invoice, Payment } from '@/models';
import { useServiceData } from '@/hooks/useServiceData';
import {
  financeService,
  computeOrderFinancials,
  type CreateExpenseInput,
  type RecordPaymentInput,
} from '@/services/financeService';
import { ExpenseFormModal, PaymentFormModal } from './FinanceModals';

type OrderEconomicsRow = { order: string; invoiced: number; expenses: number };
type CategorySlice = { name: string; value: number };
type TabValue = 'profitability' | 'expenses' | 'invoices' | 'payments';

const categoryLabels: Record<Expense['category'], string> = {
  raw_material: 'Raw Material',
  labor: 'Labor',
  utility: 'Utility',
  maintenance: 'Maintenance',
  transport: 'Transport',
  admin: 'Admin',
  other: 'Other',
};

const invoiceStatusVariant: Record<Invoice['status'], 'neutral' | 'info' | 'success' | 'danger'> = {
  draft: 'neutral',
  sent: 'info',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'neutral',
};

const paymentStatusVariant: Record<Payment['status'], 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  completed: 'success',
  failed: 'danger',
  refunded: 'info',
};

const money = (value: number) => `₹${value.toLocaleString()}`;

export function FinancePage() {
  const { data, setData, loading, error } = useServiceData(financeService.getFinance);
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabValue>('profitability');
  const [search, setSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const expenses = data?.expenses ?? [];
  const invoices = data?.invoices ?? [];
  const payments = data?.payments ?? [];
  const orderList = data?.orders ?? [];

  const query = search.trim().toLowerCase();
  const inDateRange = (date: string) => (!fromDate || date >= fromDate) && (!toDate || date <= toDate);

  const financialRows = (data ? computeOrderFinancials(data) : []).filter(
    (row) =>
      (orderFilter === 'all' || row.orderId === orderFilter) &&
      (!query || row.orderNumber.toLowerCase().includes(query) || row.buyerName.toLowerCase().includes(query))
  );

  const filteredExpenses = expenses.filter(
    (e) =>
      (orderFilter === 'all' || e.orderId === orderFilter) &&
      inDateRange(e.date) &&
      (!query ||
        e.description.toLowerCase().includes(query) ||
        e.expenseNumber.toLowerCase().includes(query) ||
        categoryLabels[e.category].toLowerCase().includes(query))
  );

  const orderOfInvoice = new Map(invoices.map((i) => [i.id, i.orderId]));
  const filteredInvoices = invoices.filter(
    (i) =>
      (orderFilter === 'all' || i.orderId === orderFilter) &&
      inDateRange(i.issueDate) &&
      (!query || i.invoiceNumber.toLowerCase().includes(query) || i.buyerName.toLowerCase().includes(query) || i.orderNumber.toLowerCase().includes(query))
  );
  const filteredPayments = payments.filter(
    (p) =>
      (orderFilter === 'all' || orderOfInvoice.get(p.invoiceId) === orderFilter) &&
      inDateRange(p.paymentDate) &&
      (!query || p.paymentNumber.toLowerCase().includes(query) || p.buyerName.toLowerCase().includes(query) || p.invoiceNumber.toLowerCase().includes(query))
  );

  const totals = financialRows.reduce(
    (acc, row) => ({
      invoiced: acc.invoiced + row.invoiced,
      received: acc.received + row.received,
      outstanding: acc.outstanding + row.outstanding,
      expenses: acc.expenses + row.expenses,
      profit: acc.profit + row.estimatedProfit,
    }),
    { invoiced: 0, received: 0, outstanding: 0, expenses: 0, profit: 0 }
  );

  const economicsData: OrderEconomicsRow[] = financialRows.map((row) => ({
    order: row.orderNumber.replace('ORD-2026-', ''),
    invoiced: row.invoiced,
    expenses: row.expenses,
  }));

  const categoryTotals = new Map<string, number>();
  for (const e of filteredExpenses) {
    const label = categoryLabels[e.category];
    categoryTotals.set(label, (categoryTotals.get(label) ?? 0) + e.amount);
  }
  const expenseBreakdown: CategorySlice[] = [...categoryTotals.entries()].map(([name, value]) => ({ name, value }));

  const receivedFor = (invoiceId: string) =>
    payments.filter((p) => p.invoiceId === invoiceId && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  const orderOptions: SelectOption[] = [
    { value: 'all', label: 'All orders' },
    ...orderList.map((o) => ({ value: o.id, label: `${o.orderNumber} · ${o.buyerName}` })),
  ];

  const resetFilters = () => {
    setOrderFilter('all');
    setFromDate('');
    setToDate('');
  };

  const replaceExpense = (updated: Expense) =>
    setData((prev) => (prev ? { ...prev, expenses: prev.expenses.map((e) => (e.id === updated.id ? updated : e)) } : prev));

  const handleCreateExpense = async (input: CreateExpenseInput) => {
    try {
      const expense = await financeService.createExpense(input);
      setData((prev) => (prev ? { ...prev, expenses: [expense, ...prev.expenses] } : prev));
      setExpenseModalOpen(false);
      addToast({
        type: 'success',
        title: `${expense.expenseNumber} recorded`,
        message:
          expense.status === 'approved'
            ? `${money(expense.amount)} approved and included in order costs.`
            : `${money(expense.amount)} pending approval.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not record expense', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleApproveExpense = async (expense: Expense) => {
    try {
      const updated = await financeService.approveExpense(expense.id);
      replaceExpense(updated);
      addToast({ type: 'success', title: `${updated.expenseNumber} approved`, message: 'Now counted in order profitability.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not approve expense', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleRecordPayment = async (input: RecordPaymentInput) => {
    try {
      const payment = await financeService.recordPayment(input);
      setData((prev) => {
        if (!prev) return prev;
        const nextPayments = [payment, ...prev.payments];
        const received = nextPayments
          .filter((p) => p.invoiceId === payment.invoiceId && p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);
        const nextInvoices = prev.invoices.map((i) =>
          i.id === payment.invoiceId && received >= i.total && i.status !== 'paid' ? { ...i, status: 'paid' as const } : i
        );
        return { ...prev, payments: nextPayments, invoices: nextInvoices };
      });
      setPaymentModalOpen(false);
      addToast({
        type: 'success',
        title: `${payment.paymentNumber} recorded`,
        message: `${money(payment.amount)} from ${payment.buyerName} · ${payment.status}.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Could not record payment', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const expenseColumns: Column<Expense>[] = [
    { key: 'expenseNumber', header: 'Expense #', width: '150px', accessor: 'expenseNumber' },
    { key: 'category', header: 'Category', width: '140px', accessor: (row) => <Badge variant="outline" size="sm">{categoryLabels[row.category]}</Badge> },
    { key: 'description', header: 'Description', accessor: 'description' },
    { key: 'related', header: 'Related To', width: '160px', accessor: (row) => row.orderNumber || '—' },
    { key: 'date', header: 'Date', width: '110px', accessor: 'date' },
    { key: 'amount', header: 'Amount', width: '120px', align: 'right', accessor: (row) => money(row.amount) },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      accessor: (row) => (
        <Badge variant={row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      accessor: (row) => (
        <Dropdown
          trigger={<MoreVertical className="h-4 w-4" />}
          triggerButtonProps={{ 'aria-label': `Actions for ${row.expenseNumber}` }}
          items={[
            {
              label: 'Approve Expense',
              icon: <CheckCircle className="h-4 w-4" />,
              disabled: row.status !== 'pending',
              onClick: () => void handleApproveExpense(row),
            },
          ]}
        />
      ),
    },
  ];

  const invoiceColumns: Column<Invoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', width: '150px', accessor: 'invoiceNumber' },
    {
      key: 'buyerName',
      header: 'Buyer',
      width: '200px',
      accessor: (row) => (
        <div>
          <p className="text-neutral-900">{row.buyerName}</p>
          <p className="text-xs text-neutral-500">{row.orderNumber}</p>
        </div>
      ),
    },
    { key: 'issueDate', header: 'Issued', width: '110px', accessor: 'issueDate' },
    { key: 'dueDate', header: 'Due', width: '110px', accessor: 'dueDate' },
    { key: 'total', header: 'Total', width: '120px', align: 'right', accessor: (row) => money(row.total) },
    { key: 'received', header: 'Received', width: '120px', align: 'right', accessor: (row) => <span className={receivedFor(row.id) >= row.total ? 'text-green-600' : 'text-neutral-700'}>{money(receivedFor(row.id))}</span> },
    { key: 'balance', header: 'Balance', width: '120px', align: 'right', accessor: (row) => money(Math.max(0, row.total - receivedFor(row.id))) },
    { key: 'status', header: 'Status', width: '110px', accessor: (row) => <Badge variant={invoiceStatusVariant[row.status]} size="sm">{row.status}</Badge> },
  ];

  const paymentColumns: Column<Payment>[] = [
    { key: 'paymentNumber', header: 'Payment #', width: '150px', accessor: 'paymentNumber' },
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      width: '160px',
      accessor: (row) => (
        <div>
          <p className="text-neutral-900">{row.invoiceNumber}</p>
          <p className="text-xs text-neutral-500">{row.buyerName}</p>
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', width: '120px', align: 'right', accessor: (row) => money(row.amount) },
    { key: 'method', header: 'Method', width: '130px', accessor: (row) => row.method.replace(/_/g, ' ') },
    { key: 'paymentDate', header: 'Date', width: '110px', accessor: 'paymentDate' },
    { key: 'reference', header: 'Reference', width: '140px', accessor: (row) => row.reference || '—' },
    { key: 'status', header: 'Status', width: '110px', accessor: (row) => <Badge variant={paymentStatusVariant[row.status]} size="sm">{row.status}</Badge> },
  ];

  const profitabilityColumns: Column<(typeof financialRows)[number]>[] = [
    {
      key: 'orderNumber',
      header: 'Order',
      width: '150px',
      accessor: (row) => (
        <div>
          <p className="font-medium text-neutral-900">{row.orderNumber}</p>
          <p className="text-xs text-neutral-500">{row.buyerName}</p>
        </div>
      ),
    },
    { key: 'contracted', header: 'Contracted', width: '130px', align: 'right', accessor: (row) => money(row.contracted) },
    { key: 'invoiced', header: 'Invoiced', width: '130px', align: 'right', accessor: (row) => money(row.invoiced) },
    { key: 'received', header: 'Received', width: '130px', align: 'right', accessor: (row) => <span className="text-green-600">{money(row.received)}</span> },
    { key: 'outstanding', header: 'Outstanding', width: '130px', align: 'right', accessor: (row) => <span className={row.outstanding > 0 ? 'text-amber-600' : 'text-neutral-500'}>{money(row.outstanding)}</span> },
    { key: 'expenses', header: 'Expenses', width: '130px', align: 'right', accessor: (row) => money(row.expenses) },
    {
      key: 'estimatedProfit',
      header: 'Est. Profit',
      width: '140px',
      align: 'right',
      accessor: (row) => (
        <span className={row.estimatedProfit >= 0 ? 'font-semibold text-neutral-900' : 'font-semibold text-red-600'}>{money(row.estimatedProfit)}</span>
      ),
    },
    {
      key: 'marginPct',
      header: 'Margin',
      width: '100px',
      align: 'right',
      accessor: (row) => (
        <Badge variant={row.marginPct >= 30 ? 'success' : row.marginPct >= 10 ? 'warning' : 'danger'} size="sm">
          {row.marginPct}%
        </Badge>
      ),
    },
    {
      key: 'basis',
      header: 'Basis',
      width: '150px',
      accessor: () => <span className="text-xs text-neutral-500">Invoiced − approved costs</span>,
    },
  ];

  return (
    <PageLayout
      title="Finance & Reports"
      description="Order profitability, expenses, invoices and payments — actual recorded values"
      actions={
        <Button onClick={() => setExpenseModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Expense
        </Button>
      }
      showSearch
      onSearch={setSearch}
    >
      {loading ? (
        <LoadingState text="Loading finance data…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <StatCard label="Invoiced" value={money(totals.invoiced)} icon={<Receipt className="h-5 w-5" />} accent="primary" hint={`${financialRows.length} order(s) in view`} />
            <StatCard label="Received" value={money(totals.received)} icon={<Banknote className="h-5 w-5" />} accent="success" hint="Completed payments only" onClick={() => setActiveTab('payments')} />
            <StatCard label="Outstanding" value={money(totals.outstanding)} icon={<AlertCircle className="h-5 w-5" />} accent="warning" hint="Invoiced − received" onClick={() => setActiveTab('invoices')} />
            <StatCard label="Approved Expenses" value={money(totals.expenses)} icon={<Wallet className="h-5 w-5" />} accent="neutral" hint="Pending items excluded" onClick={() => setActiveTab('expenses')} />
            <StatCard label="Est. Profit" value={money(totals.profit)} icon={<TrendingUp className="h-5 w-5" />} accent={totals.profit >= 0 ? 'success' : 'danger'} hint="Invoiced − approved expenses" />
          </div>

          <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="w-64">
              <Select label="Order" options={orderOptions} value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} />
            </div>
            <div className="w-44">
              <Input label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="w-44">
              <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <span className="ml-auto text-sm text-neutral-500">
              Filters apply to summary, charts and all tables
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <CardHeader>
                  <CardTitle>Order Economics — invoiced vs approved expenses</CardTitle>
                </CardHeader>
                {economicsData.length > 0 ? (
                  <BarChart
                    data={economicsData}
                    xKey="order"
                    bars={[
                      { key: 'invoiced', label: 'Invoiced ($)', color: '#0284c7' },
                      { key: 'expenses', label: 'Approved expenses ($)', color: '#94a3b8' },
                    ]}
                    height={280}
                  />
                ) : (
                  <p className="py-16 text-center text-sm text-neutral-500">No orders match the current filters</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                {expenseBreakdown.length > 0 ? (
                  <PieChart data={expenseBreakdown} dataKey="value" nameKey="name" height={280} innerRadius={50} outerRadius={85} />
                ) : (
                  <p className="py-16 text-center text-sm text-neutral-500">No expenses match the current filters</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
                <TabList className="px-6 pt-2">
                  <Tab value="profitability"><TrendingUp className="h-4 w-4 mr-2 inline" />Order Profitability</Tab>
                  <Tab value="expenses"><Wallet className="h-4 w-4 mr-2 inline" />Expenses</Tab>
                  <Tab value="invoices"><Receipt className="h-4 w-4 mr-2 inline" />Invoices</Tab>
                  <Tab value="payments"><CreditCard className="h-4 w-4 mr-2 inline" />Payments</Tab>
                </TabList>
                <div className="p-6">
                  <TabPanel value="profitability">
                    <p className="mb-3 text-sm text-neutral-500">
                      Est. profit = invoiced value − approved expenses (actual received cash shown separately).
                    </p>
                    <Table columns={profitabilityColumns} data={financialRows} keyAccessor="orderId" striped hoverable emptyMessage="No orders match the current filters" />
                  </TabPanel>
                  <TabPanel value="expenses">
                    <div className="mb-4 flex items-center gap-3">
                      <Button size="sm" onClick={() => setExpenseModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                        New Expense
                      </Button>
                      <span className="text-sm text-neutral-500">{filteredExpenses.length} records</span>
                    </div>
                    <Table columns={expenseColumns} data={filteredExpenses} keyAccessor="id" striped hoverable emptyMessage="No expenses match the current filters" />
                  </TabPanel>
                  <TabPanel value="invoices">
                    <p className="mb-3 text-sm text-neutral-500">{filteredInvoices.length} invoices · balances from completed payments</p>
                    <Table columns={invoiceColumns} data={filteredInvoices} keyAccessor="id" striped hoverable emptyMessage="No invoices match the current filters" />
                  </TabPanel>
                  <TabPanel value="payments">
                    <div className="mb-4 flex items-center gap-3">
                      <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
                        <DollarSign className="h-4 w-4" />
                        Record Payment
                      </Button>
                      <span className="text-sm text-neutral-500">{filteredPayments.length} records</span>
                    </div>
                    <Table columns={paymentColumns} data={filteredPayments} keyAccessor="id" striped hoverable emptyMessage="No payments match the current filters" />
                  </TabPanel>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {expenseModalOpen && (
        <ExpenseFormModal isOpen orders={orderList} onClose={() => setExpenseModalOpen(false)} onSubmit={handleCreateExpense} />
      )}
      {paymentModalOpen && (
        <PaymentFormModal isOpen invoices={invoices} payments={payments} onClose={() => setPaymentModalOpen(false)} onSubmit={handleRecordPayment} />
      )}
    </PageLayout>
  );
}
