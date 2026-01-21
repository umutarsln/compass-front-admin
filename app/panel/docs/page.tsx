import { PageBody } from "@/components/layout/PageBody"
import { docsService } from "@/services/docs.service"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, BookOpen } from "lucide-react"
import { cookies } from "next/headers"

const ACCESS_TOKEN_COOKIE_NAME = process.env.NEXT_PUBLIC_ACCESS_TOKEN_COOKIE_NAME || "accessToken"

export default async function DocsPage() {
  // Server-side'da cookie'lerden token al
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value

  // Token varsa API çağrısına ekle
  const docsData = await docsService.getAllDocs(accessToken)

  // Module'leri kategorilere ayır
  const categories: Record<string, typeof docsData.docs> = {
    "Temel": [],
    "E-Ticaret": [],
    "Yönetim": [],
    "Sistem": [],
  }

  const categoryLabels: Record<string, string> = {
    "Temel": "Temel",
    "E-Ticaret": "E-Ticaret",
    "Yönetim": "Yönetim",
    "Sistem": "Sistem",
  }

  docsData.docs.forEach((doc) => {
    if (["auth", "user"].includes(doc.module)) {
      categories["Temel"].push(doc)
    } else if (["product", "category", "tag", "cart", "order", "payment", "store", "favorite"].includes(doc.module)) {
      categories["E-Ticaret"].push(doc)
    } else if (["stock", "upload", "folder"].includes(doc.module)) {
      categories["Yönetim"].push(doc)
    } else {
      categories["Sistem"].push(doc)
    }
  })

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Dokümantasyonu</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Backend API endpoint'leri ve kullanım kılavuzları
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categories).map(([categoryName, docs]) => {
            if (docs.length === 0) return null

            return (
              <div key={categoryName} className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-foreground mb-2">{categoryLabels[categoryName] || categoryName}</h2>
                {docs.map((doc) => (
                  <Link key={doc.module} href={`/panel/docs/${doc.module}`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <CardTitle className="text-base">{doc.title}</CardTitle>
                        </div>
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {doc.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            )
          })}
        </div>

        {docsData.docs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz documentation bulunamadı</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageBody>
  )
}
