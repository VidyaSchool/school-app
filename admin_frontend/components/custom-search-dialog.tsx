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

export function CustomSearchDialog(props: SharedProps) {
  const [search, setSearch] = React.useState("")
  const [results, setResults] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const [loaderPhase, setLoaderPhase] = React.useState(0)

  React.useEffect(() => {
    if (!isLoading) {
      setLoaderPhase(0)
      return
    }
    const interval = setInterval(() => {
      setLoaderPhase((prev) => (prev + 1) % 2)
    }, 1300)
    return () => clearInterval(interval)
  }, [isLoading])

  React.useEffect(() => {
    if (!search.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`)
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
    return () => clearTimeout(timer)
  }, [search])

  const renderItem = ({ item, onClick }: { item: any; onClick: () => void }) => {
    if (item.type === "action") {
      return (
        <button key={item.id} onClick={item.onSelect} className="w-full text-left">
          {item.node}
        </button>
      )
    }

    const isDoc = item.id?.startsWith("docs-") || item.url?.startsWith("/docs/")
    const typeLabel = isDoc ? "Docs" : "Page"

    return (
      <SearchDialogListItem
        key={item.id}
        item={item}
        onClick={onClick}
        className="flex flex-col items-start gap-0.5 py-3 px-3 mx-1 w-[calc(100%-8px)] cursor-pointer
                   border-b border-border/30 last:border-b-0"
      >
        {/* Row 1: type pill + title */}
        <div className="flex items-center gap-2 w-full">
          <span className="shrink-0 text-[9px] font-semibold tracking-widest uppercase
                           px-1.5 py-0.5 rounded
                           bg-sidebar-foreground/10
                           text-muted-foreground
                           border border-border/60">
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
    <SearchDialog search={search} onSearchChange={setSearch} {...props}>
      {/* Overlay — same as sidebar backdrop */}
      <SearchDialogOverlay className="backdrop-blur-md bg-black/50" />

      {/* Dialog container — solid white in light mode, sidebar-glass in dark */}
      <SearchDialogContent
        className="max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-xl shadow-2xl focus:outline-none
                   border border-border/80
                   bg-sidebar/90 backdrop-blur-md
                   text-muted-foreground"
      >
        {/* Shimmer — same gradient for both modes using CSS vars */}
        <style>{`
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
              items={search.trim() === "" ? null : results}
              Item={renderItem}
              className="p-1 space-y-1"
            />
          </ScrollArea>
        )}
      </SearchDialogContent>
    </SearchDialog>
  )
}
