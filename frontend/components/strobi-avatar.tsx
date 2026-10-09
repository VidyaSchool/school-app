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
  const [isHovered, setIsHovered] = React.useState(false)

  // Determine current active animation
  const activeAnimation = animation
    ?? (isGenerating ? "talking" : isThinking ? "thinking" : isHovered ? "smirk" : undefined)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`inline-flex shrink-0 items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer select-none rounded-full ${
        isGenerating || isThinking
          ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]"
          : "hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]"
      } ${className}`}
      title="Grok Assistant"
    >
      <GrokAvatar
        size={size}
        defaultAnimation={defaultAnimation}
        animation={activeAnimation}
      />
    </div>
  )
}
