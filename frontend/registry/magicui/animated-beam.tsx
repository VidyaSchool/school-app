"use client"

import React, { useEffect, useId, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface AnimatedBeamProps {
  className?: string
  containerRef: React.RefObject<HTMLElement | null>
  fromRef: React.RefObject<HTMLElement | SVGElement | null>
  toRef: React.RefObject<HTMLElement | SVGElement | null>
  curvature?: number
  curveType?: "curve" | "bended"
  bendRadius?: number
  reverse?: boolean
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  delay?: number
  duration?: number
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
  fromAnchor?: "center" | "top" | "bottom"
  toAnchor?: "center" | "top" | "bottom"
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  curveType = "bended",
  bendRadius = 12,
  reverse = false,
  duration = 3,
  delay = 0,
  pathColor = "currentColor",
  pathWidth = 2,
  pathOpacity = 0.15,
  gradientStartColor = "#3b82f6",
  gradientStopColor = "#10b981",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  fromAnchor,
  toAnchor,
}) => {
  const id = useId()
  const [pathD, setPathD] = useState("")
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })
  const [coords, setCoords] = useState<{
    x1: [number, number]
    y1: [number, number]
    x2: [number, number]
    y2: [number, number]
  }>({
    x1: [0, 100],
    y1: [0, 100],
    x2: [0, 100],
    y2: [0, 100],
  })

  useEffect(() => {
    const updatePath = () => {
      if (!containerRef.current || !fromRef.current || !toRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const rectA = fromRef.current.getBoundingClientRect()
      const rectB = toRef.current.getBoundingClientRect()

      const svgWidth = containerRect.width
      const svgHeight = containerRect.height
      setSvgDimensions({ width: svgWidth, height: svgHeight })

      // Determine vertical departure point from A
      let startY = rectA.top - containerRect.top + rectA.height / 2 + startYOffset
      if (fromAnchor === "bottom") {
        startY = rectA.bottom - containerRect.top + startYOffset
      } else if (fromAnchor === "top") {
        startY = rectA.top - containerRect.top + startYOffset
      } else if (!fromAnchor) {
        if (rectB.top > rectA.bottom) {
          startY = rectA.bottom - containerRect.top + startYOffset
        } else if (rectB.bottom < rectA.top) {
          startY = rectA.top - containerRect.top + startYOffset
        }
      }

      // Determine vertical arrival point into B
      let endY = rectB.top - containerRect.top + rectB.height / 2 + endYOffset
      if (toAnchor === "top") {
        endY = rectB.top - containerRect.top + endYOffset
      } else if (toAnchor === "bottom") {
        endY = rectB.bottom - containerRect.top + endYOffset
      } else if (!toAnchor) {
        if (rectB.top > rectA.bottom) {
          endY = rectB.top - containerRect.top + endYOffset
        } else if (rectB.bottom < rectA.top) {
          endY = rectB.bottom - containerRect.top + endYOffset
        }
      }

      const startX = rectA.left - containerRect.left + rectA.width / 2 + startXOffset
      const endX = rectB.left - containerRect.left + rectB.width / 2 + endXOffset

      let d = ""
      if (curveType === "bended") {
        const dx = Math.abs(endX - startX)
        const dy = Math.abs(endY - startY)
        if (dx < 4) {
          d = `M ${startX},${startY} L ${endX},${endY}`
        } else {
          const dirX = endX > startX ? 1 : -1
          const dirY = endY > startY ? 1 : -1
          const midY = startY + (endY - startY) * 0.5
          const r = Math.min(bendRadius, dx / 2, dy / 2)
          d =
            `M ${startX},${startY} ` +
            `L ${startX},${midY - dirY * r} ` +
            `Q ${startX},${midY} ${startX + dirX * r},${midY} ` +
            `L ${endX - dirX * r},${midY} ` +
            `Q ${endX},${midY} ${endX},${midY + dirY * r} ` +
            `L ${endX},${endY}`
        }
      } else {
        const isVertical = Math.abs(endY - startY) >= Math.abs(endX - startX)
        if (isVertical) {
          const dy = endY - startY
          const cp1X = startX + curvature
          const cp1Y = startY + dy * 0.5
          const cp2X = endX + curvature
          const cp2Y = endY - dy * 0.5
          d = `M ${startX},${startY} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`
        } else {
          const controlY = startY - curvature
          d = `M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`
        }
      }

      setPathD(d)

      const dist = Math.hypot(endX - startX, endY - startY) || 1
      const pulseLen = Math.max(30, dist * 0.3)
      const uX = (endX - startX) / dist
      const uY = (endY - startY) / dist

      if (reverse) {
        setCoords({
          x1: [endX, startX - uX * pulseLen],
          y1: [endY, startY - uY * pulseLen],
          x2: [endX + uX * pulseLen, startX],
          y2: [endY + uY * pulseLen, startY],
        })
      } else {
        setCoords({
          x1: [startX - uX * pulseLen, endX],
          y1: [startY - uY * pulseLen, endY],
          x2: [startX, endX + uX * pulseLen],
          y2: [startY, endY + uY * pulseLen],
        })
      }
    }

    const observer = new ResizeObserver(() => updatePath())
    if (containerRef.current) observer.observe(containerRef.current)
    if (fromRef.current) observer.observe(fromRef.current)
    if (toRef.current) observer.observe(toRef.current)

    window.addEventListener("resize", updatePath)
    updatePath()

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updatePath)
    }
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    reverse,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
    fromAnchor,
    toAnchor,
  ])

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none absolute inset-0 size-full stroke-2", className)}
      viewBox={`0 0 ${svgDimensions.width || 1} ${svgDimensions.height || 1}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      {pathD && (
        <path
          d={pathD}
          stroke={`url(#${id})`}
          strokeWidth={pathWidth}
          strokeOpacity="1"
          strokeLinecap="round"
        />
      )}
      <defs>
        <motion.linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: coords.x1[0],
            y1: coords.y1[0],
            x2: coords.x2[0],
            y2: coords.y2[0],
          }}
          animate={{
            x1: [coords.x1[0], coords.x1[1]],
            y1: [coords.y1[0], coords.y1[1]],
            x2: [coords.x2[0], coords.x2[1]],
            y2: [coords.y2[0], coords.y2[1]],
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
            repeatDelay: 0.2,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="20%" stopColor={gradientStartColor} stopOpacity="1" />
          <stop offset="60%" stopColor={gradientStopColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  )
}
