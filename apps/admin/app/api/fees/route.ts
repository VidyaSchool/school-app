import { NextResponse } from "next/server"
import { getAuthenticatedSession } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { userProfile as userProfileTable, feeStructure as feeStructureTable, feeInstallment as feeInstallmentTable } from "@/lib/schema"
import { eq, asc, or } from "drizzle-orm"
import crypto from "crypto"

export function isTransportUser(transportMode?: string | null): boolean {
  if (!transportMode) return false
  const mode = String(transportMode).trim().toLowerCase()
  return mode === "transport" || mode === "bus" || mode === "school_transport" || mode === "school transport" || mode === "van"
}

const ACADEMIC_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export async function GET() {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const profile = await db
      .select()
      .from(userProfileTable)
      .where(eq(userProfileTable.userId, userId))
      .then(res => res[0])

    const studentClass = profile?.class || "10"
    const classNum = parseInt(studentClass.replace(/\D/g, ""), 10) || 10
    const usesTransport = isTransportUser(profile?.transportMode)

    const structureRow = await db
      .select()
      .from(feeStructureTable)
      .where(
        or(
          eq(feeStructureTable.className, studentClass),
          eq(feeStructureTable.classNum, classNum)
        )
      )
      .then(res => res[0])

    let components: Array<{ id: string; name: string; amount: number; billingPeriod: string }> = []
    let transportFee = 2000

    if (structureRow) {
      transportFee = structureRow.transportFee
      try {
        components = JSON.parse(structureRow.components)
      } catch (e) {
        components = []
      }
    } else {
      components = [
        { id: `c${studentClass}-1`, name: "Tuition Fee", amount: 1200, billingPeriod: "Monthly" },
        { id: `c${studentClass}-2`, name: "Platform Fee", amount: 30, billingPeriod: "Monthly" },
      ]
    }

    let baseMonthlyTotal = 0
    for (const comp of components) {
      const amt = Number(comp.amount || 0)
      const period = comp.billingPeriod || "Monthly"
      if (period === "Monthly") {
        baseMonthlyTotal += amt
      } else if (period === "Quarterly") {
        baseMonthlyTotal += Math.round(amt / 3)
      } else if (period === "Annually") {
        baseMonthlyTotal += Math.round(amt / 12)
      }
    }

    const transportFeeApplied = usesTransport ? transportFee : 0
    const netMonthlyTotal = baseMonthlyTotal + transportFeeApplied

    let installments = await db
      .select()
      .from(feeInstallmentTable)
      .where(eq(feeInstallmentTable.userId, userId))
      .orderBy(asc(feeInstallmentTable.dueDate))

    if (installments.length === 0) {
      const currentYear = new Date().getFullYear().toString()
      const newInstallments = ACADEMIC_MONTHS.map((month, idx) => {
        const dueDate = `${currentYear}-${String(idx + 1).padStart(2, '0')}-10`
        return {
          id: `inst-${crypto.randomUUID()}`,
          userId,
          month,
          year: currentYear,
          amount: netMonthlyTotal,
          dueDate,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })

      try {
        await db.insert(feeInstallmentTable).values(newInstallments)
        installments = await db
          .select()
          .from(feeInstallmentTable)
          .where(eq(feeInstallmentTable.userId, userId))
          .orderBy(asc(feeInstallmentTable.dueDate))
      } catch (e) {
        console.warn("Failed to auto-insert student default installments:", e)
      }
    } else {
      for (const inst of installments) {
        if (inst.status !== "paid" && inst.amount !== netMonthlyTotal) {
          try {
            await db
              .update(feeInstallmentTable)
              .set({ amount: netMonthlyTotal, updatedAt: new Date() })
              .where(eq(feeInstallmentTable.id, inst.id))
            inst.amount = netMonthlyTotal
          } catch (e) {
            console.warn("Failed to update student installment amount:", e)
          }
        }
      }
    }

    return NextResponse.json(installments.map((inst) => ({
      id: inst.id,
      month: inst.month,
      year: inst.year,
      amount: inst.amount,
      due_date: inst.dueDate,
      dueDate: inst.dueDate,
      status: inst.status,
      paid_date: inst.paidDate,
      paidDate: inst.paidDate,
      receipt_no: inst.receiptNo,
      receiptNo: inst.receiptNo,
      payment_method: inst.paymentMethod,
      paymentMethod: inst.paymentMethod,
    })))
  } catch (error) {
    console.error("[/api/fees GET] Error:", error)
    return NextResponse.json({ error: "Failed to fetch student fees" }, { status: 500 })
  }
}
