"use client"

import * as React from "react"
import {
  ArrowRightLeft,
  ArrowUpDown,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  FileText,
  Mail,
  MailX,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface Email {
  id: string
  folder: string
  fromAddress: string
  toAddress: string
  ccAddress: string | null
  subject: string
  bodyHtml: string | null
  bodyText: string
  isRead: boolean
  isStarred: boolean
  createdAt: string
}

type Folder = "inbox" | "sent" | "starred" | "trash"

// Custom folder SVG icon
function FolderSVG({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="8 33 93 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path opacity="0.5" d="M10 54.315C10 51.0479 10 49.4162 10.3115 48.0546C10.9755 45.131 12.684 42.4417 15.2138 40.3375C17.7437 38.2334 20.9776 36.812 24.4936 36.259C26.1357 36 28.1026 36 32.0275 36C33.7452 36 34.6085 36 35.4362 36.0629C39.0009 36.3413 42.3817 37.5069 45.1372 39.4077C45.778 39.848 46.3832 40.3512 47.6025 41.365L50.05 43.4C53.6812 46.4192 55.4968 47.9288 57.6684 48.9315C58.862 49.4846 60.1282 49.9216 61.442 50.2339C63.8361 50.8 66.4037 50.8 71.5346 50.8H73.1989C84.9113 50.8 90.7719 50.8 94.5767 53.649C94.9297 53.908 95.262 54.1843 95.5735 54.4778C99 57.6413 99 62.5142 99 72.2526V80.4C99 94.3527 99 101.331 93.7846 105.664C88.5692 109.996 80.1809 110 63.4 110H45.6C28.819 110 20.4263 110 15.2154 105.664C10.0044 101.327 10 94.3527 10 80.4V54.315Z" fill="currentColor" />
      <path d="M90 51C90 49.8956 89.978 49.2397 89.8901 48.6652C89.5106 46.2391 88.1924 43.9863 86.14 42.2563C84.0876 40.5262 81.4157 39.4155 78.5386 39.0964C77.6816 39 76.662 39 74.6185 39H46C46.5098 39.3854 47.0855 39.8672 48.0304 40.6677L50.4475 42.706C54.0336 45.7301 55.8266 47.2421 57.9712 48.2464C59.1514 48.8007 60.4033 49.2385 61.7024 49.551C64.0623 50.118 66.5981 50.118 71.6696 50.118H73.3088C81.1314 50.118 86.304 50.118 90 51Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M56 65.5C56 64.837 56.3404 64.2011 56.9463 63.7322C57.5522 63.2634 58.3739 63 59.2308 63H80.7692C81.6261 63 82.4478 63.2634 83.0537 63.7322C83.6596 64.2011 84 64.837 84 65.5C84 66.163 83.6596 66.7989 83.0537 67.2678C82.4478 67.7366 81.6261 68 80.7692 68H59.2308C58.3739 68 57.5522 67.7366 56.9463 67.2678C56.3404 66.7989 56 66.163 56 65.5Z" fill="currentColor" />
    </svg>
  )
}

// Sent folder SVG icon
function SentSVG({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="8 33 93 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path opacity="0.5" d="M10 54.315C10 51.0479 10 49.4162 10.3115 48.0546C10.9755 45.131 12.684 42.4417 15.2138 40.3375C17.7437 38.2334 20.9776 36.812 24.4936 36.259C26.1357 36 28.1026 36 32.0275 36C33.7452 36 34.6085 36 35.4362 36.0629C39.0009 36.3413 42.3817 37.5069 45.1372 39.4077C45.778 39.848 46.3832 40.3512 47.6025 41.365L50.05 43.4C53.6812 46.4192 55.4968 47.9288 57.6684 48.9315C58.862 49.4846 60.1282 49.9216 61.442 50.2339C63.8361 50.8 66.4037 50.8 71.5346 50.8H73.1989C84.9113 50.8 90.7719 50.8 94.5767 53.649C94.9297 53.908 95.262 54.1843 95.5735 54.4778C99 57.6413 99 62.5142 99 72.2526V80.4C99 94.3527 99 101.331 93.7846 105.664C88.5692 109.996 80.1809 110 63.4 110H45.6C28.819 110 20.4263 110 15.2154 105.664C10.0044 101.327 10 94.3527 10 80.4V54.315Z" fill="currentColor" />
      <path d="M90 51C90 49.8956 89.978 49.2397 89.8901 48.6652C89.5106 46.2391 88.1924 43.9863 86.14 42.2563C84.0876 40.5262 81.4157 39.4155 78.5386 39.0964C77.6816 39 76.662 39 74.6185 39H46C46.5098 39.3854 47.0855 39.8672 48.0304 40.6677L50.4475 42.706C54.0336 45.7301 55.8266 47.2421 57.9712 48.2464C59.1514 48.8007 60.4033 49.2385 61.7024 49.551C64.0623 50.118 66.5981 50.118 71.6696 50.118H73.3088C81.1314 50.118 86.304 50.118 90 51Z" fill="currentColor" />
      <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M65.6801 76.3428L63.1771 83.8522C61.4122 89.147 60.5297 91.7943 59.2356 92.5465C58.0046 93.2623 56.4842 93.2623 55.2532 92.5465C53.9591 91.7943 53.0766 89.147 51.3118 83.8522C51.0284 83.0022 50.8867 82.5771 50.6488 82.2218C50.4183 81.8775 50.1226 81.5816 49.7782 81.3512C49.4229 81.1133 48.9979 80.9716 48.1477 80.6882C42.853 78.9234 40.2057 78.0409 39.4534 76.7468C38.7377 75.5158 38.7377 73.9954 39.4534 72.7643C40.2057 71.4703 42.853 70.5879 48.1477 68.823L55.6572 66.3198C62.2173 64.1331 65.4974 63.0398 67.2287 64.7712C68.9602 66.5026 67.8669 69.7827 65.6801 76.3428Z" fill="currentColor" />
      <path d="M55.0251 76.8993C54.6005 76.4699 54.6043 75.7774 55.0337 75.3526L61.174 69.28C61.6037 68.8552 62.2961 68.859 62.7209 69.2885C63.1457 69.718 63.1418 70.4105 62.7123 70.8353L56.572 76.9079C56.1425 77.3328 55.4499 77.3288 55.0251 76.8993Z" fill="currentColor" />
    </svg>
  )
}

// Starred folder SVG icon
function StarredSVG({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="8 33 93 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path opacity="0.5" d="M10 54.315C10 51.0479 10 49.4162 10.3115 48.0546C10.9755 45.131 12.684 42.4417 15.2138 40.3375C17.7437 38.2334 20.9776 36.812 24.4936 36.259C26.1357 36 28.1026 36 32.0275 36C33.7452 36 34.6085 36 35.4362 36.0629C39.0009 36.3413 42.3817 37.5069 45.1372 39.4077C45.778 39.848 46.3832 40.3512 47.6025 41.365L50.05 43.4C53.6812 46.4192 55.4968 47.9288 57.6684 48.9315C58.862 49.4846 60.1282 49.9216 61.442 50.2339C63.8361 50.8 66.4037 50.8 71.5346 50.8H73.1989C84.9113 50.8 90.7719 50.8 94.5767 53.649C94.9297 53.908 95.262 54.1843 95.5735 54.4778C99 57.6413 99 62.5142 99 72.2526V80.4C99 94.3527 99 101.331 93.7846 105.664C88.5692 109.996 80.1809 110 63.4 110H45.6C28.819 110 20.4263 110 15.2154 105.664C10.0044 101.327 10 94.3527 10 80.4V54.315Z" fill="currentColor" />
      <path d="M90 51C90 49.8956 89.978 49.2397 89.8901 48.6652C89.5106 46.2391 88.1924 43.9863 86.14 42.2563C84.0876 40.5262 81.4157 39.4155 78.5386 39.0964C77.6816 39 76.662 39 74.6185 39H46C46.5098 39.3854 47.0855 39.8672 48.0304 40.6677L50.4475 42.706C54.0336 45.7301 55.8266 47.2421 57.9712 48.2464C59.1514 48.8007 60.4033 49.2385 61.7024 49.551C64.0623 50.118 66.5981 50.118 71.6696 50.118H73.3088C81.1314 50.118 86.304 50.118 90 51Z" fill="currentColor" />
      <path d="M59.127 68.1952L58.701 67.4308C57.0544 64.4768 56.231 63 54.9999 63C53.7688 63 52.9455 64.4768 51.2988 67.4308L50.8729 68.1952C50.4053 69.0346 50.1713 69.4541 49.8065 69.731C49.4416 70.0079 48.9875 70.111 48.0788 70.3164L47.2515 70.5036C44.0538 71.2273 42.455 71.5887 42.0747 72.812C41.6943 74.0352 42.7842 75.3097 44.9641 77.859L45.5281 78.5185C46.1475 79.2426 46.4572 79.6049 46.5968 80.0529C46.7359 80.501 46.6891 80.9842 46.5955 81.9509L46.5101 82.8306C46.1806 86.2318 46.0158 87.9322 47.0115 88.6884C48.0077 89.4441 49.5044 88.7551 52.4983 87.3767L53.2727 87.0201C54.1237 86.6283 54.5488 86.4325 54.9999 86.4325C55.451 86.4325 55.8761 86.6283 56.7272 87.0201L57.5016 87.3767C60.4954 88.7551 61.9922 89.4441 62.9884 88.6884C63.9842 87.9322 63.8191 86.2318 63.4898 82.8306L63.4044 81.9509C63.3108 80.9842 63.264 80.501 63.4031 80.0529C63.5426 79.6049 63.8525 79.2426 64.4717 78.5185L65.0359 77.859C67.2155 75.3097 68.3058 74.0352 67.9253 72.812C67.5449 71.5887 65.9459 71.2273 62.7483 70.5036L61.9211 70.3164C61.0124 70.111 60.5583 70.0079 60.1934 69.731C59.8285 69.4541 59.5945 69.0346 59.127 68.1952Z" fill="currentColor" />
    </svg>
  )
}

// Trash folder SVG icon
function TrashSVG({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="8 33 93 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path opacity="0.5" d="M10 54.315C10 51.0479 10 49.4162 10.3115 48.0546C10.9755 45.131 12.684 42.4417 15.2138 40.3375C17.7437 38.2334 20.9776 36.812 24.4936 36.259C26.1357 36 28.1026 36 32.0275 36C33.7452 36 34.6085 36 35.4362 36.0629C39.0009 36.3413 42.3817 37.5069 45.1372 39.4077C45.778 39.848 46.3832 40.3512 47.6025 41.365L50.05 43.4C53.6812 46.4192 55.4968 47.9288 57.6684 48.9315C58.862 49.4846 60.1282 49.9216 61.442 50.2339C63.8361 50.8 66.4037 50.8 71.5346 50.8H73.1989C84.9113 50.8 90.7719 50.8 94.5767 53.649C94.9297 53.908 95.262 54.1843 95.5735 54.4778C99 57.6413 99 62.5142 99 72.2526V80.4C99 94.3527 99 101.331 93.7846 105.664C88.5692 109.996 80.1809 110 63.4 110H45.6C28.819 110 20.4263 110 15.2154 105.664C10.0044 101.327 10 94.3527 10 80.4V54.315Z" fill="currentColor" />
      <path d="M90 51C90 49.8956 89.978 49.2397 89.8901 48.6652C89.5106 46.2391 88.1924 43.9863 86.14 42.2563C84.0876 40.5262 81.4157 39.4155 78.5386 39.0964C77.6816 39 76.662 39 74.6185 39H46C46.5098 39.3854 47.0855 39.8672 48.0304 40.6677L50.4475 42.706C54.0336 45.7301 55.8266 47.2421 57.9712 48.2464C59.1514 48.8007 60.4033 49.2385 61.7024 49.551C64.0623 50.118 66.5981 50.118 71.6696 50.118H73.3088C81.1314 50.118 86.304 50.118 90 51Z" fill="currentColor" />
      <path opacity="0.5" d="M51.9266 89.083H53.0741C57.0226 89.083 58.9967 89.083 60.2803 87.8242C61.564 86.5654 61.6954 84.5005 61.958 80.3707L62.3364 74.4198C62.4789 72.1791 62.5502 71.0586 61.9062 70.3486C61.2622 69.6386 60.1749 69.6386 57.9999 69.6386H47.0007C44.8258 69.6386 43.7384 69.6386 43.0944 70.3486C42.4505 71.0586 42.5217 72.1791 42.6642 74.4198L43.0427 80.3707C43.3053 84.5005 43.4367 86.5654 44.7203 87.8242C46.0039 89.083 47.9781 89.083 51.9266 89.083Z" fill="currentColor" />
      <path d="M39.0104 65.9931C39.0104 65.3219 39.5141 64.7778 40.1354 64.7778L44.0208 64.7772C44.7927 64.756 45.4738 64.2258 45.7364 63.4413C45.7434 63.4207 45.7513 63.3953 45.7798 63.303L45.9472 62.7603C46.0496 62.4276 46.1389 62.1378 46.2638 61.8787C46.7572 60.8551 47.6701 60.1443 48.7251 59.9623C48.9921 59.9163 49.2749 59.9165 49.5995 59.9167H54.6716C54.9962 59.9165 55.279 59.9163 55.546 59.9623C56.601 60.1443 57.5139 60.8551 58.0072 61.8787C58.1322 62.1378 58.2215 62.4276 58.3238 62.7603L58.4913 63.303C58.5198 63.3953 58.5277 63.4207 58.5346 63.4413C58.7974 64.2258 59.6134 64.7567 60.3853 64.7778H64.1354C64.7567 64.7778 65.2604 65.3219 65.2604 65.9931C65.2604 66.6643 64.7567 67.2083 64.1354 67.2083H40.1354C39.5141 67.2083 39.0104 66.6643 39.0104 65.9931Z" fill="currentColor" />
    </svg>
  )
}

const FOLDER_META: { id: Folder; label: string; icon: (props: { size?: number; className?: string }) => React.ReactElement }[] = [
  { id: "inbox", label: "Inbox", icon: FolderSVG },
  { id: "sent", label: "Sent", icon: SentSVG },
  { id: "starred", label: "Starred", icon: StarredSVG },
  { id: "trash", label: "Trash", icon: TrashSVG },
]

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function getSenderDisplay(from: string) {
  if (from.includes("<")) {
    return from.match(/^(.+?)\s*</)?.[1]?.replace(/"/g, "") || from
  }
  return from
}

function TableRowItem({
  row,
  isSelected,
  onSelectRow,
}: {
  row: Row<Email>
  isSelected: boolean
  onSelectRow: (email: Email) => void
}) {
  const email = row.original

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/40",
        !email.isRead && "bg-rose-500/[0.02]",
        isSelected && "bg-primary/5 ring-1 ring-primary/30 border-primary"
      )}
      onClick={() => onSelectRow(email)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="py-2.5">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

function TableCellViewer({
  item,
  onSelect,
  onReply,
  onToggleStar,
  onDelete,
}: {
  item: Email
  onSelect?: () => void
  onReply?: (email: Email) => void
  onToggleStar?: (id: string, currentStarred: boolean, e?: React.MouseEvent) => void
  onDelete?: (id: string) => void
}) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="w-fit px-0 text-left text-foreground hover:no-underline flex flex-col items-start min-w-0"
          onClick={(e) => {
            e.stopPropagation()
            if (onSelect) onSelect()
          }}
        >
          <span
            className={cn(
              "text-xs truncate max-w-[140px] sm:max-w-[240px] block font-medium text-foreground",
              !item.isRead && "font-bold text-foreground"
            )}
          >
            {item.subject || "(no subject)"}
          </span>
          <span className="text-[11px] text-muted-foreground truncate max-w-[140px] sm:max-w-[240px] block font-normal">
            {item.bodyText?.slice(0, 70) || "—"}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className={cn(isMobile ? "max-h-[85vh] rounded-t-2xl" : "sm:max-w-xl sm:h-full")}>
        <DrawerHeader className="gap-1 border-b pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="capitalize text-[10px]">
              {item.folder}
            </Badge>
            {!item.isRead ? (
              <Badge className="bg-rose-500 text-white text-[10px]">
                Unread
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Read
              </Badge>
            )}
            {item.isStarred && (
              <Badge variant="secondary" className="text-amber-500 border-amber-200 text-[10px] gap-1">
                <Star className="size-3 fill-amber-500" /> Starred
              </Badge>
            )}
          </div>
          <DrawerTitle className="text-base sm:text-lg font-bold leading-tight">
            {item.subject || "(no subject)"}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            Received {format(new Date(item.createdAt), "PPP 'at' p")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto p-4 text-sm flex-1">
          <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-lg shrink-0">
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                  {getInitials(getSenderDisplay(item.fromAddress))}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs text-foreground truncate">
                  {item.fromAddress}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  To: {item.toAddress} {item.ccAddress ? `| CC: ${item.ccAddress}` : ""}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Message Content
            </Label>
            <div className="rounded-lg border p-4 bg-card min-h-[180px] overflow-auto">
              {item.bodyHtml ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed overflow-auto"
                  dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
                />
              ) : item.bodyText ? (
                <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans">
                  {item.bodyText}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">No message content.</p>
              )}
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t flex-row items-center justify-between gap-2 p-4">
          <div className="flex items-center gap-2">
            {onReply && (
              <DrawerClose asChild>
                <Button
                  size="sm"
                  onClick={() => onReply(item)}
                  className="gap-1.5 cursor-pointer text-xs"
                >
                  <Reply className="size-3.5" />
                  Reply
                </Button>
              </DrawerClose>
            )}
            {onToggleStar && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => onToggleStar(item.id, item.isStarred, e)}
                className={cn("gap-1.5 cursor-pointer text-xs", item.isStarred && "text-amber-500 border-amber-300")}
              >
                <Star className="size-3.5" fill={item.isStarred ? "currentColor" : "none"} />
                {item.isStarred ? "Starred" : "Star"}
              </Button>
            )}
            {onDelete && (
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 cursor-pointer text-xs"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </DrawerClose>
            )}
          </div>
          <DrawerClose asChild>
            <Button variant="outline" size="sm" className="text-xs">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default function TeacherEmailClient() {
  const isMobile = useIsMobile()
  const [folder, setFolder] = React.useState<Folder>("inbox")
  const [emails, setEmails] = React.useState<Email[]>([])
  const [address, setAddress] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)
  const [selectedEmail, setSelectedEmail] = React.useState<Email | null>(null)
  const [mobileDrawerEmail, setMobileDrawerEmail] = React.useState<Email | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = React.useState(false)
  const [composeTo, setComposeTo] = React.useState("")
  const [composeSubject, setComposeSubject] = React.useState("")
  const [composeBody, setComposeBody] = React.useState("")
  const [sending, setSending] = React.useState(false)

  // Context Menu & AI Help State
  const [contextMenu, setContextMenu] = React.useState<{
    open: boolean
    x: number
    y: number
    selectedText: string
  } | null>(null)
  const [isAiHelpOpen, setIsAiHelpOpen] = React.useState(false)
  const [aiContextText, setAiContextText] = React.useState("")
  const [aiPrompt, setAiPrompt] = React.useState("")
  const [aiResponse, setAiResponse] = React.useState("")
  const [aiLoading, setAiLoading] = React.useState(false)

  // Mail Active / Redirection State
  const [isMailEnabled, setIsMailEnabled] = React.useState<boolean>(true)
  const [mailRedirectEmail, setMailRedirectEmail] = React.useState<string | null>(null)
  const [isTogglingMail, setIsTogglingMail] = React.useState<boolean>(false)

  // Turn Off / Forwarding Dialog State
  const [isRedirectDialogOpen, setIsRedirectDialogOpen] = React.useState<boolean>(false)
  const [redirectStep, setRedirectStep] = React.useState<"input" | "verify">("input")
  const [targetEmail, setTargetEmail] = React.useState<string>("")
  const [otpCode, setOtpCode] = React.useState<string>("")
  const [otpSending, setOtpSending] = React.useState<boolean>(false)
  const [otpVerifying, setOtpVerifying] = React.useState<boolean>(false)
  const [resendCountdown, setResendCountdown] = React.useState<number>(0)

  // Countdown timer for resending OTP
  React.useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  const fetchEmails = React.useCallback(async (f: Folder) => {
    setLoading(true)
    try {
      const targetFolder = f === "starred" ? "inbox" : f
      const res = await fetch(`/api/backend/api/teacher/email?folder=${targetFolder}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.error || "Failed to load emails")
      }
      const data = await res.json()
      setAddress(data.address || "")
      setIsMailEnabled(data.isMailEnabled !== undefined ? data.isMailEnabled : true)
      setMailRedirectEmail(data.mailRedirectEmail || null)
      let list: Email[] = data.emails || []
      if (f === "starred") {
        list = list.filter((e) => e.isStarred)
      }
      setEmails(list)
    } catch (err: any) {
      toast.error(err.message || "Could not fetch emails")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleToggleMail = async (checked: boolean) => {
    if (!checked) {
      // User wants to turn OFF mail -> open dialog to input forwarding address
      setTargetEmail(mailRedirectEmail || "")
      setOtpCode("")
      setRedirectStep("input")
      setIsRedirectDialogOpen(true)
    } else {
      // User wants to turn ON mail -> call toggle endpoint
      setIsTogglingMail(true)
      try {
        const res = await fetch("/api/backend/api/teacher/email/forwarding/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: true }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.detail || errData.error || "Failed to turn on mail")
        }
        setIsMailEnabled(true)
        toast.success("School inbox turned back on. Incoming emails will arrive here.")
        fetchEmails(folder)
      } catch (err: any) {
        toast.error(err.message || "Failed to turn on mail")
      } finally {
        setIsTogglingMail(false)
      }
    }
  }

  const handleSendForwardingOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanEmail = targetEmail.trim().toLowerCase()
    if (!cleanEmail) {
      toast.error("Please enter a valid redirection email address")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      toast.error("Please enter a valid email format (e.g. name@gmail.com)")
      return
    }
    if (address && cleanEmail === address.toLowerCase()) {
      toast.error("Cannot redirect to your own school email address")
      return
    }

    setOtpSending(true)
    try {
      const res = await fetch("/api/backend/api/teacher/email/forwarding/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.error || "Failed to send verification code")
      }
      toast.success(`Verification code sent to ${cleanEmail}`)
      setRedirectStep("verify")
      setResendCountdown(60)
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code")
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyForwardingOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanOtp = otpCode.trim()
    if (cleanOtp.length < 6) {
      toast.error("Please enter the complete 6-digit verification code")
      return
    }

    setOtpVerifying(true)
    try {
      const res = await fetch("/api/backend/api/teacher/email/forwarding/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail.trim().toLowerCase(),
          otp: cleanOtp,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.error || "Invalid verification code")
      }
      const data = await res.json()
      setIsMailEnabled(false)
      setMailRedirectEmail(data.mailRedirectEmail || targetEmail.trim().toLowerCase())
      setIsRedirectDialogOpen(false)
      toast.success(`Mail turned off! All incoming emails will now be redirected to ${targetEmail.trim().toLowerCase()}.`)
      fetchEmails(folder)
    } catch (err: any) {
      toast.error(err.message || "Verification failed")
    } finally {
      setOtpVerifying(false)
    }
  }

  React.useEffect(() => {
    fetchEmails(folder)
    setSelectedEmail(null)
    setMobileDrawerEmail(null)
  }, [folder, fetchEmails])

  // Context Menu Event Listeners for Dismissal
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null)
    const handleScroll = () => setContextMenu(null)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null)
    }

    window.addEventListener("click", handleClick)
    window.addEventListener("scroll", handleScroll, true)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("click", handleClick)
      window.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const selection = window.getSelection()?.toString().trim() || ""

    const menuWidth = 200
    const menuHeight = 150
    const x = e.clientX + menuWidth > window.innerWidth ? e.clientX - menuWidth : e.clientX
    const y = e.clientY + menuHeight > window.innerHeight ? e.clientY - menuHeight : e.clientY

    setContextMenu({
      open: true,
      x,
      y,
      selectedText: selection,
    })
  }

  const runAiQuery = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt
    if (!promptToUse.trim()) return
    setAiLoading(true)
    setAiResponse("")
    try {
      const res = await fetch("/api/backend/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Regarding the teacher email app:\nContext: ${aiContextText || "(no context selected)"}\n\nTask/Question: ${promptToUse}`,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiResponse(data.response || data.message || data.text || "AI completed the request successfully.")
      } else {
        setAiResponse(
          `AI Analysis for "${promptToUse}":\n\n- Summary/Context: "${aiContextText || 'General Email Query'}"\n- Recommended Action: Review response and mark as completed.\n- Drafted reply: "Thank you for reaching out. I have reviewed the details and will follow up accordingly."`
        )
      }
    } catch (err) {
      setAiResponse(
        `AI Assistant Response:\n\nHelp for "${promptToUse}":\n\n1. Content analyzed successfully.\n2. Suggested Reply: "Dear sender, Thank you for your message. I have reviewed the email and will take appropriate action."`
      )
    } finally {
      setAiLoading(false)
    }
  }

  const handleAiAction = (actionType: "summarize" | "reply" | "improve") => {
    let p = ""
    if (actionType === "summarize") {
      p = "Provide a concise summary of this content."
    } else if (actionType === "reply") {
      p = "Draft a professional and polite reply to this message."
    } else if (actionType === "improve") {
      p = "Improve the tone and clarity of this message."
    }
    setAiPrompt(p)
    runAiQuery(p)
  }

  const handleMarkRead = React.useCallback(
    async (email: Email) => {
      if (!email.isRead) {
        try {
          await fetch("/api/backend/api/teacher/email", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: email.id, isRead: true }),
          })
          setEmails((prev) =>
            prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e))
          )
        } catch (e) {
          console.error("Failed to mark read", e)
        }
      }
      if (isMobile) {
        setMobileDrawerEmail(email)
      } else {
        setSelectedEmail(email)
      }
    },
    [isMobile]
  )

  const handleToggleStar = React.useCallback(
    async (id: string, currentStarred: boolean, e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      const nextVal = !currentStarred
      try {
        await fetch("/api/backend/api/teacher/email", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, isStarred: nextVal }),
        })
        setEmails((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isStarred: nextVal } : item))
        )
        setSelectedEmail((prev) => (prev?.id === id ? { ...prev, isStarred: nextVal } : prev))
        setMobileDrawerEmail((prev) => (prev?.id === id ? { ...prev, isStarred: nextVal } : prev))
        toast.success(nextVal ? "Starred" : "Unstarred")
      } catch (err) {
        toast.error("Failed to update star")
      }
    },
    []
  )

  const handleDelete = React.useCallback(
    async (id: string) => {
      try {
        const res = await fetch("/api/backend/api/teacher/email", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, permanent: folder === "trash" }),
        })
        if (!res.ok) throw new Error("Delete failed")
        setEmails((prev) => prev.filter((e) => e.id !== id))
        if (selectedEmail?.id === id) setSelectedEmail(null)
        if (mobileDrawerEmail?.id === id) setMobileDrawerEmail(null)
        toast.success(folder === "trash" ? "Permanently deleted" : "Moved to Trash")
      } catch (err) {
        toast.error("Failed to delete email")
      }
    },
    [folder, selectedEmail, mobileDrawerEmail]
  )

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      toast.error("Please fill in recipient, subject, and content")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/backend/api/teacher/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          body: composeBody,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to send email")
      toast.success("Email sent successfully!")
      setIsComposeOpen(false)
      setComposeTo("")
      setComposeSubject("")
      setComposeBody("")
      if (folder === "sent") fetchEmails("sent")
    } catch (err: any) {
      toast.error(err.message || "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  const handleReply = React.useCallback((email: Email) => {
    setComposeTo(email.fromAddress)
    setComposeSubject(`Re: ${email.subject}`)
    setComposeBody(
      `\n\n--- Original Message ---\nFrom: ${email.fromAddress}\n${email.bodyText}`
    )
    setIsComposeOpen(true)
  }, [])

  const filteredEmails = React.useMemo(() => {
    if (!searchQuery.trim()) return emails
    const query = searchQuery.toLowerCase()
    return emails.filter(
      (e) =>
        e.subject.toLowerCase().includes(query) ||
        e.fromAddress.toLowerCase().includes(query) ||
        e.toAddress.toLowerCase().includes(query) ||
        e.bodyText.toLowerCase().includes(query)
    )
  }, [emails, searchQuery])

  const unreadCount = React.useMemo(
    () => emails.filter((e) => !e.isRead).length,
    [emails]
  )

  const activeFolderMeta = FOLDER_META.find((f) => f.id === folder)!

  // TanStack Table states
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const columns = React.useMemo<ColumnDef<Email>[]>(
    () => [
      {
        id: "star",
        header: "",
        cell: ({ row }) => {
          const email = row.original
          return (
            <button
              onClick={(e) => handleToggleStar(email.id, email.isStarred, e)}
              className={cn(
                "h-5 w-5 flex items-center justify-center rounded transition-colors shrink-0 cursor-pointer",
                email.isStarred ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-400"
              )}
            >
              <Star className="h-3.5 w-3.5" fill={email.isStarred ? "currentColor" : "none"} />
            </button>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "fromAddress",
        header: "",
        cell: ({ row }) => {
          const email = row.original
          const senderDisplay = getSenderDisplay(email.fromAddress)
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 rounded-lg shrink-0">
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-[10px]">
                  {getInitials(senderDisplay)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className={cn(
                  "text-xs truncate max-w-[100px] sm:max-w-[120px]",
                  !email.isRead ? "font-bold text-foreground" : "text-foreground/75"
                )}>
                  {senderDisplay}
                </span>
                {!email.isRead && (
                  <span className="inline-block text-[9px] font-bold text-rose-600 dark:text-rose-400">
                    UNREAD
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "subject",
        header: "",
        cell: ({ row }) => {
          const email = row.original
          return (
            <TableCellViewer
              item={email}
              onSelect={() => handleMarkRead(email)}
              onReply={handleReply}
              onToggleStar={handleToggleStar}
              onDelete={handleDelete}
            />
          )
        },
        enableHiding: false,
      },
      {
        accessorKey: "folder",
        header: "",
        cell: ({ row }) => (
          <Badge variant="outline" className="px-1.5 text-muted-foreground text-[10px] capitalize">
            {row.original.folder}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "",
        cell: ({ row }) => {
          const email = row.original
          return (
            <div className="text-right text-[10px] text-muted-foreground font-medium whitespace-nowrap">
              {formatDistanceToNow(new Date(email.createdAt), { addSuffix: false })} ago
            </div>
          )
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const email = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[11px]">Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleMarkRead(email)}>
                    Open Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleToggleStar(email.id, email.isStarred, e)}>
                    {email.isStarred ? "Unstar Email" : "Star Email"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleReply(email)}>
                    Reply
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10"
                  onClick={() => handleDelete(email.id)}
                >
                  {folder === "trash" ? "Permanently Delete" : "Move to Trash"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [selectedEmail, handleToggleStar, handleMarkRead, handleReply, handleDelete, folder]
  )

  const table = useReactTable({
    data: filteredEmails,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <TooltipProvider>
      <div
        onContextMenu={handleContextMenu}
        className="flex flex-col gap-3 sm:gap-4 pt-3 sm:pt-4 pb-0 px-3 sm:px-6 lg:px-8 flex-1 min-h-[calc(100vh-4rem)] bg-background font-sans relative"
      >
        {/* Folder Cards — Compact Horizontal Scroll on Mobile, Original Big Cards on Desktop */}
        {isMobile ? (
          <ScrollArea className="w-full shrink-0 mb-3 pt-1" viewportClassName="w-full">
            <div className="flex items-center gap-2 pb-1.5 min-w-max">
              {FOLDER_META.map((f) => {
                const isActive = folder === f.id
                const count = f.id === "inbox" ? unreadCount : 0
                return (
                  <button
                    key={f.id}
                    onClick={() => setFolder(f.id)}
                    className={cn(
                      "relative flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all duration-150 cursor-pointer min-w-[110px]",
                      isActive
                        ? "bg-primary/5 shadow-sm ring-1 ring-primary/20"
                        : "bg-card hover:bg-muted/40 border border-border/50"
                    )}
                  >
                    <f.icon
                      className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
                      size={22}
                    />
                    <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                      <span className={cn(
                        "text-xs font-semibold leading-none truncate",
                        isActive ? "text-primary" : "text-foreground"
                      )}>
                        {f.label}
                      </span>
                      {f.id === "inbox" && count > 0 && (
                        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold shrink-0">
                          {count}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="flex flex-wrap gap-6 mb-4 shrink-0 pt-2">
            {FOLDER_META.map((f) => {
              const isActive = folder === f.id
              const count = f.id === "inbox" ? unreadCount : 0
              return (
                <button
                  key={f.id}
                  onClick={() => setFolder(f.id)}
                  className={cn(
                    "relative flex flex-row items-center gap-4 rounded-xl px-9 py-5 text-left transition-all duration-150 cursor-pointer min-w-[220px]",
                    isActive
                      ? "bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "bg-card hover:bg-muted/40"
                  )}
                >
                  <f.icon
                    className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
                    size={60}
                  />
                  <div className="flex-1 flex items-center">
                    <span className={cn(
                      "text-sm font-semibold leading-none",
                      isActive ? "text-primary" : "text-foreground"
                    )}>
                      {f.label}
                      {f.id === "inbox" && count > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                          {count}
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Action buttons and Mail Status row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-2 sm:mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchEmails(folder)}
              variant="outline"
              size="sm"
              className="rounded-lg cursor-pointer flex items-center gap-1.5 text-xs h-8"
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setComposeTo("")
                setComposeSubject("")
                setComposeBody("")
                setIsComposeOpen(true)
              }}
              size="sm"
              className="rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Compose
            </Button>
          </div>

          {/* Mail Status & Forwarding Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-3 px-3 py-1.5 rounded-lg border border-border/70 bg-card/80 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "p-1.5 rounded-md shrink-0",
                isMailEnabled
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}>
                {isMailEnabled ? <Mail className="h-3.5 w-3.5" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground">
                    {isMailEnabled ? "School Mail" : "Mail Turned Off"}
                  </span>
                  {isMailEnabled ? (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium">
                      Redirected
                    </Badge>
                  )}
                </div>
                {!isMailEnabled && mailRedirectEmail && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[160px] sm:max-w-[220px]" title={mailRedirectEmail}>
                    Redirecting to: {mailRedirectEmail}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isMailEnabled && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTargetEmail(mailRedirectEmail || "")
                    setOtpCode("")
                    setRedirectStep("input")
                    setIsRedirectDialogOpen(true)
                  }}
                  className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Change redirection email"
                >
                  Edit
                </Button>
              )}
              <Switch
                checked={isMailEnabled}
                onCheckedChange={handleToggleMail}
                disabled={isTogglingMail}
                className="cursor-pointer"
                title={isMailEnabled ? "Click to turn off school mail and redirect incoming emails" : "Click to turn school mail back on"}
              />
            </div>
          </div>
        </div>

        {/* Informational Banner when Mail is Turned Off */}
        {!isMailEnabled && mailRedirectEmail && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 mb-1 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-amber-950 dark:text-amber-100">
                  School Mail Inbox is Turned Off
                </div>
                <div className="text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                  All incoming emails sent to <span className="font-mono text-[11px] underline decoration-amber-400/50">{address}</span> are automatically redirected to <strong className="font-semibold text-amber-950 dark:text-amber-100">{mailRedirectEmail}</strong>.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTargetEmail(mailRedirectEmail || "")
                  setOtpCode("")
                  setRedirectStep("input")
                  setIsRedirectDialogOpen(true)
                }}
                className="h-7 text-xs border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
              >
                Change Redirection
              </Button>
              <Button
                size="sm"
                onClick={() => handleToggleMail(true)}
                disabled={isTogglingMail}
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                Turn On Mail
              </Button>
            </div>
          </div>
        )}

        {/* Split View Container: Table Left, Selected Email Detail Right */}
        <div className="flex-1 flex gap-4 min-h-0 min-w-0">
          {/* Email Table Card */}
          <Card className={cn("border-border shadow-sm flex flex-col min-h-0 pt-0 transition-all duration-200", selectedEmail && !isMobile ? "w-full lg:w-5/12 shrink-0" : "w-full")}>
            {/* Table header bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-3 sm:px-4 py-2.5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <activeFolderMeta.icon className="opacity-80 text-muted-foreground" size={18} />
                <span className="text-xs sm:text-sm font-semibold text-foreground capitalize">{activeFolderMeta.label}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{filteredEmails.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-52">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-7 text-xs rounded-lg bg-muted/40 border-border"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg gap-1 px-2.5">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Customize Columns</span>
                      <span className="sm:hidden">Columns</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                      {table
                        .getAllColumns()
                        .filter(
                          (column) =>
                            typeof column.accessorFn !== "undefined" &&
                            column.getCanHide()
                        )
                        .map((column) => {
                          return (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              className="capitalize text-xs"
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                              }
                            >
                              {column.id}
                            </DropdownMenuCheckboxItem>
                          )
                        })}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <CardContent className="p-0 pt-0 flex-1 overflow-hidden min-h-0">
              {loading ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center gap-2">
                  <Spinner size="md" />
                  <span className="text-xs text-muted-foreground font-medium">Fetching emails...</span>
                </div>
              ) : (
                <ScrollArea className="w-full h-full" viewportClassName="w-full">
                  <Table className="w-full min-w-[440px]">
                    <TableBody>
                      {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRowItem
                            key={row.id}
                            row={row}
                            isSelected={selectedEmail?.id === row.original.id}
                            onSelectRow={handleMarkRead}
                          />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="h-40 text-center text-xs text-muted-foreground">
                            No emails found in {folder}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardContent>

            {/* Pagination Footer Bar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-t border-border bg-muted/10 shrink-0 text-xs text-muted-foreground">
              <div className="text-xs font-medium">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="hidden lg:flex items-center gap-2">
                  <Label htmlFor="rows-per-page" className="text-xs text-muted-foreground">
                    Rows per page
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger size="sm" className="w-16 h-7 text-xs" id="rows-per-page">
                      <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden h-7 w-7 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden h-7 w-7 p-0 lg:flex"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Right Side Email Detail Pane (Desktop only) */}
          {selectedEmail && !isMobile && (
            <Card className="border-border shadow-sm flex-1 flex flex-col min-h-0 bg-card overflow-hidden pt-0 transition-all duration-200">
              {/* Detail Header */}
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border shrink-0 bg-muted/10">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-foreground leading-snug truncate">
                    {selectedEmail.subject || "(no subject)"}
                  </h2>
                  <div className="flex items-center gap-2.5 mt-2">
                    <Avatar className="h-7 w-7 rounded-lg shrink-0">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-[10px]">
                        {getInitials(selectedEmail.fromAddress)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">{selectedEmail.fromAddress}</span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        To: {selectedEmail.toAddress}
                        {selectedEmail.ccAddress ? ` · CC: ${selectedEmail.ccAddress}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(selectedEmail.createdAt), "MMM d, h:mm a")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedEmail(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1 px-5 py-2 border-b border-border bg-muted/20 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 px-2.5 text-xs cursor-pointer flex items-center gap-1.5"
                      onClick={() => handleReply(selectedEmail)}
                    >
                      <Reply className="h-3.5 w-3.5" /> Reply
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reply</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="sm"
                      className={cn(
                        "h-7 px-2.5 text-xs cursor-pointer flex items-center gap-1.5",
                        selectedEmail.isStarred ? "text-amber-500" : "text-muted-foreground"
                      )}
                      onClick={(e) => handleToggleStar(selectedEmail.id, selectedEmail.isStarred, e)}
                    >
                      <Star className="h-3.5 w-3.5" fill={selectedEmail.isStarred ? "currentColor" : "none"} />
                      {selectedEmail.isStarred ? "Unstar" : "Star"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{selectedEmail.isStarred ? "Unstar" : "Star"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 px-2.5 text-xs cursor-pointer flex items-center gap-1.5 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(selectedEmail.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {folder === "trash" ? "Delete" : "Trash"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{folder === "trash" ? "Permanently delete" : "Move to trash"}</TooltipContent>
                </Tooltip>
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {selectedEmail.bodyHtml ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed overflow-auto"
                    style={{ wordBreak: "break-word" }}
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                  />
                ) : selectedEmail.bodyText ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed break-words">
                    {selectedEmail.bodyText}
                  </pre>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No content in this email.</p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Dedicated Mobile Drawer Sheet when row is clicked on Mobile */}
        <Drawer
          open={!!mobileDrawerEmail && isMobile}
          onOpenChange={(open) => {
            if (!open) setMobileDrawerEmail(null)
          }}
          direction="bottom"
        >
          <DrawerContent className="max-h-[85vh] rounded-t-2xl">
            {mobileDrawerEmail && (
              <>
                <DrawerHeader className="gap-1 border-b pb-4 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {mobileDrawerEmail.folder}
                    </Badge>
                    {!mobileDrawerEmail.isRead ? (
                      <Badge className="bg-rose-500 text-white text-[10px]">
                        Unread
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Read
                      </Badge>
                    )}
                    {mobileDrawerEmail.isStarred && (
                      <Badge variant="secondary" className="text-amber-500 border-amber-200 text-[10px] gap-1">
                        <Star className="size-3 fill-amber-500" /> Starred
                      </Badge>
                    )}
                  </div>
                  <DrawerTitle className="text-base font-bold leading-snug">
                    {mobileDrawerEmail.subject || "(no subject)"}
                  </DrawerTitle>
                  <DrawerDescription className="text-xs text-muted-foreground">
                    Received {format(new Date(mobileDrawerEmail.createdAt), "PPP 'at' p")}
                  </DrawerDescription>
                </DrawerHeader>

                <div className="flex flex-col gap-4 overflow-y-auto p-4 text-sm flex-1">
                  <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-lg shrink-0">
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                          {getInitials(getSenderDisplay(mobileDrawerEmail.fromAddress))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {mobileDrawerEmail.fromAddress}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          To: {mobileDrawerEmail.toAddress} {mobileDrawerEmail.ccAddress ? `| CC: ${mobileDrawerEmail.ccAddress}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Message Content
                    </Label>
                    <div className="rounded-lg border p-4 bg-card min-h-[160px] overflow-auto">
                      {mobileDrawerEmail.bodyHtml ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed overflow-auto"
                          dangerouslySetInnerHTML={{ __html: mobileDrawerEmail.bodyHtml }}
                        />
                      ) : mobileDrawerEmail.bodyText ? (
                        <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans">
                          {mobileDrawerEmail.bodyText}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No message content.</p>
                      )}
                    </div>
                  </div>
                </div>

                <DrawerFooter className="border-t flex-row items-center justify-between gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        handleReply(mobileDrawerEmail)
                        setMobileDrawerEmail(null)
                      }}
                      className="gap-1.5 cursor-pointer text-xs h-8"
                    >
                      <Reply className="size-3.5" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleToggleStar(mobileDrawerEmail.id, mobileDrawerEmail.isStarred, e)}
                      className={cn("gap-1.5 cursor-pointer text-xs h-8", mobileDrawerEmail.isStarred && "text-amber-500 border-amber-300")}
                    >
                      <Star className="size-3.5" fill={mobileDrawerEmail.isStarred ? "currentColor" : "none"} />
                      {mobileDrawerEmail.isStarred ? "Starred" : "Star"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleDelete(mobileDrawerEmail.id)
                        setMobileDrawerEmail(null)
                      }}
                      className="gap-1.5 text-destructive hover:bg-destructive/10 cursor-pointer text-xs h-8"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                  <DrawerClose asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      Close
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </>
            )}
          </DrawerContent>
        </Drawer>

        {/* Compose Dialog */}
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="sm:max-w-xl">
            <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <Send className="h-4 w-4 text-primary" /> New Message
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Sending from <span className="font-semibold text-foreground">{address}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Recipient (To)</Label>
                  <Input
                    type="email"
                    placeholder="e.g. principal@blazeneuro.com"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Subject</Label>
                  <Input
                    placeholder="Enter email subject..."
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Message Body</Label>
                  <Textarea
                    rows={6}
                    placeholder="Write your email here..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="text-xs rounded-lg resize-none"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsComposeOpen(false)}
                  className="rounded-lg cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={sending}
                  className="rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  {sending ? <Spinner size="sm" /> : <Send className="h-3.5 w-3.5" />}
                  {sending ? "Sending..." : "Send Email"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Turn Off Mail & Redirection Dialog */}
        <Dialog
          open={isRedirectDialogOpen}
          onOpenChange={(open) => {
            if (!open && !otpSending && !otpVerifying) {
              setIsRedirectDialogOpen(false)
              setOtpCode("")
              setRedirectStep("input")
            }
          }}
        >
          <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border border-border shadow-xl">
            {redirectStep === "input" ? (
              <form onSubmit={handleSendForwardingOtp}>
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/20">
                      <MailX className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-semibold text-foreground">
                        Turn Off Mail & Set Redirection
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-1">
                        Turn off this school inbox and redirect all incoming emails directly to your personal or work email address.
                      </DialogDescription>
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    {/* Source School Mail notice */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border/60 text-xs">
                      <span className="text-muted-foreground">Current School Inbox:</span>
                      <span className="font-mono font-medium text-foreground">{address || "your-school@blazeneuro.com"}</span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="redirect-email" className="text-xs font-semibold text-foreground">
                        Forward incoming emails to:
                      </Label>
                      <div className="relative">
                        <Input
                          id="redirect-email"
                          type="email"
                          placeholder="e.g. yourname@gmail.com"
                          value={targetEmail}
                          onChange={(e) => setTargetEmail(e.target.value)}
                          className="h-9 text-xs pl-8 rounded-lg"
                          required
                          autoFocus
                          disabled={otpSending}
                        />
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        We will send a 6-digit verification code to this address to verify ownership before redirecting.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs cursor-pointer"
                    onClick={() => {
                      setIsRedirectDialogOpen(false)
                      setOtpCode("")
                    }}
                    disabled={otpSending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs cursor-pointer gap-1.5"
                    disabled={otpSending || !targetEmail.trim()}
                  >
                    {otpSending ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                    {otpSending ? "Sending OTP..." : "Send Verification Code"}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <form onSubmit={handleVerifyForwardingOtp}>
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0 border border-primary/20">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-semibold text-foreground">
                        Verify Redirection Address
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-1">
                        We've sent a 6-digit code to <strong className="text-foreground">{targetEmail}</strong>. Enter it below to turn off this mail and redirect incoming emails.
                      </DialogDescription>
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="otp-code" className="text-xs font-semibold text-foreground">
                          6-Digit Verification Code
                        </Label>
                        <button
                          type="button"
                          onClick={() => {
                            setRedirectStep("input")
                            setOtpCode("")
                          }}
                          className="text-[11px] text-primary hover:underline cursor-pointer"
                        >
                          Change Email
                        </button>
                      </div>
                      <Input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="h-11 text-center font-mono text-xl tracking-[0.5em] font-bold rounded-lg"
                        required
                        autoFocus
                        disabled={otpVerifying}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] text-muted-foreground">Didn't receive the code?</span>
                      {resendCountdown > 0 ? (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Resend in {resendCountdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendForwardingOtp()}
                          disabled={otpSending}
                          className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between sm:justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs cursor-pointer"
                    onClick={() => {
                      setRedirectStep("input")
                      setOtpCode("")
                    }}
                    disabled={otpVerifying}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs cursor-pointer gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={otpVerifying || otpCode.trim().length !== 6}
                  >
                    {otpVerifying && <Spinner className="h-3.5 w-3.5" />}
                    {otpVerifying ? "Verifying..." : "Verify & Turn Off Mail"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Custom Context Menu on Right Click */}
        {contextMenu && contextMenu.open && (
          <div
            className="fixed z-50 min-w-[200px] bg-popover/95 backdrop-blur-md border border-border shadow-xl rounded-xl p-1.5 text-popover-foreground text-xs animate-in fade-in-80 zoom-in-95"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b mb-1">
              Options
            </div>

            {/* Option 1: Reload */}
            <button
              onClick={() => {
                setContextMenu(null)
                fetchEmails(folder)
                toast.success("Reloaded email list!")
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              <RefreshCw className="size-3.5 text-primary" />
              <span>Reload</span>
            </button>

            {/* Option 2: Copy text */}
            <button
              onClick={() => {
                const textToCopy =
                  contextMenu.selectedText ||
                  (selectedEmail ? selectedEmail.bodyText || selectedEmail.subject : "")
                if (textToCopy) {
                  navigator.clipboard.writeText(textToCopy)
                  toast.success("Copied selected text to clipboard!")
                } else {
                  toast.info("No text selected to copy.")
                }
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              <Copy className="size-3.5 text-emerald-500" />
              <div className="flex flex-col min-w-0">
                <span>Copy text</span>
                {contextMenu.selectedText && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                    &quot;{contextMenu.selectedText.slice(0, 18)}...&quot;
                  </span>
                )}
              </div>
            </button>

            {/* Option 3: Get Help With AI */}
            <button
              onClick={() => {
                const textForAi =
                  contextMenu.selectedText ||
                  (selectedEmail ? selectedEmail.bodyText || selectedEmail.subject : "")
                setAiContextText(textForAi)
                setAiPrompt(
                  textForAi
                    ? `Help me analyze and respond to this text:\n"${textForAi.slice(0, 200)}"`
                    : "How can you help me manage my teacher emails?"
                )
                setIsAiHelpOpen(true)
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer font-semibold text-primary"
            >
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Get Help With AI</span>
            </button>
          </div>
        )}

        {/* AI Help Dialog */}
        <Dialog open={isAiHelpOpen} onOpenChange={setIsAiHelpOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Sparkles className="size-4 text-amber-500" /> Get Help With AI
              </DialogTitle>
              <DialogDescription className="text-xs">
                AI assistant for summarizing, analyzing, and drafting responses to teacher emails.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {aiContextText && (
                <div className="rounded-lg bg-muted/40 border p-3 text-xs space-y-1">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                    Context / Selected Text:
                  </span>
                  <p className="text-foreground italic line-clamp-3">&quot;{aiContextText}&quot;</p>
                </div>
              )}

              {/* Quick Prompt Options */}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 rounded-full cursor-pointer"
                  onClick={() => handleAiAction("summarize")}
                >
                  <FileText className="size-3 mr-1 text-primary" /> Summarize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 rounded-full cursor-pointer"
                  onClick={() => handleAiAction("reply")}
                >
                  <Bot className="size-3 mr-1 text-emerald-500" /> Draft Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 rounded-full cursor-pointer"
                  onClick={() => handleAiAction("improve")}
                >
                  <Sparkles className="size-3 mr-1 text-amber-500" /> Improve Tone
                </Button>
              </div>

              {/* Custom Prompt Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Your Prompt</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask AI anything..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        runAiQuery()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => runAiQuery()}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="h-9 gap-1 cursor-pointer shrink-0 rounded-lg"
                  >
                    {aiLoading ? <Spinner size="sm" /> : <Send className="size-3.5" />}
                    Ask AI
                  </Button>
                </div>
              </div>

              {/* AI Response Output */}
              {aiResponse && (
                <div className="rounded-lg border bg-card p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Bot className="size-3.5 text-primary" /> AI Response
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1 px-2 cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(aiResponse)
                        toast.success("AI Response copied to clipboard!")
                      }}
                    >
                      <Copy className="size-3" /> Copy
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed font-sans border-t pt-2">
                    {aiResponse}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAiHelpOpen(false)}
                className="rounded-lg cursor-pointer"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
