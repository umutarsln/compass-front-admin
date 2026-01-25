"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { marked } from "marked"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MediaLibrarySelect } from "@/components/media/MediaLibrarySelect"
import { Upload } from "@/services/upload.service"
// Separator için basit bir div kullanacağız

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Markdown içerik yazın...",
  className,
}: RichTextEditorProps) {
  const [markdownContent, setMarkdownContent] = useState(content)
  const [showPreview, setShowPreview] = useState(true)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync content prop with internal state
  useEffect(() => {
    if (content !== markdownContent) {
      setMarkdownContent(content)
    }
  }, [content])

  // Update parent when markdown changes
  const handleMarkdownChange = useCallback((value: string) => {
    setMarkdownContent(value)
    onChange(value)
  }, [onChange])

  // Get current selection or cursor position
  const getSelection = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return { start: 0, end: 0, selectedText: "", textarea: null }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)

    return { start, end, selectedText, textarea }
  }, [])

  // Insert text at cursor position
  const insertText = useCallback((before: string, after: string = "", selectedText?: string) => {
    const { start, end, textarea } = getSelection()
    if (!textarea) return

    const text = selectedText || textarea.value.substring(start, end)
    const newText = before + text + after
    const newValue =
      textarea.value.substring(0, start) + newText + textarea.value.substring(end)

    handleMarkdownChange(newValue)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + text.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [getSelection, handleMarkdownChange])

  // Markdown toolbar actions
  const insertBold = () => insertText("**", "**")
  const insertItalic = () => insertText("*", "*")
  const insertHeading = (level: 1 | 2 | 3) => {
    const prefix = "#".repeat(level) + " "
    const { start, textarea } = getSelection()
    if (!textarea) return

    // Check if we're at the start of a line
    const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1
    const isStartOfLine = start === lineStart

    if (isStartOfLine) {
      insertText(prefix)
    } else {
      insertText("\n" + prefix)
    }
  }
  const insertBulletList = () => {
    const { start, end, textarea } = getSelection()
    if (!textarea) return

    const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1
    const lineEnd = textarea.value.indexOf("\n", end)
    const actualLineEnd = lineEnd === -1 ? textarea.value.length : lineEnd

    const line = textarea.value.substring(lineStart, actualLineEnd)
    const isListItem = line.trim().startsWith("- ") || line.trim().startsWith("* ")

    if (isListItem) {
      // Remove list marker
      const newLine = line.replace(/^[\s]*[-*]\s+/, "")
      const newValue =
        textarea.value.substring(0, lineStart) +
        newLine +
        textarea.value.substring(actualLineEnd)
      handleMarkdownChange(newValue)
    } else {
      // Add list marker
      const newLine = "- " + line.trim()
      const newValue =
        textarea.value.substring(0, lineStart) +
        newLine +
        (actualLineEnd < textarea.value.length ? "\n" : "") +
        textarea.value.substring(actualLineEnd)
      handleMarkdownChange(newValue)
    }
  }
  const insertOrderedList = () => {
    const { start, end, textarea } = getSelection()
    if (!textarea) return

    const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1
    const lineEnd = textarea.value.indexOf("\n", end)
    const actualLineEnd = lineEnd === -1 ? textarea.value.length : lineEnd

    const line = textarea.value.substring(lineStart, actualLineEnd)
    const isListItem = /^\s*\d+\.\s+/.test(line)

    if (isListItem) {
      // Remove list marker
      const newLine = line.replace(/^[\s]*\d+\.\s+/, "")
      const newValue =
        textarea.value.substring(0, lineStart) +
        newLine +
        textarea.value.substring(actualLineEnd)
      handleMarkdownChange(newValue)
    } else {
      // Add list marker
      const newLine = "1. " + line.trim()
      const newValue =
        textarea.value.substring(0, lineStart) +
        newLine +
        (actualLineEnd < textarea.value.length ? "\n" : "") +
        textarea.value.substring(actualLineEnd)
      handleMarkdownChange(newValue)
    }
  }
  const insertBlockquote = () => {
    const { start, end, textarea } = getSelection()
    if (!textarea) return

    const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1
    const lineEnd = textarea.value.indexOf("\n", end)
    const actualLineEnd = lineEnd === -1 ? textarea.value.length : lineEnd

    const line = textarea.value.substring(lineStart, actualLineEnd)
    const isBlockquote = line.trim().startsWith("> ")

    if (isBlockquote) {
      // Remove blockquote marker
      const newLine = line.replace(/^[\s]*>\s+/, "")
      const newValue =
        textarea.value.substring(0, lineStart) +
        newLine +
        textarea.value.substring(actualLineEnd)
      handleMarkdownChange(newValue)
    } else {
      // Add blockquote marker
      const newLine = "> " + line.trim()
      const newValue =
        textarea.value.substring(0, lineStart) +
        newLine +
        (actualLineEnd < textarea.value.length ? "\n" : "") +
        textarea.value.substring(actualLineEnd)
      handleMarkdownChange(newValue)
    }
  }
  const insertCodeBlock = () => insertText("```\n", "\n```")
  const insertLink = () => {
    const { selectedText } = getSelection()
    setLinkText(selectedText)
    setIsLinkDialogOpen(true)
  }

  const handleLinkSubmit = () => {
    if (!linkUrl) {
      setIsLinkDialogOpen(false)
      return
    }

    const linkMarkdown = linkText
      ? `[${linkText}](${linkUrl})`
      : `[${linkUrl}](${linkUrl})`

    const { start, end, textarea } = getSelection()
    if (!textarea) return

    const newValue =
      textarea.value.substring(0, start) +
      linkMarkdown +
      textarea.value.substring(end)

    handleMarkdownChange(newValue)
    setIsLinkDialogOpen(false)
    setLinkUrl("")
    setLinkText("")
  }

  const handleImageSelect = useCallback((uploads: Upload[]) => {
    if (uploads.length > 0) {
      const selectedUpload = uploads[0]
      const altText = imageAlt || selectedUpload.displayName || selectedUpload.filename
      const imageMarkdown = `![${altText}](${selectedUpload.s3Url})`

      const { start, end, textarea } = getSelection()
      if (!textarea) return

      const newValue =
        textarea.value.substring(0, start) +
        imageMarkdown +
        textarea.value.substring(end)

      handleMarkdownChange(newValue)
      setImageAlt("")
    }
    setIsImageDialogOpen(false)
  }, [imageAlt, getSelection, handleMarkdownChange])

  // Render markdown to HTML with custom renderer
  const renderMarkdown = useCallback((markdown: string): string => {
    try {
      // First, render markdown to HTML
      let html = marked.parse(markdown, {
        breaks: true,
        gfm: true,
      }) as string
      
      // Then, add custom classes to headings using regex replacement
      const headingReplacements = [
        { level: 1, class: 'text-4xl mb-6 mt-0 pb-3 border-b border-border font-bold text-foreground' },
        { level: 2, class: 'text-3xl mb-4 mt-12 pt-2 pb-2 font-bold text-foreground' },
        { level: 3, class: 'text-2xl mb-3 mt-8 pt-1 font-bold text-foreground' },
        { level: 4, class: 'text-xl mb-2 mt-6 font-semibold text-foreground' },
        { level: 5, class: 'text-lg mb-2 mt-4 font-semibold text-foreground' },
        { level: 6, class: 'text-base mb-2 mt-4 font-semibold text-foreground' },
      ]
      
      headingReplacements.forEach(({ level, class: className }) => {
        // Replace <h1>, <h2>, etc. with class attributes
        const regex = new RegExp(`<h${level}([^>]*)>`, 'gi')
        html = html.replace(regex, (match, attributes) => {
          // Check if class already exists
          if (attributes && attributes.includes('class=')) {
            // Append to existing class
            return match.replace(/class="([^"]*)"/, `class="$1 ${className}"`)
          } else {
            // Add new class attribute
            return `<h${level} class="${className}"${attributes || ''}>`
          }
        })
      })
      
      return html
    } catch (error) {
      console.error("Markdown render error:", error)
      return `<p class="text-red-500">Markdown render hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}</p>`
    }
  }, [])

  return (
    <>
      <div className={cn("border border-border rounded-lg overflow-hidden flex flex-col", className)}>
        {/* Toolbar */}
        <div className="border-b border-border bg-muted/50 p-2 flex items-center gap-1 flex-wrap">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertBold}
              className="h-8 w-8 p-0"
              title="Kalın (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertItalic}
              className="h-8 w-8 p-0"
              title="İtalik (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertHeading(1)}
              className="h-8 w-8 p-0"
              title="Başlık 1"
            >
              <Heading1 className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertHeading(2)}
              className="h-8 w-8 p-0"
              title="Başlık 2"
            >
              <Heading2 className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertHeading(3)}
              className="h-8 w-8 p-0"
              title="Başlık 3"
            >
              <Heading3 className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertBulletList}
              className="h-8 w-8 p-0"
              title="Madde İşareti Listesi"
            >
              <List className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertOrderedList}
              className="h-8 w-8 p-0"
              title="Numaralı Liste"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertBlockquote}
              className="h-8 w-8 p-0"
              title="Alıntı"
            >
              <Quote className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertCodeBlock}
              className="h-8 w-8 p-0"
              title="Kod Bloğu"
            >
              <Code className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Media & Links */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertLink}
              className="h-8 w-8 p-0"
              title="Link Ekle"
            >
              <LinkIcon className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsImageDialogOpen(true)}
              title="Resim Ekle"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* Preview Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-8 px-2"
            title={showPreview ? "Önizlemeyi Gizle" : "Önizlemeyi Göster"}
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                <span className="text-xs">Önizlemeyi Gizle</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                <span className="text-xs">Önizlemeyi Göster</span>
              </>
            )}
          </Button>
        </div>

        {/* Editor Content - Split View */}
        <div className="flex flex-1 min-h-[400px]">
          {/* Markdown Editor (Left) */}
          <div className={cn(
            "flex-1 border-r border-border",
            showPreview ? "w-1/2" : "w-full"
          )}>
            <Textarea
              ref={textareaRef}
              value={markdownContent}
              onChange={(e) => handleMarkdownChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-full min-h-[400px] resize-none border-0 rounded-none font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace" }}
            />
          </div>

          {/* Preview (Right) */}
          {showPreview && (
            <div className="flex-1 w-1/2 overflow-y-auto bg-muted/30 p-6">
              <div
                className="prose prose-slate dark:prose-invert max-w-none
                  prose-p:mb-5 prose-p:text-foreground prose-p:leading-7 prose-p:text-[15px]
                  prose-strong:text-foreground prose-strong:font-bold
                  prose-em:text-foreground prose-em:italic
                  prose-code:text-sm prose-code:bg-muted/80 prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                  prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-6 prose-pre:overflow-x-auto
                  prose-pre code:bg-transparent prose-pre code:p-0 prose-pre code:text-sm
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-colors
                  prose-table:w-full prose-table:min-w-full prose-table:border-collapse prose-table:text-sm
                  prose-th:border prose-th:border-border prose-th:bg-muted/60 prose-th:p-4 prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-th:align-top prose-th:whitespace-nowrap
                  prose-td:border prose-td:border-border prose-td:p-4 prose-td:text-foreground prose-td:align-top
                  prose-tr:border-b prose-tr:border-border prose-tr:transition-colors
                  prose-tr:nth-child(even):bg-muted/20 prose-tr:hover:bg-muted/40
                  prose-thead:bg-muted/60
                  prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-5 prose-ul:space-y-2
                  prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-5 prose-ol:space-y-2
                  prose-li:mb-1 prose-li:text-foreground prose-li:leading-7
                  prose-li>p:mb-0 prose-li>p:mt-0
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-2 prose-blockquote:my-6 prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-foreground
                  prose-hr:border-border prose-hr:my-8 prose-hr:border-t-2
                  prose-img:rounded-lg prose-img:my-6 prose-img:border prose-img:border-border prose-img:shadow-sm
                  prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-muted-foreground prose-figcaption:mt-2
                  [&_h1]:text-4xl [&_h1]:mb-6 [&_h1]:mt-0 [&_h1]:pb-3 [&_h1]:border-b [&_h1]:border-border [&_h1]:font-bold [&_h1]:text-foreground
                  [&_h2]:text-3xl [&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:pt-2 [&_h2]:pb-2 [&_h2]:font-bold [&_h2]:text-foreground
                  [&_h3]:text-2xl [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:pt-1 [&_h3]:font-bold [&_h3]:text-foreground
                  [&_h4]:text-xl [&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:font-semibold [&_h4]:text-foreground
                  [&_h5]:text-lg [&_h5]:mb-2 [&_h5]:mt-4 [&_h5]:font-semibold [&_h5]:text-foreground
                  [&_h6]:text-base [&_h6]:mb-2 [&_h6]:mt-4 [&_h6]:font-semibold [&_h6]:text-foreground"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(markdownContent || placeholder),
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Ekle</DialogTitle>
            <DialogDescription>
              Link URL'sini girin. Seçili metin link metni olarak kullanılacak.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="linkUrl">URL *</Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleLinkSubmit()
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="linkText">Link Metni (Opsiyonel)</Label>
              <Input
                id="linkText"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link görünen metni"
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleLinkSubmit()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsLinkDialogOpen(false)
                setLinkUrl("")
                setLinkText("")
              }}
            >
              İptal
            </Button>
            <Button type="button" onClick={handleLinkSubmit}>
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog - MediaLibrarySelect */}
      {isImageDialogOpen && (
        <>
          <MediaLibrarySelect
            open={isImageDialogOpen}
            onOpenChange={setIsImageDialogOpen}
            onSelect={handleImageSelect}
            mode="single"
            title="Resim Seç"
            description="Medya kütüphanenizden bir resim seçin."
          />
          <Dialog open={isImageDialogOpen && false}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resim Alt Metni (Opsiyonel)</DialogTitle>
                <DialogDescription>
                  Resim için alt metin ekleyebilirsiniz.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="imageAlt">Alt Metin</Label>
                  <Input
                    id="imageAlt"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Resim açıklaması"
                    className="mt-1"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  )
}
