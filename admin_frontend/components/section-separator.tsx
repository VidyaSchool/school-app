"use client"

export function SectionSeparator() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-6 select-none overflow-hidden my-4 space-y-3">
      {/* Top Separator */}
      <img
        src="/assets/illustrations/separator.svg"
        alt="Top separator"
        className="w-full max-w-5xl h-7 object-contain dark:invert dark:hue-rotate-180 opacity-80 dark:opacity-90 pointer-events-none -translate-x-8 sm:-translate-x-16"
      />

      {/* Center Capitalized Text */}
      <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-foreground/80 py-0.5">
        A LITTLE ABOUT US
      </span>

      {/* Bottom Rotated Separator */}
      <img
        src="/assets/illustrations/separator.svg"
        alt="Bottom separator"
        className="w-full max-w-5xl h-7 object-contain dark:invert dark:hue-rotate-180 opacity-80 dark:opacity-90 pointer-events-none rotate-180 translate-x-8 sm:translate-x-16"
      />
    </div>
  )
}
