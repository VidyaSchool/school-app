"use client"

import * as React from "react"
import { createAvatar } from "@bible-strong/avatar-react"
import "@bible-strong/avatar-react/styles.css"
import avatarJson from "./avatar.avatar.json"

export const GrokAvatar = createAvatar(avatarJson)

export function Strobi({
  size = 32,
  className = "",
  defaultAnimation = "idle",
  animation,
  isThinking = false,
  isGenerating = false,
}: {
  size?: number | string
  className?: string
  defaultAnimation?: "idle" | "talking" | "thinking" | "smirk"
  animation?: "idle" | "talking" | "thinking" | "smirk"
  isThinking?: boolean
  isGenerating?: boolean
}) {
  // Determine current active animation (no hover effect)
  const activeAnimation = animation
    ?? (isGenerating ? "talking" : isThinking ? "thinking" : undefined)

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center select-none rounded-full ${
        isGenerating || isThinking
          ? "drop-shadow-[0_0_8px_rgba(211,50,47,0.6)]"
          : ""
      } ${className}`}
      title="AI Assistant"
    >
      <GrokAvatar
        size={size}
        defaultAnimation={defaultAnimation}
        animation={activeAnimation}
      />
    </div>
  )
}
