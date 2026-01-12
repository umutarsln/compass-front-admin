"use client"

import { PageBody } from "@/components/layout/PageBody"
import { MediaLibrary } from "@/components/media/MediaLibrary"

export default function MediaPage() {
  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medya Kütüphanesi</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dosyalarınızı ve klasörlerinizi yönetin.
            </p>
          </div>
        </div>

        <MediaLibrary />
      </div>
    </PageBody>
  )
}
