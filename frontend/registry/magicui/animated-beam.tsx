"use client"

import React, { useEffect, useId, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface AnimatedBeamProps {
  className?: string
  containerRef: React.RefObject<HTMLElement | null>
  fromRef: React.RefObject<HTMLElement | null>
  toRef: React.RefObject<HTMLElement | null>
  curvature?: number
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
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
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

      const startX = rectA.left - containerRect.left + rectA.width / 2 + startXOffset
      const startY = rectA.top - containerRect.top + rectA.height / 2 + startYOffset
      const endX = rectB.left - containerRect.left + rectB.width / 2 + endXOffset
      const endY = rectB.top - containerRect.top + rectB.height / 2 + endYOffset

      const isVertical = Math.abs(endY - startY) >= Math.abs(endX - startX)

      let d = ""
      if (isVertical) {
        const midY = (startY + endY) / 2
        const controlX = (startX + endX) / 2 + curvature
        d = `M ${startX},${startY} C ${startX},${midY} ${controlX},${midY} ${endX},${endY}`
      } else {
        const controlY = startY - curvature
        d = `M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`
      }

      setPathD(d)

      // Linear gradient travel path from source to target
      if (reverse) {
        setCoords({
          x1: [endX, startX],
          y1: [endY, startY],
          x2: [endX + (endX - startX) * 0.2, startX - (endX - startX) * 0.2],
          y2: [endY + (endY - startY) * 0.2, startY - (endY - startY) * 0.2],
        })
      } else {
        setCoords({
          x1: [startX, endX],
          y1: [startY, endY],
          x2: [startX + (endX - startX) * 0.2, endX + (endX - startX) * 0.2],
          y2: [startY + (endY - startY) * 0.2, endY + (endY - startY) * 0.2],
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
