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
  // إضافة طلب جديد
  async createOrder(
    orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const orderWithTimestamps = {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "orders"), orderWithTimestamps);
    return docRef.id;
  },

  // جلب جميع الطلبات
  async getOrders(): Promise<Order[]> {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];
  },

  // تحديث حالة الطلب
  async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<void> {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date(),
    });
  },

  // الاستماع للتغييرات في الوقت الفعلي
  subscribeToOrders(callback: (orders: Order[]) => void) {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      callback(orders);
    });
  },
};
