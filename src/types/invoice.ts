import type { OrderItem } from './order';

export interface InvoicePaymentDetail {
  paymentId?: number;
  paymentMethod?: string;
  amount: number;
  paymentDate?: string;
  referenceNumber?: string;
}

export interface InvoiceTemplateMeta {
  id: number;
  name: string;
  headerText?: string;
  footerText?: string;
  logoUrl?: string;
  showCompanyInfo?: boolean;
  showTaxDetails?: boolean;
  paperSize?: string;
  isDefault?: boolean;
  recordStatus?: string;
  createdDate?: string;
  modifiedDate?: string;
  assignedOutletIds?: number[];
}

export interface InvoiceData {
  orderId: number;
  orderNumber: string;
  orderType?: string;
  status?: string;
  orderDate?: string;
  completedDate?: string;

  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  outletId?: number;
  outletName?: string;
  outletCode?: string;
  outletAddress?: string;
  outletPhone?: string;
  outletEmail?: string;

  cashierId?: number;
  cashierName?: string;
  cashierUsername?: string;

  tableId?: number;
  tableNumber?: string;

  items?: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  couponCode?: string;
  taxAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  changeAmount?: number;

  payments?: InvoicePaymentDetail[];
  invoiceTemplate?: InvoiceTemplateMeta;
  notes?: string;
}
