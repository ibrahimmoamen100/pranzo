import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import { analyticsService } from "@/services/analyticsService";
import { AnalyticsData } from "@/types/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Eye,
  Clock,
  TrendingUp,
  BarChart3,
  Calendar,
  Activity,
} from "lucide-react";

export default function Analytics() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = () => {
      const data = analyticsService.getAnalytics(timeFilter);
      setAnalytics(data);
      setLoading(false);
    };

    loadAnalytics();

    // الاستماع للتحديثات
    const unsubscribe = analyticsService.subscribeToAnalytics((data) => {
      setAnalytics(data);
    });

    return unsubscribe;
  }, [timeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <Navbar />
        <div className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t("analytics.loading")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <Navbar />
        <div className="container py-8">
          <div className="text-center">
            <p className="text-muted-foreground">{t("analytics.noData")}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours} ساعة ${mins} دقيقة`;
    }
    return `${mins} دقيقة`;
  };

  const getTimeFilterLabel = (filter: string) => {
    switch (filter) {
      case "today":
        return t("analytics.timeFilters.today");
      case "week":
        return t("analytics.timeFilters.week");
      case "month":
        return t("analytics.timeFilters.month");
      default:
        return t("analytics.timeFilters.all");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <Navbar />

      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("analytics.title")}</h1>
            <p className="text-muted-foreground">
              {t("analytics.description")}
            </p>
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("analytics.timeFilters.all")}
              </SelectItem>
              <SelectItem value="today">
                {t("analytics.timeFilters.today")}
              </SelectItem>
              <SelectItem value="week">
                {t("analytics.timeFilters.week")}
              </SelectItem>
              <SelectItem value="month">
                {t("analytics.timeFilters.month")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* البطاقات الإحصائية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("analytics.stats.totalVisitors")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalVisitors}
              </div>
              <p className="text-xs text-muted-foreground">
                {getTimeFilterLabel(timeFilter)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("analytics.stats.uniqueVisitors")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.uniqueVisitors}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("analytics.stats.sessions")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("analytics.stats.totalPageViews")}
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalPageViews}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("analytics.stats.totalViews")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("analytics.stats.averageSessionDuration")}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(analytics.averageSessionDuration)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("analytics.stats.perVisitor")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* تفاصيل الزوار */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t("analytics.charts.newVsReturning")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("analytics.stats.newVisitors")}
                  </span>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    {analytics.newVisitors}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("analytics.stats.returningVisitors")}
                  </span>
                  <Badge variant="secondary">
                    {analytics.returningVisitors}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        analytics.totalVisitors > 0
                          ? (analytics.newVisitors / analytics.totalVisitors) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("analytics.charts.visitorsByHour")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.visitorsByHour
                  .filter((_, index) => index % 3 === 0) // عرض كل 3 ساعات
                  .map((hourData) => (
                    <div
                      key={hourData.hour}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">
                        {hourData.hour.toString().padStart(2, "0")}:00
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${
                                Math.max(
                                  ...analytics.visitorsByHour.map(
                                    (h) => h.visitors
                                  )
                                ) > 0
                                  ? (hourData.visitors /
                                      Math.max(
                                        ...analytics.visitorsByHour.map(
                                          (h) => h.visitors
                                        )
                                      )) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {hourData.visitors}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="pages" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pages">{t("analytics.tabs.pages")}</TabsTrigger>
            <TabsTrigger value="daily">{t("analytics.tabs.daily")}</TabsTrigger>
            <TabsTrigger value="visitors">
              {t("analytics.tabs.visitors")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.pages.title")}</CardTitle>
                <CardDescription>
                  {t("analytics.pages.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("analytics.pages.page")}</TableHead>
                      <TableHead>{t("analytics.pages.views")}</TableHead>
                      <TableHead>{t("analytics.pages.percentage")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topPages.map((page, index) => (
                      <TableRow key={page.page}>
                        <TableCell className="font-medium">
                          {page.page === "/"
                            ? t("analytics.pages.homepage")
                            : page.page}
                        </TableCell>
                        <TableCell>{page.views}</TableCell>
                        <TableCell>
                          {analytics.totalPageViews > 0
                            ? (
                                (page.views / analytics.totalPageViews) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.daily.title")}</CardTitle>
                <CardDescription>
                  {t("analytics.daily.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.visitorsByDay.map((dayData) => (
                    <div
                      key={dayData.date}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">
                        {dayData.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full"
                            style={{
                              width: `${
                                Math.max(
                                  ...analytics.visitorsByDay.map(
                                    (d) => d.visitors
                                  )
                                ) > 0
                                  ? (dayData.visitors /
                                      Math.max(
                                        ...analytics.visitorsByDay.map(
                                          (d) => d.visitors
                                        )
                                      )) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {dayData.visitors}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visitors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.visitors.title")}</CardTitle>
                <CardDescription>
                  {t("analytics.visitors.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {t("analytics.visitors.bounceRate")}
                      </span>
                      <span className="text-sm">
                        {analytics.totalVisitors > 0
                          ? (
                              (analytics.uniqueVisitors /
                                analytics.totalVisitors) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {t("analytics.visitors.avgPagesPerSession")}
                      </span>
                      <span className="text-sm">
                        {analytics.uniqueVisitors > 0
                          ? (
                              analytics.totalPageViews /
                              analytics.uniqueVisitors
                            ).toFixed(1)
                          : 0}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {t("analytics.visitors.peakHour")}
                      </span>
                      <span className="text-sm">
                        {analytics.visitorsByHour
                          .reduce((max, current) =>
                            current.visitors > max.visitors ? current : max
                          )
                          .hour.toString()
                          .padStart(2, "0")}
                        :00
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {t("analytics.visitors.peakDay")}
                      </span>
                      <span className="text-sm">
                        {
                          analytics.visitorsByDay.reduce((max, current) =>
                            current.visitors > max.visitors ? current : max
                          ).date
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
