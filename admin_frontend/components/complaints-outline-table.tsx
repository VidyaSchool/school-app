"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
import { io, type Socket } from "socket.io-client"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  GripVerticalIcon,
  CircleCheckIcon,
  LoaderIcon,
  EllipsisVerticalIcon,
  Columns3Icon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  FileText,
  Download,
  CheckCircle2,
} from "lucide-react"

interface Complaint {
  id: string
  userId: string
  title: string
  recipient: string
  taggedPeople: string | null
  message: string
  fileUrl: string | null
  fileName: string | null
  status: "pending" | "resolved"
  sortOrder: number
  createdAt: string
  updatedAt: string
  senderName: string
  senderEmail: string
  senderRole: string
}

export const complaintRowSchema = z.object({
  id: z.string(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
  complaint: z.custom<Complaint>(),
})

type ComplaintRow = z.infer<typeof complaintRowSchema>

const TAB_CONFIG = [
  {
    value: "developer",
    label: "Developer",
    recipient: "Tech Support (Admin)",
  },
  {
    value: "principal",
    label: "Principal",
    recipient: "Principal (Admin)",
  },
  {
    value: "vice-principal",
    label: "Vice-Principal",
    recipient: "Vice-Principal (Admin)",
  },
  {
    value: "coordinator",
    label: "Coordinator",
    recipient: "Academic Coordinator (Admin)",
  },
] as const

type TabValue = (typeof TAB_CONFIG)[number]["value"]

function formatStatus(status: Complaint["status"]) {
  return status === "resolved" ? "Done" : "In Process"
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function complaintToRow(comp: Complaint): ComplaintRow {
  return {
    id: comp.id,
    header: comp.title,
    type: comp.recipient,
    status: formatStatus(comp.status),
    target: comp.senderRole,
    limit: formatDate(comp.createdAt),
    reviewer: comp.senderName || "Unknown",
    complaint: comp,
  }
}

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const createColumns = (onRefresh: () => void): ColumnDef<ComplaintRow>[] => [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: "Title",
    cell: ({ row }) => (
      <ComplaintCellViewer item={row.original} onResolved={onRefresh} />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Recipient",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.type.replace(" (Admin)", "")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {row.original.status === "Done" ? (
          <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
        ) : (
          <LoaderIcon />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "target",
    header: () => <div className="w-full text-right">Role</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm capitalize text-muted-foreground">
        {row.original.target}
      </div>
    ),
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-full text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm text-muted-foreground">
        {row.original.limit}
      </div>
    ),
  },
  {
    accessorKey: "reviewer",
    header: "Reporter",
    cell: ({ row }) => row.original.reviewer,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ComplaintActions complaint={row.original.complaint} onResolved={onRefresh} />
    ),
  },
]

function ComplaintActions({
  complaint,
  onResolved,
}: {
  complaint: Complaint
  onResolved?: () => void
}) {
  const handleResolve = async () => {
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: complaint.id, status: "resolved" }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast.success("Complaint marked as resolved")
      onResolved?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resolve complaint"
      toast.error(message)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
          size="icon"
        >
          <EllipsisVerticalIcon />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {complaint.status === "pending" && (
          <>
            <DropdownMenuItem onClick={handleResolve}>
              Mark as Resolved
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {complaint.fileUrl && (
          <DropdownMenuItem asChild>
            <a href={complaint.fileUrl} download={complaint.fileName || "attachment"}>
              Download File
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DraggableRow({ row }: { row: Row<ComplaintRow> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

function ComplaintsTable({
  data,
  onDragEnd,
  onRefresh,
}: {
  data: ComplaintRow[]
  onDragEnd: (event: DragEndEvent) => void
  onRefresh: () => void
}) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data.map(({ id }) => id),
    [data]
  )

  const columns = React.useMemo(() => createColumns(onRefresh), [onRefresh])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
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
    <>
      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No complaints found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export function ComplaintsOutlineTable() {
  const [complaints, setComplaints] = React.useState<Complaint[]>([])
  const [activeTab, setActiveTab] = React.useState<TabValue>("developer")
  const [loading, setLoading] = React.useState(true)
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const fetchComplaints = React.useCallback(async () => {
    try {
      const res = await fetch("/api/complaints?role=admin")
      if (!res.ok) throw new Error("Failed to fetch complaints")
      const data = await res.json()
      if (Array.isArray(data)) {
        setComplaints(data)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load complaints"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])

  React.useEffect(() => {
    const socket: Socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
      { transports: ["websocket", "polling"] }
    )

    socket.on("complaint_created", () => fetchComplaints())
    socket.on("complaint_updated", () => fetchComplaints())
    socket.on("complaint_reordered", () => fetchComplaints())

    return () => {
      socket.disconnect()
    }
  }, [fetchComplaints])

  const tabCounts = React.useMemo(() => {
    const counts: Record<TabValue, number> = {
      developer: 0,
      principal: 0,
      "vice-principal": 0,
      coordinator: 0,
    }
    for (const tab of TAB_CONFIG) {
      counts[tab.value] = complaints.filter(
        (c) => c.recipient === tab.recipient && c.status === "pending"
      ).length
    }
    return counts
  }, [complaints])

  const filteredComplaints = React.useMemo(() => {
    const tab = TAB_CONFIG.find((t) => t.value === activeTab)
    if (!tab) return []
    return complaints
      .filter((c) => c.recipient === tab.recipient)
      .sort((a, b) => a.sortOrder - b.sortOrder || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [complaints, activeTab])

  const tableData = React.useMemo(
    () => filteredComplaints.map(complaintToRow),
    [filteredComplaints]
  )

  const saveOrder = React.useCallback(async (orderedIds: string[]) => {
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      })
      if (!res.ok) throw new Error("Failed to save order")
      toast.success("Complaint order saved")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save order"
      toast.error(message)
      fetchComplaints()
    }
  }, [fetchComplaints])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!active || !over || active.id === over.id) return

    const oldIndex = tableData.findIndex((row) => row.id === active.id)
    const newIndex = tableData.findIndex((row) => row.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(tableData, oldIndex, newIndex)
    const orderedIds = reordered.map((row) => row.id)

    setComplaints((prev) => {
      const tab = TAB_CONFIG.find((t) => t.value === activeTab)
      if (!tab) return prev

      const otherComplaints = prev.filter((c) => c.recipient !== tab.recipient)
      const updatedTabComplaints = reordered.map((row, index) => ({
        ...row.complaint,
        sortOrder: index,
      }))

      return [...otherComplaints, ...updatedTabComplaints]
    })

    saveOrder(orderedIds)
  }

  const tableForColumns = useReactTable({
    data: tableData,
    columns: createColumns(fetchComplaints),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as TabValue)}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TAB_CONFIG.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {tabCounts[tab.value] > 0 && (
                <Badge variant="secondary">{tabCounts[tab.value]}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon data-icon="inline-start" />
                Columns
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {tableForColumns
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {TAB_CONFIG.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          {loading ? (
            <div className="flex h-24 items-center justify-center rounded-lg border text-sm text-muted-foreground">
              Loading complaints...
            </div>
          ) : (
            <ComplaintsTable
              data={tableData}
              onDragEnd={handleDragEnd}
              onRefresh={fetchComplaints}
            />
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}

function ComplaintCellViewer({
  item,
  onResolved,
}: {
  item: ComplaintRow
  onResolved?: () => void
}) {
  const isMobile = useIsMobile()
  const comp = item.complaint

  const handleResolve = async () => {
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: comp.id, status: "resolved" }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast.success("Complaint marked as resolved")
      onResolved?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resolve complaint"
      toast.error(message)
    }
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{comp.title}</DrawerTitle>
          <DrawerDescription>
            Filed on{" "}
            {new Date(comp.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            • Recipient: {comp.recipient}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={
                comp.status === "pending"
                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              }
            >
              {comp.status === "pending" ? "In Process" : "Done"}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {comp.senderRole}
            </Badge>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">
              Reported by {comp.senderName} ({comp.senderEmail})
            </p>
            {comp.taggedPeople && (
              <p className="text-xs text-muted-foreground">
                Tagged: {comp.taggedPeople}
              </p>
            )}
          </div>
          <p className="leading-relaxed whitespace-pre-wrap text-foreground/90">
            {comp.message}
          </p>
          {comp.fileUrl && (
            <>
              <Separator />
              <div className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card/65 p-3">
                <FileText className="h-5 w-5 shrink-0 text-rose-500" />
                <div className="flex min-w-0 flex-col pr-2">
                  <span className="max-w-[200px] truncate text-xs font-semibold text-foreground sm:max-w-[400px]">
                    {comp.fileName || "Attachment"}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Reference File
                  </span>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <a href={comp.fileUrl} download={comp.fileName || "attachment"}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
        <DrawerFooter>
          {comp.status === "pending" && (
            <Button
              onClick={handleResolve}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-500"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark as Resolved
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
