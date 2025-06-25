import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { orderService } from "@/services/firebase";
import { Order } from "@/types/order";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/utils/format";
import { toast } from "sonner";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  MapPin,
  Trash2,
  MessageCircle,
} from "lucide-react";

const PAGE_SIZE = 20;

const Orders = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [pageStack, setPageStack] = useState<any[]>([]);
  const [isLastPage, setIsLastPage] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [newOrderBanner, setNewOrderBanner] = useState(false);

  // جلب أول صفحة من الطلبات (استبدلها بالاستماع اللحظي)
  useEffect(() => {
    setLoading(true);
    setPageStack([]);
    setLastDoc(null);
    let firstLoad = true;
    let prevOrderIds: string[] = [];
    const unsubscribe = orderService.subscribeToOrders((ordersList) => {
      setOrders((prevOrders) => {
        const currentIds = ordersList.map((o) => o.id);
        // إذا لم يكن أول تحميل، تحقق من وجود معرف جديد
        if (!firstLoad) {
          const newIds = currentIds.filter(id => !prevOrderIds.includes(id));
          if (newIds.length > 0 && activeTab === "orders") {
            setNewOrderBanner(true);
          }
        }
        prevOrderIds = currentIds;
        firstLoad = false;
        return ordersList;
      });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  // تحديث الإحصائيات عند تغيير الطلبات
  useEffect(() => {
    // حساب الإحصائيات فورًا عند تغيير الطلبات
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );

    // تصفية الطلبات حسب الوقت
    const filteredByTime = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      switch (timeFilter) {
        case "today":
          return orderDate >= today;
        case "week":
          return orderDate >= weekAgo;
        case "month":
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });

    // تصفية حسب الحالة
    const filteredOrders =
      statusFilter === "all"
        ? filteredByTime
        : filteredByTime.filter((order) => order.status === statusFilter);

    // إحصائيات عامة
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // إحصائيات الحالات
    const statusStats = {
      pending: filteredOrders.filter((o) => o.status === "pending").length,
      confirmed: filteredOrders.filter((o) => o.status === "confirmed").length,
      preparing: filteredOrders.filter((o) => o.status === "preparing").length,
      ready: filteredOrders.filter((o) => o.status === "ready").length,
      delivered: filteredOrders.filter((o) => o.status === "delivered").length,
      cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
    };

    // أكثر المنتجات طلباً
    const productStats = filteredOrders.reduce((acc, order) => {
      order.items.forEach((item) => {
        if (acc[item.productName]) {
          acc[item.productName].count += item.quantity;
          acc[item.productName].revenue += item.price * item.quantity;
        } else {
          acc[item.productName] = {
            count: item.quantity,
            revenue: item.price * item.quantity,
            name: item.productName,
          };
        }
      });
      return acc;
    }, {} as Record<string, { count: number; revenue: number; name: string }>);

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // أكثر الفروع نشاطاً
    const branchStats = filteredOrders.reduce((acc, order) => {
      if (acc[order.selectedBranch]) {
        acc[order.selectedBranch].count += 1;
        acc[order.selectedBranch].revenue += order.totalAmount;
      } else {
        acc[order.selectedBranch] = {
          count: 1,
          revenue: order.totalAmount,
          name: order.selectedBranch,
        };
      }
      return acc;
    }, {} as Record<string, { count: number; revenue: number; name: string }>);

    const topBranches = Object.values(branchStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // إحصائيات زمنية
    const hourlyStats = new Array(24).fill(0);
    const dailyStats = new Array(7).fill(0);

    filteredOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      const day = orderDate.getDay();
      hourlyStats[hour]++;
      dailyStats[day]++;
    });

    setAnalyticsData({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusStats,
      topProducts,
      topBranches,
      hourlyStats,
      dailyStats,
      filteredOrders,
    });
  }, [orders, statusFilter, timeFilter]);

  // جلب الصفحة التالية
  const fetchNextPage = async () => {
    if (!lastDoc) return;
    setLoading(true);
    const { orders: nextOrders, lastDoc: nextLastDoc } = await orderService.getOrdersPaginated({ pageSize: PAGE_SIZE, lastDoc });
    setPageStack((prev) => [...prev, lastDoc]);
    setOrders(nextOrders);
    setLastDoc(nextLastDoc);
    setIsLastPage(!nextLastDoc);
    setLoading(false);
  };

  // جلب الصفحة السابقة
  const fetchPrevPage = async () => {
    if (pageStack.length === 0) return;
    setLoading(true);
    const prevStack = [...pageStack];
    const prevLastDoc = prevStack.pop();
    const { orders: prevOrders, lastDoc: prevDoc } = await orderService.getOrdersPaginated({ pageSize: PAGE_SIZE, lastDoc: prevStack[prevStack.length - 1] || null });
    setOrders(prevOrders);
    setLastDoc(prevDoc);
    setPageStack(prevStack);
    setIsLastPage(false);
    setLoading(false);
  };

  // دالة حذف الطلب
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا الطلب نهائيًا؟")) return;
    try {
      await orderService.deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("تم حذف الطلب بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الطلب. حاول مرة أخرى.");
    }
  };

  // دالة إرسال رسالة واتساب
  const sendWhatsAppMessage = (order: Order) => {
    const statusText = getStatusText(order.status);
    const orderNumber = order.id.slice(-8);
    const customerPhone = '20' + order.customerPhone.replace(/\D/g, '');
    
    const message = `مرحباً ${order.customerName} 👋

📦 *تحديث حالة طلبك*
رقم الطلب: #${orderNumber}

🔄 *الحالة الحالية:* ${statusText}

📋 *تفاصيل الطلب:*
${order.items.map(item => `• ${item.quantity}x ${item.productName}${item.selectedSize ? ` (${item.selectedSize})` : ''}${item.selectedExtra ? ` + ${item.selectedExtra}` : ''}`).join('\n')}

💰 *المبلغ الإجمالي:* ${formatPrice(order.totalAmount)} جنيه

🏪 *الفرع:* ${order.selectedBranch}

${order.status === 'ready' ? '🚚 *الطلب جاهز للتوصيل! سيتم التواصل معك قريباً*' : ''}
${order.status === 'delivered' ? '✅ *تم توصيل طلبك بنجاح! نتمنى أن ينال إعجابك*' : ''}

شكراً لثقتك بنا 🙏
للاستفسار: ${order.selectedBranch}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // تحديث حالة الطلب مع تحديث فوري للواجهة
  const handleStatusChange = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // تحديث الطلب في القائمة المحلية فورًا
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        )
      );
      
      toast.success("تم تحديث حالة الطلب بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث حالة الطلب");
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "في الانتظار";
      case "confirmed":
        return "مؤكد";
      case "preparing":
        return "قيد التحضير";
      case "ready":
        return "جاهز";
      case "delivered":
        return "تم التوصيل";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    return days[dayIndex];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <Navbar />
        <div className="container py-8">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <Navbar />
        <div className="container py-8">
          <div className="text-center">جاري تحميل البيانات...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <Navbar />

      <div className="container py-8">
        {newOrderBanner && activeTab === "orders" && (
          <div className="bg-green-600 text-white text-center py-3 mb-4 rounded-lg text-lg font-bold animate-bounce">
            تم إضافة طلب جديد! <button className="ml-4 underline" onClick={() => setNewOrderBanner(false)}>إخفاء</button>
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <div className="flex gap-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفترات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">آخر أسبوع</SelectItem>
                <SelectItem value="month">آخر شهر</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطلبات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="preparing">قيد التحضير</SelectItem>
                <SelectItem value="ready">جاهز</SelectItem>
                <SelectItem value="delivered">تم التوصيل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                إجمالي الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {timeFilter !== "all"
                  ? `في ${
                      timeFilter === "today"
                        ? "اليوم"
                        : timeFilter === "week"
                        ? "الأسبوع"
                        : "الشهر"
                    }`
                  : "جميع الفترات"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                إجمالي المبيعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(analyticsData.totalRevenue)} جنيه
              </div>
              <p className="text-xs text-muted-foreground">
                متوسط الطلب: {formatPrice(analyticsData.averageOrderValue)} جنيه
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                الطلبات النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {analyticsData.statusStats.pending +
                  analyticsData.statusStats.confirmed +
                  analyticsData.statusStats.preparing}
              </div>
              <p className="text-xs text-muted-foreground">
                في الانتظار + مؤكد + قيد التحضير
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                الطلبات المكتملة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.statusStats.delivered}
              </div>
              <p className="text-xs text-muted-foreground">تم التوصيل بنجاح</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="products">أفضل المنتجات</TabsTrigger>
            <TabsTrigger value="branches">أفضل الفروع</TabsTrigger>
            <TabsTrigger value="orders">قائمة الطلبات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* إحصائيات الحالات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    في الانتظار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {analyticsData.statusStats.pending}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    قيد التحضير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {analyticsData.statusStats.preparing}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    جاهز للتوصيل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.statusStats.ready}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* إحصائيات زمنية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    الطلبات حسب الساعة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analyticsData.hourlyStats.map((count, hour) => (
                      <div key={hour} className="flex items-center gap-2">
                        <span className="text-xs w-8">{hour}:00</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${
                                (count / Math.max(...analyticsData.hourlyStats)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    الطلبات حسب اليوم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analyticsData.dailyStats.map((count, day) => (
                      <div key={day} className="flex items-center gap-2">
                        <span className="text-xs w-16">{getDayName(day)}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${
                                (count / Math.max(...analyticsData.dailyStats)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  أفضل 5 منتجات مطلوبة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المرتبة</TableHead>
                      <TableHead>اسم المنتج</TableHead>
                      <TableHead>عدد الطلبات</TableHead>
                      <TableHead>إجمالي المبيعات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.topProducts.map((product, index) => (
                      <TableRow key={product.name}>
                        <TableCell className="font-bold">
                          #{index + 1}
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.count}</TableCell>
                        <TableCell>
                          {formatPrice(product.revenue)} جنيه
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branches" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  أفضل 5 فروع نشاطاً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المرتبة</TableHead>
                      <TableHead>اسم الفرع</TableHead>
                      <TableHead>عدد الطلبات</TableHead>
                      <TableHead>إجمالي المبيعات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.topBranches.map((branch, index) => (
                      <TableRow key={branch.name}>
                        <TableCell className="font-bold">
                          #{index + 1}
                        </TableCell>
                        <TableCell>{branch.name}</TableCell>
                        <TableCell>{branch.count}</TableCell>
                        <TableCell>
                          {formatPrice(branch.revenue)} جنيه
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {/* جدول الطلبات */}
            <Card>
              <CardHeader>
                <CardTitle>
                  الطلبات ({analyticsData.filteredOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المنتجات</TableHead>
                      <TableHead>الفرع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.customerPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.quantity}x {item.productName}
                                {item.selectedSize && ` (${item.selectedSize})`}
                                {item.selectedExtra &&
                                  ` + ${item.selectedExtra}`}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{order.selectedBranch}</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(order.totalAmount)} جنيه
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(order.createdAt).toLocaleString("ar-EG")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value: Order["status"]) =>
                              handleStatusChange(order.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                في الانتظار
                              </SelectItem>
                              <SelectItem value="confirmed">مؤكد</SelectItem>
                              <SelectItem value="preparing">
                                قيد التحضير
                              </SelectItem>
                              <SelectItem value="ready">جاهز</SelectItem>
                              <SelectItem value="delivered">
                                تم التوصيل
                              </SelectItem>
                              <SelectItem value="cancelled">ملغي</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            className="ml-2 text-green-600 hover:text-green-800"
                            title="إرسال رسالة واتساب"
                            onClick={() => sendWhatsAppMessage(order)}
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                          <button
                            className="ml-2 text-red-600 hover:text-red-800"
                            title="حذف الطلب"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* أزرار التنقل بين الصفحات */}
                <div className="flex justify-between items-center mt-4">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    onClick={fetchPrevPage}
                    disabled={pageStack.length === 0 || loading}
                  >
                    الصفحة السابقة
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    onClick={fetchNextPage}
                    disabled={isLastPage || loading}
                  >
                    الصفحة التالية
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;
