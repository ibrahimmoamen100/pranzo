import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { isAdminAuthenticated } from "@/utils/auth";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Activity,
  Target,
  Award,
  Zap,
  Tag,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Package
} from "lucide-react";

const BASE_URL = import.meta.env.DEV ? "http://localhost:3001" : "";

const CashierAnalytics = () => {
  const navigate = useNavigate();
  const { products } = useStore();
  const [cashierOrders, setCashierOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  // جلب الطلبات من السيرفر
  const fetchCashierOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders`);
      const data = await res.json();
      setCashierOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("فشل في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashierOrders();
  }, []);

  // دالة تحويل الساعة إلى 12 ساعة مع ص/م
  const formatHour12 = (hour: number) => {
    const period = hour < 12 ? "ص" : "م";
    let h = hour % 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, '0')}:00 ${period}`;
  };

  // حساب جميع الإحصائيات
  const analytics = useMemo(() => {
    if (cashierOrders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        todaysOrders: 0,
        todaysRevenue: 0,
        topProducts: [],
        hourlyStats: [],
        categoryStats: [],
        dailyStats: [],
        performanceIndicators: {
          dailyOrderPercentage: 0,
          dailyRevenuePercentage: 0,
          productDiversity: 0
        }
      };
    }

    const cashierOrdersOnly = cashierOrders.filter(o => o.source === "cashier");
    const totalOrders = cashierOrdersOnly.length;
    const totalRevenue = cashierOrdersOnly.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // إحصائيات اليوم
    const today = new Date().toISOString().slice(0, 10);
    const todaysOrders = cashierOrdersOnly.filter(o => (o.createdAt || '').slice(0, 10) === today);
    const todaysRevenue = todaysOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    // المنتجات الأكثر مبيعاً
    const productStats: Record<string, { productName: string; quantity: number; revenue: number }> = {};
    cashierOrdersOnly.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!productStats[item.productId]) {
            productStats[item.productId] = {
              productName: item.productName,
              quantity: 0,
              revenue: 0
            };
          }
          const itemTotal = (Number(item.price) + (item.sizePrice || 0) + (item.extraPrice || 0)) * item.quantity;
          productStats[item.productId].quantity += item.quantity || 1;
          productStats[item.productId].revenue += itemTotal;
        });
      }
    });

    const topProducts = Object.entries(productStats)
      .map(([productId, stats]) => ({ productId, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // إحصائيات الساعات
    const hourlyData: Record<number, { orders: number; revenue: number }> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { orders: 0, revenue: 0 };
    }

    cashierOrdersOnly.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      hourlyData[hour].orders += 1;
      hourlyData[hour].revenue += order.totalAmount || 0;
    });

    const hourlyStats = Object.entries(hourlyData)
      .map(([hour, stats]) => ({ hour: parseInt(hour), ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // إحصائيات الفئات
    const categoryData: Record<string, { orders: number; revenue: number; quantity: number }> = {};
    cashierOrdersOnly.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const product = products?.find(p => p.id === item.productId);
          const category = product?.category || 'غير محدد';
          
          if (!categoryData[category]) {
            categoryData[category] = { orders: 0, revenue: 0, quantity: 0 };
          }
          
          const itemTotal = (Number(item.price) + (item.sizePrice || 0) + (item.extraPrice || 0)) * item.quantity;
          categoryData[category].orders += 1;
          categoryData[category].revenue += itemTotal;
          categoryData[category].quantity += item.quantity || 1;
        });
      }
    });

    const categoryStats = Object.entries(categoryData)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // إحصائيات الأيام
    const dailyData: Record<string, { orders: number; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      dailyData[dateStr] = { orders: 0, revenue: 0 };
    }

    cashierOrdersOnly.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dateStr = orderDate.toISOString().slice(0, 10);
      if (dailyData[dateStr]) {
        dailyData[dateStr].orders += 1;
        dailyData[dateStr].revenue += order.totalAmount || 0;
      }
    });

    const dailyStats = Object.entries(dailyData)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // مؤشرات الأداء
    const performanceIndicators = {
      dailyOrderPercentage: totalOrders > 0 ? Math.round((todaysOrders.length / totalOrders) * 100) : 0,
      dailyRevenuePercentage: totalRevenue > 0 ? Math.round((todaysRevenue / totalRevenue) * 100) : 0,
      productDiversity: totalOrders > 0 ? Math.round((topProducts.length / totalOrders) * 100) : 0
    };

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      todaysOrders: todaysOrders.length,
      todaysRevenue,
      topProducts,
      hourlyStats,
      categoryStats,
      dailyStats,
      performanceIndicators
    };
  }, [cashierOrders, products]);

  // Check authentication
  if (!isAdminAuthenticated()) {
    navigate("/admin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#f1f5f9]">
      <Helmet>
        <title>تحليلات الكاشير</title>
        <meta name="description" content="تحليل شامل لأداء الكاشير والمبيعات" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Topbar />
      <Navbar />
      <main className="max-w-[1600px] mx-auto py-8 px-2 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4 md:gap-0">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/admin/cashier")} className="flex items-center gap-2 text-base md:text-lg px-4 py-2 rounded-xl shadow-sm border-primary/30 bg-white/80 hover:bg-primary/10">
              <ArrowLeft className="h-5 w-5" /> العودة إلى الكاشير
            </Button>
            <div>
              <h1 className="text-4xl font-extrabold mb-1 text-primary drop-shadow-sm tracking-tight">تحليلات الكاشير</h1>
              <p className="text-muted-foreground text-base md:text-lg font-medium">تحليل شامل لأداء الكاشير والمبيعات</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48 h-12 rounded-xl text-base bg-white/90 border-primary/20 shadow-sm">
                <SelectValue placeholder="اختر الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="90">آخر 90 يوم</SelectItem>
                <SelectItem value="all">جميع الفترات</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchCashierOrders} variant="outline" className="gap-2 px-4 py-2 rounded-xl shadow-sm border-primary/30 bg-white/80 hover:bg-primary/10 text-base md:text-lg" disabled={loading}>
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /> تحديث
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Orders */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <ShoppingCart className="h-5 w-5" />
                    إجمالي الطلبات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">{analytics.totalOrders.toLocaleString('ar-EG')}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span>+{analytics.todaysOrders} اليوم</span>
                  </div>
                </CardContent>
              </Card>

              {/* Total Revenue */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <DollarSign className="h-5 w-5" />
                    إجمالي الإيرادات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">{analytics.totalRevenue.toLocaleString('ar-EG')} ج.م</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span>+{analytics.todaysRevenue.toLocaleString('ar-EG')} اليوم</span>
                  </div>
                </CardContent>
              </Card>

              {/* Average Order Value */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <BarChart3 className="h-5 w-5" />
                    متوسط قيمة الطلب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">{analytics.averageOrderValue.toFixed(0)} ج.م</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>لكل طلب</span>
                  </div>
                </CardContent>
              </Card>

              {/* Product Diversity */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Package className="h-5 w-5" />
                    تنوع المنتجات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">{analytics.topProducts.length}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="h-4 w-4 text-orange-500" />
                    <span>منتجات مختلفة</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Indicators */}
            <Card className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl shadow-xl border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Target className="inline-block w-7 h-7 text-primary" />
                  مؤشرات الأداء
                </CardTitle>
                <CardDescription>تحليل أداء الكاشير مقارنة بالأهداف</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-green-200">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {analytics.performanceIndicators.dailyOrderPercentage}%
                    </div>
                    <div className="text-sm font-semibold text-green-800">نسبة طلبات اليوم</div>
                    <div className="text-xs text-green-600 mt-1">
                      {analytics.todaysOrders} من {analytics.totalOrders} طلب
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-blue-200">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {analytics.performanceIndicators.dailyRevenuePercentage}%
                    </div>
                    <div className="text-sm font-semibold text-blue-800">نسبة إيرادات اليوم</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {analytics.todaysRevenue.toLocaleString('ar-EG')} من {analytics.totalRevenue.toLocaleString('ar-EG')} ج.م
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-purple-200">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {analytics.performanceIndicators.productDiversity}%
                    </div>
                    <div className="text-sm font-semibold text-purple-800">تنوع المنتجات</div>
                    <div className="text-xs text-purple-600 mt-1">
                      {analytics.topProducts.length} منتج مختلف
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            {analytics.topProducts.length > 0 && (
              <Card className="mb-8 p-6 bg-white/90 rounded-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Award className="inline-block w-7 h-7 text-primary" />
                    المنتجات الأكثر مبيعاً
                  </CardTitle>
                  <CardDescription>أفضل 10 منتجات من حيث الكمية المباعة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {analytics.topProducts.map((product, index) => (
                      <Card key={product.productId} className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-primary/20">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-3">
                            <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-primary text-sm mb-2 line-clamp-2">{product.productName}</h3>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-primary">{product.quantity}</div>
                            <div className="text-xs text-muted-foreground">كمية مباعة</div>
                            <div className="text-sm font-semibold text-green-600">{product.revenue.toLocaleString('ar-EG')} ج.م</div>
                            <div className="text-xs text-muted-foreground">إجمالي الإيرادات</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Peak Hours */}
            {analytics.hourlyStats.length > 0 && (
              <Card className="mb-8 p-6 bg-white/90 rounded-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Clock className="inline-block w-7 h-7 text-primary" />
                    ساعات الذروة
                  </CardTitle>
                  <CardDescription>أعلى 6 ساعات من حيث الإيرادات</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {analytics.hourlyStats.map((hour, index) => (
                      <Card key={hour.hour} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-blue-200">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-3">
                            <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-primary text-lg mb-2">
                            {formatHour12(hour.hour)}
                          </h3>
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-blue-600">{hour.orders}</div>
                            <div className="text-xs text-muted-foreground">عدد الطلبات</div>
                            <div className="text-sm font-bold text-primary">{hour.revenue.toLocaleString('ar-EG')} ج.م</div>
                            <div className="text-xs text-muted-foreground">الإيرادات</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category Performance */}
            {analytics.categoryStats.length > 0 && (
              <Card className="mb-8 p-6 bg-white/90 rounded-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Tag className="inline-block w-7 h-7 text-primary" />
                    أداء الفئات
                  </CardTitle>
                  <CardDescription>أفضل 5 فئات من حيث الإيرادات</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {analytics.categoryStats.map((category, index) => (
                      <Card key={category.category} className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-green-200">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-3">
                            <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-primary text-sm mb-2 line-clamp-2">{category.category}</h3>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-primary">{category.quantity}</div>
                            <div className="text-xs text-muted-foreground">كمية مباعة</div>
                            <div className="text-sm font-semibold text-green-600">{category.revenue.toLocaleString('ar-EG')} ج.م</div>
                            <div className="text-xs text-muted-foreground">الإيرادات</div>
                            <div className="text-xs text-blue-600">{category.orders} طلب</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Performance */}
            {analytics.dailyStats.length > 0 && (
              <Card className="mb-8 p-6 bg-white/90 rounded-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                    <CalendarDays className="inline-block w-7 h-7 text-primary" />
                    الأداء اليومي
                  </CardTitle>
                  <CardDescription>إحصائيات الأيام السبعة الماضية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                    {analytics.dailyStats.map((day, index) => (
                      <Card key={day.date} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-purple-200">
                        <CardContent className="p-4 text-center">
                          <div className="mb-3">
                            <div className="text-sm font-bold text-primary">
                              {new Date(day.date).toLocaleDateString('ar-EG', { weekday: 'short' })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(day.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-primary">{day.orders}</div>
                            <div className="text-xs text-muted-foreground">عدد الطلبات</div>
                            <div className="text-sm font-semibold text-purple-600">{day.revenue.toLocaleString('ar-EG')} ج.م</div>
                            <div className="text-xs text-muted-foreground">الإيرادات</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CashierAnalytics; 