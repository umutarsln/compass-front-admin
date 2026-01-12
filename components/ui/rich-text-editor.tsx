"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Link } from "@tiptap/extension-link"
import { Image } from "@tiptap/extension-image"
import { CodeBlock } from "@tiptap/extension-code-block"
import { Underline } from "@tiptap/extension-underline"
import { Strike } from "@tiptap/extension-strike"
import { TextAlign } from "@tiptap/extension-text-align"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { Highlight } from "@tiptap/extension-highlight"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useState, useCallback } from "react"
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

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "İçerik yazın...",
  className,
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false, // Custom code block kullanacağız
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: "bg-muted p-4 rounded-lg font-mono text-sm",
        },
      }),
      Underline,
      Strike,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-border",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert focus:outline-none min-h-[300px] max-w-none p-4 text-foreground",
      },
    },
  })

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const setLink = () => {
    if (linkUrl === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run()
      setIsLinkDialogOpen(false)
      return
    }

    if (linkText) {
      editor?.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run()
    } else {
      editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
    }
    setIsLinkDialogOpen(false)
    setLinkUrl("")
    setLinkText("")
  }

  const handleImageSelect = useCallback((uploads: Upload[]) => {
    if (uploads.length > 0) {
      const selectedUpload = uploads[0]
      editor?.chain().focus().setImage({ src: selectedUpload.s3Url, alt: selectedUpload.displayName || selectedUpload.filename }).run()
    }
    setIsImageDialogOpen(false)
  }, [editor])

  const handleImageDialogChange = useCallback((open: boolean) => {
    // Sadece gerçekten değişiklik varsa state'i güncelle
    if (open !== isImageDialogOpen) {
      setIsImageDialogOpen(open)
    }
  }, [isImageDialogOpen])

  const addTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  if (!isMounted || !editor) {
    return (
      <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
        <div className="border-b border-border bg-muted/50 p-2 flex items-center gap-1 flex-wrap">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
        </div>
        <div className="bg-background min-h-[300px] p-4">
          <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!editor) {
    return null
  }

  return (
    <>
      <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
        {/* Toolbar */}
        <div className="border-b border-border bg-muted/50 p-2 flex items-center gap-1 flex-wrap">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("bold") && "bg-muted"
              )}
              title="Kalın (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("italic") && "bg-muted"
              )}
              title="İtalik (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("underline") && "bg-muted"
              )}
              title="Altı Çizili (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("strike") && "bg-muted"
              )}
              title="Üstü Çizili"
            >
              <Strikethrough className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("heading", { level: 1 }) && "bg-muted"
              )}
              title="Başlık 1"
            >
              <Heading1 className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("heading", { level: 2 }) && "bg-muted"
              )}
              title="Başlık 2"
            >
              <Heading2 className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("heading", { level: 3 }) && "bg-muted"
              )}
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
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("bulletList") && "bg-muted"
              )}
              title="Madde İşareti Listesi"
            >
              <List className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("orderedList") && "bg-muted"
              )}
              title="Numaralı Liste"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("blockquote") && "bg-muted"
              )}
              title="Alıntı"
            >
              <Quote className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("codeBlock") && "bg-muted"
              )}
              title="Kod Bloğu"
            >
              <Code className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive({ textAlign: "left" }) && "bg-muted"
              )}
              title="Sola Hizala"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive({ textAlign: "center" }) && "bg-muted"
              )}
              title="Ortala"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive({ textAlign: "right" }) && "bg-muted"
              )}
              title="Sağa Hizala"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Media & Links */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const previousUrl = editor.getAttributes("link").href
                setLinkUrl(previousUrl || "")
                setIsLinkDialogOpen(true)
              }}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("link") && "bg-muted"
              )}
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

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addTable}
              title="Tablo Ekle"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* History */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className="h-8 w-8 p-0"
              title="Geri Al (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className="h-8 w-8 p-0"
              title="Yinele (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="bg-background">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Ekle/Düzenle</DialogTitle>
            <DialogDescription>
              Link URL'sini girin. Seçili metni değiştirmek için metin alanını doldurun.
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
                    setLink()
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
                    setLink()
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
                editor?.chain().focus().unsetLink().run()
                setIsLinkDialogOpen(false)
                setLinkUrl("")
                setLinkText("")
              }}
            >
              Linki Kaldır
            </Button>
            <Button type="button" onClick={setLink}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog - MediaLibrarySelect */}
      {isImageDialogOpen && (
        <MediaLibrarySelect
          open={isImageDialogOpen}
          onOpenChange={handleImageDialogChange}
          onSelect={handleImageSelect}
          mode="single"
          title="Resim Seç"
          description="Medya kütüphanenizden bir resim seçin."
        />
      )}
    </>
  )
}
