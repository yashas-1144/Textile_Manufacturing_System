export type FabricUnit = string;
export type OrderStatus = 'Pending' | 'Ready' | 'Material Check' | 'In Production' | 'Quality Check' | 'Rework Required' | 'Completed' | 'Rejected' | 'Cancelled';
export type ProductionStage = 'Queue' | 'Spinning' | 'Weaving' | 'Dyeing' | 'Finishing' | 'Finished' | 'Completed';

export interface RequiredMaterial {
  materialId: string;
  materialName: string;
  requiredAmount: number;
  availableAmount: number;
  unit: string;
}

export interface ProductionOrder {
  id: string;
  clientName: string;
  fabricType: string;
  colour: string;
  colourHex: string;
  requiredQuantity: number;
  completedQuantity: number;
  unit: FabricUnit;
  unitPrice: number;
  totalValue?: number;
  startDate?: string;
  deadline: string;
  createdAt: string;
  status: OrderStatus;
  priority: 'Normal' | 'High' | 'Urgent';
  currentStage: ProductionStage;
  spinningQuantity: number;
  weavingQuantity: number;
  dyeingQuantity: number;
  assignedMachines: string[];
  materialsRequired: RequiredMaterial[];
  materialAvailability: 'Available' | 'Partial' | 'Partial Stock' | 'Unavailable';
  defectReason?: string;
  notes?: string;
}
