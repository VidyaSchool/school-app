"use client"

import * as React from "react"
import { DocsPage, DocsBody } from "fumadocs-ui/page"
import { PublicEditorJsBlockRenderer } from "@/components/static-page-renderer"
import type { StaticPageData, EditorJsBlock } from "@/lib/static-pages"

export function DocsStaticRenderer({ page }: { page: StaticPageData }) {
  const raw = page.widgets
  let blocks: EditorJsBlock[] = []
  if (raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray(raw.blocks)) {
    blocks = raw.blocks
  } else if (Array.isArray(raw) && raw.length > 0 && "data" in raw[0]) {
    blocks = raw as unknown as EditorJsBlock[]
  }

  // Generate Table of Contents from header blocks
  const toc = blocks
    .filter((b) => b.type === "header")
    .map((b) => {
      const rawText = b.data?.text || ""
      const cleanText = rawText.replace(/<[^>]*>/g, "").trim()
      const slug = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      return {
        title: cleanText,
        url: `#${slug}`,
        depth: b.data?.level || 2,
      }
    })

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        <div className="space-y-3 pb-4 border-b border-border/40">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" id="overview">
            {page.title}
          </h1>
          {page.description && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {page.description}
            </p>
          )}
        </div>

        <div className="space-y-4 pt-4">
          {blocks.map((block, idx) => (
            <PublicEditorJsBlockRenderer key={block.id || idx} block={block} />
          ))}
        </div>
      </DocsBody>
    </DocsPage>
  )
}
