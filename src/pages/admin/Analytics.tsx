import { useState, useEffect } from "react";
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
  Zap
} from "lucide-react";

const BASE_URL = import.meta.env.DEV ? "http://localhost:3001" : "";

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todaysRevenue: number;
  todaysOrdersCount: number;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    orders: number;
  }>;
  hourlyStats: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  categoryStats: Array<{
    category: string;
    orders: number;
    revenue: number;
    quantity: number;
  }>;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [previousData, setPreviousData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/analytics?days=${timeRange}`);
      if (!res.ok) throw new Error();
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (error) {
      toast.error("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  // Get peak hours
  const getPeakHours = () => {
    if (!data?.hourlyStats) return [];
    const sorted = [...data.hourlyStats].sort((a, b) => b.revenue - a.revenue);
    return sorted.slice(0, 3);
  };

  // Get top categories
  const getTopCategories = () => {
    if (!data?.categoryStats) return [];
    return [...data.categoryStats].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  };

  // Check authentication
  if (!isAdminAuthenticated()) {
    navigate("/admin");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#f1f5f9]">
        <Topbar />
        <Navbar />
        <main className="max-w-7xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg text-muted-foreground">جاري تحميل البيانات...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#f1f5f9]">
      <Helmet>
        <title>الإحصائيات والتحليل</title>
        <meta name="description" content="إحصائيات وتحليل بيانات المبيعات" />
      </Helmet>
      
      <Topbar />
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للوحة التحكم
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">الإحصائيات والتحليل</h1>
              <p className="text-muted-foreground">تحليل شامل لأداء المبيعات</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="90">آخر 90 يوم</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={fetchAnalytics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">إجمالي المبيعات</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrency(data.totalRevenue)}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {data.todaysRevenue > 0 && `اليوم: ${formatCurrency(data.todaysRevenue)}`}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">عدد الطلبات</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    {data.totalOrders.toLocaleString('ar-EG')}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {data.todaysOrdersCount > 0 && `اليوم: ${data.todaysOrdersCount}`}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">متوسط قيمة الطلب</CardTitle>
                  <Target className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">
                    {formatCurrency(data.averageOrderValue)}
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    لكل طلب
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">أفضل ساعة مبيعات</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    {getPeakHours()[0]?.hour || 0}:00
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    {getPeakHours()[0] && `${getPeakHours()[0].orders} طلب`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Daily Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    نمو المبيعات اليومية
                  </CardTitle>
                  <CardDescription>تطور المبيعات خلال الفترة المحددة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.dailyStats.slice(-7).map((day, index) => (
                      <div key={day.date} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('ar-EG', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{formatCurrency(day.revenue)}</span>
                            <span className="text-muted-foreground">{day.orders} طلب</span>
                          </div>
                          <Progress 
                            value={(day.revenue / Math.max(...data.dailyStats.map(d => d.revenue))) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Hourly Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    الأداء بالساعات
                  </CardTitle>
                  <CardDescription>أفضل أوقات المبيعات خلال اليوم</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getPeakHours().map((hour, index) => (
                      <div key={hour.hour} className="flex items-center gap-4">
                        <Badge variant={index === 0 ? "default" : "secondary"} className="w-16">
                          {hour.hour}:00
                        </Badge>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{formatCurrency(hour.revenue)}</span>
                            <span className="text-muted-foreground">{hour.orders} طلب</span>
                          </div>
                          <Progress 
                            value={(hour.revenue / Math.max(...data.hourlyStats.map(h => h.revenue))) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Products & Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Selling Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    أفضل المنتجات مبيعاً
                  </CardTitle>
                  <CardDescription>المنتجات الأكثر طلباً</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.topProducts.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.quantity} قطعة • {formatCurrency(product.revenue)}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {product.orders} طلب
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    أداء الفئات
                  </CardTitle>
                  <CardDescription>توزيع المبيعات حسب الفئات</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getTopCategories().map((category, index) => (
                      <div key={category.category} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{category.category}</div>
                          <div className="text-sm text-muted-foreground">
                            {category.quantity} قطعة • {formatCurrency(category.revenue)}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {category.orders} طلب
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Hourly Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  تحليل المبيعات بالساعات (24 ساعة)
                </CardTitle>
                <CardDescription>توزيع المبيعات على مدار اليوم</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-12 gap-2 h-32 items-end">
                  {data.hourlyStats.map((hour) => (
                    <div key={hour.hour} className="flex flex-col items-center">
                      <div 
                        className="w-full bg-primary/20 rounded-t transition-all duration-300 hover:bg-primary/30"
                        style={{ 
                          height: `${(hour.revenue / Math.max(...data.hourlyStats.map(h => h.revenue))) * 100}%` 
                        }}
                      >
                        <div className="text-xs text-center p-1 text-primary font-medium">
                          {hour.orders}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {hour.hour}:00
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Analytics;
