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
  offlineReference?: string;
  offlineCreatedDate?: string;
  syncedAt?: string;
  
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

  // Table details
  tableId?: number;
  tableNumber?: string;

  // Order items
  items?: OrderItem[];
  payments?: OrderPayment[];
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

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  weight?: number;
  notes?: string;
  isCustom: boolean;
}

export interface OrderPayment {
  paymentMethodName: string;
  amount: number;
}

export interface PartialRefundRequest {
  items: Array<{
    orderItemId: number;
    quantity: number;
  }>;
  reason?: string;
  restockItems: boolean;
}

export interface RefundResponse {
  orderId: number;
  orderNumber: string;
  status: OrderStatus;
  refundedAmount: number;
  originalAmount: number;
  remainingAmount: number;
  restockedItems: boolean;
  reason?: string;
  refundDate: string;
  refundedItems: RefundedItemDTO[];
}

export interface RefundedItemDTO {
  orderItemId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}
