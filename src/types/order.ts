export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedExtra?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  selectedBranch: string;
  items: OrderItem[];
  totalAmount: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  estimatedDeliveryTime?: Date;
}

export interface OrderFormData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  selectedBranch: string;
  notes?: string;
}
