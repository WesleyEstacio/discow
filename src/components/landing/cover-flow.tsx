"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { motion } from "framer-motion"
import type { LandingAlbum } from "./albums"

type CoverFlowProps = {
  albums: LandingAlbum[]
  autoPlayInterval?: number // default 3800ms
  onSelectAlbum?: (album: LandingAlbum, index: number) => void
}

export function CoverFlow({
  albums,
  autoPlayInterval = 3800,
  onSelectAlbum,
}: CoverFlowProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)

  const dragStartX = useRef<number | null>(null)
  const dragDelta = useRef(0)
  const dragMoved = useRef(false)

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const total = albums.length
  const stepX = isMobile ? 75 : 145
  const overlapGap = isMobile ? 35 : 70
  const dragStepThreshold = isMobile ? 60 : 90

  const nextAlbum = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total)
  }, [total])

  const prevAlbum = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  // Infinite Auto-play loop
  useEffect(() => {
    if (isHovered || isDragging) return
    const timer = setInterval(() => {
      nextAlbum()
    }, autoPlayInterval)

    return () => clearInterval(timer)
  }, [autoPlayInterval, nextAlbum, isHovered, isDragging])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextAlbum()
      } else if (e.key === "ArrowLeft") {
        prevAlbum()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextAlbum, prevAlbum])

  // Notify active change
  useEffect(() => {
    if (onSelectAlbum && albums[activeIndex]) {
      onSelectAlbum(albums[activeIndex], activeIndex)
    }
  }, [activeIndex, albums, onSelectAlbum])

  // Unified pointer handlers: mouse drag and touch swipe both flow through here
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX
    dragDelta.current = 0
    dragMoved.current = false
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return
    const delta = dragStartX.current - e.clientX
    dragDelta.current = delta
    if (Math.abs(delta) > 4) dragMoved.current = true
    // Subtle damped "peek" so the stage follows the pointer while dragging
    const damped = Math.max(-140, Math.min(140, -delta * 0.5))
    setDragX(damped)
  }

  const endDrag = () => {
    if (dragStartX.current === null) return
    const steps = Math.round(dragDelta.current / dragStepThreshold)
    if (steps !== 0) {
      setActiveIndex((prev) => ((prev + steps) % total + total) % total)
    }
    dragStartX.current = null
    dragDelta.current = 0
    setDragX(0)
    setIsDragging(false)
  }

  const handlePointerUp = () => endDrag()
  const handlePointerCancel = () => endDrag()

  return (
    <div className="w-full flex flex-col items-center justify-center select-none">
      {/* 3D Viewport Stage */}
      <div
        className="relative w-full h-[320px] sm:h-[400px] md:h-[460px] flex items-center justify-center perspective-container overflow-visible cursor-grab touch-pan-y active:cursor-grabbing"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={(e) => {
          setIsHovered(false)
          if (e.buttons === 1) endDrag()
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <motion.div
          className="relative w-full max-w-5xl h-full flex items-center justify-center preserve-3d"
          animate={{ x: dragX }}
          transition={{
            duration: isDragging ? 0 : 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {albums.map((album, index) => {
            // Compute shortest circular distance
            let offset = index - activeIndex
            if (offset > total / 2) offset -= total
            if (offset < -total / 2) offset += total

            const maxVisible = isMobile ? 2 : 3
            const isVisible = Math.abs(offset) <= maxVisible

            if (!isVisible) return null

            const isCenter = offset === 0

            // Responsive 3D Transform calculations
            const cardWidth = isMobile ? 180 : 270
            const cardHeight = isMobile ? 180 : 270

            let translateX = 0
            let rotateY = 0
            let translateZ = 0

            if (isCenter) {
              translateX = 0
              rotateY = 0
              translateZ = isMobile ? 100 : 160
            } else if (offset < 0) {
              rotateY = 60 // Left cards tilt right towards center
              translateX = offset * stepX - overlapGap
              translateZ = -50 - Math.abs(offset) * 35
            } else {
              rotateY = -60 // Right cards tilt left towards center
              translateX = offset * stepX + overlapGap
              translateZ = -50 - Math.abs(offset) * 35
            }

            const zIndex = 100 - Math.abs(offset) * 10
            // Balanced side covers opacity (subtle, non-distracting)
            const opacity = isCenter
              ? 1
              : Math.max(0.22, 0.52 - (Math.abs(offset) - 1) * 0.15)

            return (
              <motion.div
                key={album.id || album.title + index}
                onClick={() => {
                  if (dragMoved.current) {
                    dragMoved.current = false
                    return
                  }
                  setActiveIndex(index)
                }}
                className="absolute cursor-pointer preserve-3d"
                style={{
                  width: `${cardWidth}px`,
                  zIndex,
                }}
                animate={{
                  x: translateX,
                  z: translateZ,
                  rotateY: rotateY,
                  opacity: Math.max(0, opacity),
                }}
                transition={{
                  duration: 0.85,
                  ease: [0.16, 1, 0.3, 1], // Apple cubic-bezier curve
                }}
              >
                {/* Album Cover & Reflection wrapper */}
                <div className="relative group">
                  {/* Main Album Card */}
                  <div
                    className={`relative rounded-sm overflow-hidden bg-muted ${
                      isCenter
                        ? "shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
                        : "shadow-md brightness-55 hover:brightness-85 transition-all"
                    }`}
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={album.cover}
                      alt={`${album.title} - ${album.artist}`}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      loading="eager"
                      draggable={false}
                    />

                    {/* Subtle vinyl sheen highlight */}
                    <div className="absolute inset-0 vinyl-sheen pointer-events-none" />

                    {/* Hover Info Overlay on Central Cover */}
                    {isCenter && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-5 text-left pointer-events-auto">
                        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                          <span>{album.genre || "Album"}</span>
                          <span>{album.year}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <h3 className="text-foreground text-base sm:text-lg font-medium tracking-tight leading-tight">
                            {album.title}
                          </h3>
                          <p className="text-foreground/80 text-xs sm:text-sm font-light">
                            {album.artist}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-foreground/10 flex items-center justify-between text-[11px] text-muted-foreground font-light">
                          <span>Tap to explore</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3D Discrete Reflection Below */}
                  <div
                    className="absolute top-full left-0 right-0 overflow-hidden pointer-events-none select-none mt-[2px]"
                    style={{
                      height: `${cardHeight * 0.45}px`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={album.cover}
                      alt=""
                      className="w-full object-cover reflection-image"
                      draggable={false}
                      style={{
                        height: `${cardHeight}px`,
                        opacity: isCenter ? 0.6 : 0.35,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
