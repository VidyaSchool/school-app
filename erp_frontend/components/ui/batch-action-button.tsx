"use client"

import * as React from "react"
import {
  Layers,
  ChevronDown,
  Edit3,
  Trash2,
  Download,
  Archive,
  Loader2,
  CheckSquare,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export interface BatchActionItem {
  key?: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void | Promise<void>
  disabled?: boolean
  isDestructive?: boolean
}

export interface BatchActionButtonProps {
  /** Number of currently selected items */
  selectedCount?: number
  /** Label for the trigger button */
  label?: string
  /** Loading state displaying spinner */
  isLoading?: boolean
  /** Explicit disabled override */
  disabled?: boolean
  /** Action handlers */
  onEditSelected?: () => void | Promise<void>
  onDeleteSelected?: () => void | Promise<void>
  onExportSelected?: () => void | Promise<void>
  onArchiveSelected?: () => void | Promise<void>
  /** Custom extra batch actions */
  customActions?: BatchActionItem[]
  /** Custom action on clearing selection */
  onClearSelection?: () => void
  /** Visual variant: standard button or selection toolbar format */
  variant?: "default" | "toolbar"
  /** Custom trigger class */
  className?: string
  /** Dropdown menu alignment */
  align?: "start" | "end" | "center"
}

export function BatchActionButton({
  selectedCount = 0,
  label = "Batch Actions",
  isLoading = false,
  disabled = false,
  onEditSelected,
  onDeleteSelected,
  onExportSelected,
  onArchiveSelected,
  customActions = [],
  onClearSelection,
  variant = "default",
  className,
  align = "start",
}: BatchActionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const isSelectionEmpty = selectedCount === 0
  const isButtonDisabled = disabled || (isSelectionEmpty && !customActions.length)

  // Build standard actions list
  const defaultActions: BatchActionItem[] = []

  if (onEditSelected) {
    defaultActions.push({
      key: "edit",
      label: "Edit selected",
      icon: Edit3,
      onClick: onEditSelected,
    })
  }

  if (onExportSelected) {
    defaultActions.push({
      key: "export",
      label: "Export selected",
      icon: Download,
      onClick: onExportSelected,
    })
  }

  if (onArchiveSelected) {
    defaultActions.push({
      key: "archive",
      label: "Archive selected",
      icon: Archive,
      onClick: onArchiveSelected,
    })
  }

  // Toolbar mode: "5 selected | Batch Actions ▾"
  if (variant === "toolbar" && selectedCount > 0) {
    return (
      <div
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-1 shadow-xs backdrop-blur-sm transition-all animate-in fade-in-0 zoom-in-95",
          className
        )}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{selectedCount} selected</span>
          {onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="ml-1 text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-border/80" />

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isButtonDisabled || isLoading}
              className={cn(
                "group inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold tracking-tight text-foreground transition-colors outline-none",
                "hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
                isOpen && "bg-muted text-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <Layers className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
              <span>{label}</span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180 text-foreground"
                )}
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align={align} sideOffset={6} className="w-48 p-1">
            <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground">
              Bulk actions ({selectedCount} items)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {defaultActions.map((action) => {
              const Icon = action.icon
              return (
                <DropdownMenuItem
                  key={action.key || action.label}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className="gap-2 text-xs cursor-pointer"
                >
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                  <span>{action.label}</span>
                </DropdownMenuItem>
              )
            })}

            {customActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <DropdownMenuItem
                  key={action.key || action.label || idx}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className={cn(
                    "gap-2 text-xs cursor-pointer",
                    action.isDestructive && "text-destructive focus:text-destructive focus:bg-destructive/10"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                  <span>{action.label}</span>
                </DropdownMenuItem>
              )
            })}

            {onDeleteSelected && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDeleteSelected}
                  className="gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span>Delete selected</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Standard Button Mode
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isButtonDisabled || isLoading}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={cn(
            "group inline-flex h-9 sm:h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 sm:px-4 py-2",
            "text-xs sm:text-sm font-semibold tracking-tight text-foreground shadow-xs transition-all duration-150 outline-none select-none",
            "hover:bg-muted/60 active:bg-muted/80",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "data-[state=open]:bg-muted/70 data-[state=open]:border-foreground/20",
            "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer",
            className
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          ) : (
            <Layers className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          )}

          <span className="truncate">
            {selectedCount > 0 ? `${label} (${selectedCount})` : label}
          </span>

          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-foreground"
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={5}
        className="w-52 rounded-xl p-1 shadow-lg text-popover-foreground border-border"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between">
          <span>Batch Operations</span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] font-mono">
              {selectedCount}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {defaultActions.length > 0 && (
          <>
            {defaultActions.map((action) => {
              const Icon = action.icon
              return (
                <DropdownMenuItem
                  key={action.key || action.label}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className="gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg transition-colors"
                >
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="flex-1 truncate">{action.label}</span>
                </DropdownMenuItem>
              )
            })}
          </>
        )}

        {customActions.map((action, idx) => {
          const Icon = action.icon
          return (
            <DropdownMenuItem
              key={action.key || action.label || idx}
              disabled={action.disabled}
              onClick={action.onClick}
              className={cn(
                "gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg transition-colors",
                action.isDestructive
                  ? "text-destructive focus:text-destructive focus:bg-destructive/10"
                  : "text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
              <span className="flex-1 truncate">{action.label}</span>
            </DropdownMenuItem>
          )
        })}

        {onDeleteSelected && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDeleteSelected}
              className="gap-2.5 px-2.5 py-2 text-xs font-semibold text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg cursor-pointer transition-colors"
            >
              <Trash2 className="h-4 w-4 text-destructive shrink-0" />
              <span className="flex-1 truncate">Delete selected</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
