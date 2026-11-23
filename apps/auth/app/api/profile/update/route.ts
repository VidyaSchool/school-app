import { NextRequest } from 'next/server'
import { PATCH as handlePatch, GET as handleGet } from '../route'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  return handlePatch(req)
}

export async function GET(req: NextRequest) {
  return handleGet(req)
}
