"use client"

import * as React from "react"
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  Search,
  Loader2,
  TrendingUp,
  Flame,
  ArrowRight,
  GraduationCap
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import StudentLeaderboardSkeleton from "./skeleton"
import { getStudentCache, setStudentCache } from "@/lib/student-cache"

interface LeaderboardEntry {
  id: string
  name: string
  username: string
  image: string | null
  average: number
  examsCount: number
  rank: number
}

interface LeaderboardData {
  class: string | null
  section: string | null
  leaderboard: LeaderboardEntry[]
  current_student_rank: number | null
}

export default function StudentLeaderboardPage() {
  const cachedLeaderboard = React.useMemo(() => getStudentCache<LeaderboardData>("leaderboard"), [])
  const [data, setData] = React.useState<LeaderboardData | null>(() => cachedLeaderboard || null)
  const [loading, setLoading] = React.useState(() => !cachedLeaderboard)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    fetch("/api/backend/api/student/leaderboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load leaderboard data")
        return res.json()
      })
      .then((data: LeaderboardData) => {
        setData(data)
        setStudentCache("leaderboard", data)
        setLoading(false)
      })
      .catch((err) => {
        if (!getStudentCache("leaderboard")) {
          setError(err.message)
        }
        setLoading(false)
      })
  }, [])

  const filteredLeaderboard = React.useMemo(() => {
    if (!data) return []
    return data.leaderboard.filter(
      (entry) =>
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [data, searchQuery])

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return <StudentLeaderboardSkeleton />
  }

  if (error || !data || data.leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 p-6 bg-background text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/60" />
        <h2 className="text-xl font-bold text-foreground">Leaderboard Unavailable</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error ? "Could not retrieve the current classroom rankings." : "No academic performance records have been uploaded yet."}
        </p>
      </div>
    )
  }

  const topThree = data.leaderboard.slice(0, 3)
  const remainder = filteredLeaderboard.filter((entry) => entry.rank > 3)

  // Podium layout: [2nd, 1st, 3rd] for visual symmetry
  const podiumOrder = [
    topThree[1], // 2nd Place
    topThree[0], // 1st Place
    topThree[2]  // 3rd Place
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans px-4 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Class Leaderboard
            <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-500 animate-pulse" />
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Compare overall academic scores with classmates in Class {data.class} – {data.section}.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input
            type="text"
            placeholder="Search classmates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs"
          />
        </div>
      </div>

      {/* Podium Section (Top 3) */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end justify-center pt-8 max-w-4xl mx-auto w-full">
          {podiumOrder.map((student) => {
            const isFirst = student.rank === 1
            const isSecond = student.rank === 2
            const isThird = student.rank === 3

            let rankColor = ""
            let rankBg = ""
            let rankIcon = null
            let heightClass = ""

            if (isFirst) {
              rankColor = "text-yellow-500"
              rankBg = "bg-yellow-500/10 border-yellow-500/30"
              rankIcon = <Trophy className="h-8 w-8 text-yellow-500 fill-yellow-500/20" />
              heightClass = "md:h-[330px]"
            } else if (isSecond) {
              rankColor = "text-slate-400"
              rankBg = "bg-slate-400/10 border-slate-400/30"
              rankIcon = <Medal className="h-8 w-8 text-slate-400 fill-slate-400/20" />
              heightClass = "md:h-[290px]"
            } else if (isThird) {
              rankColor = "text-amber-600"
              rankBg = "bg-amber-600/10 border-amber-600/30"
              rankIcon = <Award className="h-8 w-8 text-amber-600 fill-amber-600/20" />
              heightClass = "md:h-[260px]"
            }

            return (
              <div
                key={student.id}
                className={`flex flex-col items-center justify-end text-center p-5 rounded-2xl border ${rankBg} ${heightClass} shadow-md relative overflow-hidden transition-all hover:scale-102`}
              >
                {/* Ribbon details */}
                <div className="absolute top-3 right-3 flex items-center justify-center p-2 rounded-full bg-background/80 backdrop-blur-xs">
                  {rankIcon}
                </div>

                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-background ring-4 ring-primary/20 flex items-center justify-center font-bold text-lg text-primary shrink-0">
                    {getInitials(student.name)}
                  </div>

                  <div className="flex flex-col min-w-0 px-2">
                    <span className="font-bold text-sm text-foreground truncate block">{student.name}</span>
                    <span className="text-xs text-muted-foreground">@{student.username}</span>
                  </div>

                  <div className="mt-2 w-full">
                    <div className="text-2xl font-black tracking-tight text-foreground">{student.average}%</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">
                      Class Average
                    </div>
                  </div>

                  <Badge variant={isFirst ? "default" : "secondary"} className="mt-3 px-4 font-bold text-xs uppercase">
                    {student.rank === 1 ? "1st Place" : student.rank === 2 ? "2nd Place" : "3rd Place"}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Main Leaderboard List */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">Class Standings</CardTitle>
          <CardDescription>Full student performance rankings based on cumulative averages</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y divide-border/60">
            {remainder.length > 0 ? (
              remainder.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 px-6 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Rank indicator */}
                    <span className="text-sm font-bold text-muted-foreground w-6 text-center">
                      {student.rank}
                    </span>

                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-primary/10 border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                      {getInitials(student.name)}
                    </div>

                    {/* Student Info */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {student.name}
                      </span>
                      <span className="text-xs text-muted-foreground">@{student.username}</span>
                    </div>
                  </div>

                  {/* Score Info */}
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-extrabold text-foreground">
                        {student.average}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">Class Average</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-semibold text-xs">
                      {student.examsCount}
                    </div>
                  </div>
                </div>
              ))
            ) : filteredLeaderboard.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground font-medium">
                No matching classmates found.
              </div>
            ) : remainder.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground font-medium">
                All class entries displayed on the podium.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
