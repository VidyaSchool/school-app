"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Widget2Icon } from "@solar-icons/react/outline/widget-2"
import { SquareAcademicCap2Icon } from "@solar-icons/react/outline/square-academic-cap-2"
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/outline/users-group-two-rounded"
import { GitPullRequestIcon } from "@solar-icons/react/outline/git-pull-request"
import { DangerTriangleIcon } from "@solar-icons/react/outline/danger-triangle"
import { BellIcon } from "@solar-icons/react/outline/bell"
import { CameraIcon } from "@solar-icons/react/outline/camera"
import { GalleryIcon } from "@solar-icons/react/outline/gallery"
import { CalendarIcon } from "@solar-icons/react/outline/calendar"
import { SettingsMinimalisticIcon } from "@solar-icons/react/outline/settings-minimalistic"
import { QuestionCircleIcon } from "@solar-icons/react/outline/question-circle"
import { MagnifierIcon } from "@solar-icons/react/outline/magnifier"
import { UserCircleIcon } from "@solar-icons/react/outline/user-circle"
import { Sun2Icon } from "@solar-icons/react/outline/sun-2"
import { MoonIcon } from "@solar-icons/react/outline/moon"
import { LaptopIcon } from "@solar-icons/react/outline/laptop"
import { Logout2Icon } from "@solar-icons/react/outline/logout-2"
import { ChevronsUpDownIcon } from "@solar-icons/react/outline/chevrons-up-down"
import { logoutUser } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { toast } from "sonner"

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    username?: string | null
  }
}

const RESERVED_ADMIN_ROUTES = new Set([
  "students",
  "teacher",
  "requests",
  "complaints",
  "notice",
  "slider",
  "gallery",
  "page-builder",
  "admins",
  "account",
  "fee-management",
])

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()
  const [isCommandOpen, setIsCommandOpen] = React.useState(false)
  const { setTheme } = useTheme()

  // Extract username synchronously: prioritizes user prop, then URL pathname
  const username = React.useMemo(() => {
    if (user?.username) return user.username
    if (!pathname) return ""
    const parts = pathname.split("/").filter(Boolean)
    if (parts[0] === "admin" && parts[1] && !RESERVED_ADMIN_ROUTES.has(parts[1])) {
      return parts[1]
    }
    return ""
  }, [pathname, user?.username])

  const base = username ? `/admin/${username}` : "/admin"
  const accountUrl = `${base}/account`

  // Fixed admin navigation items — zero async fetching or dynamic loading
  const navMain = React.useMemo(
    () => [
      {
        title: "Dashboard",
        url: base,
        icon: <Widget2Icon className="size-5 shrink-0" />,
      },
      {
        title: "Students",
        url: `${base}/students`,
        icon: <SquareAcademicCap2Icon className="size-5 shrink-0" />,
      },
      {
        title: "Teachers",
        url: `${base}/teacher`,
        icon: <UsersGroupTwoRoundedIcon className="size-5 shrink-0" />,
      },
      {
        title: "Timetable Rescheduling",
        url: "/timetable/absences",
        icon: <CalendarIcon className="size-5 shrink-0" />,
      },
      {
        title: "Requests",
        url: `${base}/requests`,
        icon: <GitPullRequestIcon className="size-5 shrink-0" />,
      },
      /* {
        title: "Fee Management",
        url: `${base}/fee-management`,
        icon: <DatabaseIcon className="size-5 shrink-0" />,
      }, */
      {
        title: "Complaints",
        url: `${base}/complaints`,
        icon: <DangerTriangleIcon className="size-5 shrink-0" />,
      },
      {
        title: "Notices",
        url: `${base}/notice`,
        icon: <BellIcon className="size-5 shrink-0" />,
      },
      {
        title: "Slider Banners",
        url: `${base}/slider`,
        icon: <CameraIcon className="size-5 shrink-0" />,
      },
      {
        title: "Gallery",
        url: `${base}/gallery`,
        icon: <GalleryIcon className="size-5 shrink-0" />,
      },
      {
        title: "Page Builder",
        url: `${base}/page-builder`,
        icon: <Widget2Icon className="size-5 shrink-0" />,
      },
    ],
    [base]
  )

  const navSecondary = React.useMemo(
    () => [
      {
        title: "Sessions",
        url: "/login-accounts",
        icon: <SettingsMinimalisticIcon className="size-5 shrink-0" />,
      },
      {
        title: "Get Help",
        url: "https://beta.blazeneuro.com/docs",
        icon: <QuestionCircleIcon className="size-5 shrink-0" />,
      },
    ],
    []
  )

  const displayName = user?.name || "Admin"
  const displayEmail = user?.email || ""

  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "AD"
    )
  }

  // Global search shortcut listener for Cmd+F / Ctrl+F
  React.useEffect(() => {
    const handleSearchShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === "f") {
        e.preventDefault()
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            code: "KeyK",
            ctrlKey: true,
            metaKey: true,
            bubbles: true,
            cancelable: true,
          })
        )
      }
    }

    window.addEventListener("keydown", handleSearchShortcut)
    return () => window.removeEventListener("keydown", handleSearchShortcut)
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-3 flex flex-col gap-5">
        <div className="flex flex-col gap-5">
          {/* User Card Dropdown */}
          <Popover open={isCommandOpen} onOpenChange={setIsCommandOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => setIsCommandOpen(true)}
                className="group w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer focus:outline-none"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.image || undefined} alt={displayName} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 block size-2 rounded-full bg-green-500 ring-2 ring-sidebar dark:ring-[#1c1c1e]" />
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="truncate text-sm font-semibold text-foreground leading-tight">
                    {displayName}
                  </span>
                </div>
                <ChevronsUpDownIcon className="size-3.5 text-muted-foreground/60 shrink-0 group-hover:text-muted-foreground transition-colors" />
              </button>
            </PopoverTrigger>

            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0 overflow-hidden bg-white dark:bg-[#141414] border border-zinc-200/70 dark:border-zinc-800/70 rounded-xl shadow-xl"
              align="start"
              sideOffset={6}
            >
              {/* User info header */}
              <div className="flex items-center gap-3 px-3.5 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
                <Avatar className="h-9 w-9 rounded-lg shrink-0">
                  <AvatarImage src={user?.image || undefined} alt={displayName} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate leading-snug">
                    {displayName}
                  </span>
                  {displayEmail && (
                    <span className="text-[11px] text-muted-foreground truncate leading-snug">
                      {displayEmail}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setIsCommandOpen(false)
                    router.push(accountUrl)
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <UserCircleIcon className="size-4 text-muted-foreground shrink-0" />
                  Account Settings
                </button>
                <button
                  onClick={() => {
                    setIsCommandOpen(false)
                    router.push(`${base}/notice`)
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <BellIcon className="size-4 text-muted-foreground shrink-0" />
                  Notifications
                </button>
              </div>

              {/* Theme section */}
              <div className="px-1.5 pb-1.5">
                <div className="px-2.5 pt-1 pb-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Theme
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: "Light", value: "light" as const, icon: <Sun2Icon className="size-3.5" /> },
                    { label: "Dark", value: "dark" as const, icon: <MoonIcon className="size-3.5" /> },
                    { label: "System", value: "system" as const, icon: <LaptopIcon className="size-3.5" /> },
                  ].map(({ label, value, icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setTheme(value)
                        setIsCommandOpen(false)
                        toast.success(`Theme: ${label}`)
                      }}
                      className="flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-foreground transition-colors cursor-pointer"
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider + Log Out */}
              <div className="border-t border-zinc-100 dark:border-zinc-800/60 p-1.5 space-y-0.5">
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2.5 px-2.5 cursor-pointer"
                  onClick={async () => {
                    setIsCommandOpen(false)
                    await logoutUser()
                  }}
                >
                  <Logout2Icon className="size-4 shrink-0" />
                  Log Out
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Quick Search Button */}
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("open-vidya-search"))
              }
              if (isMobile) {
                setOpenMobile(false)
              }
            }}
            className="w-full h-9 flex items-center justify-between px-3 py-1.5 rounded-xl border border-border/80 bg-sidebar-foreground/5 hover:bg-sidebar-foreground/10 text-muted-foreground transition-all duration-150 text-xs cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <MagnifierIcon className="size-4.5 shrink-0 text-muted-foreground/80" />
              <span className="text-muted-foreground/80 font-normal">Quick Search</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-border bg-transparent dark:bg-transparent px-1.5 font-mono text-[9px] font-medium text-muted-foreground/60 shadow-none">
              <span>⌘</span><span>F</span>
            </kbd>
          </button>
          <div className="h-px bg-sidebar-border/60 w-full" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="px-2 pt-0 pb-1.5">
        <div className="flex items-center justify-start gap-1 text-[10px] text-muted-foreground/80 font-normal w-full pl-1.5">
          <span>© {new Date().getFullYear()} VidyaSchool</span>
          <span>•</span>
          <a href="/docs/terms-of-service" className="hover:text-foreground hover:underline transition-colors">Terms</a>
          <span>•</span>
          <a href="/docs/privacy-policy" className="hover:text-foreground hover:underline transition-colors">Privacy</a>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
