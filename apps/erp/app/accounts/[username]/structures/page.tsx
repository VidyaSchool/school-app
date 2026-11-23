import { Suspense } from "react"
import { FeeStructuresClient } from "./fee-structures-client"

export default async function FeeStructuresPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading Fee Structures...</div>}>
      <FeeStructuresClient username={username} />
    </Suspense>
  )
}
