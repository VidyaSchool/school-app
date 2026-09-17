"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, ImageIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon, BookOpenIcon, GraduationCapIcon, BellIcon, GitPullRequest, MessageSquare, AlertTriangle, MoonIcon, CircleUserRoundIcon, ChevronsUpDown, SunIcon, Laptop, ChevronRight, LogOut, CalendarIcon, NotebookPenIcon, Trophy, Mail } from "lucide-react"
import { useSession, signOut, logoutUser } from "@/lib/auth-client"
import { io } from "socket.io-client"
import { Skeleton } from "@/components/ui/skeleton"

const MAIN_PORTAL_URL = process.env.NEXT_PUBLIC_MAIN_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://vidyaschool.com' : 'http://localhost:3000')
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { toast } from "sonner"

// Persistent Cache Keys & TTLs
const USER_CACHE_KEY = "vs_admin_user_cache"
const NOTIFS_CACHE_KEY = "vs_admin_notifs_cache"
const USER_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const NOTIFS_CACHE_TTL = 60 * 1000   // 60 seconds

interface CachedUserData {
  user: {
    id: string
    name: string
    email: string
    role: string
    image?: string | null
  }
  username: string | null
  savedAt: number
}

interface CachedNotifsData {
  unreadCommunity: boolean
  unreadRequests: boolean
  unreadNotices: boolean
  unreadComplaints: boolean
  savedAt: number
}

// In-memory singletons to prevent layout remount re-reads and duplicate network calls
let _memoryUserCache: CachedUserData | null = null
let _memoryNotifsCache: CachedNotifsData | null = null
let _accountFetchPromise: Promise<any> | null = null
let _usernameFetchPromise: Promise<string | null> | null = null
let _sharedSocket: any = null
let _cachedUsername: string | null = null

function getStoredUser(): CachedUserData | null {
  if (_memoryUserCache) return _memoryUserCache
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    if (raw) {
      const parsed: CachedUserData = JSON.parse(raw)
      _memoryUserCache = parsed
      return parsed
    }
  } catch {}
  return null
}

function setStoredUser(data: { user: any; username: string | null }) {
  if (typeof window === "undefined") return
  const item: CachedUserData = {
    user: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      image: data.user.image,
    },
    username: data.username,
    savedAt: Date.now(),
  }
  _memoryUserCache = item
  _cachedUsername = data.username
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(item))
  } catch {}
}

function getStoredNotifs(): CachedNotifsData | null {
  if (_memoryNotifsCache) return _memoryNotifsCache
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(NOTIFS_CACHE_KEY)
    if (raw) {
      const parsed: CachedNotifsData = JSON.parse(raw)
      _memoryNotifsCache = parsed
      return parsed
    }
  } catch {}
  return null
}

function setStoredNotifs(data: Partial<CachedNotifsData>) {
  if (typeof window === "undefined") return
  const current = getStoredNotifs() || {
    unreadCommunity: false,
    unreadRequests: false,
    unreadNotices: false,
    unreadComplaints: false,
    savedAt: 0,
  }
  const updated: CachedNotifsData = {
    ...current,
    ...data,
    savedAt: Date.now(),
  }
  _memoryNotifsCache = updated
  try {
    sessionStorage.setItem(NOTIFS_CACHE_KEY, JSON.stringify(updated))
  } catch {}
}

function fetchUsernameOnce(): Promise<string | null> {
  const cached = getStoredUser()
  if (cached?.username) {
    _cachedUsername = cached.username
    return Promise.resolve(cached.username)
  }
  if (_usernameFetchPromise) return _usernameFetchPromise

  _usernameFetchPromise = fetch("/api/profile/username")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const u = data?.username ?? null
      if (u) {
        _cachedUsername = u
        const cur = getStoredUser()
        if (cur) {
          setStoredUser({ user: cur.user, username: u })
        }
      }
      return u
    })
    .catch(() => null)
    .finally(() => {
      _usernameFetchPromise = null
    })

  return _usernameFetchPromise
}

// Single shared hook — extracts username from URL, memory, or persistent localStorage cache
function useProfileUsername(): string | null {
  const pathname = usePathname()

  const urlUsername = React.useMemo(() => {
    if (!pathname) return null
    const parts = pathname.split("/").filter(Boolean)
    if (parts.length >= 2 && ["student", "teacher", "admin", "librarian", "accounts"].includes(parts[0])) {
      return parts[1]
    }
    return null
  }, [pathname])

  const [username, setUsername] = React.useState<string | null>(() => {
    if (urlUsername) {
      _cachedUsername = urlUsername
      return urlUsername
    }
    if (_cachedUsername) return _cachedUsername
    const stored = getStoredUser()
    if (stored?.username) {
      _cachedUsername = stored.username
      return stored.username
    }
    return null
  })

  // Synchronize when URL contains a valid username
  React.useEffect(() => {
    if (urlUsername && urlUsername !== username) {
      _cachedUsername = urlUsername
      setUsername(urlUsername)
      const stored = getStoredUser()
      if (stored && stored.username !== urlUsername) {
        setStoredUser({ user: stored.user, username: urlUsername })
      }
    }
  }, [urlUsername, username])

  // Only fallback to network if username is not yet known
  React.useEffect(() => {
    if (!username) {
      fetchUsernameOnce().then((u) => {
        if (u) {
          _cachedUsername = u
          setUsername(u)
          const stored = getStoredUser()
          if (stored) {
            setStoredUser({ user: stored.user, username: u })
          }
        }
      })
    }
  }, [username])

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
    gallery: `${base}/gallery`,
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
      url: "https://beta.blazeneuro.com/docs",
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

  // 1. Synchronously initialize user from memory / localStorage cache
  const [cachedUser, setCachedUser] = React.useState<any>(() => {
    const stored = getStoredUser()
    return stored?.user || null
  })

  const userToDisplay = session?.user || cachedUser
  // In admin_frontend, default to cached role or "admin" to prevent flash of student navigation
  const userRole = userToDisplay?.role || cachedUser?.role || (pathname?.startsWith("/teacher") ? "teacher" : "admin")

  // Sidebar is only loading if we have NEITHER session NOR cached user
  const isLoading = !userToDisplay && isPending

  const isLibrarian = userRole === "librarian" || pathname?.startsWith("/librarian")
  const isTeacher = userRole === "teacher" || pathname?.startsWith("/teacher")
  const isAdmin = userRole === "admin" || (!isTeacher && !isLibrarian && !pathname?.startsWith("/accounts"))
  const isAccount = userRole === "account" || pathname?.startsWith("/accounts")

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

  // Stale-While-Revalidate: fetch /api/account ONLY when cache is missing, stale (>5m), or session user changed
  React.useEffect(() => {
    const stored = getStoredUser()
    const isStale = !stored || (Date.now() - stored.savedAt > USER_CACHE_TTL)
    const idMismatch = session?.user && stored && session.user.id !== stored.user.id

    if (!isStale && !idMismatch && stored?.user) {
      if (!cachedUser) setCachedUser(stored.user)
      return
    }

    if (_accountFetchPromise) {
      _accountFetchPromise.then((data) => {
        if (data?.user) setCachedUser(data.user)
      })
      return
    }

    _accountFetchPromise = fetch("/api/account")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCachedUser(data.user)
          const usernameVal = data.profile?.username || profileUsername || null
          setStoredUser({ user: data.user, username: usernameVal })
        }
        return data
      })
      .catch(() => null)
      .finally(() => {
        _accountFetchPromise = null
      })
  }, [session?.user?.id, profileUsername])

  // Notification states — initialized synchronously from sessionStorage cache
  const [unreadCommunity, setUnreadCommunity] = React.useState(() => getStoredNotifs()?.unreadCommunity ?? false)
  const [unreadRequests, setUnreadRequests] = React.useState(() => getStoredNotifs()?.unreadRequests ?? false)
  const [unreadNotices, setUnreadNotices] = React.useState(() => getStoredNotifs()?.unreadNotices ?? false)
  const [unreadComplaints, setUnreadComplaints] = React.useState(() => getStoredNotifs()?.unreadComplaints ?? false)

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

  // Clear notifications when visiting pages & persist clear to cache
  React.useEffect(() => {
    if (!pathname) return
    if (pathname === "/community") {
      setUnreadCommunity(false)
      setStoredNotifs({ unreadCommunity: false })
    }
    if (pathname.includes("/requests")) {
      setUnreadRequests(false)
      setStoredNotifs({ unreadRequests: false })
    }
    if (pathname.includes("/notice")) {
      setUnreadNotices(false)
      setStoredNotifs({ unreadNotices: false })
    }
    if (pathname.includes("/complaints")) {
      setUnreadComplaints(false)
      setStoredNotifs({ unreadComplaints: false })
    }
  }, [pathname])

  // Keep a ref to pathname so socket handlers always see the latest value
  const pathnameRef = React.useRef(pathname)
  React.useEffect(() => { pathnameRef.current = pathname }, [pathname])

  // Fetch initial pending status (suppressed if fetched within last 60s) & persistent Socket.IO listeners
  React.useEffect(() => {
    if (!session?.user && !cachedUser) return

    const storedNotifs = getStoredNotifs()
    const isNotifsFresh = storedNotifs && (Date.now() - storedNotifs.savedAt < NOTIFS_CACHE_TTL)

    if (!isNotifsFresh) {
      // 1. Fetch complaints status
      const roleParam = isTeacher || isLibrarian ? "teacher" : isAdmin ? "admin" : ""
      if (roleParam) {
        fetch(`/api/complaints?role=${roleParam}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              const hasPending = data.some(c => c.status === "pending")
              setUnreadComplaints(hasPending)
              setStoredNotifs({ unreadComplaints: hasPending })
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
              setStoredNotifs({ unreadRequests: hasPending })
            }
          })
          .catch(() => {})
      }
    }

    // 3. Setup Socket.IO with singleton connection
    if (!_sharedSocket || !_sharedSocket.connected) {
      _sharedSocket = io(
        process.env.NEXT_PUBLIC_BACKEND_URL ||
          (typeof window !== "undefined" && window.location.hostname !== "localhost"
            ? "https://api.vidyaschool.com"
            : "http://localhost:8000"),
        {
          transports: ["websocket", "polling"],
        }
      )
    }
    const socket = _sharedSocket

    const handleNewMessage = () => {
      if (pathnameRef.current !== "/community") {
        setUnreadCommunity(true)
        setStoredNotifs({ unreadCommunity: true })
      }
    }

    const handleTeacherRequest = () => {
      if (isAdmin && !pathnameRef.current?.includes("/requests")) {
        setUnreadRequests(true)
        setStoredNotifs({ unreadRequests: true })
      }
    }

    const handleComplaint = () => {
      if ((isAdmin || isTeacher) && !pathnameRef.current?.includes("/complaints")) {
        setUnreadComplaints(true)
        setStoredNotifs({ unreadComplaints: true })
      }
    }

    socket.off("new_message", handleNewMessage)
    socket.off("teacher_request_created", handleTeacherRequest)
    socket.off("complaint_created", handleComplaint)

    socket.on("new_message", handleNewMessage)
    socket.on("teacher_request_created", handleTeacherRequest)
    socket.on("complaint_created", handleComplaint)

    return () => {
      socket.off("new_message", handleNewMessage)
      socket.off("teacher_request_created", handleTeacherRequest)
      socket.off("complaint_created", handleComplaint)
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
          title: "Gallery",
          url: adminUrls.gallery,
          icon: <ImageIcon />,
        },
        {
          title: "Page Builder",
          url: adminUrls.pageBuilder,
          icon: <LayoutDashboardIcon />,
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

  const navMain = baseNavMain

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
                      try {
                        localStorage.removeItem(USER_CACHE_KEY)
                        sessionStorage.removeItem(NOTIFS_CACHE_KEY)
                        _memoryUserCache = null
                        _memoryNotifsCache = null
                        _cachedUsername = null
                      } catch {}
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
              {/* 5 main nav items: Dashboard / Fees / Library / Marks / Notices */}
              <SidebarMenu>
                {[
                  { w: "w-20" }, // Dashboard
                  { w: "w-9"  }, // Fees
                  { w: "w-14" }, // Library
                  { w: "w-11" }, // Marks
                  { w: "w-14" }, // Notices
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
    </Sidebar>
  )
}
