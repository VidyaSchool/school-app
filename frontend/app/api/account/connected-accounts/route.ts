import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { account as accountTable } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await db
      .select({
        id: accountTable.id,
        providerId: accountTable.providerId,
        createdAt: accountTable.createdAt,
      })
      .from(accountTable)
      .where(eq(accountTable.userId, session.user.id))

    const googleAccount = accounts.find((a) => a.providerId === 'google')
    const githubAccount = accounts.find((a) => a.providerId === 'github')
    const hasCredential = accounts.some((a) => a.providerId === 'credential')

    return NextResponse.json({
      google: {
        connected: !!googleAccount,
        createdAt: googleAccount?.createdAt || null,
        id: googleAccount?.id || null,
      },
      github: {
        connected: !!githubAccount,
        createdAt: githubAccount?.createdAt || null,
        id: githubAccount?.id || null,
      },
      hasPassword: hasCredential,
      totalMethods: accounts.length,
    })
  } catch (error: any) {
    console.error('[GET /api/account/connected-accounts error]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connected accounts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { provider } = body

    if (provider !== 'google' && provider !== 'github') {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    // Safety check: ensure user has at least one other login method so they don't get locked out
    const accounts = await db
      .select()
      .from(accountTable)
      .where(eq(accountTable.userId, session.user.id))

    if (accounts.length <= 1) {
      return NextResponse.json(
        {
          error:
            'Cannot disconnect your only sign-in method. Please ensure you have a password or another provider connected first.',
        },
        { status: 400 }
      )
    }

    await db
      .delete(accountTable)
      .where(
        and(
          eq(accountTable.userId, session.user.id),
          eq(accountTable.providerId, provider)
        )
      )

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected ${
        provider.charAt(0).toUpperCase() + provider.slice(1)
      } account.`,
    })
  } catch (error: any) {
    console.error('[POST /api/account/connected-accounts error]:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    )
  }
}
