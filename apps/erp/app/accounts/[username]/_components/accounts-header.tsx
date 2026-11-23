"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, Calendar } from "lucide-react"

export function AccountsHeader() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          FY 2024-25
        </Button>
      </div>
      <Button variant="ghost" size="icon">
        <Bell className="h-4 w-4" />
      </Button>
    </div>
  )
}
