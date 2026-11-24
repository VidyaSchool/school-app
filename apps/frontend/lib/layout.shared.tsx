import * as React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookOpen } from 'lucide-react';

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
      { text: "ERP Portal", url: "/login-accounts" },
    ],
    githubUrl: "https://github.com/VidyaSchool/school-app",
  };
}
