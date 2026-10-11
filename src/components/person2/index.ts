/**
 * @file components/person2/index.ts
 * Person 2 Modules Public API for Everest Textile Mills
 *
 * Person 1 can import any of these standalone modules to mount inside
 * the shared navigation/layout and pages:
 *
 * import {
 *   OrdersModule,
 *   InventoryModule,
 *   FactoryOperationsModule,
 *   QualityControlModule
 * } from '@/src/components/person2';
 */

export { OrdersModule } from './orders/OrdersModule';
export { OrdersTable } from './orders/OrdersTable';
export { OrderDetails } from './orders/OrderDetails';
export { OrderForm } from './orders/OrderForm';

export { InventoryModule } from './inventory/InventoryModule';
export { InventoryTable } from './inventory/InventoryTable';
export { InventoryForm } from './inventory/InventoryForm';
export { StockAlerts } from './inventory/StockAlerts';

export { FactoryOperationsModule } from './factory-operations/FactoryOperationsModule';
export { ProductionOverview } from './factory-operations/ProductionOverview';
export { ProductionTrackingTable } from './factory-operations/ProductionTrackingTable';
export { MachineTable } from './factory-operations/MachineTable';
export { MachineDetails } from './factory-operations/MachineDetails';
export { ProductionForm } from './factory-operations/ProductionForm';
export { DowntimeTable } from './factory-operations/DowntimeTable';

export { QualityControlModule } from './quality-control/QualityControlModule';
export { InspectionTable } from './quality-control/InspectionTable';
export { InspectionForm } from './quality-control/InspectionForm';
export { QualityReports } from './quality-control/QualityReports';

export { DevModuleSwitcher } from './dev/DevModuleSwitcher';
