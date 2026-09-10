import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSession } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { user as userTable, userProfile as userProfileTable, feeStructure as feeStructureTable, feeInstallment as feeInstallmentTable } from "@/lib/schema"
import { eq, asc } from "drizzle-orm"
import crypto from "crypto"

export function isTransportUser(transportMode?: string | null): boolean {
  if (!transportMode) return false
  const mode = String(transportMode).trim().toLowerCase()
  const nonTransport = new Set([
    "none", "", "walking", "walk", "self", "self_transport",
    "self transport", "on_foot", "foot", "private", "no", "personal"
  ])
  return !nonTransport.has(mode)
}

const ACADEMIC_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'account')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { studentId } = await params

  try {
    // 1. Get student user
    const studentUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, studentId))
      .then(res => res[0])

    if (!studentUser) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // 2. Get student profile
    const profile = await db
      .select()
      .from(userProfileTable)
      .where(eq(userProfileTable.userId, studentId))
      .then(res => res[0])

    const studentClass = profile?.class || "10"
    const usesTransport = isTransportUser(profile?.transportMode)

    // 3. Get fee structure for student's class
    const structureRow = await db
      .select()
      .from(feeStructureTable)
      .where(eq(feeStructureTable.className, studentClass))
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
      // Default structure if not configured yet
      components = [
        { id: `c${studentClass}-1`, name: "Tuition Fee", amount: 1200, billingPeriod: "Monthly" },
        { id: `c${studentClass}-2`, name: "Platform Fee", amount: 30, billingPeriod: "Monthly" },
      ]
    }

    // Calculate base monthly total from components
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

    // Apply transport fee ONLY if student uses school transport
    const transportFeeApplied = usesTransport ? transportFee : 0
    const netMonthlyTotal = baseMonthlyTotal + transportFeeApplied

    // 4. Fetch or generate installments
    let installments = await db
      .select()
      .from(feeInstallmentTable)
      .where(eq(feeInstallmentTable.userId, studentId))
      .orderBy(asc(feeInstallmentTable.dueDate))

    if (installments.length === 0) {
      const currentYear = new Date().getFullYear().toString()
      const newInstallments = ACADEMIC_MONTHS.map((month, idx) => {
        const dueDate = `${currentYear}-${String(idx + 1).padStart(2, '0')}-10`
        return {
          id: `inst-${crypto.randomUUID()}`,
          userId: studentId,
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
          .where(eq(feeInstallmentTable.userId, studentId))
          .orderBy(asc(feeInstallmentTable.dueDate))
      } catch (e) {
        console.warn("Failed to auto-insert default installments:", e)
      }
    } else {
      // Update unpaid installment amounts to match netMonthlyTotal if transport_mode or components changed
      for (const inst of installments) {
        if (inst.status !== "paid" && inst.amount !== netMonthlyTotal) {
          try {
            await db
              .update(feeInstallmentTable)
              .set({ amount: netMonthlyTotal, updatedAt: new Date() })
              .where(eq(feeInstallmentTable.id, inst.id))
            inst.amount = netMonthlyTotal
          } catch (e) {
            console.warn("Failed to update installment amount:", e)
          }
        }
      }
    }

    return NextResponse.json({
      student: {
        id: studentUser.id,
        name: studentUser.name,
        username: profile?.username || studentUser.name.toLowerCase().replace(/\s+/g, "_"),
        class: studentClass,
        section: profile?.section || "A",
        admission_number: profile?.admissionNumber || "ADM-001",
        transport_mode: profile?.transportMode || "walking",
        uses_transport: usesTransport,
      },
      classNum: studentClass,
      components,
      transportFee,
      transportFeeApplied,
      baseMonthlyTotal,
      netMonthlyTotal,
      installments: installments.map((inst) => ({
        id: inst.id,
        month: inst.month,
        year: inst.year,
        amount: inst.amount,
        dueDate: inst.dueDate,
        due_date: inst.dueDate,
        status: inst.status,
        paidDate: inst.paidDate,
        paid_date: inst.paidDate,
        receiptNo: inst.receiptNo,
        receipt_no: inst.receiptNo,
        paymentMethod: inst.paymentMethod,
        payment_method: inst.paymentMethod,
      })),
    })
  } catch (error) {
    console.error("[student fee breakdown GET] Error:", error)
    return NextResponse.json({ error: "Failed to fetch student fee breakdown" }, { status: 500 })
  }
}
