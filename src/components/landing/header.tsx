"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { DiscowsLogo } from "./discows-logo"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function LandingHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4 z-20 select-none"
    >
      <div className="flex items-center gap-2">
        <DiscowsLogo size={20} />
        <h1 className="text-lg font-semibold tracking-tight text-foreground font-sans">
          Discows
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button
          variant="secondary"
          render={<Link href="/library" />}
          nativeButton={false}
        >
          Sign in
        </Button>
      </div>
    </motion.header>
  )
}
