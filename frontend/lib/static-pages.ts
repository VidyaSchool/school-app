// Auto-generated static pages registry
import page_about_vidyaschool from "../data/static-pages/about-vidyaschool.json"
import page_academic_calendar from "../data/static-pages/academic-calendar.json"
import page_achievements from "../data/static-pages/achievements.json"
import page_activities from "../data/static-pages/activities.json"
import page_admission_process from "../data/static-pages/admission-process.json"
import page_admission from "../data/static-pages/admission.json"
import page_affiliation from "../data/static-pages/affiliation.json"
import page_announcements from "../data/static-pages/announcements.json"
import page_annual_report from "../data/static-pages/annual-report.json"
import page_arts_and_music from "../data/static-pages/arts-and-music.json"
import page_certificates from "../data/static-pages/certificates.json"
import page_circulars from "../data/static-pages/circulars.json"
import page_clubs from "../data/static-pages/clubs.json"
import page_contact from "../data/static-pages/contact.json"
import page_curriculum from "../data/static-pages/curriculum.json"
import page_eligibility from "../data/static-pages/eligibility.json"
import page_events from "../data/static-pages/events.json"
import page_examinations from "../data/static-pages/examinations.json"
import page_faculty_details from "../data/static-pages/faculty-details.json"
import page_faqs from "../data/static-pages/faqs.json"
import page_fee_structure from "../data/static-pages/fee-structure.json"
import page_get_involved from "../data/static-pages/get-involved.json"
import page_infrastructure_details from "../data/static-pages/infrastructure-details.json"
import page_infrastructure from "../data/static-pages/infrastructure.json"
import page_laboratories from "../data/static-pages/laboratories.json"
import page_leadership from "../data/static-pages/leadership.json"
import page_library from "../data/static-pages/library.json"
import page_mandatory_public_disclosure from "../data/static-pages/mandatory-public-disclosure.json"
import page_notices from "../data/static-pages/notices.json"
import page_principals_message from "../data/static-pages/principals-message.json"
import page_pta from "../data/static-pages/pta.json"
import page_results from "../data/static-pages/results.json"
import page_school_management_committee from "../data/static-pages/school-management-committee.json"
import page_sports from "../data/static-pages/sports.json"
import page_stem from "../data/static-pages/stem.json"
import page_student_life from "../data/static-pages/student-life.json"
import page_subjects from "../data/static-pages/subjects.json"
import page_syllabus from "../data/static-pages/syllabus.json"
import page_teachers_and_staff from "../data/static-pages/teachers-and-staff.json"
import page_tech_fest from "../data/static-pages/tech-fest.json"
import page_textbooks from "../data/static-pages/textbooks.json"
import page_vision_and_mission from "../data/static-pages/vision-and-mission.json"

export interface EditorJsBlock {
  id?: string
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}

export interface ElementorWidget {
  id: string
  type: string
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>
}

export interface StaticPageData {
  slug: string
  title: string
  description?: string
  widgets: {
    blocks?: EditorJsBlock[]
    time?: number
    version?: string
  } | ElementorWidget[]
}

const STATIC_PAGES_REGISTRY: Record<string, StaticPageData> = {
  "about-vidyaschool": page_about_vidyaschool as unknown as StaticPageData,
  "academic-calendar": page_academic_calendar as unknown as StaticPageData,
  "achievements": page_achievements as unknown as StaticPageData,
  "activities": page_activities as unknown as StaticPageData,
  "admission-process": page_admission_process as unknown as StaticPageData,
  "admission": page_admission as unknown as StaticPageData,
  "affiliation": page_affiliation as unknown as StaticPageData,
  "announcements": page_announcements as unknown as StaticPageData,
  "annual-report": page_annual_report as unknown as StaticPageData,
  "arts-and-music": page_arts_and_music as unknown as StaticPageData,
  "certificates": page_certificates as unknown as StaticPageData,
  "circulars": page_circulars as unknown as StaticPageData,
  "clubs": page_clubs as unknown as StaticPageData,
  "contact": page_contact as unknown as StaticPageData,
  "curriculum": page_curriculum as unknown as StaticPageData,
  "eligibility": page_eligibility as unknown as StaticPageData,
  "events": page_events as unknown as StaticPageData,
  "examinations": page_examinations as unknown as StaticPageData,
  "faculty-details": page_faculty_details as unknown as StaticPageData,
  "faqs": page_faqs as unknown as StaticPageData,
  "fee-structure": page_fee_structure as unknown as StaticPageData,
  "get-involved": page_get_involved as unknown as StaticPageData,
  "infrastructure-details": page_infrastructure_details as unknown as StaticPageData,
  "infrastructure": page_infrastructure as unknown as StaticPageData,
  "laboratories": page_laboratories as unknown as StaticPageData,
  "leadership": page_leadership as unknown as StaticPageData,
  "library": page_library as unknown as StaticPageData,
  "mandatory-public-disclosure": page_mandatory_public_disclosure as unknown as StaticPageData,
  "notices": page_notices as unknown as StaticPageData,
  "principals-message": page_principals_message as unknown as StaticPageData,
  "pta": page_pta as unknown as StaticPageData,
  "results": page_results as unknown as StaticPageData,
  "school-management-committee": page_school_management_committee as unknown as StaticPageData,
  "sports": page_sports as unknown as StaticPageData,
  "stem": page_stem as unknown as StaticPageData,
  "student-life": page_student_life as unknown as StaticPageData,
  "subjects": page_subjects as unknown as StaticPageData,
  "syllabus": page_syllabus as unknown as StaticPageData,
  "teachers-and-staff": page_teachers_and_staff as unknown as StaticPageData,
  "tech-fest": page_tech_fest as unknown as StaticPageData,
  "textbooks": page_textbooks as unknown as StaticPageData,
  "vision-and-mission": page_vision_and_mission as unknown as StaticPageData,
}

/**
 * Normalizes a slug or path identifier
 */
export function normalizeSlug(slug: string): string {
  if (!slug) return ""
  return slug
    .trim()
    .toLowerCase()
    .replace(/^\/?p\//, "")
    .replace(/^\/+|\/+$/g, "")
}

/**
 * Retrieves a static page by slug or path
 */
export function getStaticPage(identifier: string): StaticPageData | null {
  const clean = normalizeSlug(identifier)
  if (!clean) return null
  return STATIC_PAGES_REGISTRY[clean] || null
}

/**
 * Returns all static pages
 */
export function getAllStaticPages(): StaticPageData[] {
  return Object.values(STATIC_PAGES_REGISTRY)
}

/**
 * Returns all available static slugs
 */
export function getAllStaticSlugs(): string[] {
  return Object.keys(STATIC_PAGES_REGISTRY)
}

/**
 * Checks if a given slug exists statically
 */
export function hasStaticPage(identifier: string): boolean {
  return Boolean(getStaticPage(identifier))
}
