"use client"

import { useEffect, useRef } from "react"
import { remark } from "remark"
import remarkRehype from "remark-rehype"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeStringify from "rehype-stringify"
import "highlight.js/styles/github-dark.css"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renderMarkdown = async () => {
      if (!contentRef.current) return

      try {
        const file = await remark()
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeSlug)
          .use(rehypeAutolinkHeadings, {
            behavior: "wrap",
            properties: {
              className: ["anchor-link"],
            },
          })
          .use(rehypeHighlight, {
            ignoreMissing: true,
          })
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(content)

        if (contentRef.current) {
          contentRef.current.innerHTML = String(file)
          
          // Wrap tables in a scrollable container
          const tables = contentRef.current.querySelectorAll('table')
          tables.forEach((table) => {
            // Check if table is already wrapped
            if (table.parentElement?.classList.contains('table-wrapper')) {
              return
            }
            
            const wrapper = document.createElement('div')
            wrapper.className = 'table-wrapper my-6 overflow-x-auto rounded-lg border border-border'
            table.parentNode?.insertBefore(wrapper, table)
            wrapper.appendChild(table)
            
            // Add table classes
            table.className = 'w-full min-w-full border-collapse'
          })
        }
      } catch (error) {
        console.error("Markdown render hatası:", error)
        if (contentRef.current) {
          contentRef.current.innerHTML = `<p class="text-red-500">Markdown render hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}</p>`
        }
      }
    }

    renderMarkdown()
  }, [content])

  return (
    <div
      ref={contentRef}
      className="markdown-content prose prose-slate dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:text-foreground prose-headings:scroll-mt-20
        prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-0 prose-h1:pb-3 prose-h1:border-b prose-h1:border-border
        prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-12 prose-h2:pt-2 prose-h2:pb-2
        prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8 prose-h3:pt-1
        prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-6
        prose-h5:text-lg prose-h5:mb-2 prose-h5:mt-4
        prose-h6:text-base prose-h6:mb-2 prose-h6:mt-4
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
        prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-muted-foreground prose-figcaption:mt-2"
    />
  )
}
