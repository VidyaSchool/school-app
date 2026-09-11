"use client"

import * as React from "react"
import type EditorJS from "@editorjs/editorjs"
import type { OutputData, ToolConstructable } from "@editorjs/editorjs"

import {
  ShadcnAlertTool,
  ShadcnButtonTool,
  ShadcnCardTool,
  ShadcnStatsTool,
  ShadcnPdfTool,
  ShadcnVideoTool,
  ShadcnTableTool,
} from "./editorjs-tools"

export interface CanvasSelectedBlock {
  id: string
  type: string
  data: Record<string, unknown>
  index: number
}

interface EditorCanvasProps {
  holderId?: string
  initialData?: OutputData
  onChange?: (data: OutputData) => void
  readOnly?: boolean
  onReady?: (editor: EditorJS) => void
  selectedBlockId?: string | null
  onSelectBlock?: (block: CanvasSelectedBlock | null) => void
}

export function EditorCanvas({
  holderId = "editorjs-canvas",
  initialData,
  onChange,
  readOnly = false,
  onReady,
  selectedBlockId,
  onSelectBlock,
}: EditorCanvasProps) {
  const editorInstanceRef = React.useRef<EditorJS | null>(null)
  const initialDataRef = React.useRef(initialData)
  const onChangeRef = React.useRef(onChange)
  const onReadyRef = React.useRef(onReady)
  const onSelectBlockRef = React.useRef(onSelectBlock)

  React.useEffect(() => {
    onChangeRef.current = onChange
    onReadyRef.current = onReady
    onSelectBlockRef.current = onSelectBlock
  }, [onChange, onReady, onSelectBlock])

  // Attach click listener on the canvas to detect block selection
  React.useEffect(() => {
    const holderEl = document.getElementById(holderId)
    if (!holderEl) return

    const handlePointerDown = async (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      const blockEl = target.closest(".ce-block") as HTMLElement | null
      const editor = editorInstanceRef.current

      if (!blockEl || !editor) {
        if (target === holderEl && onSelectBlockRef.current) {
          onSelectBlockRef.current(null)
        }
        return
      }

      try {
        const blockAPI = editor.blocks.getBlockByElement(blockEl)
        if (!blockAPI) return

        const saved = await blockAPI.save()
        const index = editor.blocks.getBlockIndex(blockAPI.id)

        const blockData = saved && typeof saved === "object" && "data" in saved ? (saved as { data: Record<string, unknown> }).data : {}

        if (onSelectBlockRef.current) {
          onSelectBlockRef.current({
            id: blockAPI.id,
            type: blockAPI.name,
            data: blockData,
            index,
          })
        }
      } catch {
        // Ignore selection error during active edit
      }
    }

    holderEl.addEventListener("pointerdown", handlePointerDown)
    return () => {
      holderEl.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [holderId])

  // Outline selected block element in real-time
  React.useEffect(() => {
    const holderEl = document.getElementById(holderId)
    if (!holderEl) return

    const prevSelected = holderEl.querySelectorAll(".ce-block--active-highlight")
    prevSelected.forEach((el) => el.classList.remove("ce-block--active-highlight"))

    if (selectedBlockId) {
      const allBlocks = holderEl.querySelectorAll(".ce-block")
      allBlocks.forEach((bEl) => {
        const editor = editorInstanceRef.current
        if (editor) {
          const api = editor.blocks.getBlockByElement(bEl as HTMLElement)
          if (api && api.id === selectedBlockId) {
            bEl.classList.add("ce-block--active-highlight")
          }
        }
      })
    }
  }, [selectedBlockId, holderId])

  React.useEffect(() => {
    let isMounted = true
    let editor: EditorJS | null = null

    const initEditor = async () => {
      try {
        const [
          { default: EditorJSClass },
          { default: Header },
          { default: List },
          { default: Quote },
          { default: Delimiter },
          { default: Checklist },
        ] = await Promise.all([
          import("@editorjs/editorjs"),
          import("@editorjs/header"),
          import("@editorjs/list"),
          import("@editorjs/quote"),
          import("@editorjs/delimiter"),
          import("@editorjs/checklist"),
        ])

        // Abort if component was unmounted during async import
        if (!isMounted) return

        // Clear any existing DOM nodes in holder to prevent duplicate editors
        const holderEl = document.getElementById(holderId)
        if (holderEl) {
          holderEl.innerHTML = ""
        }

        const initial = initialDataRef.current

        editor = new EditorJSClass({
          holder: holderId,
          readOnly,
          placeholder: "Type '/' for commands or click '+' to add an element...",
          data: initial && initial.blocks?.length ? initial : undefined,
          tools: {
            header: {
              class: Header as unknown as ToolConstructable,
              inlineToolbar: ["link", "bold", "italic"],
              config: {
                placeholder: "Enter a heading...",
                levels: [1, 2, 3, 4],
                defaultLevel: 2,
              },
            },
            list: {
              class: List as unknown as ToolConstructable,
              inlineToolbar: true,
              config: {
                defaultStyle: "unordered",
              },
            },
            checklist: {
              class: Checklist as unknown as ToolConstructable,
              inlineToolbar: true,
            },
            table: ShadcnTableTool as unknown as ToolConstructable,
            quote: {
              class: Quote as unknown as ToolConstructable,
              inlineToolbar: true,
              config: {
                quotePlaceholder: "Enter quote text...",
                captionPlaceholder: "Quote author / citation...",
              },
            },
            delimiter: Delimiter as unknown as ToolConstructable,

            // Shadcn custom element tools
            alert: ShadcnAlertTool as unknown as ToolConstructable,
            button: ShadcnButtonTool as unknown as ToolConstructable,
            card: ShadcnCardTool as unknown as ToolConstructable,
            stats: ShadcnStatsTool as unknown as ToolConstructable,
            pdf: ShadcnPdfTool as unknown as ToolConstructable,
            video: ShadcnVideoTool as unknown as ToolConstructable,
          },
          onChange: async (api) => {
            if (onChangeRef.current) {
              const savedData = await api.saver.save()
              onChangeRef.current(savedData)
            }
          },
          onReady: () => {
            if (!isMounted) {
              try {
                editor?.destroy()
              } catch {
                // Ignore
              }
              return
            }
            if (editor) {
              editorInstanceRef.current = editor
              if (onReadyRef.current) onReadyRef.current(editor)
            }
          },
        })
      } catch (err) {
        console.error("Failed to initialize Editor.js:", err)
      }
    }

    initEditor()

    return () => {
      isMounted = false
      if (editorInstanceRef.current && typeof editorInstanceRef.current.destroy === "function") {
        try {
          editorInstanceRef.current.destroy()
        } catch {
          // Ignore
        }
      } else if (editor && typeof editor.destroy === "function") {
        try {
          editor.destroy()
        } catch {
          // Ignore
        }
      }
      editorInstanceRef.current = null
      const holderEl = document.getElementById(holderId)
      if (holderEl) {
        holderEl.innerHTML = ""
      }
    }
  }, [holderId, readOnly])

  return (
    <div className="w-full editorjs-theme-wrapper">
      <div id={holderId} className="min-h-[500px] w-full" />
      <style jsx global>{`
        /* Editor.js Clean Shadcn Typography & Layout Tuning */
        .editorjs-theme-wrapper .codex-editor {
          width: 100%;
        }
        .editorjs-theme-wrapper .ce-block__content {
          max-width: 100% !important;
          margin: 0 auto;
        }
        .editorjs-theme-wrapper .ce-toolbar__content {
          max-width: 100% !important;
        }
        .editorjs-theme-wrapper .ce-paragraph {
          font-size: 0.95rem;
          line-height: 1.7;
          color: var(--foreground);
        }
        .editorjs-theme-wrapper .ce-header {
          font-weight: 700;
          letter-spacing: -0.025em;
          color: var(--foreground);
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .editorjs-theme-wrapper h1.ce-header {
          font-size: 2rem;
          line-height: 1.2;
        }
        .editorjs-theme-wrapper h2.ce-header {
          font-size: 1.5rem;
          line-height: 1.3;
        }
        .editorjs-theme-wrapper h3.ce-header {
          font-size: 1.25rem;
          line-height: 1.4;
        }
        .editorjs-theme-wrapper h4.ce-header {
          font-size: 1.1rem;
          line-height: 1.4;
        }
        .editorjs-theme-wrapper .cdx-quote {
          border-left: 3px solid var(--primary);
          padding: 0.5rem 1rem;
          background: color-mix(in srgb, var(--muted) 30%, transparent);
          border-radius: 0 0.5rem 0.5rem 0;
          margin: 1rem 0;
        }
        .editorjs-theme-wrapper .cdx-quote__text {
          font-style: italic;
          font-size: 0.95rem;
        }
        .editorjs-theme-wrapper .cdx-quote__caption {
          font-size: 0.8rem;
          color: var(--muted-foreground);
          margin-top: 0.25rem;
        }
        .editorjs-theme-wrapper .ce-toolbar__plus,
        .editorjs-theme-wrapper .ce-toolbar__settings-btn {
          color: var(--foreground);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          transition: background 0.15s ease;
        }
        .editorjs-theme-wrapper .ce-toolbar__plus:hover,
        .editorjs-theme-wrapper .ce-toolbar__settings-btn:hover {
          background: var(--muted);
        }
        .editorjs-theme-wrapper .ce-popover {
          background: var(--card);
          color: var(--card-foreground);
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .editorjs-theme-wrapper .ce-popover-item:hover {
          background: var(--muted);
        }
        .editorjs-theme-wrapper .ce-popover-item__icon {
          background: var(--muted);
          border-radius: 0.375rem;
        }
        .editorjs-theme-wrapper .cdx-delimiter {
          line-height: 1.6em;
          text-align: center;
          margin: 1.5rem 0;
        }
        .editorjs-theme-wrapper .cdx-delimiter:before {
          content: "***";
          font-size: 1.5rem;
          letter-spacing: 0.5em;
          color: var(--border);
        }
        .editorjs-theme-wrapper .tc-wrap {
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .editorjs-theme-wrapper .tc-row {
          border-bottom: 1px solid var(--border);
        }
        .editorjs-theme-wrapper .tc-cell {
          border-right: 1px solid var(--border);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }

        /* Active Block Highlight */
        .editorjs-theme-wrapper .ce-block--active-highlight > .ce-block__content {
          outline: 2px solid var(--primary);
          outline-offset: 4px;
          border-radius: 0.75rem;
          transition: outline-color 0.15s ease;
        }
      `}</style>
    </div>
  )
}
