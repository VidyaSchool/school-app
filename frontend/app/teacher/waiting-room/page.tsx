'use client'

import * as React from "react"
import { useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { useSession } from "@/lib/auth-client"
import { 
  Clock, 
  Loader2, 
  ShieldAlert, 
  CheckCircle2, 
  LogOut,
  ArrowRight,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

export default function TeacherWaitingRoomPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [socket, setSocket] = React.useState<Socket | null>(null)
  const [connected, setConnected] = React.useState(false)
  const [requestStatus, setRequestStatus] = React.useState<"pending" | "approved" | "rejected">("pending")
  const [checkInterval, setCheckInterval] = React.useState<any>(null)

  // Verify request status via HTTP as a fallback, and setup socket
  React.useEffect(() => {
    if (isPending) return
    if (!session?.user) {
      router.push("/login")
      return
    }

    // Connect to Socket.IO backend on port 8000
    const socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000", {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 3,
    })

    socketInstance.on("connect", () => {
      console.log("Connected to Socket.IO in waiting room")
      setConnected(true)
      
      socketInstance.emit("join", {
        userId: session.user.id,
        name: session.user.name,
        role: session.user.role,
        image: session.user.image,
      })
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from Socket.IO")
      setConnected(false)
    })

    socketInstance.on("teacher_request_status", (data: { status: "approved" | "rejected" }) => {
      console.log("Received teacher request status change event:", data)
      setRequestStatus(data.status)
      if (data.status === "approved") {
        toast.success("Congratulations! Your Teacher Registration has been approved by the Admin!")
        setTimeout(() => {
          router.push("/teacher")
        }, 2000)
      } else if (data.status === "rejected") {
        toast.error("Your educator role request has been rejected. You have been assigned the Student role.")
        setTimeout(() => {
          router.push("/student")
        }, 4000)
      }
    })

    setSocket(socketInstance)

    // Fallback polling check every 5 seconds in case WebSocket fails
    const interval = setInterval(() => {
      fetch("/api/backend/api/profile")
        .then(res => res.json())
        .then(data => {
          if (data?.role === "teacher") {
            setRequestStatus("approved")
            toast.success("Your Teacher Registration has been approved!")
            clearInterval(interval)
            router.push("/teacher")
          }
        })
        .catch(err => console.error(err))
    }, 5000)

    setCheckInterval(interval)

    return () => {
      socketInstance.disconnect()
      clearInterval(interval)
    }
  }, [session, isPending, router])

  const handleSignOut = async () => {
    if (socket) socket.disconnect()
    if (checkInterval) clearInterval(checkInterval)
    const { logoutUser } = await import("@/lib/auth-client")
    await logoutUser()
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl border border-border/80 shadow-2xl bg-card overflow-hidden">
        
        {/* Top visual border */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-primary to-emerald-500" />
        
        <CardHeader className="text-center pt-8">
          <div className="mx-auto size-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            {requestStatus === "pending" && (
              <Clock className="h-8 w-8 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
            )}
            {requestStatus === "approved" && (
              <CheckCircle2 className="h-8 w-8 text-emerald-600 animate-bounce" />
            )}
            {requestStatus === "rejected" && (
              <ShieldAlert className="h-8 w-8 text-destructive animate-pulse" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {requestStatus === "pending" && "Teacher Waiting Room"}
            {requestStatus === "approved" && "Registration Approved!"}
            {requestStatus === "rejected" && "Registration Rejected"}
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            {requestStatus === "pending" && "Your educator role request is currently under review by the Administrator."}
            {requestStatus === "approved" && "Your application was successful. Redirecting to your dashboard..."}
            {requestStatus === "rejected" && "Unfortunately, your application to join as a faculty member was declined."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-8 py-4">
          
          {requestStatus === "pending" && (
            <div className="space-y-4">
              <div className="bg-muted/40 border rounded-lg p-4 text-xs text-muted-foreground leading-relaxed">
                <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  <BookOpen className="size-3.5 text-primary" /> Why am I here?
                </div>
                Before you can configure courses, record student marks, or update class notices, an administrator must verify your Employee ID and approve your staff membership. This process typically takes only a few minutes.
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Waiting for Administrator...</span>
                  <span className="text-primary">{connected ? "Connected" : "Reconnecting..."}</span>
                </div>
                <Progress value={45} className="h-1.5 animate-pulse" />
              </div>
            </div>
          )}

          {requestStatus === "rejected" && (
            <div className="space-y-4">
              <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4 text-xs text-destructive leading-relaxed flex items-start gap-2.5">
                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Registration Rejected</span>
                  Your application to join as an educator has been declined by the system administrator. 
                  You will now be redirected to the Student workspace under the default Student role.
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center animate-pulse">
                <span>Redirecting to Student Space shortly</span>
                <ArrowRight className="size-3" />
              </div>
            </div>
          )}

        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border/50 px-8 py-4 bg-muted/20">
          <div className="text-xs text-muted-foreground">
            Account: <span className="font-mono font-medium text-foreground">{session?.user?.email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1 rounded-lg text-xs cursor-pointer">
            <LogOut className="size-3.5" /> Sign Out
          </Button>
        </CardFooter>

      </Card>
    </div>
  )
}
