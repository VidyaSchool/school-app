import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '*.localhost',
    '*.local',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    qualities: [75, 85],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-navigation-menu'],
    serverActions: {
      // Raise the body size limit to 30MB so that large PDF/image uploads
      // via Server Actions and API routes don't return 413 errors.
      bodySizeLimit: '30mb',
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async redirects() {
    return [
      { source: "/p/school-management-committee", destination: "/docs/compliance/smc", permanent: false },
      { source: '/about', destination: '/about-vidyaschool', permanent: false },
      { source: '/principal-message', destination: '/principals-message', permanent: false },
      { source: '/faculty-and-staff', destination: '/teachers-and-staff', permanent: false },
      { source: '/management-committee', destination: '/docs/compliance/smc', permanent: false },

      // Institutional Compliance redirects to /docs/
      { source: '/mandatory-public-disclosure', destination: '/docs/compliance/mandatory-disclosure', permanent: false },
      { source: '/p/mandatory-public-disclosure', destination: '/docs/compliance/mandatory-disclosure', permanent: false },
      { source: '/affiliation', destination: '/docs/compliance/affiliation', permanent: false },
      { source: '/p/affiliation', destination: '/docs/compliance/affiliation', permanent: false },
      { source: '/annual-report', destination: '/docs/compliance/annual-report', permanent: false },
      { source: '/p/annual-report', destination: '/docs/compliance/annual-report', permanent: false },
      { source: '/school-management-committee', destination: '/docs/compliance/smc', permanent: false },
      { source: '/pta', destination: '/docs/compliance/pta', permanent: false },
      { source: '/p/pta', destination: '/docs/compliance/pta', permanent: false },
      { source: '/certificates', destination: '/docs/compliance/certificates', permanent: false },
      { source: '/p/certificates', destination: '/docs/compliance/certificates', permanent: false },

      // Academics redirects to /docs/
      { source: '/fee-structure', destination: '/docs/academics/fee-structure', permanent: false },
      { source: '/p/fee-structure', destination: '/docs/academics/fee-structure', permanent: false },
      { source: '/academic-calendar', destination: '/docs/academics/academic-calendar', permanent: false },
      { source: '/p/academic-calendar', destination: '/docs/academics/academic-calendar', permanent: false },
      { source: '/curriculum', destination: '/docs/academics/curriculum', permanent: false },
      { source: '/p/curriculum', destination: '/docs/academics/curriculum', permanent: false },
      { source: '/syllabus', destination: '/docs/academics/syllabus', permanent: false },
      { source: '/p/syllabus', destination: '/docs/academics/syllabus', permanent: false },
      { source: '/textbooks', destination: '/docs/academics/textbooks', permanent: false },
      { source: '/p/textbooks', destination: '/docs/academics/textbooks', permanent: false },
      { source: '/examinations', destination: '/docs/academics/examinations', permanent: false },
      { source: '/p/examinations', destination: '/docs/academics/examinations', permanent: false },
      { source: '/results', destination: '/docs/academics/results', permanent: false },
      { source: '/p/results', destination: '/docs/academics/results', permanent: false },

      // Admissions & FAQs redirects to /docs/
      { source: '/admission-process', destination: '/docs/admissions/process', permanent: false },
      { source: '/p/admission-process', destination: '/docs/admissions/process', permanent: false },
      { source: '/eligibility', destination: '/docs/admissions/eligibility', permanent: false },
      { source: '/p/eligibility', destination: '/docs/admissions/eligibility', permanent: false },
      { source: '/faqs', destination: '/docs/faqs', permanent: false },
      { source: '/p/faqs', destination: '/docs/faqs', permanent: false },

      // Docs category index redirects
      { source: '/docs/compliance', destination: '/docs/compliance/mandatory-disclosure', permanent: false },
      { source: '/docs/academics', destination: '/docs/academics/fee-structure', permanent: false },
      { source: '/docs/getting-started', destination: '/docs/getting-started/overview', permanent: false },
      { source: '/docs/auth', destination: '/docs/auth/signup', permanent: false },
      { source: '/docs/student', destination: '/docs/student/onboarding', permanent: false },
      { source: '/docs/teacher', destination: '/docs/teacher/roster', permanent: false },
      { source: '/docs/admissions', destination: '/docs/admissions/overview', permanent: false },
      { source: '/docs/co-curriculars', destination: '/docs/co-curriculars/overview', permanent: false },
      { source: '/docs/developers', destination: '/docs/developers/architecture', permanent: false },
      { source: '/docs/legal', destination: '/docs/legal/terms-of-service', permanent: false },

      // Docs legal legacy path redirects
      { source: '/docs/terms-of-service', destination: '/docs/legal/terms-of-service', permanent: false },
      { source: '/docs/privacy-policy', destination: '/docs/legal/privacy-policy', permanent: false },
      { source: '/docs/acceptable-use', destination: '/docs/legal/acceptable-use', permanent: false },
      { source: '/docs/cookie-policy', destination: '/docs/legal/cookie-policy', permanent: false },
      { source: '/docs/refund-policy', destination: '/docs/legal/refund-policy', permanent: false },
      { source: '/docs/security-policy', destination: '/docs/legal/security-policy', permanent: false },
      { source: '/docs/dmca-policy', destination: '/docs/legal/dmca-policy', permanent: false },
      { source: '/docs/ai-disclaimer', destination: '/docs/legal/ai-disclaimer', permanent: false },

      // ERP and Auth Portal redirects
      { source: '/erp', destination: process.env.NEXT_PUBLIC_ERP_URL || 'https://erp.vidyaschool.com', permanent: false },
      { source: '/login-accounts', destination: `${process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.vidyaschool.com'}/login-accounts`, permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/uploads/:path*`,
      },
      {
        source: '/:slug((?!api|_next|assets|uploads|student|teacher|librarian|admin|accounts|contact|dashboard|docs|downloads|gallery|login|login-accounts|signup|mandatory-public-disclosure|circulars|monitoring|p|sitemap|robots\\.txt|favicon\\.ico).*)',
        destination: '/p/:slug',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(withMDX(nextConfig), {
  org: process.env.SENTRY_ORG || "vidya-school",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
