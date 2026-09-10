import * as React from "react"

export default function PageBuilderEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {children}
    </div>
  )
}
