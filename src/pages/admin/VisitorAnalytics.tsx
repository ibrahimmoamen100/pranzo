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
import { analyticsService } from "@/services/analyticsService";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
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
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  CalendarDays,
  Clock3,
  Trash2
} from "lucide-react";

interface AnalyticsData {
  totalVisitors: number;
  uniqueVisitors: number;
  totalPageViews: number;
  averageSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  visitorsByDay: Array<{ date: string; visitors: number }>;
  visitorsByHour: Array<{ hour: number; visitors: number }>;
  newVisitors: number;
  returningVisitors: number;
}

const VisitorAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const [previousData, setPreviousData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const analyticsData = analyticsService.getAnalytics(timeFilter);
      setData(analyticsData);
    } catch (error) {
      toast.error("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // دالة مسح جميع بيانات الزوار وإعادة الحساب
  const handleClearAllVisitorData = async () => {
    const confirmed = window.confirm(
      "هل أنت متأكد من مسح جميع بيانات الزوار؟ هذا الإجراء سيحذف جميع الإحصائيات ويبدأ الحساب من جديد!"
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      // مسح جميع بيانات الزوار من localStorage
      localStorage.removeItem('visitorAnalytics');
      localStorage.removeItem('visitorSessions');
      localStorage.removeItem('pageViews');
      localStorage.removeItem('visitorData');
      
      // إعادة تهيئة خدمة التحليلات
      analyticsService.clearAllData();
      
      // إعادة تحميل البيانات
      await fetchAnalytics();
      
      toast.success("تم مسح جميع بيانات الزوار وإعادة الحساب بنجاح");
    } catch (error) {
      console.error("Error clearing visitor data:", error);
      toast.error("فشل في مسح بيانات الزوار");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter]);

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Format duration
  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get peak hours
  const getPeakHours = () => {
    if (!data?.visitorsByHour) return [];
    const sorted = [...data.visitorsByHour].sort((a, b) => b.visitors - a.visitors);
    return sorted.slice(0, 3);
  };

  // Get top pages
  const getTopPages = () => {
    if (!data?.topPages) return [];
    return data.topPages.slice(0, 5);
  };

  // Check authentication
  if (!isAdminAuthenticated()) {
    navigate("/admin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#f1f5f9]">
      <Helmet>
        <title>تحليل الزوار</title>
        <meta name="description" content="تحليل شامل لزوار الموقع ونشاطهم" />
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
              <h1 className="text-4xl font-extrabold mb-1 text-primary drop-shadow-sm tracking-tight">تحليل الزوار</h1>
              <p className="text-muted-foreground text-base md:text-lg font-medium">تحليل شامل لزوار الموقع ونشاطهم</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-48 h-12 rounded-xl text-base bg-white/90 border-primary/20 shadow-sm">
                <SelectValue placeholder="اختر الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفترات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">الأسبوع</SelectItem>
                <SelectItem value="month">الشهر</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchAnalytics} variant="outline" className="gap-2 px-4 py-2 rounded-xl shadow-sm border-primary/30 bg-white/80 hover:bg-primary/10 text-base md:text-lg" disabled={loading}>
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /> تحديث
            </Button>
            <Button 
              onClick={handleClearAllVisitorData} 
              variant="destructive" 
              className="gap-2 px-4 py-2 rounded-xl text-base md:text-lg" 
              disabled={loading}
            >
              <Trash2 className="h-5 w-5" /> مسح جميع البيانات
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : data ? (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Visitors */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Users className="h-5 w-5" />
                    إجمالي الزوار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">{data.totalVisitors.toLocaleString('ar-EG')}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>زيادة في النشاط</span>
                  </div>
                </CardContent>
              </Card>

              {/* Unique Visitors */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Globe className="h-5 w-5" />
                    الزوار الفريدون
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">{data.uniqueVisitors.toLocaleString('ar-EG')}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>جلسات فريدة</span>
                  </div>
                </CardContent>
              </Card>

              {/* Page Views */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Eye className="h-5 w-5" />
                    عروض الصفحات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">{data.totalPageViews.toLocaleString('ar-EG')}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <span>إجمالي المشاهدات</span>
                  </div>
                </CardContent>
              </Card>

              {/* Average Session Duration */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Clock className="h-5 w-5" />
                    متوسط مدة الجلسة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">{formatDuration(data.averageSessionDuration)}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4 text-orange-500" />
                    <span>دقائق وثواني</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visitor Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* New vs Returning Visitors */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                    <PieChart className="h-6 w-6" />
                    الزوار الجدد والعائدون
                  </CardTitle>
                  <CardDescription>توزيع الزوار حسب نوع الزيارة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="font-semibold">الزوار الجدد</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{data.newVisitors}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.totalVisitors > 0 ? Math.round((data.newVisitors / data.totalVisitors) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                    <Progress value={data.totalVisitors > 0 ? (data.newVisitors / data.totalVisitors) * 100 : 0} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="font-semibold">الزوار العائدون</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{data.returningVisitors}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.totalVisitors > 0 ? Math.round((data.returningVisitors / data.totalVisitors) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                    <Progress value={data.totalVisitors > 0 ? (data.returningVisitors / data.totalVisitors) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Peak Hours */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Activity className="h-6 w-6" />
                    ساعات الذروة
                  </CardTitle>
                  <CardDescription>أعلى 3 ساعات نشاط</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getPeakHours().map((hour, index) => (
                      <div key={hour.hour} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="font-semibold">
                            {hour.hour.toString().padStart(2, '0')}:00
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{hour.visitors}</div>
                          <div className="text-sm text-muted-foreground">زائر</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Daily Visitors Chart */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                    <CalendarDays className="h-6 w-6" />
                    الزوار اليومي
                  </CardTitle>
                  <CardDescription>عدد الزوار خلال الأسبوع الماضي</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.visitorsByDay.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium text-sm">{day.date}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(5, (day.visitors / Math.max(...data.visitorsByDay.map(d => d.visitors))) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-primary min-w-[2rem] text-right">{day.visitors}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Pages */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Target className="h-6 w-6" />
                    أكثر الصفحات زيارة
                  </CardTitle>
                  <CardDescription>الصفحات الأكثر شعبية بين الزوار</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getTopPages().map((page, index) => (
                      <div key={page.page} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="font-medium text-sm max-w-[150px] truncate">
                            {page.page === "/" ? "الصفحة الرئيسية" : page.page}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{page.views}</div>
                          <div className="text-xs text-muted-foreground">
                            {data.totalPageViews > 0 ? Math.round((page.views / data.totalPageViews) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bounce Rate */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Zap className="h-5 w-5" />
                    معدل الارتداد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {data.totalVisitors > 0 ? Math.round(((data.totalVisitors - data.uniqueVisitors) / data.totalVisitors) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    زوار غادروا بعد صفحة واحدة
                  </div>
                </CardContent>
              </Card>

              {/* Avg Pages per Session */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <BarChart3 className="h-5 w-5" />
                    متوسط الصفحات لكل جلسة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {data.uniqueVisitors > 0 ? (data.totalPageViews / data.uniqueVisitors).toFixed(1) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    صفحات لكل زائر
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Score */}
              <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Award className="h-5 w-5" />
                    درجة التفاعل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {data.totalVisitors > 0 ? Math.round((data.averageSessionDuration / 60000) * (data.totalPageViews / data.totalVisitors)) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    نقاط التفاعل
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="bg-white/90 rounded-2xl shadow-xl border-0 backdrop-blur-sm p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-primary mb-2">لا توجد بيانات متاحة</h3>
              <p className="text-muted-foreground">لم يتم جمع أي بيانات عن الزوار بعد</p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default VisitorAnalytics; 