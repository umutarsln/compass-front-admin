"use client"

import { PageBody } from "@/components/layout/PageBody"
import { CategoryList } from "@/components/products/CategoryList"

/**
 * Kategori ekleme, düzenleme ve silme işlemleri için bağımsız admin sayfasını gösterir.
 */
export default function CategoriesPage() {
  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kategoriler</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ürün kategorilerini oluşturun, düzenleyin veya silin.
            </p>
          </div>
        </div>

        <CategoryList />
      </div>
    </PageBody>
  )
}
