import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { db } from "@/lib/db"
import { galleryImage } from "@/lib/schema"
import { asc, desc } from "drizzle-orm"
import { GalleryClient, GalleryItem } from "./gallery-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Photo Gallery | The VIDYA School",
  description:
    "Explore our vibrant student community, high-tech science labs, robotics innovation workshops, performing arts, and institutional memories at The VIDYA School.",
}

/* ── Fallback Static Gallery Dataset ─────────────────────────────────── */
const STATIC_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g1",
    title: "VidyaSchool Campus Overview",
    category: "Campus & Life",
    src: "/assets/vidyaschool/school.jpg",
    aspectRatio: "aspect-[16/9]",
    description: "State-of-the-art academic building located in DLF Phase 3, Gurugram.",
    location: "Main Campus, Gurugram",
    date: "2026",
  },
  {
    id: "g2",
    title: "Lego STEM Robotics Workshop",
    category: "STEM & Robotics",
    src: "/assets/vidyaschool/student_robotics.jpg",
    aspectRatio: "aspect-[4/3]",
    description: "Students building and programming autonomous Lego Mindstorms robots.",
    location: "Robotics Innovation Lab",
    date: "2026",
  },
  {
    id: "g3",
    title: "Indian Classical Dance Ensemble",
    category: "Arts & Music",
    src: "/assets/vidyaschool/student_classical_dance.jpg",
    aspectRatio: "aspect-[4/3]",
    description: "Students performing traditional Kathak and Bharatanatyam recital.",
    location: "Auditorium Stage",
    date: "2026",
  },
  {
    id: "g4",
    title: "Choral Singing & Vocal Performance",
    category: "Arts & Music",
    src: "/assets/vidyaschool/student_singing.jpg",
    aspectRatio: "aspect-square",
    description: "School choir performing harmony choir arrangements during annual festival.",
    location: "Cultural Hall",
    date: "2026",
  },
  {
    id: "g5",
    title: "Musical Instruments Practice",
    category: "Arts & Music",
    src: "/assets/vidyaschool/student_playing.jpg",
    aspectRatio: "aspect-[4/3]",
    description: "Hands-on instrumental music sessions featuring sitar, tabla, and keyboard.",
    location: "Music Studio",
    date: "2026",
  },
  {
    id: "g6",
    title: "Classroom Learning & Digital Interactive Study",
    category: "Campus & Life",
    src: "/assets/vidyaschool/student_1.jpg",
    aspectRatio: "aspect-[4/3]",
    description: "Interactive smartboard teaching encouraging collaborative student discussions.",
    location: "Academic Block",
    date: "2026",
  },
  {
    id: "g7",
    title: "Science & Chemistry Practical Lab",
    category: "STEM & Robotics",
    src: "/assets/vidyaschool/student_2.jpg",
    aspectRatio: "aspect-square",
    description: "Hands-on experiments in our modern chemistry and physical sciences laboratory.",
    location: "Sciences Complex",
    date: "2026",
  },
  {
    id: "g8",
    title: "Central Library & Knowledge Hub",
    category: "Campus & Life",
    src: "/assets/vidyaschool/student_3.jpg",
    aspectRatio: "aspect-[16/9]",
    description: "Quiet reading zones, research desks, and digital catalog workstations.",
    location: "Library Annex",
    date: "2026",
  },
  {
    id: "g9",
    title: "Computer Science & Coding Workstation",
    category: "STEM & Robotics",
    src: "/assets/vidyaschool/student_4.jpg",
    aspectRatio: "aspect-[4/3]",
    description: "Students coding in Python and web development in our high-speed IT lab.",
    location: "Computer Lab 2",
    date: "2026",
  },
  {
    id: "g10",
    title: "Institutional Leadership & Award Ceremony",
    category: "Leadership",
    src: "/assets/illustrations/principle.png",
    aspectRatio: "aspect-[16/9]",
    description: "Principal Ila Sarin receiving institutional recognition at Youth Ideathon IIT Delhi.",
    location: "IIT Delhi Auditorium",
    date: "2026",
  },
  {
    id: "g11",
    title: "Founder Vision & Philanthropic Heritage",
    category: "Leadership",
    src: "/assets/vidyaschool/vidya-founder.png",
    aspectRatio: "aspect-square",
    description: "Empowering underprivileged youth through practical, modern education.",
    location: "Vidya Foundation",
    date: "2026",
  },
  {
    id: "g12",
    title: "Modern Interactive Learning Hub",
    category: "Campus & Life",
    src: "/assets/illustrations/hero_section.png",
    aspectRatio: "aspect-[16/9]",
    description: "Digital learning ecosystem connecting students, parents, and faculty.",
    location: "Vidya School Digital Portal",
    date: "2026",
  },
]

async function getDbGalleryImages(): Promise<GalleryItem[]> {
  try {
    const rows = await db
      .select()
      .from(galleryImage)
      .orderBy(asc(galleryImage.order), desc(galleryImage.createdAt))

    return rows
      .filter((img) => {
        if (!img?.src || typeof img.src !== "string") return false
        const s = img.src.trim()
        if (/^(javascript|data|vbscript):/i.test(s)) return false
        return s.startsWith("/") || s.startsWith("https://") || s.startsWith("http://")
      })
      .map((img) => ({
        id: String(img.id).replace(/[^a-zA-Z0-9_-]/g, ""),
        title: String(img.title || "Campus Photograph").replace(/<[^>]*>?/gm, "").slice(0, 150),
        category: img.category || "Campus & Life",
        src: img.src.trim(),
        aspectRatio: img.aspectRatio || "aspect-[4/3]",
        description: String(img.description || "").replace(/<[^>]*>?/gm, "").slice(0, 1000),
        location: String(img.location || "Main Campus, Gurugram").replace(/<[^>]*>?/gm, "").slice(0, 100),
        date: String(img.date || "2026").replace(/<[^>]*>?/gm, "").slice(0, 50),
      }))
  } catch (err) {
    console.error("Failed to load gallery images from DB:", err)
    return []
  }
}

export default async function GalleryPage() {
  const dbItems = await getDbGalleryImages()
  const dbSrcs = new Set(dbItems.map((i) => i.src))
  const remainingStatic = STATIC_GALLERY_ITEMS.filter((i) => !dbSrcs.has(i.src))
  const combined = [...dbItems, ...remainingStatic]

  return (
    <>
      <Header />
      <GalleryClient initialItems={combined} />
      <Footer />
    </>
  )
}
