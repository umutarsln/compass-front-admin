"use client"

import { PageBody } from "@/components/layout/PageBody"
import { OrderDetail } from "@/components/orders/OrderDetail"
import { use } from "react"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params)

  return (
    <PageBody>
      <OrderDetail orderId={id} />
    </PageBody>
  )
}
