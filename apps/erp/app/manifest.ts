import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VidyaSchool Portal",
    short_name: "VidyaSchool",
    description: "Welcome to VidyaSchool, a premier educational portal dedicated to academic excellence, STEM innovation, and student growth.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    orientation: "any",
    icons: [
      {
        src: "/assets/vidyaschool/Logo/restored_no_title_no_bg.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/vidyaschool/Logo/Full_circle_logo.webp",
        sizes: "192x192",
        type: "image/webp",
        purpose: "maskable",
      },
    ],
  }
}
