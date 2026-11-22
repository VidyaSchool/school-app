'use client'

import * as React from "react"
import {
  SearchDialog,
  SearchDialogOverlay,
  SearchDialogContent,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogHeader,
  SearchDialogInput,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search"
import { Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface SearchResultItem {
  id: string
  title: string
  content?: string
  url: string
  type?: string
  badge?: string
  onSelect?: () => void
  node?: React.ReactNode
  [key: string]: unknown
}

export function CustomSearchDialog(props: SharedProps) {
  const [internalOpen, setInternalOpen] = React.useState<boolean | null>(null)
  const isDialogOpen = internalOpen !== null ? internalOpen : props.open

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setInternalOpen(open)
      try {
        props.onOpenChange?.(open)
      } catch {}
      if (!open) {
        setSearch("")
        setResults([])
      }
    },
    [props]
  )

  React.useEffect(() => {
    const handleCustomOpen = () => {
      setInternalOpen(true)
      try {
        props.onOpenChange?.(true)
      } catch {}
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault()
        e.stopPropagation()
        setInternalOpen((prev) => {
          const current = prev !== null ? prev : props.open
          const next = !current
          try {
            props.onOpenChange?.(next)
          } catch {}
          return next
        })
      }
    }

    window.addEventListener("open-vidya-search", handleCustomOpen)
    window.addEventListener("keydown", handleGlobalKeyDown, true)
    return () => {
      window.removeEventListener("open-vidya-search", handleCustomOpen)
      window.removeEventListener("keydown", handleGlobalKeyDown, true)
    }
  }, [props])

  React.useEffect(() => {
    setInternalOpen(props.open)
  }, [props.open])

  const [search, setSearch] = React.useState("")
  const [results, setResults] = React.useState<SearchResultItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [, setIsFocused] = React.useState(false)
  const [loaderPhase, setLoaderPhase] = React.useState(0)

  React.useEffect(() => {
    if (!isLoading) {
      return
    }
    const interval = setInterval(() => {
      setLoaderPhase((prev) => (prev + 1) % 2)
    }, 1300)
    return () => clearInterval(interval)
  }, [isLoading])

  React.useEffect(() => {
    const trimmed = search.trim()
    if (!trimmed) {
      const resetTimer = setTimeout(() => {
        setResults([])
        setIsLoading(false)
      }, 0)
      return () => clearTimeout(resetTimer)
    }

    const startTimer = setTimeout(() => setIsLoading(true), 0)
    const fetchTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (err) {
        console.error("Search fetch failed:", err)
      } finally {
        setIsLoading(false)
      }
    }, 150)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(fetchTimer)
    }
  }, [search])

  const renderItem = ({ item, onClick }: { item: SearchResultItem; onClick: () => void }) => {
    if (item.type === "action") {
      return (
        <button key={item.id} onClick={item.onSelect} className="w-full text-left">
          {item.node}
        </button>
      )
    }

    const isDoc = item.id?.startsWith("docs-") || item.url?.startsWith("/docs/")
    const isCustom = item.id?.startsWith("page-custom-") || item.url?.startsWith("/p/")
    const isBuilder = item.id?.startsWith("builder-edit-") || item.url?.includes("/page-builder/")
    const typeLabel = isDoc ? "Docs" : isBuilder ? "Builder" : isCustom ? "Custom" : "Page"

    return (
      <SearchDialogListItem
        key={item.id}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item={item as unknown as any}
        onClick={onClick}
        className="flex flex-col items-start gap-0.5 py-3 px-3 mx-1 w-[calc(100%-8px)] cursor-pointer
                   border-b border-border/30 last:border-b-0"
      >
        {/* Row 1: type pill + title */}
        <div className="flex items-center gap-2 w-full">
          <span className={`shrink-0 text-[9px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded border ${
            isBuilder
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              : isCustom
              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
              : isDoc
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              : "bg-sidebar-foreground/10 text-muted-foreground border-border/60"
          }`}>
            {typeLabel}
          </span>
          <span className="text-xs font-medium text-foreground truncate flex-1 leading-snug">
            {item.title}
          </span>
        </div>

        {/* Row 2: content snippet */}
        {item.content && (
          <p className="text-[11px] text-muted-foreground/70 line-clamp-1 leading-normal w-full pl-[46px]">
            {item.content}
          </p>
        )}
      </SearchDialogListItem>
    )
  }

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      {...props}
      open={isDialogOpen}
      onOpenChange={handleOpenChange}
    >
      {/* Overlay — at the very top of all elements above sticky navbar */}
      <SearchDialogOverlay className="!z-[99998] backdrop-blur-md bg-black/60" />

      {/* Dialog container — elevated above navbar on all viewports */}
      <SearchDialogContent
        className="!z-[99999] top-3 sm:top-6 md:top-[calc(50%-250px)] max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-xl shadow-2xl focus:outline-none
                   border border-border/80
                   bg-sidebar/95 backdrop-blur-md
                   text-muted-foreground"
      >
        {/* Shimmer & Portal Top Stacking */}
        <style>{`
          [data-radix-portal] {
            z-index: 99999 !important;
            position: relative;
          }
          @keyframes text-shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          .shimmer-light {
            background: linear-gradient(90deg, var(--muted-foreground) 20%, var(--foreground) 50%, var(--muted-foreground) 80%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: text-shimmer 2s linear infinite;
          }
        `}</style>

        {/* Header */}
        <SearchDialogHeader
          className={`flex items-center justify-between px-3 py-1.5 h-11 shrink-0 ${
            search.trim() !== "" ? "border-b border-border/80" : ""
          }`}
        >
          <div className="flex items-center gap-2.5 flex-1 h-full">
            <Search className="size-4.5 shrink-0 text-muted-foreground/80" />
            <SearchDialogInput
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 bg-transparent text-xs text-muted-foreground font-normal
                         placeholder:text-muted-foreground/50
                         focus-visible:outline-none h-full py-0 border-none outline-none"
              placeholder="Quick Search"
            />
          </div>
          {search.trim() === "" && (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5
                            rounded-md border border-border
                            bg-transparent dark:bg-transparent
                            px-1.5 font-mono text-[9px] font-medium
                            text-muted-foreground/60 shadow-none">
              <span>⌘</span><span>F</span>
            </kbd>
          )}
        </SearchDialogHeader>

        {/* Results list */}
        {search.trim() !== "" && (
          <ScrollArea className="flex-1 max-h-[380px] py-1" type="always">
            {isLoading && (
              <div className="flex items-center px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-xs font-semibold shimmer-light">
                  {loaderPhase === 0 ? "Searching in documentations..." : "Searching in pages..."}
                </span>
              </div>
            )}
            <SearchDialogList
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              items={search.trim() === "" ? null : (results as unknown as any)}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Item={renderItem as unknown as any}
              className="p-1 space-y-1"
            />
          </ScrollArea>
        )}
      </SearchDialogContent>
    </SearchDialog>
  )
}
