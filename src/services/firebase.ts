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
  where,
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

// دوال إدارة الطلبات
export const orderService = {
  // إضافة طلب جديد مع معالجة محسنة للأخطاء
  async createOrder(
    orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
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
      console.log("Fetching orders from Firebase...");
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
      console.log("Query created, executing...");
      const querySnapshot = await getDocs(q);
      console.log("Query executed, found", querySnapshot.docs.length, "orders");
      const orders = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return { ...data, id: doc.id } as Order;
      });
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      console.log("Returning orders:", orders.length);
      return { orders, lastDoc: lastVisible };
    } catch (error) {
      console.error("Error fetching paginated orders:", error);
      throw error;
    }
  },

  // حذف طلب من Firestore
  async deleteOrder(orderId: string): Promise<void> {
    try {
      const orderRef = doc(db, "orders", orderId);
      await deleteDoc(orderRef);
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },

  // جلب بيانات مسؤول حسب اسم المستخدم
  async getAdminByUsername(username: string) {
    try {
      const q = query(collection(db, "admins"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    } catch (error) {
      console.error("Error fetching admin:", error);
      throw error;
    }
  },

  // جلب كلمة سر لوحة الإدارة من Firestore
  async getAdminPanelPassword() {
    try {
      const docRef = doc(db, "adminPanel", "main");
      const docSnap = await getDocs(collection(db, "adminPanel"));
      // ابحث عن مستند باسم main أو أول مستند
      let password = null;
      docSnap.forEach((d) => {
        if (d.id === "main") password = d.data().password;
      });
      return password;
    } catch (error) {
      console.error("Error fetching admin panel password:", error);
      throw error;
    }
  },
};