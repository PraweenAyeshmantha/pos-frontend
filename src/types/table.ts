export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';

export interface DiningTable {
  id: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  isActive: boolean;
  outlet: {
    id: number;
    name?: string;
    mode?: string;
  };
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateDiningTableRequest {
  outletId: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  isActive: boolean;
}

export interface UpdateDiningTableRequest {
  id: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  isActive: boolean;
}
