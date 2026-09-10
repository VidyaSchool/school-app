import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getAuthenticatedSession } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { feeStructure } from "@/lib/schema"
import crypto from "crypto"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

const CLASSES_ORDER = ["Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
const DEFAULT_CLASS_FEES: Record<string, number> = {
  Nursery: 6000, KG: 6000,
  "1": 8000, "2": 8000, "3": 8000, "4": 8000, "5": 8000,
  "6": 10000, "7": 10000, "8": 10000,
  "9": 12000, "10": 12000,
  "11": 15000, "12": 15000,
}
const CLASS_KEY_TO_NUM: Record<string, number> = {
  Nursery: -1, KG: 0,
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6,
  "7": 7, "8": 8, "9": 9, "10": 10, "11": 11, "12": 12
}

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'account')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1. Attempt FastAPI backend first if available
  const cookieHeader = (await headers()).get("cookie") || ""
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/fee-structures`, {
      headers: {
        cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (err) {
    console.warn("[fee-structures GET] FastAPI backend unavailable, querying DB directly...")
  }

  // 2. Direct Database Fallback via Drizzle (Zero 500 errors!)
  try {
    const existingRows = await db.select().from(feeStructure)
    const existingMap = new Map<string, typeof existingRows[0]>()

    for (const r of existingRows) {
      const key = r.className || String(r.classNum)
      existingMap.set(key, r)
    }

    const result = []
    const newRowsToInsert = []

    for (const classKey of CLASSES_ORDER) {
      let row = existingMap.get(classKey)
      if (!row) {
        const num = CLASS_KEY_TO_NUM[classKey] ?? 10
        const tuition = DEFAULT_CLASS_FEES[classKey] ?? 8000
        const defaultComponents = [
          { id: `c${classKey}-1`, name: "Tuition Fee", amount: tuition, billingPeriod: "Monthly" },
          { id: `c${classKey}-2`, name: "Computing & Activity Access", amount: 500, billingPeriod: "Monthly" },
          { id: `c${classKey}-3`, name: "Co-Curricular Activities", amount: 1000, billingPeriod: "Monthly" },
          { id: `c${classKey}-4`, name: "Examination Fee", amount: 1500, billingPeriod: "Quarterly" },
        ]

        row = {
          id: `fs-${crypto.randomUUID()}`,
          classNum: num,
          className: classKey,
          components: JSON.stringify(defaultComponents),
          transportFee: 2000,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        newRowsToInsert.push(row)
      }

      let parsedComponents = []
      try {
        parsedComponents = JSON.parse(row.components)
      } catch (e) {
        parsedComponents = []
      }

      result.push({
        classKey,
        classNum: row.classNum,
        className: classKey === "Nursery" || classKey === "KG" ? classKey : `Class ${classKey}`,
        components: parsedComponents,
        transportFee: row.transportFee,
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
      })
    }

    if (newRowsToInsert.length > 0) {
      try {
        await db.insert(feeStructure).values(newRowsToInsert)
      } catch (insertErr) {
        console.warn("[fee-structures GET] DB insert default rows warning:", insertErr)
      }
    }

    return NextResponse.json(result)
  } catch (dbErr) {
    console.error("[fee-structures GET] DB fallback error:", dbErr)
    return NextResponse.json({ error: "Failed to load fee structures" }, { status: 500 })
  }
}
