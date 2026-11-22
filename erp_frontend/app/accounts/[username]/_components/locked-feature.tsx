"use client"

import { Lock, ArrowLeft, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function LockedFeatureScreen({ title, username }: { title: string; username: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[65vh] p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
        <Lock className="h-8 w-8" />
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-3">
        <ShieldAlert className="h-3.5 w-3.5" /> Coming Soon & Locked
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title} Module Locked</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        The <strong>{title}</strong> module is currently locked and unavailable. Active features for your accounts portal are <strong>Dashboard</strong>, <strong>Student Fees</strong>, and <strong>Fee Structures</strong>.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="outline">
          <Link href={`/accounts/${username}`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/accounts/${username}/fees`}>
            Go to Student Fees
          </Link>
        </Button>
      </div>
    </div>
  )
}
