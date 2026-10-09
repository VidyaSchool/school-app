"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const defaultChartConfig = {
  average: {
    label: "Average",
    color: "var(--primary)",
  },
  highest: {
    label: "Highest",
    color: "#10b981",
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  title?: string;
  descriptionLine1?: string;
  descriptionLine2?: string;
  data?: any[];
  config?: ChartConfig;
  xAxisKey?: string;
  dataKey1?: string;
  dataKey2?: string;
  hideTimeRangeToggle?: boolean;
  emptyMessage?: string;
}

export function ChartAreaInteractive({
  title = "Performance Chart",
  descriptionLine1,
  descriptionLine2,
  data,
  config,
  xAxisKey = "date",
  dataKey1 = "average",
  dataKey2 = "highest",
  hideTimeRangeToggle = false,
  emptyMessage = "No performance data available to display.",
}: ChartAreaInteractiveProps = {}) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  if (!data || data.length === 0) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {(descriptionLine1 || descriptionLine2) && (
            <CardDescription>
              {descriptionLine1 && (
                <span className="hidden @[540px]/card:block">
                  {descriptionLine1}
                </span>
              )}
              {descriptionLine2 && (
                <span className="@[540px]/card:hidden">{descriptionLine2}</span>
              )}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex flex-col items-center justify-center h-[250px] w-full rounded-xl border border-dashed border-border/60 text-muted-foreground bg-muted/5">
            <p className="text-base font-medium text-foreground/80">Not available</p>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-sm px-4">
              {emptyMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeConfig = config ?? defaultChartConfig

  const filteredData = hideTimeRangeToggle || xAxisKey !== "date"
    ? data
    : data.filter((item) => {
        const date = new Date(item[xAxisKey])
        if (isNaN(date.getTime())) return true
        let daysToSubtract = 90
        if (timeRange === "30d") {
          daysToSubtract = 30
        } else if (timeRange === "7d") {
          daysToSubtract = 7
        }
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysToSubtract)
        return date >= startDate
      })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {descriptionLine1}
          </span>
          <span className="@[540px]/card:hidden">{descriptionLine2}</span>
        </CardDescription>
        {!hideTimeRangeToggle && (
          <CardAction>
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
            >
              <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
              <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
              <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Select a value"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={activeConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={`var(--color-${dataKey1})`}
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor={`var(--color-${dataKey1})`}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={`var(--color-${dataKey2})`}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={`var(--color-${dataKey2})`}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                if (xAxisKey === "date") {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
                return value
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value, payload) => {
                    const item = payload?.[0]?.payload
                    if (item?.exam) {
                      return item.exam
                    }
                    if (xAxisKey === "date") {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                    return value
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey={dataKey1}
              type="monotone"
              fill="url(#fillMobile)"
              stroke={`var(--color-${dataKey1})`}
            />
            {dataKey2 && dataKey2 !== dataKey1 && (
              <Area
                dataKey={dataKey2}
                type="monotone"
                fill="url(#fillDesktop)"
                stroke={`var(--color-${dataKey2})`}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

