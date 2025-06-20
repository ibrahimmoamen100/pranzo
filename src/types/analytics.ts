export interface Visitor {
  id: string;
  timestamp: Date;
  page: string;
  userAgent: string;
  referrer?: string;
  ip?: string;
  sessionId: string;
  isNewVisitor: boolean;
  visitDuration?: number;
}

export interface PageView {
  id: string;
  page: string;
  timestamp: Date;
  sessionId: string;
  visitorId: string;
}

export interface AnalyticsData {
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
