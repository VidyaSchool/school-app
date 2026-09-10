"use client"

import { useSession, logoutUser } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function UserCard() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  const handleSignOut = async () => {
    await logoutUser()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={session.user.image || undefined} alt={session.user.name} />
        <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        className="shrink-0"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
