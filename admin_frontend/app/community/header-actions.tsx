"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Users } from "lucide-react"

interface CommunityHeaderActionsProps {
  connected: boolean
  onToggleMembers: () => void
}

export function CommunityHeaderActions({ connected, onToggleMembers }: CommunityHeaderActionsProps) {
  return (
    <div className="flex items-center gap-3">
      {connected ? (
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5">
          <Wifi className="h-3 w-3" />
          Online
        </Badge>
      ) : (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5 animate-pulse">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleMembers}
        title="Toggle member list"
      >
        <Users className="h-5 w-5" />
      </Button>
    </div>
  )
}
