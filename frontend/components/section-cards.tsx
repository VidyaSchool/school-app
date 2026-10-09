"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

interface CardData {
  title?: string;
  value?: string;
  trend?: string;
  trendUp?: boolean;
  footer1?: string;
  footer2?: string;
}

interface SectionCardsProps {
  card1?: CardData;
  card2?: CardData;
  card3?: CardData;
  card4?: CardData;
}

function StatCard({
  title,
  value,
  trend,
  trendUp,
  footer1,
  footer2,
}: {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  footer1?: string;
  footer2?: string;
}) {
  const isNotAvailable = !value || value.toLowerCase().includes("not available") || value === "N/A"

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className={cn(
          "font-semibold tabular-nums",
          isNotAvailable
            ? "text-lg text-muted-foreground font-medium @[250px]/card:text-xl"
            : "text-2xl @[250px]/card:text-3xl"
        )}>
          {value || "Not available"}
        </CardTitle>
        {trend && (
          <CardAction>
            <Badge variant="outline">
              {trendUp ? <TrendingUpIcon /> : <TrendingDownIcon />}
              {trend}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {(footer1 || footer2) && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {footer1 && (
            <div className="line-clamp-1 flex gap-2 font-medium">
              {footer1}{" "}
              {trend && (trendUp ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />)}
            </div>
          )}
          {footer2 && (
            <div className="text-muted-foreground text-xs">
              {footer2}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

export function SectionCards({ card1, card2, card3, card4 }: SectionCardsProps = {}) {
  // Card 1 values
  const c1Title = card1?.title ?? "Class Avg. Score"
  const c1Value = card1?.value ?? "Not available"
  const c1Trend = card1?.trend
  const c1TrendUp = card1?.trendUp ?? true
  const c1Footer1 = card1?.footer1
  const c1Footer2 = card1?.footer2

  // Card 2 values
  const c2Title = card2?.title ?? "Total Students"
  const c2Value = card2?.value ?? "Not available"
  const c2Trend = card2?.trend
  const c2TrendUp = card2?.trendUp ?? true
  const c2Footer1 = card2?.footer1
  const c2Footer2 = card2?.footer2

  // Card 3 values
  const c3Title = card3?.title ?? "Top Subject"
  const c3Value = card3?.value ?? "Not available"
  const c3Trend = card3?.trend
  const c3TrendUp = card3?.trendUp ?? true
  const c3Footer1 = card3?.footer1
  const c3Footer2 = card3?.footer2

  // Card 4 values
  const c4Title = card4?.title ?? "Needs Improvement"
  const c4Value = card4?.value ?? "Not available"
  const c4Trend = card4?.trend
  const c4TrendUp = card4?.trendUp ?? false
  const c4Footer1 = card4?.footer1
  const c4Footer2 = card4?.footer2

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <StatCard
        title={c1Title}
        value={c1Value}
        trend={c1Trend}
        trendUp={c1TrendUp}
        footer1={c1Footer1}
        footer2={c1Footer2}
      />
      <StatCard
        title={c2Title}
        value={c2Value}
        trend={c2Trend}
        trendUp={c2TrendUp}
        footer1={c2Footer1}
        footer2={c2Footer2}
      />
      <StatCard
        title={c3Title}
        value={c3Value}
        trend={c3Trend}
        trendUp={c3TrendUp}
        footer1={c3Footer1}
        footer2={c3Footer2}
      />
      <StatCard
        title={c4Title}
        value={c4Value}
        trend={c4Trend}
        trendUp={c4TrendUp}
        footer1={c4Footer1}
        footer2={c4Footer2}
      />
    </div>
  )
}
