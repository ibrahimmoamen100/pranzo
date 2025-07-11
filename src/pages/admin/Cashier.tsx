import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ShoppingCart,
  ArrowLeft,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  Award,
  Clock,
  Tag,
  CalendarDays,
  Activity,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { isAdminAuthenticated, clearAdminAuth } from "@/utils/auth";
import ReceiptPrinter from "@/components/ReceiptPrinter";

const BASE_URL = import.meta.env.DEV ? "http://localhost:3001" : "";

const Cashier = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products } = useStore();

  // ========== CASHIER STATE ========== //
  const [cashierCategory, setCashierCategory] = useState<string>("");
  const [cashierSubcategory, setCashierSubcategory] = useState<string>("");
  const [cashierProductId, setCashierProductId] = useState<string>("");
  const [cashierQuantity, setCashierQuantity] = useState<number>(1);
  const [cashierPaid, setCashierPaid] = useState<number>(0);
  const [cashierOrders, setCashierOrders] = useState<any[]>([]);
  const [cashierLoading, setCashierLoading] = useState(false);
  const [cashierError, setCashierError] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedExtra, setSelectedExtra] = useState<string>("");

  // --- سلة الطلب المؤقتة ---
  const [orderItems, setOrderItems] = useState<any[]>([]);
  // --- حالة اختيار منتج للإضافة ---
  const [productSearch, setProductSearch] = useState("");
  const [productDialog, setProductDialog] = useState<{ open: boolean; product: any | null }>({ open: false, product: null });
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempSize, setTempSize] = useState("");
  const [tempExtra, setTempExtra] = useState("");
  
  // --- حالة المنتجات المختارة في البطاقات ---
  const [selectedProducts, setSelectedProducts] = useState<Record<string, { quantity: number; size: string; extra: string }>>({});
  
  // --- حالة طباعة الكوبون ---
  const [receiptData, setReceiptData] = useState<any>(null);
  
  // --- حالة حذف الطلب ---
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);


  // استخراج الفئات والفئات الفرعية من المنتجات
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products?.forEach((p) => cats.add(p.category));
    return Array.from(cats);
  }, [products]);

  const subcategories = useMemo(() => {
    const subs = new Set<string>();
    products?.forEach((p) => {
      if (p.category === cashierCategory && p.subcategory) subs.add(p.subcategory);
    });
    return Array.from(subs);
  }, [products, cashierCategory]);

  // --- تصفية المنتجات حسب البحث والفئة ---
  const filteredProductsCashier = useMemo(() => {
    let filtered = products;
    if (cashierCategory && cashierCategory !== "all") filtered = filtered.filter((p) => p.category === cashierCategory);
    if (cashierSubcategory && cashierSubcategory !== "all") filtered = filtered.filter((p) => p.subcategory === cashierSubcategory);
    if (productSearch.trim()) {
      const q = productSearch.trim().toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [products, cashierCategory, cashierSubcategory, productSearch]);

  const selectedProductCashier = useMemo(() => {
    return products?.find((p) => p.id === cashierProductId);
  }, [products, cashierProductId]);

  // احسب سعر الحجم المختار
  const selectedSizePrice = useMemo(() => {
    if (!selectedProductCashier?.sizesWithPrices || !selectedSize || selectedSize === "none") return 0;
    const found = selectedProductCashier.sizesWithPrices.find((s) => s.size === selectedSize);
    return found ? Number(found.price) : 0;
  }, [selectedProductCashier, selectedSize]);
  // احسب سعر الإضافة المختارة
  const selectedExtraPrice = useMemo(() => {
    if (!selectedProductCashier?.extras || !selectedExtra || selectedExtra === "none") return 0;
    const found = selectedProductCashier.extras.find((e) => e.name === selectedExtra);
    return found ? Number(found.price) : 0;
  }, [selectedProductCashier, selectedExtra]);
  // اجمع السعر الكلي
  const cashierTotal = selectedProductCashier
    ? (Number(selectedProductCashier.price) + selectedSizePrice + selectedExtraPrice) * cashierQuantity
    : 0;
  // --- حساب الإجمالي ---
  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const base = Number(item.price) || 0;
      const size = Number(item.sizePrice) || 0;
      const extra = Number(item.extraPrice) || 0;
      return sum + (base + size + extra) * (item.quantity || 1);
    }, 0);
  }, [orderItems]);
  const cashierChange = cashierPaid - orderTotal;

  // جلب الطلبات من السيرفر
  const fetchCashierOrders = async () => {
    setCashierLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders`);
      const data = await res.json();
      setCashierOrders(Array.isArray(data) ? data : []);
    } catch {
      setCashierError("فشل في تحميل الطلبات");
    } finally {
      setCashierLoading(false);
    }
  };

  useEffect(() => {
    fetchCashierOrders();
  }, []);



  // عند تغيير الفئة، أعد تعيين الفئة الفرعية إلى 'all'
  const handleCategoryChange = (cat: string) => {
    setCashierCategory(cat);
    setCashierSubcategory("all");
  };

  // --- إضافة منتج للسلة من البطاقة ---
  const handleAddItemFromCard = (product: any) => {
    const selected = selectedProducts[product.id] || { quantity: 1, size: "", extra: "" };
    
    const sizeObj = selected.size && selected.size !== "none" ? product.sizesWithPrices?.find((s: any) => s.size === selected.size) : null;
    const extraObj = selected.extra && selected.extra !== "none" ? product.extras?.find((e: any) => e.name === selected.extra) : null;
    
    // التأكد من وجود صورة المنتج
    const productImage = product.images?.[0] || "/placeholder.svg";
    
    
    setOrderItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        productImage: productImage, // إضافة صورة المنتج
        price: product.price,
        quantity: selected.quantity,
        selectedSize: sizeObj ? sizeObj.size : undefined,
        sizePrice: sizeObj ? Number(sizeObj.price) : 0,
        selectedExtra: extraObj ? extraObj.name : undefined,
        extraPrice: extraObj ? Number(extraObj.price) : 0,
      },
    ]);
    
    // إعادة تعيين القيم المختارة للمنتج
    setSelectedProducts(prev => ({
      ...prev,
      [product.id]: { quantity: 1, size: "", extra: "" }
    }));
  };

  // --- إضافة منتج للسلة من Modal ---
  const handleAddItemToOrder = () => {
    if (!productDialog.product || tempQuantity <= 0) return;
    const sizeObj = tempSize && tempSize !== "none" ? productDialog.product.sizesWithPrices?.find((s: any) => s.size === tempSize) : null;
    const extraObj = tempExtra && tempExtra !== "none" ? productDialog.product.extras?.find((e: any) => e.name === tempExtra) : null;
    
    // التأكد من وجود صورة المنتج
    const productImage = productDialog.product.images?.[0] || "/placeholder.svg";
    
    
    setOrderItems((prev) => [
      ...prev,
      {
        productId: productDialog.product.id,
        productName: productDialog.product.name,
        productImage: productImage, // إضافة صورة المنتج
        price: productDialog.product.price,
        quantity: tempQuantity,
        selectedSize: sizeObj ? sizeObj.size : undefined,
        sizePrice: sizeObj ? Number(sizeObj.price) : 0,
        selectedExtra: extraObj ? extraObj.name : undefined,
        extraPrice: extraObj ? Number(extraObj.price) : 0,
      },
    ]);
    setProductDialog({ open: false, product: null });
    setTempQuantity(1);
    setTempSize("");
    setTempExtra("");
  };

  // --- حذف منتج من السلة ---
  const handleRemoveItem = (idx: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClearOrder = () => {
    setOrderItems([]);
    setCashierPaid(0);
    setSelectedProducts({}); // إعادة تعيين جميع المنتجات المختارة
  };

  // --- إرسال الطلب ---
  const handleAddCashierOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0 || cashierPaid < 0) {
      toast.error("يرجى إضافة منتجات وإدخال المبلغ المدفوع");
      return;
    }
    setCashierLoading(true);
    try {
      // إنشاء كود الطلب
      const orderNumber = cashierOrders.filter(o => o.source === "cashier").length + 1;
      const orderCode = `ORD-${orderNumber.toString().padStart(3, '0')}`;
      
      const order = {
        orderNumber,
        orderCode,
        items: orderItems,
        totalAmount: orderTotal,
        paid: cashierPaid,
        change: cashierChange,
        createdAt: new Date().toISOString(),
        source: "cashier",
      };
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error();
      toast.success("تمت إضافة الطلب بنجاح");
      
      // إعداد بيانات الكوبون للطباعة
      setReceiptData({
        orderNumber,
        orderCode,
        items: orderItems,
        totalAmount: orderTotal,
        paid: cashierPaid,
        change: cashierChange,
        createdAt: new Date().toISOString(),
      });
      
      setOrderItems([]);
      setCashierPaid(0);
      setSelectedProducts({}); // إعادة تعيين جميع المنتجات المختارة
      fetchCashierOrders();
    } catch {
      toast.error("فشل في إضافة الطلب");
    } finally {
      setCashierLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminAuth();
    navigate("/admin");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  // --- حذف طلب ---
  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("تم حذف الطلب بنجاح");
      setDeleteOrderId(null);
      fetchCashierOrders();
    } catch {
      toast.error("فشل في حذف الطلب");
    }
  };

  // --- مسح جميع الطلبات ---
  const handleClearAllOrders = async () => {
    if (!confirm("هل أنت متأكد من مسح جميع الطلبات؟ هذا الإجراء لا يمكن التراجع عنه.")) {
      return;
    }
    
    try {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("تم مسح جميع الطلبات بنجاح");
      fetchCashierOrders();
    } catch {
      toast.error("فشل في مسح الطلبات");
    }
  };

  // --- طباعة كوبون طلب موجود ---
  const handlePrintExistingOrder = (order: any) => {
    setReceiptData({
      orderNumber: order.orderNumber,
      orderCode: order.orderCode,
      items: order.items,
      totalAmount: order.totalAmount,
      paid: order.paid,
      change: order.change,
      createdAt: order.createdAt,
    });
  };

  // التحقق من المصادقة
  if (!isAdminAuthenticated()) {
    navigate("/admin");
    return null;
  }

  // إذا لم توجد فئات فرعية، اجعل القيمة دومًا 'all'
  useEffect(() => {
    if (subcategories.length === 0 && cashierSubcategory !== "all") {
      setCashierSubcategory("all");
    }
  }, [subcategories, cashierSubcategory]);

  // عند تحميل المنتجات، إذا كانت الفئة فارغة وcategories غير فارغة، عيّن "جميع الفئات"
  useEffect(() => {
    if (!cashierCategory && categories.length > 0) {
      setCashierCategory("all");
    }
  }, [categories, cashierCategory]);

  // Debug: طباعة القيم الفعلية للـ Select
  useEffect(() => {

  }, [cashierCategory, cashierSubcategory, tempSize, tempExtra, subcategories]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#f1f5f9]">
      <Helmet>
        <title>نظام الكاشير</title>
        <meta name="description" content="نظام إدارة الطلبات اليدوية للكاشير" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Topbar />
      <Navbar />
      <main className="max-w-[1600px] mx-auto py-8 px-2 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4 md:gap-0">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/admin")} className="flex items-center gap-2 text-base md:text-lg px-4 py-2 rounded-xl shadow-sm border-primary/30 bg-white/80 hover:bg-primary/10">
              <ArrowLeft className="h-5 w-5" /> العودة إلى لوحة التحكم
            </Button>
            <div>
              <h1 className="text-4xl font-extrabold mb-1 text-primary drop-shadow-sm tracking-tight">نظام الكاشير</h1>
              <p className="text-muted-foreground text-base md:text-lg font-medium">إضافة الطلبات يدويًا وإدارة المبيعات بسهولة</p>
            </div>
          </div>
          <Button onClick={fetchCashierOrders} variant="outline" className="gap-2 px-4 py-2 rounded-xl shadow-sm border-primary/30 bg-white/80 hover:bg-primary/10 text-base md:text-lg" disabled={cashierLoading}>
            <RefreshCw className={`h-5 w-5 ${cashierLoading ? 'animate-spin' : ''}`} /> تحديث
          </Button>
          <Link to="/admin/cashier/analytics">
            <Button variant="outline" className="gap-2 px-4 py-2 rounded-xl shadow-sm border-primary/30 bg-white/80 hover:bg-primary/10 text-base md:text-lg">
              <BarChart3 className="h-5 w-5" /> التحليلات
            </Button>
          </Link>
          <Button onClick={handleClearAllOrders} variant="destructive" className="gap-2 px-4 py-2 rounded-xl text-base md:text-lg">
            <Trash2 className="h-5 w-5" /> مسح جميع الطلبات
          </Button>
          <Button onClick={handleLogout} variant="destructive" className="gap-2 px-4 py-2 rounded-xl text-base md:text-lg">
            <LogOut className="h-5 w-5" /> تسجيل الخروج
          </Button>
        </div>



        {/* واجهة اختيار المنتجات كبطاقات مع بحث وتصفية */}
        <Card className="mb-8 p-6 bg-white/90 rounded-3xl shadow-xl">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
            <CardTitle className="text-2xl font-bold text-primary">اختيار المنتجات</CardTitle>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <Button 
                onClick={() => {
                  setCashierCategory("all");
                  setCashierSubcategory("all");
                  setProductSearch("");
                }}
                variant="outline"
                size="sm"
                className="h-12 px-4 text-sm bg-white/90 border-primary/20 hover:bg-primary/10"
              >
                مسح الفلاتر
              </Button>
              {!cashierCategory ? (
                <div className="h-12 flex items-center justify-center text-muted-foreground">جاري تحميل الفئات...</div>
              ) : (
                <Select value={cashierCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full md:w-48 h-12 rounded-xl text-base bg-white/90 border-primary/20 shadow-sm">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {categories.filter((cat) => typeof cat === "string" && cat.trim() !== "" && cat !== undefined && cat !== null).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={subcategories.length === 0 ? "all" : (cashierSubcategory || "all")}
                onValueChange={val => { if (val && val !== "") setCashierSubcategory(val); }}
                disabled={subcategories.length === 0}
              >
                <SelectTrigger className="w-full md:w-48 h-12 rounded-xl text-base bg-white/90 border-primary/20 shadow-sm">
                  <SelectValue placeholder="كل الفئات الفرعية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفئات الفرعية</SelectItem>
                  {subcategories.length > 0 && subcategories.filter((sub) => typeof sub === "string" && sub.trim() !== "" && sub !== undefined && sub !== null).map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full md:w-64">
                <Input 
                  type="text" 
                  placeholder="🔍 بحث عن منتج..." 
                  value={productSearch} 
                  onChange={e => setProductSearch(e.target.value)} 
                  className="w-full h-12 rounded-xl text-base bg-white/90 border-primary/20 shadow-sm pr-10" 
                />
                {productSearch && (
                  <button 
                    onClick={() => setProductSearch("")}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProductsCashier.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <div className="text-lg font-medium">لا توجد منتجات مطابقة</div>
                  <div className="text-sm text-gray-500 mt-2">جرب تغيير الفئة أو البحث بكلمات مختلفة</div>
                </div>
              ) : (
                <>
                  <div className="col-span-full mb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        تم العثور على <span className="font-semibold text-primary">{filteredProductsCashier.length}</span> منتج
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {cashierCategory === "all" ? "جميع الفئات" : cashierCategory}
                        {cashierSubcategory && cashierSubcategory !== "all" && ` / ${cashierSubcategory}`}
                      </div>
                    </div>
                  </div>
                  {filteredProductsCashier.map((product) => {
                    const selected = selectedProducts[product.id] || { quantity: 1, size: "", extra: "" };
                    const hasSizes = product.sizesWithPrices && product.sizesWithPrices.length > 0;
                    const hasExtras = product.extras && product.extras.length > 0;
                    
                    return (
                      <Card 
                        key={product.id} 
                        className="group relative overflow-hidden border bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/30"
                      >
                        {/* صورة المنتج */}
                        <div className="aspect-[1/1] overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative">
                          <img 
                            src={product.images?.[0] || "/placeholder.svg"} 
                            alt={product.name} 
                            className="h-32 w-32 object-contain group-hover:scale-110 transition-transform duration-300"
                                              onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                          />
                          {/* شارة الحجم أو الإضافة */}
                          {(hasSizes || hasExtras) && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-primary/90 text-white text-xs px-2 py-1 rounded-full">
                                {hasSizes && hasExtras ? "خيارات" : hasSizes ? "أحجام" : "إضافات"}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <CardContent className="p-4">
                          {/* اسم المنتج والفئة */}
                          <div className="mb-3">
                            <h3 className="font-bold text-base line-clamp-2 text-primary mb-1 leading-tight">{product.name}</h3>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{product.category}</span>
                              {product.subcategory && (
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">{product.subcategory}</span>
                              )}
                            </div>
                          </div>

                          {/* السعر */}
                          <div className="font-semibold text-lg text-primary mb-3 text-center">
                            {(() => {
                              const sizePrice = selected.size && selected.size !== "none" 
                                ? product.sizesWithPrices?.find((s: any) => s.size === selected.size)?.price || 0 
                                : 0;
                              const extraPrice = selected.extra && selected.extra !== "none" 
                                ? product.extras?.find((e: any) => e.name === selected.extra)?.price || 0 
                                : 0;
                              const unitPrice = Number(product.price) + Number(sizePrice) + Number(extraPrice);
                              const totalPrice = unitPrice * selected.quantity;
                              return `${totalPrice} ج.م`;
                            })()}
                          </div>
                          
                          {/* الكمية */}
                          <div className="flex items-center justify-between mb-3 bg-gray-50 p-2 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">الكمية:</span>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-7 h-7 p-0 text-xs rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProducts(prev => ({
                                    ...prev,
                                    [product.id]: { ...selected, quantity: Math.max(1, selected.quantity - 1) }
                                  }));
                                }}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center text-sm font-bold text-primary">{selected.quantity}</span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-7 h-7 p-0 text-xs rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProducts(prev => ({
                                    ...prev,
                                    [product.id]: { ...selected, quantity: selected.quantity + 1 }
                                  }));
                                }}
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          {/* الحجم */}
                          {hasSizes && (
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">الحجم:</label>
                              <Select 
                                value={selected.size || "none"} 
                                onValueChange={(value) => setSelectedProducts(prev => ({
                                  ...prev,
                                  [product.id]: { ...selected, size: value }
                                }))}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="اختر الحجم" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">بدون حجم</SelectItem>
                                  {product.sizesWithPrices?.filter((sizeObj: any) => typeof sizeObj?.size === "string" && sizeObj.size.trim() !== "").map((sizeObj: any) => (
                                    <SelectItem key={sizeObj.size} value={sizeObj.size}>
                                      {sizeObj.size} {sizeObj.price && Number(sizeObj.price) > 0 ? `(+${sizeObj.price} ج.م)` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* الإضافة */}
                          {hasExtras && (
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">الإضافة:</label>
                              <Select 
                                value={selected.extra || "none"} 
                                onValueChange={(value) => setSelectedProducts(prev => ({
                                  ...prev,
                                  [product.id]: { ...selected, extra: value }
                                }))}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="اختر الإضافة" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">بدون إضافة</SelectItem>
                                  {product.extras?.filter((extraObj: any) => typeof extraObj?.name === "string" && extraObj.name.trim() !== "").map((extraObj: any) => (
                                    <SelectItem key={extraObj.name} value={extraObj.name}>
                                      {extraObj.name} {extraObj.price && Number(extraObj.price) > 0 ? `(+${extraObj.price} ج.م)` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </CardContent>
                        
                        <CardFooter className="p-4 pt-0">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddItemFromCard(product);
                            }}
                            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold"
                          >
                            <Plus className="w-4 h-4 mr-2" /> إضافة للسلة
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* نافذة اختيار تفاصيل المنتج */}
        {productDialog.open && productDialog.product && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-in fade-in zoom-in">
              <button className="absolute top-3 left-3 text-gray-400 hover:text-red-500" onClick={() => setProductDialog({ open: false, product: null })}>&times;</button>
              <div className="flex flex-col items-center gap-3 mb-4">
                <img 
                  src={productDialog.product.images?.[0] || "/placeholder.svg"} 
                  alt={productDialog.product.name} 
                  className="h-24 w-24 object-contain rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <h3 className="font-bold text-xl text-primary">{productDialog.product.name}</h3>
                <div className="font-semibold text-lg text-primary">{productDialog.product.price} ج.م</div>
              </div>
              {/* حجم */}
              {productDialog.product.sizesWithPrices && productDialog.product.sizesWithPrices.length > 0 && (
                <div className="mb-3 w-full">
                  <label className="block mb-1 font-semibold text-gray-700">الحجم</label>
                  <Select value={tempSize || "none"} onValueChange={setTempSize}>
                    <SelectTrigger className="w-full h-12 rounded-xl text-base bg-white/90 border-primary/20 shadow-sm">
                      <SelectValue placeholder="اختر الحجم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون حجم</SelectItem>

                      {Array.isArray(productDialog.product.sizesWithPrices) && productDialog.product.sizesWithPrices.filter((sizeObj: any) => typeof sizeObj?.size === "string" && sizeObj.size.trim() !== "" && sizeObj.size !== undefined && sizeObj.size !== null).map((sizeObj: any, i: number) => (
                        <SelectItem key={sizeObj.size + i} value={sizeObj.size}>
                          {sizeObj.size} {sizeObj.price && Number(sizeObj.price) > 0 ? `(+${sizeObj.price} ج.م)` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* إضافة */}
              {productDialog.product.extras && productDialog.product.extras.length > 0 && (
                <div className="mb-3 w-full">
                  <label className="block mb-1 font-semibold text-gray-700">الإضافة</label>
                  <Select value={tempExtra || "none"} onValueChange={setTempExtra}>
                    <SelectTrigger className="w-full h-12 rounded-xl text-base bg-white/90 border-primary/20 shadow-sm">
                      <SelectValue placeholder="اختر الإضافة (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون إضافة</SelectItem>

                      {Array.isArray(productDialog.product.extras) && productDialog.product.extras.filter((extraObj: any) => typeof extraObj?.name === "string" && extraObj.name.trim() !== "" && extraObj.name !== undefined && extraObj.name !== null).map((extraObj: any, i: number) => (
                        <SelectItem key={extraObj.name + i} value={extraObj.name}>
                          {extraObj.name} {extraObj.price && Number(extraObj.price) > 0 ? `(+${extraObj.price} ج.م)` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="mb-3 w-full">
                <label className="block mb-1 font-semibold text-gray-700">الكمية</label>
                <Input type="number" min={1} value={tempQuantity} onChange={e => setTempQuantity(Number(e.target.value))} className="h-12 rounded-xl text-base bg-white/90 border-primary/20 shadow-sm" />
              </div>
              <Button className="w-full py-3 text-lg font-bold rounded-xl bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition" onClick={handleAddItemToOrder}>
                <ShoppingCart className="inline-block w-5 h-5 mr-2" /> إضافة للسلة
              </Button>
            </div>
          </div>
        )}

        {/* عرض السلة المؤقتة */}
        <Card className="mb-8 p-6 bg-white/90 rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <ShoppingCart className="inline-block w-7 h-7 text-primary" />
              سلة الطلب الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">لم يتم إضافة أي منتجات بعد</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-center">
                <thead className="bg-primary/10">
                  <tr>
                    <th className="px-4 py-3 font-bold text-primary text-lg">المنتج</th>
                    <th className="px-4 py-3 font-bold text-primary text-lg">الحجم</th>
                    <th className="px-4 py-3 font-bold text-primary text-lg">الإضافة</th>
                    <th className="px-4 py-3 font-bold text-primary text-lg">الكمية</th>
                    <th className="px-4 py-3 font-bold text-primary text-lg">سعر الوحدة</th>
                    <th className="px-4 py-3 font-bold text-primary text-lg">الإجمالي</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {orderItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-primary/5 transition">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border flex-shrink-0 flex items-center justify-center">
                            {item.productImage && item.productImage !== "/placeholder.svg" ? (
                              <img 
                                src={item.productImage} 
                                alt={item.productName} 
                                className="w-full h-full object-cover"
                                                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                                onLoad={() => {
                                  console.log("Image loaded successfully:", item.productImage);
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                <span>صورة</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-base md:text-lg text-primary">{item.productName}</div>
                            <div className="text-xs text-gray-500">ID: {item.productId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-base md:text-lg">
                        {item.selectedSize ? (
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {item.selectedSize}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-2 text-base md:text-lg">
                        {item.selectedExtra ? (
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            + {item.selectedExtra}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-2 text-base md:text-lg font-semibold">{item.quantity}</td>
                      <td className="px-4 py-2 text-base md:text-lg">{Number(item.price) + (item.sizePrice || 0) + (item.extraPrice || 0)} ج.م</td>
                      <td className="px-4 py-2 font-bold text-primary text-base md:text-lg">{((Number(item.price) + (item.sizePrice || 0) + (item.extraPrice || 0)) * item.quantity)} ج.م</td>
                      <td className="px-4 py-2">
                        <Button size="sm" variant="destructive" onClick={() => handleRemoveItem(idx)}>حذف</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
          <CardFooter className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 text-xl font-bold text-primary">
              الإجمالي:
              <span className="text-2xl">{orderTotal} ج.م</span>
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-green-700">
              الباقي:
              <span className="text-2xl">{cashierChange >= 0 ? cashierChange : 0} ج.م</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold text-gray-700">المبلغ المدفوع</label>
              <Input type="number" min={0} value={cashierPaid} onChange={e => setCashierPaid(Number(e.target.value))} className="h-12 rounded-xl text-base bg-white/90 border-primary/20 shadow-sm w-32" />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleClearOrder}
                variant="outline"
                className="py-3 px-6 text-lg font-bold rounded-xl border-red-300 text-red-600 hover:bg-red-50 shadow-lg transition" 
                disabled={orderItems.length === 0}>
                <Trash2 className="inline-block w-5 h-5 mr-2" />
                مسح السلة
              </Button>
              <Button 
                onClick={handleAddCashierOrder} 
                className="py-3 px-8 text-lg font-bold rounded-xl bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition" 
                disabled={orderItems.length === 0 || cashierLoading || cashierPaid < orderTotal || cashierPaid === 0}>
                <ShoppingCart className="inline-block w-5 h-5 mr-2" />
                {cashierLoading ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* جدول الطلبات المدخلة يدويًا (محسن) */}
        <Card className="p-8 shadow-2xl border-0 bg-white/80 rounded-3xl backdrop-blur-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3 text-primary drop-shadow-sm">
            <ShoppingCart className="inline-block w-7 h-7 text-primary" />
            الطلبات المدخلة يدويًا
          </h2>
          <div className="overflow-x-auto rounded-2xl shadow border border-primary/10 bg-white/80">
            <table className="min-w-full divide-y divide-gray-200 text-center">
              <thead className="bg-primary/10">
                <tr>
                  <th className="px-4 py-3 font-bold text-primary text-lg">رقم الطلب</th>
                  <th className="px-4 py-3 font-bold text-primary text-lg">كود الطلب</th>
                  <th className="px-4 py-3 font-bold text-primary text-lg">المنتجات</th>
                  <th className="px-4 py-3 font-bold text-primary text-lg">الكمية الإجمالية</th>
                  <th className="px-4 py-3 font-bold text-primary text-lg">الإجمالي</th>
                  <th className="px-4 py-3 font-bold text-primary text-lg">التاريخ والوقت</th>
                  <th className="px-4 py-3 font-bold text-primary text-lg">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {cashierLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-muted-foreground text-lg">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : cashierOrders.filter((o) => o.source === "cashier").length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-muted-foreground text-lg">
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  cashierOrders
                    .filter((o) => o.source === "cashier")
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((order, idx) => (
                      <tr key={idx} className="hover:bg-primary/5 transition">
                        <td className="px-4 py-3 font-bold text-primary text-lg">
                          {order.orderNumber || idx + 1}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-600 text-lg">
                          {order.orderCode || `ORD-${(order.orderNumber || idx + 1).toString().padStart(3, '0')}`}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="space-y-2">
                            {order.items?.map((item, i) => {
                              const product = products?.find(p => p.id === item.productId);
                              return (
                                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border flex-shrink-0">
                                    <img 
                                      src={product?.images?.[0] || item.productImage || "/placeholder.svg"} 
                                      alt={item.productName} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = "/placeholder.svg";
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 text-right">
                                    <div className="font-semibold text-primary">{item.productName}</div>
                                    <div className="text-sm text-gray-600">
                                      {item.selectedSize && (
                                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1">
                                          {item.selectedSize}
                                        </span>
                                      )}
                                      {item.selectedExtra && (
                                        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                          + {item.selectedExtra}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      الكمية: {item.quantity} | السعر: {Number(item.price) + (item.sizePrice || 0) + (item.extraPrice || 0)} ج.م
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-lg font-semibold">
                          {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                        </td>
                        <td className="px-4 py-3 font-bold text-primary text-lg">
                          {order.totalAmount} ج.م
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {order.createdAt ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-primary">
                                {new Date(order.createdAt).toLocaleDateString("ar-EG", { 
                                  year: "numeric", 
                                  month: "long", 
                                  day: "numeric" 
                                })}
                              </div>
                              <div className="text-gray-600">
                                {new Date(order.createdAt).toLocaleTimeString("ar-EG", { 
                                  hour: "2-digit", 
                                  minute: "2-digit",
                                  second: "2-digit"
                                })}
                              </div>
                            </div>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintExistingOrder(order)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              🖨️ طباعة
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteOrderId(order.orderCode)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              🗑️ حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
        
        {/* مكون طباعة الكوبون */}
        <ReceiptPrinter 
          receiptData={receiptData} 
          onClose={() => setReceiptData(null)} 
        />

        {/* Modal تأكيد الحذف */}
        {deleteOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">تأكيد الحذف</h2>
                <p className="text-muted-foreground">
                  هل أنت متأكد من حذف الطلب رقم <span className="font-bold text-primary">{deleteOrderId}</span>؟
                </p>
                <p className="text-sm text-red-500 mt-2">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteOrder(deleteOrderId)}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition"
                >
                  🗑️ حذف الطلب
                </button>
                <button
                  onClick={() => setDeleteOrderId(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cashier; 