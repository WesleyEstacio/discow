"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Dice5Icon, SparklesIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import {
  formatDecadeLabel,
  formatGenreLabel,
  UNKNOWN_GENRE_LABEL,
  type DiscoverFilters,
  type DiscoverRollResult,
} from "@/lib/discover"

type SurpriseMeButtonProps = {
  filters: DiscoverFilters
  excludeIds: string[]
  onRolled: (result: DiscoverRollResult) => void
}

type RollPhase = "idle" | "rolling" | "revealed"

// The dice keeps "rolling" for at least this long even if the API answers
// instantly, and the resolved roll stays on screen for a beat before the
// modal closes - the search itself is already done by the time either of
// these delays starts, they're purely for feel.
const MIN_ROLL_ANIMATION_MS = 1100
const REVEAL_DISPLAY_MS = 1300

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function SurpriseMeButton({ filters, excludeIds, onRolled }: SurpriseMeButtonProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<RollPhase>("idle")
  const [result, setResult] = useState<DiscoverRollResult | null>(null)

  async function handleSurpriseMe() {
    setOpen(true)
    setPhase("rolling")
    setResult(null)

    try {
      // The dice animation below and the actual search run in parallel - by
      // the time the roll is revealed, the album has already been found.
      // The random genre/artist/decade shown here always describes the
      // real album the request found, never a guess the search abandoned.
      const [response] = await Promise.all([
        fetch("/api/discover/roll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters, excludeIds }),
        }),
        wait(MIN_ROLL_ANIMATION_MS),
      ])

      const data = (await response.json()) as Partial<DiscoverRollResult> & { error?: string }
      if (!response.ok || !data.album || !data.roll) {
        throw new Error(data.error ?? "Failed to roll a new album")
      }

      const rollResult: DiscoverRollResult = {
        album: data.album,
        roll: data.roll,
        genreLabel: data.genreLabel ?? null,
      }
      setResult(rollResult)
      setPhase("revealed")

      await wait(REVEAL_DISPLAY_MS)
      setOpen(false)
      onRolled(rollResult)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to roll a new album"
      toast.add({ title: "Could not roll a new album", description: message, type: "error" })
      setOpen(false)
    } finally {
      setPhase("idle")
    }
  }

  return (
    <>
      <Button type="button" onClick={handleSurpriseMe} disabled={phase !== "idle"}>
        <SparklesIcon data-icon="inline-start" />
        Surprise Me
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          // Ignore backdrop/escape close attempts while the roll is in
          // flight - the modal only closes on its own once revealed.
          if (!nextOpen && phase === "rolling") return
          setOpen(nextOpen)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="flex flex-col items-center gap-4 py-8 text-center"
        >
          <DialogTitle className="sr-only">Rolling a new album</DialogTitle>
          <DialogDescription className="sr-only">
            Picking a random genre, artist, and decade, then finding an album to match.
          </DialogDescription>

          <motion.div
            animate={
              phase === "rolling" ? { rotate: [0, 20, -20, 15, -15, 0] } : { rotate: 0 }
            }
            transition={
              phase === "rolling"
                ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
            className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <Dice5Icon className="size-8" />
          </motion.div>

          <AnimatePresence mode="wait">
            {phase === "rolling" ? (
              <motion.p
                key="rolling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Rolling the dice for your next album…
              </motion.p>
            ) : result ? (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <Badge variant="secondary">
                    {formatDecadeLabel(result.roll.decadeStartYear)}
                  </Badge>
                  {(() => {
                    // result.roll.genre falls back to UNKNOWN_GENRE_LABEL when
                    // nothing could be resolved (see buildRollFromAlbum in
                    // discover-server.ts) - that's a marker value, not a real
                    // genre, so it never gets its own badge.
                    const displayGenreLabel =
                      result.genreLabel ??
                      (result.roll.genre !== UNKNOWN_GENRE_LABEL
                        ? formatGenreLabel(result.roll.genre)
                        : null)
                    return displayGenreLabel ? (
                      <Badge variant="secondary">{displayGenreLabel}</Badge>
                    ) : null
                  })()}
                  {result.roll.artist ? (
                    <Badge variant="outline">Inspired by {result.roll.artist}</Badge>
                  ) : null}
                </div>
                <p className="font-heading text-lg font-medium">{result.album.name}</p>
                <p className="text-sm text-muted-foreground">
                  {result.album.artists.join(", ")}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}
