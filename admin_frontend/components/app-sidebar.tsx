"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { OnboardingAlert } from "@/components/onboarding-alert"
import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarSeparator,
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
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon, BookOpenIcon, GraduationCapIcon, BellIcon, GitPullRequest, MessageSquare, AlertTriangle, MoonIcon, CircleUserRoundIcon, ChevronsUpDown, SunIcon, Laptop, ChevronRight, LogOut, CalendarIcon, NotebookPenIcon, Trophy, Mail, Terminal } from "lucide-react"
import { useSession, signOut, logoutUser } from "@/lib/auth-client"
import { io } from "socket.io-client"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Smartphone, Download, Plus } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { toast } from "sonner"

// Module-level username cache — fetched once per page load, shared across all hooks
let _cachedUsername: string | null = null
let _usernameFetchPromise: Promise<string | null> | null = null

function fetchUsernameOnce(): Promise<string | null> {
  if (_cachedUsername !== null) return Promise.resolve(_cachedUsername)
  if (_usernameFetchPromise) return _usernameFetchPromise
  _usernameFetchPromise = fetch('/api/profile/username')
    .then(res => res.json())
    .then(data => {
      _cachedUsername = data.username ?? null
      return _cachedUsername
    })
    .catch(() => { _cachedUsername = null; return null })
  return _usernameFetchPromise
}

// Single shared hook — extracts username from URL or fetches from API
function useProfileUsername(): string | null {
  const pathname = usePathname()
  const [username, setUsername] = React.useState<string | null>(() => {
    if (_cachedUsername) return _cachedUsername
    if (pathname) {
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length >= 2 && ['student', 'teacher', 'admin', 'librarian', 'accounts'].includes(parts[0])) {
        return parts[1]
      }
    }
    return null
  })

  React.useEffect(() => {
    fetchUsernameOnce().then(u => {
      if (u) {
        _cachedUsername = u
        setUsername(u)
      }
    })
  }, [pathname])

  return username
}

// Derived URL builders — computed from the single username value
function buildStudentUrls(username: string | null) {
  const base = username ? `/student/${username}` : '/student'
  return {
    dashboard: base, fees: `${base}/fees`, library: `${base}/library`,
    marks: `${base}/marks`, notice: `${base}/notice`, account: `${base}/account`,
    leaderboard: `${base}/leaderboard`,
  }
}
function buildTeacherUrls(username: string | null) {
  const base = username ? `/teacher/${username}` : '/teacher'
  return {
    dashboard: base, class: `${base}/class`, subjects: `${base}/subjects`,
    requests: `${base}/requests`, notice: `${base}/notice`, account: `${base}/account`,
    timetable: `${base}/timetable`, notes: `${base}/notes`, email: `${base}/email`,
  }
}
function buildLibrarianUrls(username: string | null) {
  const base = username ? `/librarian/${username}` : '/librarian'
  return {
    dashboard: base, books: `${base}/books`, borrowings: `${base}/borrowings`,
    notice: `${base}/notice`, account: `${base}/account`,
  }
}
function buildAdminUrls(username: string | null) {
  const base = username ? `/admin/${username}` : '/admin'
  return {
    dashboard: base, students: `${base}/students`, teachers: `${base}/teacher`,
    requests: `${base}/requests`, feeManagement: `${base}/fee-management`,
    notices: `${base}/notice`, slider: `${base}/slider`, pageBuilder: `${base}/page-builder`,
    developer: `${base}/developer`,
  }
}
function buildAccountUrls(username: string | null) {
  const base = username ? `/accounts/${username}` : '/accounts'
  return {
    dashboard: base, fees: `${base}/fees`, structures: `${base}/structures`,
    payments: `${base}/payments`, expenses: `${base}/expenses`, income: `${base}/income`,
    payroll: `${base}/payroll`, ledgers: `${base}/ledgers`, banks: `${base}/banks`,
    invoices: `${base}/invoices`, receipts: `${base}/receipts`, refunds: `${base}/refunds`,
    scholarships: `${base}/scholarships`, reports: `${base}/reports`, settings: `${base}/settings`,
  }
}

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/student",
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
    {
      title: "Fees",
      url: "/student/fees",
      icon: (
        <DatabaseIcon
        />
      ),
    },
    {
      title: "Library",
      url: "/student/library",
      icon: (
        <BookOpenIcon
        />
      ),
    },
    {
      title: "Notes",
      url: "/student/notes",
      icon: (
        <NotebookPenIcon
        />
      ),
    },
    {
      title: "Marks",
      url: "/student/marks",
      icon: (
        <GraduationCapIcon
        />
      ),
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: (
        <CameraIcon
        />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: (
        <FileTextIcon
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: (
        <FileTextIcon
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Sessions",
      url: "/login-accounts",
      icon: (
        <Settings2Icon
        />
      ),
    },
    {
      title: "Get Help",
      url: "/docs",
      icon: (
        <CircleHelpIcon
        />
      ),
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: (
        <DatabaseIcon
        />
      ),
    },
    {
      name: "Reports",
      url: "#",
      icon: (
        <FileChartColumnIcon
        />
      ),
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: (
        <FileIcon
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { isMobile, setOpenMobile } = useSidebar()
  const [profileLoading, setProfileLoading] = React.useState(true)
  const [isQrOpen, setIsQrOpen] = React.useState(false)
  const [appVersion, setAppVersion] = React.useState<string>("v1.0.52")
  const [downloadUrl, setDownloadUrl] = React.useState<string>(
    "https://github.com/ankit-blazeneuro/vidyaschool/releases/download/v1.0.52/app-debug.apk"
  )

  const [fetchedUser, setFetchedUser] = React.useState<any>(null)

  React.useEffect(() => {
    fetch('/api/account')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) setFetchedUser(data.user)
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    fetch('/api/profile/username')
      .then(() => setProfileLoading(false))
      .catch(() => setProfileLoading(false))

    fetch('https://api.github.com/repos/ankit-blazeneuro/vidyaschool/releases/latest')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch latest release')
        return res.json()
      })
      .then(data => {
        if (data.tag_name) {
          setAppVersion(data.tag_name)
          const apkAsset = data.assets?.find((asset: any) => asset.name?.endsWith('.apk'))
          if (apkAsset?.browser_download_url) {
            setDownloadUrl(apkAsset.browser_download_url)
          } else {
            setDownloadUrl(`https://github.com/ankit-blazeneuro/vidyaschool/releases/download/${data.tag_name}/app-debug.apk`)
          }
        }
      })
      .catch(() => {})
  }, [])

  const userToDisplay = session?.user || fetchedUser
  const isLoading = (isPending && !fetchedUser) || profileLoading
  const userRole = userToDisplay?.role || session?.user?.role
  
  const isLibrarian = userRole === "librarian" || (userRole === undefined && pathname?.startsWith("/librarian"))
  const isTeacher = userRole === "teacher" || (userRole === undefined && pathname?.startsWith("/teacher"))
  const isAdmin = userRole === "admin" || (userRole === undefined && pathname?.startsWith("/admin"))
  const isAccount = userRole === "account" || (userRole === undefined && pathname?.startsWith("/accounts"))
  
  // Single fetch — shared by all URL builders via module-level cache
  const profileUsername = useProfileUsername()

  const adminUrls = React.useMemo(() => buildAdminUrls(profileUsername), [profileUsername])
  const accountUrls = React.useMemo(() => buildAccountUrls(profileUsername), [profileUsername])
  const urls = React.useMemo(() => buildStudentUrls(profileUsername), [profileUsername])
  const teacherUrls = React.useMemo(() => buildTeacherUrls(profileUsername), [profileUsername])
  const librarianUrls = React.useMemo(() => buildLibrarianUrls(profileUsername), [profileUsername])

  const [isCommandOpen, setIsCommandOpen] = React.useState(false)
  const [commandSearch, setCommandSearch] = React.useState("")
  const [isThemeHovered, setIsThemeHovered] = React.useState(false)
  const { setTheme } = useTheme()

  const accountUrl = userRole === 'admin'
    ? (profileUsername ? `/admin/${profileUsername}/account` : '/admin')
    : (userRole === 'teacher' || userRole === 'librarian')
    ? (profileUsername ? `/teacher/${profileUsername}/account` : '/teacher')
    : (profileUsername ? `/student/${profileUsername}/account` : '/student')

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const currentRoleValue = isTeacher
    ? "teacher"
    : isLibrarian
    ? "librarian"
    : isAdmin
    ? "admin"
    : isAccount
    ? "account"
    : "student"

  const handleRoleChange = (role: string) => {
    let targetUrl = "/student"
    if (role === "teacher") targetUrl = teacherUrls.dashboard
    else if (role === "librarian") targetUrl = librarianUrls.dashboard
    else if (role === "admin") targetUrl = adminUrls.dashboard
    else if (role === "account") targetUrl = accountUrls.dashboard
    else targetUrl = urls.dashboard

    router.push(targetUrl)
  }

  // Notification states
  const [unreadCommunity, setUnreadCommunity] = React.useState(false)
  const [unreadRequests, setUnreadRequests] = React.useState(false)
  const [unreadNotices, setUnreadNotices] = React.useState(false)
  const [unreadComplaints, setUnreadComplaints] = React.useState(false)

  // AI Chats State for Teacher
  const [teacherChats, setTeacherChats] = React.useState<{ id: string; title: string }[]>([])

  const loadTeacherChats = React.useCallback(async () => {
    try {
      const res = await fetch("/api/backend/api/chats")
      if (res.ok) {
        const data = await res.json()
        setTeacherChats(data.map((c: any) => ({ id: c.id, title: c.title })))
      }
    } catch (e) {
      console.error("Failed to load chats from backend:", e)
    }
  }, [])

  React.useEffect(() => {
    if (!isTeacher) return
    loadTeacherChats()

    // Listen for chat changes
    window.addEventListener("vidya_chats_updated", loadTeacherChats)
    return () => {
      window.removeEventListener("vidya_chats_updated", loadTeacherChats)
    }
  }, [isTeacher, loadTeacherChats])

  // Clear notifications when visiting pages
  React.useEffect(() => {
    if (!pathname) return
    if (pathname === "/community") {
      setUnreadCommunity(false)
    }
    if (pathname.includes("/requests")) {
      setUnreadRequests(false)
    }
    if (pathname.includes("/notice")) {
      setUnreadNotices(false)
    }
    if (pathname.includes("/complaints")) {
      setUnreadComplaints(false)
    }
  }, [pathname])

  // Keep a ref to pathname so socket handlers always see the latest value
  // without needing pathname in the dep array (which would reconnect on every nav)
  const pathnameRef = React.useRef(pathname)
  React.useEffect(() => { pathnameRef.current = pathname }, [pathname])

  // Fetch initial pending status on mount and connect to Socket.IO
  // Deps: session + role flags only — NOT pathname, so socket stays alive across navigations
  React.useEffect(() => {
    if (!session?.user) return

    // 1. Fetch complaints status
    const roleParam = isTeacher || isLibrarian ? "teacher" : isAdmin ? "admin" : ""
    if (roleParam) {
      fetch(`/api/complaints?role=${roleParam}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const hasPending = data.some(c => c.status === "pending")
            setUnreadComplaints(hasPending)
          }
        })
        .catch(() => {})
    }

    // 2. Fetch admin requests status
    if (isAdmin) {
      fetch('/api/admin/requests')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const hasPending = data.some((r: any) => r.status === "pending")
            setUnreadRequests(hasPending)
          }
        })
        .catch(() => {})
    }

    // 3. Setup Socket.IO — single persistent connection, reads pathname via ref
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000", {
      transports: ["websocket", "polling"]
    })

    socket.on("new_message", () => {
      if (pathnameRef.current !== "/community") {
        setUnreadCommunity(true)
      }
    })

    socket.on("teacher_request_created", () => {
      if (isAdmin && !pathnameRef.current?.includes("/requests")) {
        setUnreadRequests(true)
      }
    })

    socket.on("complaint_created", () => {
      if ((isAdmin || isTeacher) && !pathnameRef.current?.includes("/complaints")) {
        setUnreadComplaints(true)
      }
    })

    return () => {
      socket.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, isTeacher, isAdmin, isLibrarian])

  // Trigger simulated new notice dot
  React.useEffect(() => {
    if (pathname?.includes("/notice")) {
      setUnreadNotices(false)
      return
    }
    const timer = setTimeout(() => {
      setUnreadNotices(true)
    }, 12000)
    return () => clearTimeout(timer)
  }, [pathname])

  // Global search shortcut listener for Cmd+F / Ctrl+F
  React.useEffect(() => {
    const handleSearchShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === "f") {
        e.preventDefault()
        const event = new KeyboardEvent("keydown", {
          key: "k",
          code: "KeyK",
          ctrlKey: true,
          metaKey: true,
          bubbles: true,
          cancelable: true,
        })
        window.dispatchEvent(event)
      }
    }

    window.addEventListener("keydown", handleSearchShortcut)
    return () => window.removeEventListener("keydown", handleSearchShortcut)
  }, [])

  const baseNavMain = isAccount
    ? [
        {
          title: "Dashboard",
          url: accountUrls.dashboard,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "Student Fees",
          url: accountUrls.fees,
          icon: <UsersIcon />,
        },
        {
          title: "Fee Structures",
          url: accountUrls.structures,
          icon: <FileTextIcon />,
        },
        {
          title: "Payments",
          url: accountUrls.payments,
          icon: <DatabaseIcon />,
        },
        {
          title: "Expenses",
          url: accountUrls.expenses,
          icon: <FileChartColumnIcon />,
        },
        {
          title: "Income",
          url: accountUrls.income,
          icon: <ChartBarIcon />,
        },
        {
          title: "Payroll",
          url: accountUrls.payroll,
          icon: <UsersIcon />,
        },
        {
          title: "Ledgers",
          url: accountUrls.ledgers,
          icon: <BookOpenIcon />,
        },
        {
          title: "Bank Accounts",
          url: accountUrls.banks,
          icon: <DatabaseIcon />,
        },
        {
          title: "Invoices",
          url: accountUrls.invoices,
          icon: <FileTextIcon />,
        },
        {
          title: "Receipts",
          url: accountUrls.receipts,
          icon: <FileIcon />,
        },
        {
          title: "Refunds",
          url: accountUrls.refunds,
          icon: <CircleHelpIcon />,
        },
        {
          title: "Scholarships",
          url: accountUrls.scholarships,
          icon: <GraduationCapIcon />,
        },
        {
          title: "Reports",
          url: accountUrls.reports,
          icon: <FileChartColumnIcon />,
        },
        {
          title: "Settings",
          url: accountUrls.settings,
          icon: <Settings2Icon />,
        },
      ]
    : isLibrarian
    ? [
        {
          title: "Dashboard",
          url: librarianUrls.dashboard,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "Manage Books",
          url: librarianUrls.books,
          icon: <BookOpenIcon />,
        },
        {
          title: "Book Issues",
          url: librarianUrls.borrowings,
          icon: <GitPullRequest />,
        },
        {
          title: "Notices",
          url: librarianUrls.notice,
          icon: <BellIcon />,
          hasNotification: unreadNotices,
        },
        {
          title: "Community Chat",
          url: "/community",
          icon: <MessageSquare />,
          hasNotification: unreadCommunity,
        },
      ]
    : isTeacher
    ? [
        {
          title: "Dashboard",
          url: teacherUrls.dashboard,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "My Class",
          url: teacherUrls.class,
          icon: <UsersIcon />,
        },
        {
          title: "Timetable",
          url: teacherUrls.timetable,
          icon: <CalendarIcon />,
        },
        {
          title: "Email",
          url: teacherUrls.email,
          icon: <Mail />,
        },
        {
          title: "Notes",
          url: teacherUrls.notes,
          icon: <NotebookPenIcon />,
        },
        {
          title: "Subject Class",
          url: teacherUrls.subjects,
          icon: <BookOpenIcon />,
        },
        {
          title: "Requests",
          url: teacherUrls.requests,
          icon: <GitPullRequest />,
          hasNotification: unreadRequests,
        },
        {
          title: "Notices",
          url: teacherUrls.notice,
          icon: <BellIcon />,
          hasNotification: unreadNotices,
        },
        {
          title: "Community Chat",
          url: "/community",
          icon: <MessageSquare />,
          hasNotification: unreadCommunity,
        },
        {
          title: "Complaints",
          url: `${teacherUrls.dashboard}/complaints`,
          icon: <AlertTriangle />,
          hasNotification: unreadComplaints,
        },
      ]
    : isAdmin
    ? [
        {
          title: "Dashboard",
          url: adminUrls.dashboard,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "Students",
          url: adminUrls.students,
          icon: <GraduationCapIcon />,
        },
        {
          title: "Teachers",
          url: adminUrls.teachers,
          icon: <UsersIcon />,
        },
        {
          title: "Requests",
          url: adminUrls.requests,
          icon: <GitPullRequest />,
          hasNotification: unreadRequests,
        },
        {
          title: "Fee Management",
          url: adminUrls.feeManagement,
          icon: <DatabaseIcon />,
        },
        {
          title: "Community Chat",
          url: "/community",
          icon: <MessageSquare />,
          hasNotification: unreadCommunity,
        },
        {
          title: "Complaints",
          url: `${adminUrls.dashboard}/complaints`,
          icon: <AlertTriangle />,
          hasNotification: unreadComplaints,
        },
        {
          title: "Notices",
          url: adminUrls.notices,
          icon: <BellIcon />,
          hasNotification: unreadNotices,
        },
        {
          title: "Slider Banners",
          url: adminUrls.slider,
          icon: <CameraIcon />,
        },
        {
          title: "Page Builder",
          url: adminUrls.pageBuilder,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "Developer Console",
          url: adminUrls.developer,
          icon: <Terminal />,
        },
      ]
    : [
        {
          title: "Dashboard",
          url: urls.dashboard,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "Leaderboard",
          url: urls.leaderboard,
          icon: <Trophy />,
        },
        {
          title: "Fees",
          url: urls.fees,
          icon: <DatabaseIcon />,
        },
        {
          title: "Library",
          url: urls.library,
          icon: <BookOpenIcon />,
        },
        {
          title: "Marks",
          url: urls.marks,
          icon: <GraduationCapIcon />,
        },
        {
          title: "Notices",
          url: urls.notice,
          icon: <BellIcon />,
          hasNotification: unreadNotices,
        },
      ]

  const navMain = [
    ...baseNavMain,
    {
      title: "Mobile App",
      url: "/downloads",
      icon: <Smartphone />,
    }
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-3 flex flex-col gap-5">
        {isLoading ? (
          <div className="flex flex-col gap-5">
            {/* Avatar row: h-8 avatar + name + chevron icon */}
            <div className="flex items-center justify-between px-1 py-1.5 w-full">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0 bg-muted-foreground/15" />
                <Skeleton className="h-3.5 w-28 rounded bg-muted-foreground/15" />
              </div>
              <Skeleton className="size-4 rounded shrink-0 bg-muted-foreground/10" />
            </div>
            {/* Quick Search button placeholder: h-9, full width, rounded-xl */}
            <Skeleton className="h-9 w-full rounded-xl bg-muted-foreground/10" />
            <div className="h-px bg-sidebar-border/60 w-full" />
          </div>
        ) : (
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
                      <AvatarImage src={userToDisplay?.image || undefined} alt={userToDisplay?.name} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {userToDisplay?.name ? getInitials(userToDisplay.name) : "VS"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 block size-2 rounded-full bg-green-500 ring-2 ring-sidebar dark:ring-[#1c1c1e]" />
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="truncate text-sm font-semibold text-foreground leading-tight">
                      {userToDisplay?.name || "VidyaSchool User"}
                    </span>
                  </div>
                  <ChevronsUpDown className="size-3.5 text-muted-foreground/60 shrink-0 group-hover:text-muted-foreground transition-colors" />
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
                    <AvatarImage src={userToDisplay?.image || undefined} alt={userToDisplay?.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {userToDisplay?.name ? getInitials(userToDisplay.name) : "VS"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate leading-snug">
                      {userToDisplay?.name || "VidyaSchool User"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate leading-snug">
                      {userToDisplay?.email || ""}
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { setIsCommandOpen(false); router.push(accountUrl) }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  >
                    <CircleUserRoundIcon className="size-4 text-muted-foreground shrink-0" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsCommandOpen(false)
                      const noticeUrl = isAdmin
                        ? adminUrls.notices
                        : isTeacher
                        ? teacherUrls.notice
                        : isLibrarian
                        ? librarianUrls.notice
                        : urls.notice
                      router.push(noticeUrl)
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
                      { label: "Light", value: "light" as const, icon: <SunIcon className="size-3.5" /> },
                      { label: "Dark",  value: "dark" as const,  icon: <MoonIcon className="size-3.5" /> },
                      { label: "System",value: "system" as const,icon: <Laptop   className="size-3.5" /> },
                    ].map(({ label, value, icon }) => (
                      <button
                        key={value}
                        onClick={() => { setTheme(value); setIsCommandOpen(false); toast.success(`Theme: ${label}`) }}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-foreground transition-colors cursor-pointer"
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider + Add Account + Log Out */}
                <div className="border-t border-zinc-100 dark:border-zinc-800/60 p-1.5 space-y-0.5">
                  <button
                    onClick={() => { setIsCommandOpen(false); window.location.href = "/login" }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Plus className="size-4 shrink-0" />
                    Add Account
                  </button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start gap-2.5 px-2.5"
                    onClick={async () => {
                      setIsCommandOpen(false)
                      await logoutUser()
                    }}
                  >
                    <LogOut className="size-4 shrink-0" />
                    Log Out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick Search Button */}
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  code: "KeyK",
                  ctrlKey: true,
                  metaKey: true,
                  bubbles: true,
                  cancelable: true,
                })
                window.dispatchEvent(event)
                if (isMobile) {
                  setOpenMobile(false)
                }
              }}
              className="w-full h-9 flex items-center justify-between px-3 py-1.5 rounded-xl border border-border/80 bg-sidebar-foreground/5 hover:bg-sidebar-foreground/10 text-muted-foreground transition-all duration-150 text-xs cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-2.5">
                <SearchIcon className="size-4.5 shrink-0 text-muted-foreground/80" />
                <span className="text-muted-foreground/80 font-normal">Quick Search</span>
              </div>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-border bg-transparent dark:bg-transparent px-1.5 font-mono text-[9px] font-medium text-muted-foreground/60 shadow-none">
                <span>⌘</span><span>F</span>
              </kbd>
            </button>
            <div className="h-px bg-sidebar-border/60 w-full" />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-1">
              {/* 6 main nav items: Dashboard / Fees / Library / Marks / Notices / Mobile App */}
              <SidebarMenu>
                {[
                  { w: "w-20" }, // Dashboard
                  { w: "w-9"  }, // Fees
                  { w: "w-14" }, // Library
                  { w: "w-11" }, // Marks
                  { w: "w-14" }, // Notices
                  { w: "w-20" }, // Mobile App
                ].map(({ w }, i) => (
                  <SidebarMenuItem key={i} className="pointer-events-none">
                    <SidebarMenuButton className="gap-2">
                      <Skeleton className="size-4 shrink-0 rounded bg-muted-foreground/15" />
                      <Skeleton className={`h-3.5 rounded bg-muted-foreground/15 ${w}`} />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <NavMain items={navMain} />
            {!isAdmin && (
              <div className="px-3 py-2">
                <OnboardingAlert isTeacher={isTeacher} />
              </div>
            )}
          </>
        )}
        {isLoading ? (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Secondary nav: Sessions / Get Help */}
                {[{ w: "w-14" }, { w: "w-16" }].map(({ w }, i) => (
                  <SidebarMenuItem key={i} className="pointer-events-none">
                    <SidebarMenuButton className="gap-2">
                      <Skeleton className="size-4 shrink-0 rounded bg-muted-foreground/15" />
                      <Skeleton className={`h-3.5 rounded bg-muted-foreground/15 ${w}`} />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {/* AI Chat History group for Teacher */}
            {isTeacher && (
              <SidebarGroup className="pt-0 mt-1">
                <div className="h-px bg-sidebar-border/60 mx-0 mb-3" />
                
                <SidebarGroupContent>
                  <SidebarMenu className="max-h-[160px] overflow-y-auto scrollbar-none gap-0.5">
                    {teacherChats.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] text-muted-foreground italic">
                        No active chat threads
                      </div>
                    ) : (
                      teacherChats.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === `/teacher/${profileUsername}/tasks/${chat.id}`}
                            className="py-1 h-7.5 px-3 rounded-lg"
                          >
                            <Link href={`/teacher/${profileUsername || 'username'}/tasks/${chat.id}`} className="flex items-center gap-2">
                              <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate text-xs font-normal">{chat.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            <NavSecondary items={data.navSecondary} className="mt-auto" />
          </>
        )}
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

      {/* Dialog: Android App QR Code */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="sm:max-w-md text-center flex flex-col items-center p-6">
          <DialogHeader className="items-center">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Smartphone className="size-5 text-primary animate-bounce" />
              Download VidyaSchool App
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Scan the QR code below on your Android device to download and install the latest version ({appVersion}).
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-6 p-4 bg-white rounded-xl shadow-inner border border-muted/55">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(downloadUrl)}`} 
              alt="Download QR Code" 
              width={200}
              height={200}
              className="rounded-lg object-contain mx-auto"
            />
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <Button asChild variant="default" className="w-full gap-2">
              <a href={downloadUrl} download>
                <Download className="size-4" />
                Direct Download (APK)
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setIsQrOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
