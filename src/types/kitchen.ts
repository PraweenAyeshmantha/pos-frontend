export interface KitchenOrderItem {
  id: number;
  productName: string;
  quantity: number;
  imageUrl?: string | null;
}

export interface KitchenOrder {
  id: number;
  orderNumber: string;
  orderType?: string;
  createdDate?: string;
  customerEmail?: string;
  tableId?: number;
  tableNumber?: string;
  items: KitchenOrderItem[];
}
