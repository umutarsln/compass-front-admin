"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { productService } from "@/services/product.service"
import { ProductForm } from "@/components/products/ProductForm"
import { PageBody } from "@/components/layout/PageBody"
import { Loader2 } from "lucide-react"

export default function EditProductPage() {
  const params = useParams()
  const slug = params?.slug as string

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", "slug", slug],
    queryFn: () => productService.getBySlug(slug),
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <PageBody>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageBody>
    )
  }

  if (error || !product) {
    return (
      <PageBody>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Ürün Bulunamadı
            </h2>
            <p className="text-muted-foreground">
              Aradığınız ürün bulunamadı veya silinmiş olabilir.
            </p>
          </div>
        </div>
      </PageBody>
    )
  }

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ürün Düzenle</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {product.name} ürününü düzenliyorsunuz
          </p>
        </div>
        <ProductForm product={product} />
      </div>
    </PageBody>
  )
}
