"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronUp, ChevronDown, Maximize2, Plus, Type, Pen, Ruler, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

const TASKS_STORAGE_KEY = "student_dashboard_tasks"
const SCRATCHPAD_STORAGE_KEY = "student_dashboard_scratchpad"

const DEFAULT_TASKS = [
  { id: "1", label: "Submit Chemistry Lab report", completed: false },
  { id: "2", label: "Read Chapter 4 of History textbook", completed: true },
  { id: "3", label: "Solve Mathematics worksheet 3", completed: false },
  { id: "4", label: "Prepare for Spanish vocabulary quiz", completed: false },
]

export function StudentWidgets() {
  const [tasks, setTasks] = React.useState<Array<{ id: string; label: string; completed: boolean }>>(DEFAULT_TASKS)
  const [scratchText, setScratchText] = React.useState("")
  const [isLoaded, setIsLoaded] = React.useState(false)

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [newTaskLabel, setNewTaskLabel] = React.useState("")
  const [activeTool, setActiveTool] = React.useState<"text" | "pen" | "ruler">("text")

  // Load from localStorage on client mount
  React.useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY)
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks))
      }
      const savedScratch = localStorage.getItem(SCRATCHPAD_STORAGE_KEY)
      if (savedScratch !== null) {
        setScratchText(savedScratch)
      }
    } catch (e) {
      // Fallback to defaults
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save tasks to localStorage
  React.useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
      } catch (e) {}
    }
  }, [tasks, isLoaded])

  // Save scratchpad text to localStorage
  React.useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SCRATCHPAD_STORAGE_KEY, scratchText)
      } catch (e) {}
    }
  }, [scratchText, isLoaded])

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskLabel.trim()) {
      setTasks(prev => [
        ...prev,
        { id: String(Date.now()), label: newTaskLabel.trim(), completed: false }
      ])
      setNewTaskLabel("")
      setIsAddOpen(false)
    }
  }

  const moveTask = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= tasks.length) return
    const newTasks = [...tasks]
    const temp = newTasks[index]
    newTasks[index] = newTasks[targetIndex]
    newTasks[targetIndex] = temp
    setTasks(newTasks)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 lg:px-6">
      {/* Tasks Card */}
      <div className="rounded-2xl bg-zinc-100 dark:bg-[#121212] p-5 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base leading-snug font-medium text-foreground">
            Tasks
          </h2>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <button
                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Add Task"
              >
                <Plus className="size-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md flex flex-col p-6 bg-white dark:bg-[#1c1c1e] border-zinc-200 dark:border-zinc-800 text-foreground rounded-2xl">
              <DialogTitle className="font-heading text-lg font-medium text-foreground mb-4">
                Add New Task
              </DialogTitle>
              <form onSubmit={handleAddTaskSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800/60 flex-1 overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-8 text-center text-xs text-muted-foreground">
              No tasks added yet. Click "+" to create a task!
            </div>
          ) : (
            tasks.map((task, index) => (
              <div key={task.id} className="flex items-center justify-between group py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Checkbox
                    id={task.id}
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="size-4.5 border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground cursor-pointer"
                  />
                  <label
                    htmlFor={task.id}
                    className={`text-base font-normal leading-tight cursor-pointer select-none transition-colors duration-150 truncate flex-1 ${
                      task.completed ? "line-through text-muted-foreground/80" : "text-foreground"
                    }`}
                  >
                    {task.label}
                  </label>
                </div>

                {/* Task controls */}
                <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                  <button
                    onClick={() => moveTask(index, "up")}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Move Up"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    onClick={() => moveTask(index, "down")}
                    disabled={index === tasks.length - 1}
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Move Down"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scratch Pad Card */}
      <div className="rounded-2xl bg-zinc-100 dark:bg-[#121212] p-5 flex flex-col min-h-[300px] relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base leading-snug font-medium text-foreground">
            Scratch Pad
          </h2>
          
          {/* Full Screen Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Maximize2 className="size-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-6 bg-zinc-900 border-zinc-800 text-white rounded-2xl">
              <DialogTitle className="font-heading text-lg font-medium text-white mb-2">
                Scratch Pad (Full Screen)
              </DialogTitle>
              <textarea
                value={scratchText}
                onChange={(e) => setScratchText(e.target.value)}
                placeholder="Start writing..."
                className="w-full flex-1 bg-transparent border-0 resize-none outline-none focus:ring-0 text-base font-light text-zinc-100 placeholder:text-zinc-500 leading-relaxed mt-2"
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1 flex flex-col">
          <textarea
            value={scratchText}
            onChange={(e) => setScratchText(e.target.value)}
            placeholder="Jot down quick thoughts here..."
            className="w-full flex-1 bg-transparent border-0 resize-none outline-none focus:ring-0 text-sm font-light text-foreground placeholder:text-muted-foreground/60 leading-relaxed scrollbar-none pb-14"
          />
        </div>

        {/* Floating Toolbar */}
        <TooltipProvider delayDuration={200}>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-full shadow-md z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTool("text")}
                  className={cn(
                    "p-1.5 rounded-full transition-all duration-150 cursor-pointer",
                    activeTool === "text"
                      ? "bg-zinc-100 dark:bg-zinc-800 text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <Type className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs py-1 px-2">
                Text Tool
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTool("pen")}
                  className={cn(
                    "p-1.5 rounded-full transition-all duration-150 cursor-pointer",
                    activeTool === "pen"
                      ? "bg-zinc-100 dark:bg-zinc-800 text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <Pen className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs py-1 px-2">
                Pen Tool
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTool("ruler")}
                  className={cn(
                    "p-1.5 rounded-full transition-all duration-150 cursor-pointer",
                    activeTool === "ruler"
                      ? "bg-zinc-100 dark:bg-zinc-800 text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <Ruler className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs py-1 px-2">
                Ruler Tool
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
