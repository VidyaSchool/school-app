import { requireRole } from "@/lib/auth-helpers"
import { headers } from "next/headers"
import { FeeManagementClient } from "./fee-management-client"

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function AdminFeeManagementPage({ params }: PageProps) {
  const { username } = await params
  // Ensure only admins can access this page
  await requireRole(['admin'])

  const cookieHeader = (await headers()).get("cookie") || ""

  let installments: any[] = []
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
    const res = await fetch(`${backendUrl}/api/admin/fee-management`, {
      headers: {
        "cookie": cookieHeader,
      },
      cache: "no-store",
    })
    if (res.ok) {
      const data = await res.json()
      installments = data.map((inst: any) => ({
        ...inst,
        dueDate: inst.dueDate ? new Date(inst.dueDate).toISOString() : null,
        paidDate: inst.paidDate ? new Date(inst.paidDate).toISOString() : null,
      }))
    } else {
      console.error("Failed to fetch fee-management from FastAPI backend:", await res.text())
    }
  } catch (err) {
    console.error("Error fetching fee-management:", err)
  }

  return (
    <FeeManagementClient 
      initialInstallments={installments} 
      adminUsername={username} 
    />
  )
}
