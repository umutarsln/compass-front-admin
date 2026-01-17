"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderPlus, Upload as UploadIcon, Loader2 } from "lucide-react"

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  currentFolderId: string | null
  onCreateFolder: (data: { name: string; description?: string }) => void
  onUploadFiles: (data: { files: File[]; displayNames?: string[] }) => void
  isCreatingFolder: boolean
  isUploadingFile: boolean
}

export function UploadModal({
  isOpen,
  onClose,
  currentFolderId,
  onCreateFolder,
  onUploadFiles,
  isCreatingFolder,
  isUploadingFile,
}: UploadModalProps) {
  const [folderName, setFolderName] = useState("")
  const [folderDescription, setFolderDescription] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [displayNames, setDisplayNames] = useState<string[]>([])

  const handleCreateFolder = () => {
    if (!folderName.trim()) return

    onCreateFolder({
      name: folderName.trim(),
      description: folderDescription.trim() || undefined,
    })

    // Reset form
    setFolderName("")
    setFolderDescription("")
  }

  const handleUploadFiles = () => {
    if (selectedFiles.length === 0) return

    onUploadFiles({
      files: selectedFiles,
      displayNames: displayNames.map(name => name.trim()),
    })

    // Reset form
    setSelectedFiles([])
    setDisplayNames([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(files)
      // Her dosya için display name oluştur
      setDisplayNames(files.map(file => file.name))
    }
  }

  const handleDisplayNameChange = (index: number, value: string) => {
    const newDisplayNames = [...displayNames]
    newDisplayNames[index] = value
    setDisplayNames(newDisplayNames)
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newDisplayNames = displayNames.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setDisplayNames(newDisplayNames)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Öğe Ekle</DialogTitle>
          <DialogDescription>
            Yeni bir klasör oluşturun veya dosya yükleyin.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="folder" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="folder">
              <FolderPlus className="w-4 h-4 mr-2" />
              Klasör
            </TabsTrigger>
            <TabsTrigger value="file">
              <UploadIcon className="w-4 h-4 mr-2" />
              Dosya
            </TabsTrigger>
          </TabsList>

          {/* Klasör Oluşturma */}
          <TabsContent value="folder" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="folder-name" className="text-sm font-medium text-foreground">
                Klasör Adı *
              </label>
              <input
                id="folder-name"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Örn: Ürün Resimleri"
                className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="folder-description"
                className="text-sm font-medium text-foreground"
              >
                Açıklama (Opsiyonel)
              </label>
              <textarea
                id="folder-description"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder="Klasör açıklaması..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <button
              onClick={handleCreateFolder}
              disabled={!folderName.trim() || isCreatingFolder}
              className="w-full h-10 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingFolder ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                "Klasör Oluştur"
              )}
            </button>
          </TabsContent>

          {/* Dosya Yükleme */}
          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="file-upload" className="text-sm font-medium text-foreground">
                Dosya Seç (Çoklu Seçim) *
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground file:cursor-pointer hover:file:bg-primary/90"
              />
              {selectedFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedFiles.length} dosya seçildi (Toplam: {(selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Seçilen Dosyalar Listesi */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Seçilen Dosyalar ({selectedFiles.length})
                </label>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {selectedFiles.map((file, index) => {
                    const isImage = file.type.startsWith("image/")
                    const previewUrl = isImage ? URL.createObjectURL(file) : null

                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary transition-colors"
                      >
                        {/* Küçük Preview/Icon */}
                        <div className="relative w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                          {isImage && previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={file.name}
                              className="w-full h-full object-cover"
                              onLoad={() => {
                                // Cleanup URL after image loads
                                setTimeout(() => {
                                  if (previewUrl) URL.revokeObjectURL(previewUrl)
                                }, 100)
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-muted-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label
                              htmlFor={`display-name-${index}`}
                              className="text-xs font-medium text-foreground"
                            >
                              Görünen İsim
                            </label>
                            <input
                              id={`display-name-${index}`}
                              type="text"
                              value={displayNames[index] || ""}
                              onChange={(e) => handleDisplayNameChange(index, e.target.value)}
                              placeholder="Görünen isim (opsiyonel)..."
                              className="w-full h-9 px-3 text-sm rounded border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                          type="button"
                          title="Dosyayı Kaldır"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleUploadFiles}
              disabled={selectedFiles.length === 0 || isUploadingFile}
              className="w-full h-10 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploadingFile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                `${selectedFiles.length > 0 ? `${selectedFiles.length} Dosya ` : ""}Yükle`
              )}
            </button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
