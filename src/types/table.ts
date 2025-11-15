import type { RecordStatus } from './configuration';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';

export interface DiningTable {
  id: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  recordStatus: RecordStatus;
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
  recordStatus: RecordStatus;
}

export interface UpdateDiningTableRequest {
  id: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  recordStatus: RecordStatus;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED';

export interface TableReservation {
  id: string;
  tableId: number;
  tableNumber: string;
  guestName: string;
  partySize: number;
  reservationTime: string;
  status: ReservationStatus;
  contactPhone?: string;
  notes?: string;
}

export type TableSessionStatus = 'ACTIVE' | 'COMPLETED';

export interface TableServiceSession {
  id: string;
  tableId: number;
  tableNumber: string;
  startedAt: string;
  endedAt?: string;
  waiter?: string;
  guestCount?: number;
  status: TableSessionStatus;
}
