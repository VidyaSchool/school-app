"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CirclePlusIcon, Send } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export function HeaderComplaintButton() {
  const { data: session } = useSession()
  const [complaintOpen, setComplaintOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [, startTransition] = React.useTransition()

  // Form states
  const [recipient, setRecipient] = React.useState("Teacher")
  const [title, setTitle] = React.useState("")
  const [taggedPeople, setTaggedPeople] = React.useState("")
  const [message, setMessage] = React.useState("")

  // Autocomplete states
  const [users, setUsers] = React.useState<{ name: string; username: string; role: string }[]>([])
  const [showAutocomplete, setShowAutocomplete] = React.useState(false)
  const [searchVal, setSearchVal] = React.useState("")

  React.useEffect(() => {
    if (!searchVal) {
      setUsers([])
      return
    }
    const controller = new AbortController()
    fetch(`/api/backend/api/users/search?q=${encodeURIComponent(searchVal)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data)
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [searchVal])

  const handleInputChange = (val: string) => {
    setTaggedPeople(val)
    
    // Find if we are typing a tag
    const words = val.split(/[\s,]+/)
    const lastWord = words[words.length - 1]
    
    if (lastWord.startsWith("@")) {
      const query = lastWord.slice(1)
      setSearchVal(query)
      setShowAutocomplete(true)
    } else {
      setShowAutocomplete(false)
      setUsers([])
    }
  }

  const selectUser = (username: string) => {
    const words = taggedPeople.split(",").map(w => w.trim()).filter(Boolean)
    if (words.length > 0) {
      const lastIndex = words.length - 1
      if (words[lastIndex].startsWith("@")) {
        words[lastIndex] = "@" + username
      } else {
        words.push("@" + username)
      }
    } else {
      words.push("@" + username)
    }
    const newValue = words.join(", ") + ", "
    setTaggedPeople(newValue)
    setShowAutocomplete(false)
    setUsers([])
  }

  const userRole = session?.user?.role || "student"
  const isStudent = userRole === "student"

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide a title and a description message.")
      return
    }

    setIsSubmitting(true)
    const tId = toast.loading(`Filing complaint with ${recipient}...`)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("recipient", recipient)
      formData.append("taggedPeople", taggedPeople)
      formData.append("message", message)

      const res = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to submit complaint")
      }

      toast.dismiss(tId)
      toast.success(`Your complaint has been sent to ${recipient}`)
      setIsSubmitting(false)
      setComplaintOpen(false)
      
      // Reset form
      setTitle("")
      setTaggedPeople("")
      setMessage("")
    } catch (err: any) {
      toast.dismiss(tId)
      toast.error(err.message || "Failed to file complaint")
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => startTransition(() => setComplaintOpen(true))}
        variant="outline" 
        size="sm" 
        className="h-7 text-[11px] gap-1.5 border-zinc-200/80 dark:border-zinc-800 bg-background hover:bg-muted text-foreground font-medium rounded-lg px-2.5 shadow-none transition-colors"
      >
        <CirclePlusIcon className="size-3.5 text-muted-foreground" />
        File a Complaint
      </Button>

      {/* Dialog: File a Complaint */}
      <Dialog open={complaintOpen} onOpenChange={(open) => startTransition(() => setComplaintOpen(open))}>
        {complaintOpen && (
          <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> File a Complaint
            </DialogTitle>
            <DialogDescription>
              Submit an issue or escalation. It will be routed directly to the selected authority.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleComplaintSubmit} className="space-y-4 pt-2">
            <div className="grid gap-1.5">
              <Label htmlFor="dest">Who to send to</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger id="dest" className="w-full text-xs">
                  <SelectValue placeholder="Select Recipient" />
                </SelectTrigger>
                <SelectContent>
                  {isStudent ? (
                    <>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Librarian">Librarian</SelectItem>
                      <SelectItem value="Tech Support (Admin)">Tech Support (Admin)</SelectItem>
                      <SelectItem value="Principal (Admin)">Principal (Admin)</SelectItem>
                      <SelectItem value="Vice-Principal (Admin)">Vice-Principal (Admin)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Academic Coordinator (Admin)">Academic Coordinator (Admin)</SelectItem>
                      <SelectItem value="Tech Support (Admin)">Tech Support (Admin)</SelectItem>
                      <SelectItem value="Principal (Admin)">Principal (Admin)</SelectItem>
                      <SelectItem value="Vice-Principal (Admin)">Vice-Principal (Admin)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="compTitle">Complaint Title</Label>
              <Input
                id="compTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smartboard in classroom 10-A not turning on"
                required
              />
            </div>

            <div className="grid gap-1.5 relative">
              <Label htmlFor="compTag">Tag People (Optional)</Label>
              <Input
                id="compTag"
                value={taggedPeople}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Type @ to search and tag people..."
                autoComplete="off"
              />
              {showAutocomplete && users.length > 0 && (
                <div className="absolute top-[100%] left-0 right-0 z-50 mt-1 max-h-[160px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-hidden animate-in fade-in-50 zoom-in-95">
                  {users.map((u) => (
                    <div
                      key={u.username}
                      onClick={() => selectUser(u.username)}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2.5 py-2 text-xs outline-hidden hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{u.name}</span>
                        <span className="text-[10px] text-muted-foreground">@{u.username} • {u.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="compMsg">Message Box</Label>
              <textarea
                id="compMsg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe the issue or complaint in detail..."
                required
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 outline-hidden"
              />
            </div>



            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setComplaintOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" className="gap-1.5" disabled={isSubmitting}>
                <Send className="size-3.5" /> Complain
              </Button>
            </DialogFooter>
          </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
