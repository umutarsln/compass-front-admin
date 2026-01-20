"use client"

import { PageBody } from "@/components/layout/PageBody"
import { OrderList } from "@/components/orders/OrderList"

export default function OrdersPage() {
  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Siparişler</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tüm siparişleri görüntüleyin, filtreleyin ve yönetin.
            </p>
          </div>
        </div>

        <OrderList />
      </div>
    </PageBody>
  )
}
