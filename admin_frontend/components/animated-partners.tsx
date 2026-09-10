"use client"

import { BlurImage } from "@/components/blur-image"

interface Partner {
  name: string
  logo: string
  width: number
  height: number
}

interface AnimatedPartnersProps {
  partners: readonly Partner[]
}

export default function AnimatedPartners({ partners }: AnimatedPartnersProps) {
  const noTextLogos = ['KPMG', 'ReNew Power', 'Bird Group', 'IndiGo']
  
  return (
    <div className="relative flex w-full overflow-hidden mask-gradient">
      <div className="animate-marquee flex items-center py-8 will-change-transform">
        {Array.from({ length: 3 }).map((_, groupIndex) => 
          partners.map((partner, index) => (
            <div
              key={`${groupIndex}-${index}`}
              style={{
                animation: `float 8s ease-in-out ${-index * 1.25}s infinite`
              }}
              className="flex items-center justify-center bg-muted/20 border border-border/40 hover:border-foreground/30 rounded-lg px-8 py-5 min-w-[210px] h-[72px] mr-8 transition-colors duration-200"
            >
              <div className="flex items-center gap-3 font-semibold text-foreground/75 text-sm">
                <div className="relative flex items-center justify-center bg-white p-1 rounded shadow-xs">
                  <BlurImage 
                    src={partner.logo} 
                    width={partner.width} 
                    height={partner.height} 
                    alt={`${partner.name} Logo`} 
                    className="object-contain"
                    loading="lazy"
                    quality={90}
                  />
                </div>
                {!noTextLogos.includes(partner.name) && <span>{partner.name}</span>}
              </div>
            </div>
          ))
        )}
      </div>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
      `}</style>
    </div>
  )
}
