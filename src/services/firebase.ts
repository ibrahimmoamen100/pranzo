import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
  onSnapshot,
  deleteDoc,
  startAfter,
  limit as firestoreLimit,
} from "firebase/firestore";
import { Order } from "@/types/order";

// تكوين Firebase - ستحتاج لإنشاء مشروع في Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAOROOtx0In2Sdv2iuGyY2spPtRNxJfaUU",
  authDomain: "store-a4dbe.firebaseapp.com",
  projectId: "store-a4dbe",
  storageBucket: "store-a4dbe.firebasestorage.app",
  messagingSenderId: "398100588916",
  appId: "1:398100588916:web:d42672f21283e6fb82a421",
  measurementId: "G-X5XDSFH5DY",
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// دالة اختبار الاتصال بـ Firebase
export const testFirebaseConnection = async () => {
  try {
    const testDoc = await addDoc(collection(db, "test"), {
      test: true,
      timestamp: new Date()
    });
    await deleteDoc(doc(db, "test", testDoc.id));
    return true;
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    return false;
  }
};

// دوال إدارة الطلبات
export const orderService = {
  // إضافة طلب جديد مع معالجة محسنة للأخطاء
  async createOrder(
    orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      // اختبار الاتصال أولاً
      const isConnected = await testFirebaseConnection();
      if (!isConnected) {
        throw new Error("No connection to Firebase");
      }

      const orderWithTimestamps = {
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderWithTimestamps);
      return docRef.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  // جلب جميع الطلبات مع معالجة محسنة للأخطاء
  async getOrders(): Promise<Order[]> {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  // تحديث حالة الطلب مع معالجة محسنة للأخطاء
  async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<void> {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },

  // الاستماع للتغييرات في الوقت الفعلي مع معالجة محسنة للأخطاء
  subscribeToOrders(callback: (orders: Order[]) => void) {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (querySnapshot) => {
        const orders = querySnapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return { ...data, id: doc.id } as Order;
        });
        callback(orders);
      }, (error) => {
        console.error("Error in orders subscription:", error);
        callback([]);
      });
    } catch (error) {
      console.error("Error setting up orders subscription:", error);
      return () => {};
    }
  },

  // جلب الطلبات مع دعم pagination
  async getOrdersPaginated({ pageSize = 20, lastDoc = null }: { pageSize?: number; lastDoc?: any }) {
    try {
      let q;
      if (lastDoc) {
        q = query(
          collection(db, "orders"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          firestoreLimit(pageSize)
        );
      } else {
        q = query(
          collection(db, "orders"),
          orderBy("createdAt", "desc"),
          firestoreLimit(pageSize)
        );
      }
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return { ...data, id: doc.id } as Order;
      });
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      return { orders, lastDoc: lastVisible };
    } catch (error) {
      console.error("Error fetching paginated orders:", error);
      throw error;
    }
  },
};