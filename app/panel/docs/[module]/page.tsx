import { PageBody } from "@/components/layout/PageBody"
import { docsService } from "@/services/docs.service"
import { notFound } from "next/navigation"
import { MarkdownRenderer } from "@/components/docs/MarkdownRenderer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"

const ACCESS_TOKEN_COOKIE_NAME = process.env.NEXT_PUBLIC_ACCESS_TOKEN_COOKIE_NAME || "accessToken"

interface DocDetailPageProps {
  params: Promise<{ module: string }>
}

export default async function DocDetailPage({ params }: DocDetailPageProps) {
  const { module } = await params

  // Server-side'da cookie'lerden token al
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value

  let doc
  try {
    doc = await docsService.getDocByModule(module, accessToken)
  } catch (error) {
    notFound()
  }

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/panel/docs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{doc.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Modül: <span className="font-mono font-semibold text-foreground">{doc.module}</span>
                {doc.lastModified && (
                  <span className="ml-4">
                    Son güncelleme: {new Date(doc.lastModified).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-8 lg:p-12">
            <MarkdownRenderer content={doc.content} />
          </div>
        </div>
      </div>
    </PageBody>
  )
}
