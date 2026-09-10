"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export default function WaitingRoomPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await authClient.getSession()
        console.log("Session data:", session)
        
        if (!session?.data?.user) {
          console.log("No session, redirecting to login")
          router.push("/login")
          return
        }
        
        const userData = session.data.user as any
        console.log("User data:", userData)
        setUser(userData)
        setLoading(false)

        // If already teacher role, go to teacher dashboard
        if (userData.role === "teacher") {
          console.log("User is teacher, redirecting")
          router.push("/teacher")
        }
      } catch (error) {
        console.error("Error fetching session:", error)
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  useEffect(() => {
    if (!user) return

    console.log("Setting up socket connection for user:", user.id)
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000", {
      transports: ["websocket", "polling"]
    })

    newSocket.on("connect", () => {
      console.log("✅ Connected to server, socket ID:", newSocket.id)
      newSocket.emit("teacher_request_status", { userId: user.id })
    })

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error)
    })

    newSocket.on("approval_status", (data: { status: string; userId: string }) => {
      console.log("📨 Approval status received:", data)
      console.log("Current user ID:", user.id)
      console.log("Match:", data.userId === user.id)
      
      if (data.userId === user.id) {
        console.log("✅ Status matches, updating to:", data.status)
        setStatus(data.status as any)
        if (data.status === "approved") {
          console.log("Approved! Refetching session...")
          // Refetch session to get updated role
          authClient.getSession().then(() => {
            setTimeout(() => {
              console.log("Redirecting to /teacher")
              window.location.href = "/teacher"
            }, 1500)
          })
        } else if (data.status === "rejected") {
          setTimeout(() => {
            console.log("Redirecting to /student")
            window.location.href = "/student"
          }, 3000)
        }
      }
    })

    setSocket(newSocket)

    return () => {
      console.log("Disconnecting socket")
      newSocket.close()
    }
  }, [user, router])

  const handleLogout = async () => {
    const { logoutUser } = await import("@/lib/auth-client")
    await logoutUser()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        {status === "pending" && (
          <>
            <div className="space-y-2">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <h1 className="text-2xl font-bold">Waiting for Approval</h1>
              <p className="text-muted-foreground">
                Your teacher account request is pending admin approval. You will be notified once reviewed.
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Sign Out
            </Button>
          </>
        )}
        {status === "approved" && (
          <div className="space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-600">Approved!</h1>
            <p className="text-muted-foreground">Redirecting to teacher dashboard...</p>
          </div>
        )}
        {status === "rejected" && (
          <div className="space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600">Request Denied</h1>
            <p className="text-muted-foreground">
              Your teacher account request was not approved. You will be redirected to student dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
