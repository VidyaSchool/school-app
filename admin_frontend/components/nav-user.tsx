"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSession, authClient, logoutUser } from "@/lib/auth-client"
import { useTheme } from "@/components/theme-provider"
import { EllipsisVerticalIcon, CircleUserRoundIcon, BellIcon, LogOutIcon, SunIcon } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { setTheme } = useTheme()
  const { data: session, isPending } = useSession()
  const [fetchedUser, setFetchedUser] = React.useState<any>(null)
  const [username, setUsername] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch('/api/account')
      .then(res => {
        if (!res.ok) return null
        return res.json()
      })
      .then(data => {
        if (data?.user) {
          setFetchedUser(data.user)
          if (data.profile?.username) {
            setUsername(data.profile.username)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const currentUser = session?.user || fetchedUser

  if (isPending && loading && !currentUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2.5 px-2 py-1.5 w-full">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0 animate-pulse bg-muted-foreground/20" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-20 rounded animate-pulse bg-muted-foreground/20" />
              <Skeleton className="h-2 w-32 rounded animate-pulse bg-muted-foreground/20" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!currentUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/login">Sign In</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const user = currentUser

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

  const accountUrl = user.role === 'admin'
    ? (username ? `/admin/${username}/account` : '/admin')
    : (user.role === 'teacher' || user.role === 'librarian')
    ? (username ? `/teacher/${username}/account` : '/teacher')
    : (username ? `/student/${username}/account` : '/student')

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
                <span className="truncate text-xs text-muted-foreground capitalize">
                  {user.role}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={accountUrl} className="flex items-center cursor-pointer">
                  <CircleUserRoundIcon />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <SunIcon />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      System
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuItem>
                <BellIcon
                />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOutIcon
              />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
