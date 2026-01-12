"use client"

import { PageBody } from "@/components/layout/PageBody"
import { CustomerList } from "@/components/customers/CustomerList"

export default function CustomersPage() {
  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Müşteriler</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tüm müşterileri görüntüleyin, arayın ve sıralayın.
            </p>
          </div>
        </div>

        <CustomerList />
      </div>
    </PageBody>
  )
}
