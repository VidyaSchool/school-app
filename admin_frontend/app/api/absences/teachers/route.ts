import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, teacherProfiles, userProfile } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Query active teachers from user joined with teacher_profiles and user_profile
    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        wingId: teacherProfiles.wingId,
        dailyFreeCount: teacherProfiles.dailyFreeCount,
        weeklyProxyCount: teacherProfiles.weeklyProxyCount,
        designation: userProfile.designation,
        teacherCategory: userProfile.teacherCategory,
        assignedClass: userProfile.class,
      })
      .from(user)
      .leftJoin(teacherProfiles, eq(user.id, teacherProfiles.userId))
      .leftJoin(userProfile, eq(user.id, userProfile.userId))
      .where(eq(user.role, 'teacher'))
      .orderBy(asc(user.name))

    const formattedTeachers = rows.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      image: t.image,
      wingId: t.wingId || 'General',
      dailyFreeCount: t.dailyFreeCount ?? 4,
      weeklyProxyCount: t.weeklyProxyCount ?? 0,
      designation: t.designation || 'Faculty',
      category: t.teacherCategory || 'TGT',
      assignedClass: t.assignedClass || null,
    }))

    return NextResponse.json({
      success: true,
      teachers: formattedTeachers,
    })
  } catch (error: any) {
    console.error('Error fetching teachers for absences:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch teachers' },
      { status: 500 }
    )
  }
}
