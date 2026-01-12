"use client"

import { PageBody } from "@/components/layout/PageBody"

export default function PanelPage() {
    return (
        <PageBody>
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Hoş Geldiniz!</h2>
                <p className="text-muted-foreground">
                    Admin paneline başarıyla giriş yaptınız. Burada e-ticaret yönetim işlemlerinizi
                    gerçekleştirebilirsiniz.
                </p>
            </div>
        </PageBody>
    )
}
