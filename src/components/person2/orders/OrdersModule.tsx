/**
 * @file components/person2/orders/OrdersModule.tsx
 * Order Management Module Root (Person 2 - Factory Operations)
 * Everest Textile Mills
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ProductionOrder, OrderStatus } from '../../../types/person2/orders';
import { RawMaterial } from '../../../types/person2/inventory';
import { ProductionLogEntry } from '../../../types/person2/production';
import { FabricRollInspection } from '../../../types/person2/quality';
import { validateOrderStatusTransition } from '../../../lib/person2/order-calculations';
import { OrdersTable } from './OrdersTable';
import { OrderDetails } from './OrderDetails';
import { OrderForm } from './OrderForm';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { btnPrimary, btnSecondary, btnDestructivePrimary } from '../../../lib/person2/ui-styles';

interface OrdersModuleProps {
  orders: ProductionOrder[];
  inventory: RawMaterial[];
  productionLogs?: ProductionLogEntry[];
  inspections?: FabricRollInspection[];
  onUpdateOrders: (updatedOrders: ProductionOrder[]) => void;
}

export const OrdersModule: React.FC<OrdersModuleProps> = ({
  orders,
  inventory,
  productionLogs = [],
  inspections = [],
  onUpdateOrders,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<ProductionOrder | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Essential filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [fabricFilter, setFabricFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'Normal' | 'High' | 'Urgent' | 'ALL'>('ALL');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.clientName.toLowerCase().includes(q) ||
        order.fabricType.toLowerCase().includes(q) ||
        order.colour.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesFabric = fabricFilter === 'ALL' || order.fabricType === fabricFilter;
      const matchesPriority = priorityFilter === 'ALL' || order.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesFabric && matchesPriority;
    });
  }, [orders, searchQuery, statusFilter, fabricFilter, priorityFilter]);

  // Unique fabrics for filter
  const uniqueFabrics = useMemo(() => {
    return Array.from(new Set(orders.map((o) => o.fabricType)));
  }, [orders]);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // Validate workflow transition
    const validation = validateOrderStatusTransition(targetOrder, newStatus, inspections);
    if (!validation.valid) {
      setNotification({
        type: 'error',
        text: validation.reason || `Status transition to '${newStatus}' is not allowed for this order.`,
      });
      return;
    }

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          // Preserve actual quantities! Do NOT overwrite actual production logs.
          currentStage:
            newStatus === 'Completed'
              ? ('Completed' as const)
              : newStatus === 'In Production' && o.currentStage === 'Completed'
              ? ('Dyeing' as const)
              : o.currentStage,
        };
      }
      return o;
    });
    onUpdateOrders(updated);

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus,
          currentStage:
            newStatus === 'Completed'
              ? ('Completed' as const)
              : newStatus === 'In Production' && prev.currentStage === 'Completed'
              ? ('Dyeing' as const)
              : prev.currentStage,
        };
      });
    }

    setNotification({
      type: 'success',
      text: `Order ${orderId} status updated to '${newStatus}'.`,
    });
  };

  const handleEditOrder = (order: ProductionOrder) => {
    setEditingOrder(order);
  };

  const handleSaveOrder = (savedOrder: ProductionOrder) => {
    if (editingOrder) {
      // Edit existing order:
      // Preserves existing production history and quality inspection history
      const updated = orders.map((o) => (o.id === savedOrder.id ? savedOrder : o));
      onUpdateOrders(updated);
      if (selectedOrder && selectedOrder.id === savedOrder.id) {
        setSelectedOrder(savedOrder);
      }
      setEditingOrder(null);
      setNotification({
        type: 'success',
        text: `Order ${savedOrder.id} (${savedOrder.clientName}) updated successfully. Revised target: ${savedOrder.requiredQuantity.toLocaleString()} ${savedOrder.unit}.`,
      });
    } else {
      // New order created
      onUpdateOrders([savedOrder, ...orders]);
      setIsCreateModalOpen(false);
      setNotification({
        type: 'success',
        text: `New order ${savedOrder.id} (${savedOrder.clientName}) created successfully.`,
      });
    }
  };

  const handleDeleteClick = (order: ProductionOrder) => {
    setDeletingOrder(order);
  };

  // Inspect dependent records for the order targeted for deletion
  const deleteDependencyInfo = useMemo(() => {
    if (!deletingOrder) return null;
    const relatedLogs = (productionLogs || []).filter((l) => l.orderId === deletingOrder.id);
    const relatedInspections = (inspections || []).filter(
      (i) => i.productionOrderId === deletingOrder.id
    );
    const hasProcessedGoods =
      (deletingOrder.completedQuantity ?? 0) > 0 ||
      (deletingOrder.spinningQuantity ?? 0) > 0 ||
      (deletingOrder.weavingQuantity ?? 0) > 0 ||
      (deletingOrder.dyeingQuantity ?? 0) > 0;

    const hasOperationalHistory =
      relatedLogs.length > 0 || relatedInspections.length > 0 || hasProcessedGoods;

    return {
      hasOperationalHistory,
      logCount: relatedLogs.length,
      inspectionCount: relatedInspections.length,
      hasProcessedGoods,
      finishedMeters: deletingOrder.completedQuantity ?? 0,
      spinningMeters: deletingOrder.spinningQuantity ?? 0,
      weavingMeters: deletingOrder.weavingQuantity ?? 0,
      dyeingMeters: deletingOrder.dyeingQuantity ?? 0,
    };
  }, [deletingOrder, productionLogs, inspections]);

  const handleConfirmDelete = () => {
    if (!deletingOrder) return;
    const orderToDelete = deletingOrder;
    const updated = orders.filter((o) => o.id !== orderToDelete.id);
    onUpdateOrders(updated);
    if (selectedOrder && selectedOrder.id === orderToDelete.id) {
      setSelectedOrder(null);
    }
    setDeletingOrder(null);
    setNotification({
      type: 'success',
      text: `Order ${orderToDelete.id} (${orderToDelete.clientName}) was permanently deleted.`,
    });
  };

  const handleCancelOrderInstead = () => {
    if (!deletingOrder) return;
    handleUpdateStatus(deletingOrder.id, 'Cancelled');
    const orderId = deletingOrder.id;
    setDeletingOrder(null);
    setNotification({
      type: 'warning',
      text: `Order ${orderId} has operational records and was marked as 'Cancelled' instead of deleted.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification Alert */}
      {notification && (
        <div
          className={`p-3 rounded border flex items-center justify-between text-xs transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : notification.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-800 text-xs px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-300">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-xs text-slate-500">
            Manage orders, fabric, and deadlines.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => {
              setEditingOrder(null);
              setIsCreateModalOpen(true);
            }}
            className={btnPrimary}
          >
            + New Order
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-300 rounded p-2.5 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between text-xs">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-xs">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All</option>
              <option value="Pending">Pending</option>
              <option value="Material Check">Material Check</option>
              <option value="Ready">Ready</option>
              <option value="In Production">In Production</option>
              <option value="Quality Check">Quality Check</option>
              <option value="Rework Required">Rework Required</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-xs">Fabric:</span>
            <select
              value={fabricFilter}
              onChange={(e) => setFabricFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-600 max-w-[170px] truncate"
            >
              <option value="ALL">All Fabrics</option>
              {uniqueFabrics.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-xs">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Simplified Orders Table */}
      <OrdersTable
        orders={filteredOrders}
        inspections={inspections}
        onSelectOrder={(order) => setSelectedOrder(order)}
        onEditOrder={handleEditOrder}
        onDeleteOrder={handleDeleteClick}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Clean Order Details Panel */}
      <OrderDetails
        order={selectedOrder}
        inspections={inspections}
        onClose={() => setSelectedOrder(null)}
        onEditOrder={(order) => {
          setSelectedOrder(null);
          handleEditOrder(order);
        }}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Order Creation / Edit Modal */}
      <OrderForm
        isOpen={isCreateModalOpen || Boolean(editingOrder)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={handleSaveOrder}
        inventory={inventory}
        initialOrder={editingOrder}
      />

      {/* Delete Confirmation Dialog */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-300 shadow-xl w-full max-w-md overflow-hidden text-xs">
            <div className="px-5 py-3 border-b border-slate-300 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`w-4 h-4 ${
                    deleteDependencyInfo?.hasOperationalHistory ? 'text-amber-600' : 'text-rose-600'
                  }`}
                />
                <h3 className="font-bold text-slate-900 text-sm">
                  {deleteDependencyInfo?.hasOperationalHistory
                    ? `Cannot Delete Order: ${deletingOrder.id}`
                    : `Delete Order: ${deletingOrder.id}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                className="text-slate-500 hover:text-slate-800 text-sm font-semibold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {deleteDependencyInfo?.hasOperationalHistory ? (
                <>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 space-y-2">
                    <p className="font-medium">
                      This order has recorded operational history and cannot be permanently deleted:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-800">
                      {deleteDependencyInfo.finishedMeters > 0 && (
                        <li>
                          <strong>{deleteDependencyInfo.finishedMeters.toLocaleString()} m</strong> finished fabric produced
                        </li>
                      )}
                      {(deleteDependencyInfo.spinningMeters > 0 || deleteDependencyInfo.weavingMeters > 0) && (
                        <li>
                          Pipeline output: {deleteDependencyInfo.spinningMeters.toLocaleString()} m spun, {deleteDependencyInfo.weavingMeters.toLocaleString()} m woven
                        </li>
                      )}
                      {deleteDependencyInfo.logCount > 0 && (
                        <li>
                          <strong>{deleteDependencyInfo.logCount}</strong> production floor log entry(s)
                        </li>
                      )}
                      {deleteDependencyInfo.inspectionCount > 0 && (
                        <li>
                          <strong>{deleteDependencyInfo.inspectionCount}</strong> quality control inspection record(s)
                        </li>
                      )}
                    </ul>
                  </div>

                  <p className="text-slate-600 text-xs">
                    To comply with factory quality assurance and industrial ISO traceability standards,
                    orders with manufacturing history cannot be deleted. You can mark this order as{' '}
                    <strong>Cancelled</strong> instead to halt further production.
                  </p>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeletingOrder(null)}
                      className={btnSecondary}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelOrderInstead}
                      className="h-[38px] px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-medium text-xs rounded-[7px] transition-colors"
                    >
                      Cancel Order
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-700 font-medium text-xs">
                    Are you sure you want to delete this order?
                    <br />
                    <span className="text-rose-600 font-normal">This action cannot be undone.</span>
                  </p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1 text-slate-700">
                    <div>
                      <span className="text-slate-500">Order ID:</span>{' '}
                      <strong className="font-mono text-slate-900">{deletingOrder.id}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Client:</span>{' '}
                      <strong className="text-slate-900">{deletingOrder.clientName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Fabric:</span>{' '}
                      <span className="text-slate-900">{deletingOrder.fabricType} ({deletingOrder.colour})</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Target:</span>{' '}
                      <span className="text-slate-900 font-mono">
                        {deletingOrder.requiredQuantity.toLocaleString()} {deletingOrder.unit}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeletingOrder(null)}
                      className={btnSecondary}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className={btnDestructivePrimary}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
