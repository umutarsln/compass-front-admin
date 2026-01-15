import { Suspense } from "react"
import { StoreFilters } from "./components/StoreFilters"
import { StoreProducts } from "./components/StoreProducts"
import {
  storeService,
  StoreProductListResponse,
  StoreProductQuery,
  StoreTag
} from "@/services/store.service"
import { CategoryTree } from "@/services/category.service"

interface StorePageProps {
  searchParams: Promise<{
    search?: string
    categorySlugs?: string
    tagSlugs?: string
    minPrice?: string
    maxPrice?: string
    orderBy?: string
    page?: string
    limit?: string
  }>
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const params = await searchParams

  // Query parametrelerini hazırla
  const query: StoreProductQuery = {
    search: params.search,
    categorySlugs: params.categorySlugs,
    tagSlugs: params.tagSlugs,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    orderBy: (params.orderBy as StoreProductQuery["orderBy"]) || "created_at_desc",
    page: params.page ? Number(params.page) : 1,
    limit: params.limit ? Number(params.limit) : 20,
  }

  // Paralel olarak verileri çek
  const [productsData, categories, tags] = await Promise.all([
    storeService.getProducts(query),
    storeService.getCategories(),
    storeService.getTags(),
  ])

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mağaza</h1>
        <p className="text-muted-foreground">
          {productsData.total} ürün bulundu
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sol Sütun - Filtreler */}
        <aside className="w-64 flex-shrink-0">
          <Suspense fallback={<div>Yükleniyor...</div>}>
            <StoreFilters categories={categories} tags={tags} />
          </Suspense>
        </aside>

        {/* Sağ Sütun - Ürünler */}
        <Suspense fallback={<div>Yükleniyor...</div>}>
          <StoreProducts productsData={productsData} />
        </Suspense>
      </div>
    </div>
  )
}
