import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { DocsStaticRenderer } from "@/components/docs-static-renderer"

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQs) | VIDYA SCHOOL",
  description: "Comprehensive guidance and answers for parents, students, educators, and community partners.",
}

export default function DocsFaqsPage() {
  const page = getStaticPage("faqs")
  if (!page) notFound()

  return <DocsStaticRenderer page={page} />
}
