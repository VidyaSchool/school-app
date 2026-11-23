"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Code2, Play, RotateCcw, Copy, Check, ChevronDown, FileCode2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  fusionToBlocks,
  blocksToFusion,
  registerFusionLanguage,
  registerFusionTheme,
  FUSION_SNIPPETS,
} from "@/lib/fusion-lang"

// Dynamically load Monaco Editor (only on client)
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then(m => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#1a1b26]">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Code2 className="size-6 animate-pulse text-purple-400" />
        <span className="text-xs font-medium">Loading Editor...</span>
      </div>
    </div>
  ),
})

interface Block {
  id: string
  type: string
  props: Record<string, string>
  x?: number
  y?: number
  customWidth?: number
  customHeight?: number
  isInline?: boolean
  isFreeform?: boolean
  marginTop?: number
  marginBottom?: number
  marginStart?: number
  marginEnd?: number
  horizontalBias?: number
  verticalBias?: number
  layoutWidth?: "wrap_content" | "match_parent"
  linkedTargetId?: string
  linkedSide?: "top" | "bottom" | "left" | "right"
  anchoredLeft?: boolean
  anchoredRight?: boolean
  anchoredTop?: boolean
  anchoredBottom?: boolean
}

interface FusionCodeEditorProps {
  blocks: Block[]
  onApply: (blocks: Block[]) => void
}

export default function FusionCodeEditor({ blocks, onApply }: FusionCodeEditorProps) {
  const [code, setCode] = React.useState("")
  const [isApplied, setIsApplied] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)
  const [showSnippets, setShowSnippets] = React.useState(false)
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [blockCount, setBlockCount] = React.useState(0)
  const editorRef = React.useRef<any>(null)
  const monacoRef = React.useRef<any>(null)
  const prevBlocksJson = React.useRef<string>("")

  // Sync blocks → code when blocks change externally
  React.useEffect(() => {
    const currentJson = JSON.stringify(blocks.map(b => ({ type: b.type, props: b.props })))
    if (currentJson !== prevBlocksJson.current) {
      const fusionCode = blocksToFusion(blocks as any)
      setCode(fusionCode)
      prevBlocksJson.current = currentJson
      setBlockCount(blocks.length)
    }
  }, [blocks])

  // Register Fusion language and theme on Monaco mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco
    registerFusionLanguage(monaco)
    registerFusionTheme(monaco)
    monaco.editor.setTheme("fusion-dark")

    // Add keyboard shortcut: Ctrl+Enter → Apply
    editor.addAction({
      id: "fusion-apply",
      label: "Apply Fusion Code to Canvas",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handleApply(),
    })
  }

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || ""
    setCode(newCode)
    setIsApplied(false)

    // Live parse validation
    try {
      const parsed = fusionToBlocks(newCode)
      setParseError(null)
      setBlockCount(parsed.length)
    } catch (e: any) {
      setParseError(e.message || "Parse error")
    }
  }

  const handleApply = () => {
    try {
      const newBlocks = fusionToBlocks(code)
      onApply(newBlocks)
      prevBlocksJson.current = JSON.stringify(newBlocks.map(b => ({ type: b.type, props: b.props })))
      setIsApplied(true)
      setParseError(null)
      setBlockCount(newBlocks.length)
      setTimeout(() => setIsApplied(false), 2000)
    } catch (e: any) {
      setParseError(e.message || "Failed to parse Fusion code")
    }
  }

  const handleReset = () => {
    const fusionCode = blocksToFusion(blocks as any)
    setCode(fusionCode)
    setParseError(null)
    setIsApplied(false)
    if (editorRef.current) {
      editorRef.current.setValue(fusionCode)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 1500)
  }

  const handleInsertSnippet = (snippet: string) => {
    setCode(snippet)
    if (editorRef.current) {
      editorRef.current.setValue(snippet)
    }
    setShowSnippets(false)
    setIsApplied(false)
    try {
      const parsed = fusionToBlocks(snippet)
      setBlockCount(parsed.length)
      setParseError(null)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Code Editor Header */}
      <div className="px-3 py-2 border-b bg-[#1a1b26]/80 shrink-0 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <FileCode2 className="size-3.5 text-purple-400" />
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
            Fusion
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            ({blockCount} blocks)
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Snippets dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSnippets(!showSnippets)}
              className="flex items-center gap-1 h-6 px-2 rounded text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
            >
              <Sparkles className="size-3 text-amber-400" />
              Templates
              <ChevronDown className={cn("size-2.5 transition-transform", showSnippets && "rotate-180")} />
            </button>

            {showSnippets && (
              <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border/60 bg-[#1a1b26] shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {Object.entries(FUSION_SNIPPETS).map(([name, snippet]) => (
                  <button
                    key={name}
                    onClick={() => handleInsertSnippet(snippet)}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Code2 className="size-3 text-purple-400 shrink-0" />
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
            title="Copy code"
          >
            {isCopied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
            title="Reset to current canvas"
          >
            <RotateCcw className="size-3" />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 relative">
        <MonacoEditor
          height="100%"
          defaultLanguage="fusion"
          language="fusion"
          theme="fusion-dark"
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            renderLineHighlight: "line",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            wrappingIndent: "indent",
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              preview: true,
            },
            quickSuggestions: { other: true, strings: true, comments: false },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
              useShadows: false,
            },
          }}
        />

        {/* Floating apply overlay when code is dirty */}
        {!isApplied && code !== blocksToFusion(blocks as any) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1a1b26] via-[#1a1b26]/95 to-transparent pt-8 pb-2 px-3 pointer-events-none">
            <div className="pointer-events-auto">
              {/* Parse error indicator */}
              {parseError && (
                <div className="mb-1.5 text-[10px] text-red-400 font-mono truncate px-1">
                  ⚠ {parseError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Apply to Canvas bar */}
      <div className="border-t border-border/40 bg-[#1a1b26]/90 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded bg-muted/30 border border-border/40 text-[9px] font-mono">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1 py-0.5 rounded bg-muted/30 border border-border/40 text-[9px] font-mono">Enter</kbd>
          <span className="ml-1">to apply</span>
        </div>

        <Button
          size="sm"
          onClick={handleApply}
          disabled={!!parseError}
          className={cn(
            "h-7 text-[11px] gap-1.5 font-bold shadow-xs transition-all",
            isApplied
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          )}
        >
          {isApplied ? (
            <>
              <Check className="size-3" /> Applied!
            </>
          ) : (
            <>
              <Play className="size-3" /> Apply to Canvas
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
