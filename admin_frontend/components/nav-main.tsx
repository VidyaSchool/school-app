"use client"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AlertTriangle, CirclePlusIcon, MailIcon, Send } from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"
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

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    hasNotification?: boolean
  }[]
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1 pl-1">
          {items.map((item) => {
            const isActive = (() => {
              if (!pathname) return false
              if (pathname === item.url) return true
              const isDashboardRoot = /^\/(student|teacher|admin)(?:\/[^/]+)?$/.test(item.url)
              if (isDashboardRoot) return false
              return pathname.startsWith(item.url + '/')
            })()
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  isActive={isActive}
                  className={cn(
                    "transition-all duration-150 font-medium h-9 rounded-xl pl-2",
                    isActive 
                      ? "bg-sidebar-foreground/5! text-foreground! border-none! shadow-none" 
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40"
                  )}
                >
                  <Link 
                    href={item.url} 
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false)
                      }
                    }}
                    className="relative flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative flex shrink-0">
                        {item.icon}
                        {item.hasNotification && (
                          <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-blue-500 ring-1 ring-sidebar dark:ring-sidebar" />
                        )}
                      </div>
                      <span>{item.title}</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function NavFooterActions() {
  const router = useRouter()
  return (
    <div className="flex items-center gap-2 px-3 py-2 w-full">
      <Button
        className="w-full h-9 rounded-xl border border-border bg-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground justify-start px-3 text-xs gap-2 font-medium"
        variant="outline"
        onClick={() => {
          router.push("/community")
        }}
      >
        <MailIcon className="size-4 shrink-0" />
        <span>Inbox</span>
      </Button>
    </div>
  )
}
