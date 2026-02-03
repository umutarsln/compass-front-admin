"use client"

import { PageBody } from "@/components/layout/PageBody"
import { CouponList } from "@/components/coupons/CouponList"

export default function CouponsPage() {
  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kuponlar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kupon oluşturun, düzenleyin veya silin. Müşteriler sepette tek bir kupon uygulayabilir.
            </p>
          </div>
        </div>

        <CouponList />
      </div>
    </PageBody>
  )
}
