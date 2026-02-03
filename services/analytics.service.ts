import api from "@/lib/api"
import { AxiosResponse } from "axios"

export interface StoreSummary {
  id: string
  totalPageViews: number
  totalProductViews: number
  totalCartAdds: number
  totalOrders: number
  totalRevenue: number
  lastAggregationAt: string | null
}

export interface StoreDailyRow {
  id: string
  date: string
  pageViewCount: number
  productViewCount: number
  cartAddCount: number
  orderCount: number
  totalRevenue: number
  pageBreakdown: Record<string, number> | null
}

export interface StoreInsights {
  cartAddRate: number
  orderRate: number
  avgTimeOnProductSeconds: number
  pageBreakdown: Array<{ page: string; count: number }>
}

export interface ProductReportItem {
  productId: string
  productName: string
  productSlug: string
  detailLink: string
  viewCount: number
  totalTimeSeconds: number
  cartAddCount: number
  orderCount: number
}

export interface ProductReport {
  product: {
    id: string
    name: string
    slug: string
    detailLink: string
  } | null
  total: {
    viewCount: number
    totalTimeSeconds: number
    cartAddCount: number
    orderCount: number
  }
  daily: Array<{
    date: string
    viewCount: number
    totalTimeSeconds: number
    cartAddCount: number
    orderCount: number
  }>
}

export interface ProductsReportResponse {
  data: ProductReportItem[]
  total: number
}

export const analyticsService = {
  getStoreSummary(): Promise<StoreSummary | null> {
    return api
      .get<StoreSummary | null>("/analytics/store/summary")
      .then((res: AxiosResponse<StoreSummary | null>) => res.data)
  },

  getStoreDaily(from: string, to: string): Promise<StoreDailyRow[]> {
    return api
      .get<StoreDailyRow[]>("/analytics/store/daily", { params: { from, to } })
      .then((res: AxiosResponse<StoreDailyRow[]>) => res.data)
  },

  getStoreInsights(
    from: string,
    to: string
  ): Promise<StoreInsights> {
    return api
      .get<StoreInsights>("/analytics/store/insights", { params: { from, to } })
      .then((res: AxiosResponse<StoreInsights>) => res.data)
  },

  getProductsReport(
    from: string,
    to: string,
    page = 1,
    limit = 20
  ): Promise<ProductsReportResponse> {
    return api
      .get<ProductsReportResponse>("/analytics/products", {
        params: { from, to, page, limit },
      })
      .then((res: AxiosResponse<ProductsReportResponse>) => res.data)
  },

  getProductReport(productId: string): Promise<ProductReport> {
    return api
      .get<ProductReport>(`/analytics/products/${productId}`)
      .then((res: AxiosResponse<ProductReport>) => res.data)
  },

  /** Günlük analiz agregasyonunu manuel tetikler (cron ile aynı işlem). */
  runDailyAggregation(): Promise<{ message: string }> {
    return api
      .post<{ message: string }>("/analytics/aggregate")
      .then((res: AxiosResponse<{ message: string }>) => res.data)
  },
}
