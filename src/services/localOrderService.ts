import { Order } from "@/types/order";

// خدمة محلية للطلبات باستخدام Local Storage
export const localOrderService = {
  // إضافة طلب جديد
  async createOrder(
    orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const orderWithTimestamps = {
      ...orderData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orders = this.getOrdersFromStorage();
    orders.unshift(orderWithTimestamps);
    this.saveOrdersToStorage(orders);

    return orderWithTimestamps.id;
  },

  // جلب جميع الطلبات
  async getOrders(): Promise<Order[]> {
    return this.getOrdersFromStorage();
  },

  // تحديث حالة الطلب
  async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<void> {
    const orders = this.getOrdersFromStorage();
    const orderIndex = orders.findIndex((order) => order.id === orderId);

    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      orders[orderIndex].updatedAt = new Date();
      this.saveOrdersToStorage(orders);
    }
  },

  // الاستماع للتغييرات (محاكاة Real-time)
  subscribeToOrders(callback: (orders: Order[]) => void) {
    // إرجاع دالة لإلغاء الاشتراك
    const interval = setInterval(() => {
      const orders = this.getOrdersFromStorage();
      callback(orders);
    }, 1000); // تحديث كل ثانية

    return () => clearInterval(interval);
  },

  // دوال مساعدة للـ Local Storage
  getOrdersFromStorage(): Order[] {
    try {
      const ordersJson = localStorage.getItem("orders");
      return ordersJson ? JSON.parse(ordersJson) : [];
    } catch {
      return [];
    }
  },

  saveOrdersToStorage(orders: Order[]): void {
    try {
      localStorage.setItem("orders", JSON.stringify(orders));
    } catch (error) {
      console.error("Error saving orders to localStorage:", error);
    }
  },
};
