"use client"

import { PageBody } from "@/components/layout/PageBody"
import { AdminList } from "@/components/admins/AdminList"

export default function AdminsPage() {
    return (
        <PageBody>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Admin Yönetimi</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Admin kullanıcılarını yönetin, yeni admin ekleyin veya mevcut admin bilgilerini güncelleyin.
                        </p>
                    </div>
                </div>

                <AdminList />
            </div>
        </PageBody>
    )
}
