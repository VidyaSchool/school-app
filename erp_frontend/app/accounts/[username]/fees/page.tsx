import { Suspense } from "react"
import { StudentFeesClient } from "./student-fees-client"

export default async function StudentFeesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading Student Fees...</div>}>
      <StudentFeesClient username={username} />
    </Suspense>
  )
}
