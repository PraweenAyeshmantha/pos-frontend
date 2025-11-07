export type OrderType = 'COUNTER' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type OrderStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'PREPARING' 
  | 'READY' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'REFUNDED' 
  | 'ON_HOLD';

export interface Order {
  id: number;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  notes?: string;
  createdDate: string;
  completedDate?: string;
  isOnline: boolean;
  
  // Customer details
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Outlet details
  outletId: number;
  outletName: string;
  outletCode: string;
  
  // Cashier details
  cashierId?: number;
  cashierName?: string;
  cashierUsername?: string;
}

export interface OrderFilters {
  outletId?: number;
  status?: OrderStatus;
  isOnline?: boolean;
  startDate?: string;
  endDate?: string;
  cashierId?: number;
  cashierUsername?: string;
}
