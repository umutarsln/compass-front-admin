"use client"

import { PageBody } from "@/components/layout/PageBody"
import { ProductList } from "@/components/products/ProductList"
import { TagList } from "@/components/products/TagList"

export default function ProductsPage() {
  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ürünler</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tüm ürünleri görüntüleyin, filtreleyin ve yönetin.
            </p>
          </div>
        </div>

        <ProductList />

        {/* Taglar */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Taglar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tagları görüntüleyin ve yönetin.
            </p>
          </div>
          <TagList />
        </div>
      </div>
    </PageBody>
  )
}
