"use client"

import { PageBody } from "@/components/layout/PageBody"
import { ProductForm } from "@/components/products/ProductForm"

export default function NewProductPage() {
  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Yeni Ürün Ekle</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Yeni bir ürün oluşturun ve yönetin.
          </p>
        </div>

        <ProductForm />
      </div>
    </PageBody>
  )
}
