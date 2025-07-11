import { Visitor, PageView, AnalyticsData } from "@/types/analytics";

// خدمة تتبع الزوار
export const analyticsService = {
  // إنشاء معرف جلسة فريد
  generateSessionId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  },

  // إنشاء معرف زائر فريد
  generateVisitorId(): string {
    return (
      "visitor_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  },

  // حفظ بيانات الزائر
  saveVisitor(visitor: Omit<Visitor, "id">): string {
    const visitorWithId = {
      ...visitor,
      id: this.generateVisitorId(),
    };

    const visitors = this.getVisitorsFromStorage();
    visitors.push(visitorWithId);
    this.saveVisitorsToStorage(visitors);

    return visitorWithId.id;
  },

  // حفظ عرض الصفحة
  savePageView(pageView: Omit<PageView, "id">): void {
    const pageViewWithId = {
      ...pageView,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };

    const pageViews = this.getPageViewsFromStorage();
    pageViews.push(pageViewWithId);
    this.savePageViewsToStorage(pageViews);
  },

  // جلب جميع الزوار
  getVisitors(): Visitor[] {
    return this.getVisitorsFromStorage();
  },

  // جلب جميع عروض الصفحات
  getPageViews(): PageView[] {
    return this.getPageViewsFromStorage();
  },

  // تحليل البيانات
  getAnalytics(timeFilter: string = "all"): AnalyticsData {
    const visitors = this.getVisitors();
    const pageViews = this.getPageViews();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );

    // تصفية حسب الوقت
    const filteredVisitors = visitors.filter((visitor) => {
      const visitorDate = new Date(visitor.timestamp);
      switch (timeFilter) {
        case "today":
          return visitorDate >= today;
        case "week":
          return visitorDate >= weekAgo;
        case "month":
          return visitorDate >= monthAgo;
        default:
          return true;
      }
    });

    const filteredPageViews = pageViews.filter((pageView) => {
      const pageViewDate = new Date(pageView.timestamp);
      switch (timeFilter) {
        case "today":
          return pageViewDate >= today;
        case "week":
          return pageViewDate >= weekAgo;
        case "month":
          return pageViewDate >= monthAgo;
        default:
          return true;
      }
    });

    // إحصائيات عامة
    const totalVisitors = filteredVisitors.length;
    const uniqueVisitors = new Set(filteredVisitors.map((v) => v.sessionId))
      .size;
    const totalPageViews = filteredPageViews.length;

    // حساب متوسط مدة الجلسة
    const sessionDurations = filteredVisitors
      .filter((v) => v.visitDuration)
      .map((v) => v.visitDuration!);
    const averageSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) /
          sessionDurations.length
        : 0;

    // أكثر الصفحات زيارة
    const pageStats = filteredPageViews.reduce((acc, pageView) => {
      if (acc[pageView.page]) {
        acc[pageView.page]++;
      } else {
        acc[pageView.page] = 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topPages = Object.entries(pageStats)
      .map(([page, views]) => ({ page, views: Number(views) }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // الزوار حسب اليوم
    const visitorsByDay = new Array(7).fill(0).map((_, index) => {
      const date = new Date(
        today.getTime() - (6 - index) * 24 * 60 * 60 * 1000
      );
      const dateStr = date.toLocaleDateString("ar-EG");
      const count = filteredVisitors.filter((visitor) => {
        const visitorDate = new Date(visitor.timestamp);
        return visitorDate.toDateString() === date.toDateString();
      }).length;
      return { date: dateStr, visitors: count };
    });

    // الزوار حسب الساعة
    const visitorsByHour = new Array(24).fill(0).map((_, hour) => {
      const count = filteredVisitors.filter((visitor) => {
        const visitorDate = new Date(visitor.timestamp);
        return visitorDate.getHours() === hour;
      }).length;
      return { hour, visitors: count };
    });

    // الزوار الجدد والعائدون
    const newVisitors = filteredVisitors.filter((v) => v.isNewVisitor).length;
    const returningVisitors = filteredVisitors.filter(
      (v) => !v.isNewVisitor
    ).length;

    return {
      totalVisitors,
      uniqueVisitors,
      totalPageViews,
      averageSessionDuration,
      topPages,
      visitorsByDay,
      visitorsByHour,
      newVisitors,
      returningVisitors,
    };
  },

  // الاستماع للتغييرات
  subscribeToAnalytics(callback: (analytics: AnalyticsData) => void) {
    const interval = setInterval(() => {
      const analytics = this.getAnalytics();
      callback(analytics);
    }, 5000); // تحديث كل 5 ثواني

    return () => clearInterval(interval);
  },

  // دوال مساعدة للـ Local Storage
  getVisitorsFromStorage(): Visitor[] {
    try {
      const visitorsJson = localStorage.getItem("visitors");
      return visitorsJson ? JSON.parse(visitorsJson) : [];
    } catch {
      return [];
    }
  },

  saveVisitorsToStorage(visitors: Visitor[]): void {
    try {
      localStorage.setItem("visitors", JSON.stringify(visitors));
    } catch (error) {
      console.error("Error saving visitors to localStorage:", error);
    }
  },

  getPageViewsFromStorage(): PageView[] {
    try {
      const pageViewsJson = localStorage.getItem("pageViews");
      return pageViewsJson ? JSON.parse(pageViewsJson) : [];
    } catch {
      return [];
    }
  },

  savePageViewsToStorage(pageViews: PageView[]): void {
    try {
      localStorage.setItem("pageViews", JSON.stringify(pageViews));
    } catch (error) {
      console.error("Error saving pageViews to localStorage:", error);
    }
  },

  // مسح جميع بيانات الزوار
  clearAllData(): void {
    try {
      localStorage.removeItem("visitors");
      localStorage.removeItem("pageViews");
      localStorage.removeItem("visitorAnalytics");
      localStorage.removeItem("visitorSessions");
      localStorage.removeItem("visitorData");
      console.log("تم مسح جميع بيانات الزوار بنجاح");
    } catch (error) {
      console.error("Error clearing visitor data:", error);
    }
  },
};
