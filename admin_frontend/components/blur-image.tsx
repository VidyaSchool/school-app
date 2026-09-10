"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"

export function BlurImage({ className, alt, onLoad, ...props }: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <Image
      alt={alt || ""}
      className={`transition-all duration-700 ease-out ${
        isLoaded
          ? "blur-0 scale-100 opacity-100"
          : "blur-xl scale-105 opacity-40"
      } ${className || ""}`}
      onLoad={(e) => {
        setIsLoaded(true)
        if (onLoad) onLoad(e)
      }}
      {...props}
    />
  )
}

export function BlurImg({ className, alt, style, onLoad, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <img
      alt={alt || ""}
      style={style}
      ref={(node) => {
        if (node?.complete && node.naturalWidth > 0 && !isLoaded) {
          setIsLoaded(true)
        }
      }}
      className={`transition-all duration-700 ease-out ${
        isLoaded
          ? "blur-0 scale-100 opacity-100"
          : "blur-xl scale-105 opacity-40"
      } ${className || ""}`}
      onLoad={(e) => {
        setIsLoaded(true)
        if (onLoad) onLoad(e)
      }}
      {...props}
    />
  )
}
