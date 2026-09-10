import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subjectClassRequest, user } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { getAuthenticatedSession } from '@/lib/auth-helpers'

export async function GET() {
  const session = await getAuthenticatedSession()
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const requests = await db.select({
      id: subjectClassRequest.id,
      class: subjectClassRequest.class,
      section: subjectClassRequest.section,
      subject: subjectClassRequest.subject,
      status: subjectClassRequest.status,
      createdAt: subjectClassRequest.createdAt,
      teacher: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
    .from(subjectClassRequest)
    .leftJoin(user, eq(subjectClassRequest.teacherId, user.id))
    .where(eq(subjectClassRequest.status, 'pending'))
    .orderBy(desc(subjectClassRequest.createdAt))

    // Formulate a clean array mapping like what client expects
    const resolvedRequests = requests.map(r => ({
      id: r.id,
      class: r.class,
      section: r.section,
      subject: r.subject,
      status: r.status,
      createdAt: r.createdAt?.toISOString(),
      teacher: r.teacher ? {
        id: r.teacher.id,
        name: r.teacher.name,
        email: r.teacher.email
      } : {
        id: '',
        name: 'Unknown',
        email: ''
      }
    }))

    return NextResponse.json(resolvedRequests)
  } catch (error: any) {
    console.error('Failed to fetch admin requests:', error)
    return NextResponse.json({ error: error.message || 'Failed to load requests' }, { status: 500 })
  }
}
