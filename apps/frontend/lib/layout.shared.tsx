import * as React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookOpen } from 'lucide-react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2 font-bold text-sm">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>VIDYA SCHOOL</span>
        </div>
      ),
    },
  };
}
