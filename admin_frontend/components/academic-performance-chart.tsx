"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { GraduationCap } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

interface SubjectMark {
  score: number
  maxScore: number
  classAverage: number
}

interface TermMarks {
  termName: string
  subjects: SubjectMark[]
}

interface ChartDataPoint {
  exam: string
  yourScore: number
  classAverage: number
}

const chartConfig = {
  yourScore: {
    label: "Your Score",
    color: "var(--primary)",
  },
  classAverage: {
    label: "Class Average",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig

export function AcademicPerformanceChart() {
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch("/api/backend/api/student/marks")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load performance data")
        return res.json()
      })
      .then((data: Record<string, TermMarks>) => {
        const entries = Object.values(data)

        if (!entries.length) {
          setChartData([])
          setLoading(false)
          return
        }

        // Transform each exam into a chart data point
        const transformed: ChartDataPoint[] = entries
          .reverse() // Oldest exam first → left-to-right trend
          .map((term) => {
            const totalScore = term.subjects.reduce((s, m) => s + m.score, 0)
            const totalMax = term.subjects.reduce((s, m) => s + m.maxScore, 0)
            const yourPct =
              totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0

            const avgClassScore = term.subjects.reduce(
              (s, m) => s + m.classAverage,
              0
            )
            const classAvgPct =
              totalMax > 0
                ? Math.round((avgClassScore / totalMax) * 1000) / 10
                : 0

            return {
              exam: term.termName,
              yourScore: yourPct,
              classAverage: classAvgPct,
            }
          })

        setChartData(transformed)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (error || chartData.length === 0) {
    return (
      <div className="px-4 lg:px-6 py-1.5">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Academic Performance</CardTitle>
            <CardDescription>Overall score trend across exams</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <div className="flex flex-col items-center justify-center h-[250px] gap-3 text-center">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {error
                  ? "Could not load performance data."
                  : "No exam results recorded yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6 py-1.5">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Academic Performance</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              Your score vs class average across all exams
            </span>
            <span className="@[540px]/card:hidden">Score trend</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillYourScore" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-yourScore)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-yourScore)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient
                  id="fillClassAverage"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-classAverage)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-classAverage)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="exam"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={20}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
                width={40}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => value}
                    formatter={(value, name) => [
                      `${value}%`,
                      chartConfig[name as keyof typeof chartConfig]?.label ?? name,
                    ]}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="classAverage"
                type="natural"
                fill="url(#fillClassAverage)"
                stroke="var(--color-classAverage)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <Area
                dataKey="yourScore"
                type="natural"
                fill="url(#fillYourScore)"
                stroke="var(--color-yourScore)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
