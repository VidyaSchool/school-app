import * as React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookOpen } from 'lucide-react';
import { DocsThemeToggle } from '@/components/docs-theme-toggle';

const isLocal = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  : process.env.NODE_ENV === 'development';

const ERP_URL = process.env.NEXT_PUBLIC_ERP_URL || (isLocal ? 'http://localhost:3003' : 'https://erp.vidyaschool.com');

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2 font-bold text-sm tracking-tight">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>VIDYA SCHOOL</span>
        </div>
      ),
    },
    // see https://fumadocs.dev/docs/ui/navigation/links
    links: [
      { text: "Overview", url: "/docs" },
      { text: "Compliance", url: "/docs/compliance/mandatory-disclosure" },
      { text: "Academics", url: "/docs/academics/fee-structure" },
      { text: "ERP Portal", url: ERP_URL, external: true },
    ],
    themeSwitch: {
      component: <DocsThemeToggle />,
    },
    githubUrl: "https://github.com/VidyaSchool/school-app",
  };
}
