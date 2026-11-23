"use client"

import dynamic from "next/dynamic"

const PaperPlanes = dynamic(() => import("@/components/paper-planes"), { ssr: false })

export function PaperPlanesWrapper() {
  return <PaperPlanes />
}
