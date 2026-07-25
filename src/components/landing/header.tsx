"use client"

import { motion } from "framer-motion"
import { DiscowsLogo } from "@/components/discows-logo"

export function LandingHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl mx-auto flex flex-col items-center gap-2 z-20 select-none"
    >
      <div className="flex items-center gap-3">
        <DiscowsLogo size={32} />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground font-sans">
          Discows
        </h1>
      </div>
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Rate • Discover • Share
      </p>
    </motion.header>
  )
}
