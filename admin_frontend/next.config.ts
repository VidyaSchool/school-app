import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
      { source: '/about', destination: '/#about', permanent: false },
      { source: '/principal-message', destination: '/mandatory-public-disclosure#general-info', permanent: false },
      { source: '/infrastructure', destination: '/mandatory-public-disclosure#infrastructure', permanent: false },
      { source: '/faculty-and-staff', destination: '/mandatory-public-disclosure#staff', permanent: false },
      { source: '/management-committee', destination: '/mandatory-public-disclosure#documents-info', permanent: false },
      { source: '/curriculum', destination: '/mandatory-public-disclosure#academics', permanent: false },
      { source: '/academic-calendar', destination: '/mandatory-public-disclosure#academics', permanent: false },
      { source: '/annual-report', destination: '/mandatory-public-disclosure#academics', permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/:slug((?!api|_next|assets|admin|auth|circulars|contact|dashboard|login|mandatory-public-disclosure|p|unauthorized|favicon\\.ico).*)',
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

export default withSentryConfig(nextConfig, {
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
