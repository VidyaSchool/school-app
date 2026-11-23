import { requireRole } from '@/lib/auth-helpers'
import { Metadata } from 'next'
import TeacherEmailClient from './email-client'

export const metadata: Metadata = {
  title: 'Email — VidyaSchool',
  description: 'Your @blazeneuro.com school email inbox',
}

export default async function TeacherEmailPage() {
  // Server-side auth guard — teachers, librarians, admins only
  await requireRole(['teacher', 'admin'])

  return <TeacherEmailClient />
}
