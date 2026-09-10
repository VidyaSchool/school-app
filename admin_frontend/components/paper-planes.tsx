"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

/* ─── Physics constants ───────────────────────────────────────────────────
 *  Real paper-plane aerodynamics (simplified 2-D):
 *    Lift  = Cl * v²  (perpendicular to velocity, always "screen-upward")
 *    Drag  = Cd * v²  (opposing velocity)
 *    Gravity = g      (downward, +y in canvas coords)
 *
 *  Equilibrium cruise speed where lift == gravity (horizontal flight):
 *    v_eq = sqrt(GRAVITY / LIFT) ≈ sqrt(0.015 / 0.009) ≈ 1.29 px/frame
 *  Planes faster than v_eq climb; slower ones descend → natural glide arc.
 * ─────────────────────────────────────────────────────────────────────── */
const GRAVITY  = 0.020   // downward px/frame²
const LIFT     = 0.008   // lift coefficient — lift = LIFT * speed²
const DRAG     = 0.0050  // drag coefficient — higher = more deceleration from launch speed
const MAX_SPD  = 7.5     // px / frame (terminal velocity cap)

// SVG nose points upper-right at canvas angle −π/4,
// so we add +π/4 when drawing so the icon faces the velocity direction.
const SVG_OFFSET = Math.PI / 4

type Edge = "top" | "bottom" | "left" | "right"
const EDGES: Edge[] = ["top", "bottom", "left", "right"]
const OPPOSITE: Record<Edge, Edge> = {
  top: "bottom", bottom: "top", left: "right", right: "left",
}

const rand    = (a: number, b: number) => a + Math.random() * (b - a)
const randEdge = (): Edge => EDGES[Math.floor(Math.random() * 4)]

/* ─── SVG icon — two colour schemes ───────────────────────────────────── */
function makeSVG(bodyColor: string, bodyOpacity: number, streakColor: string) {
  return encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M20.3521 10.5208L18.6357 15.6701C17.4255 19.3008 16.8204 21.1161 15.933 21.6319C15.0889 22.1227 14.0463 22.1227 13.2022 21.6319C12.3148 21.1161 11.7097 19.3008 10.4995 15.6701C10.3052 15.0872 10.208 14.7957 10.0449 14.5521C9.88687 14.316 9.68404 14.1131 9.44793 13.9551C9.2043 13.792 8.91282 13.6948 8.32987 13.5005C4.69923 12.2903 2.88392 11.6852 2.36806 10.7978C1.87731 9.95369 1.87731 8.91112 2.36806 8.06698C2.88392 7.17964 4.69923 6.57453 8.32987 5.36432L13.4792 3.64788C17.9776 2.14842 20.2268 1.39869 21.414 2.58595C22.6013 3.77322 21.8516 6.02242 20.3521 10.5208Z"
        fill="${bodyColor}" opacity="${bodyOpacity}"/>
      <path
        d="M13.0458 10.9024C12.7546 10.6079 12.7572 10.1331 13.0517 9.84179L17.2622 5.67768C17.5568 5.38641 18.0316 5.38904 18.3229 5.68355C18.6142 5.97807 18.6115 6.45293 18.317 6.7442L14.1065 10.9083C13.812 11.1996 13.3371 11.1969 13.0458 10.9024Z"
        fill="${streakColor}"/>
    </svg>`
  )
}

const SVG_DARK  = makeSVG("white",   0.60, "white")      // for dark  backgrounds
const SVG_LIGHT = makeSVG("#2d3a8c", 0.80, "#1a2470")   // for light backgrounds

const TRAIL_DARK  = "rgba(255,255,255,0.9)"
const TRAIL_LIGHT = "rgba(30,50,140,0.55)"

/* ─── Types ─────────────────────────────────────────────────────────────── */
let uid = 0

interface Plane {
  id: number
  x: number
  y: number
  vx: number       // velocity x (px/frame)
  vy: number       // velocity y (px/frame)
  angle: number    // visual heading = atan2(vy, vx), updated by physics
  scale: number
  opacity: number
  trail: { x: number; y: number }[]
  alive: boolean
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function edgePt(edge: Edge, W: number, H: number) {
  switch (edge) {
    case "top":    return { x: rand(W * 0.1, W * 0.9), y: -65 }
    case "bottom": return { x: rand(W * 0.1, W * 0.9), y: H + 65 }
    case "left":   return { x: -65, y: rand(H * 0.1, H * 0.9) }
    case "right":  return { x: W + 65, y: rand(H * 0.1, H * 0.9) }
  }
}

function spawn(W: number, H: number): Plane {
  const fromEdge = randEdge()
  const from     = edgePt(fromEdge, W, H)

  // aim roughly toward the opposite quadrant of the screen
  const toEdge = OPPOSITE[fromEdge]
  const to     = edgePt(toEdge, W, H)
  const base   = Math.atan2(to.y - from.y, to.x - from.x)

  const isLoop = Math.random() < 0.35

  let speed: number
  let angle: number

  if (isLoop) {
    // High-energy launch with a gentle upward nudge — physics curves it into a loop smoothly
    speed = rand(5.0, 7.0)
    angle = base - rand(0.14, 0.35)   // 8–20° upward bias; subtle enough for smooth entry
  } else {
    // Fast launch that decelerates into a glide — feels like a real throw
    speed = rand(3.0, 5.0)
    angle = base + rand(-0.35, 0.35)
  }

  return {
    id:      uid++,
    x:       from.x,
    y:       from.y,
    vx:      Math.cos(angle) * speed,
    vy:      Math.sin(angle) * speed,
    angle,
    scale:   rand(1.6, 2.5),
    opacity: rand(0.55, 0.85),
    trail:   [],
    alive:   true,
  }
}

/* ─── Physics step ───────────────────────────────────────────────────────── */
function step(p: Plane) {
  const spd = Math.hypot(p.vx, p.vy)
  if (spd < 0.01) { p.alive = false; return }

  const velAngle  = Math.atan2(p.vy, p.vx)

  // Lift: perpendicular to velocity, rotating −π/2 gives the
  // "screen-upward" normal when flying horizontally (left-hand rule in +y-down space).
  const liftAngle = velAngle - Math.PI / 2
  const liftMag   = LIFT * spd * spd

  // Drag magnitude opposes velocity
  const dragMag = DRAG * spd * spd

  const ax = Math.cos(liftAngle) * liftMag - (p.vx / spd) * dragMag
  const ay = Math.sin(liftAngle) * liftMag - (p.vy / spd) * dragMag + GRAVITY

  p.vx += ax
  p.vy += ay

  // Cap at terminal velocity
  const newSpd = Math.hypot(p.vx, p.vy)
  if (newSpd > MAX_SPD) {
    p.vx = (p.vx / newSpd) * MAX_SPD
    p.vy = (p.vy / newSpd) * MAX_SPD
  }

  p.x    += p.vx
  p.y    += p.vy
  // visual heading always tracks actual velocity direction → nose points where it's going
  p.angle = Math.atan2(p.vy, p.vx)
}

/* ─── Draw ───────────────────────────────────────────────────────────────── */
function draw(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  p: Plane,
  trailColor: string,
  isDark: boolean,
) {
  const { x, y, angle, scale, opacity, trail } = p
  const size = scale * 22

  // fading dotted trail
  for (let i = 1; i < trail.length; i++) {
    if (i % 4 !== 0) continue
    const t = i / trail.length
    ctx.save()
    ctx.globalAlpha = t * opacity * 0.22
    ctx.fillStyle   = trailColor
    ctx.beginPath()
    ctx.arc(trail[i].x, trail[i].y, scale * 0.55, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // plane icon
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle + SVG_OFFSET)
  ctx.globalAlpha = opacity
  ctx.shadowColor = isDark ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.12)"
  ctx.shadowBlur  = 8
  ctx.drawImage(img, -size / 2, -size / 2, size, size)
  ctx.restore()
}

const offScreen = (x: number, y: number, W: number, H: number) =>
  x < -160 || x > W + 160 || y < -160 || y > H + 160

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function PaperPlanes() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)

  // Gate portal to client-only to avoid SSR mismatch
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // clientWidth/clientHeight exclude the scrollbar — avoids horizontal overflow
    let W = document.documentElement.clientWidth
    let H = document.documentElement.clientHeight
    canvas.width  = W
    canvas.height = H

    // Pre-load both theme variants
    const darkImg  = new Image()
    const lightImg = new Image()
    darkImg.src  = `data:image/svg+xml;charset=utf-8,${SVG_DARK}`
    lightImg.src = `data:image/svg+xml;charset=utf-8,${SVG_LIGHT}`
    let darkReady = false, lightReady = false
    darkImg.onload  = () => { darkReady  = true }
    lightImg.onload = () => { lightReady = true }

    // Track current theme via html class list
    const themeState = {
      isDark: document.documentElement.classList.contains("dark"),
    }
    const themeObserver = new MutationObserver(() => {
      themeState.isDark = document.documentElement.classList.contains("dark")
    })
    themeObserver.observe(document.documentElement, { attributeFilter: ["class"] })

    const planes: Plane[] = []
    let raf   = 0
    let timer: ReturnType<typeof setTimeout>

    const onResize = () => {
      W = document.documentElement.clientWidth
      H = document.documentElement.clientHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener("resize", onResize)

    const scheduleSpawn = () => {
      timer = setTimeout(() => {
        if (planes.length < 3) planes.push(spawn(W, H))
        scheduleSpawn()
      }, rand(1000, 10000))
    }

    setTimeout(() => planes.push(spawn(W, H)), 600)
    scheduleSpawn()

    const tick = () => {
      // Sync canvas offset with scroll position every frame — same frame as
      // drawing so there is zero lag between page scroll and canvas position.
      canvas.style.top  = `${window.scrollY}px`
      canvas.style.left = `${window.scrollX}px`

      ctx.clearRect(0, 0, W, H)
      for (let i = planes.length - 1; i >= 0; i--) {
        const p = planes[i]
        step(p)
        if (!p.alive || offScreen(p.x, p.y, W, H)) { planes.splice(i, 1); continue }
        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 32) p.trail.shift()
        const dark  = themeState.isDark
        const img   = dark ? darkImg  : lightImg
        const ready = dark ? darkReady : lightReady
        if (ready) draw(ctx, img, p, dark ? TRAIL_DARK : TRAIL_LIGHT, dark)
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      window.removeEventListener("resize", onResize)
      themeObserver.disconnect()
    }
  }, [mounted])

  if (!mounted) return null

  // position:absolute + scroll listener is guaranteed viewport-relative
  // even when ancestor CSS (transforms, contain, etc.) would trap position:fixed.
  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 15,
        display: "block",
      }}
    />,
    document.body
  )
}

