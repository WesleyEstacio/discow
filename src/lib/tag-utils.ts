// Pure helpers for src/lib/tags.ts, split out from it (rather than living
// there) because that module is "server-only" - and this logic needs to run
// client-side too, in src/components/profile-view.tsx, right after an edit
// so the UI doesn't need a full page reload to reflect a tag change.
import type { ProfileTag } from "@/lib/tags"

// Picks the single tag to show next to the user's name on their profile.
// Users can pick a favorite among their earned tags in Edit Profile
// (src/lib/profile-actions.ts stores that choice as users.displayTagKey);
// this resolves that choice back to a real tag, falling back to
// "joined-<year>" - and then to whatever they have - if they haven't picked
// one, or picked one they no longer have.
export function resolveDisplayTag(
  tags: ProfileTag[],
  displayTagKey: string | null
): ProfileTag | null {
  if (displayTagKey) {
    const chosen = tags.find((tag) => tag.id === displayTagKey)
    if (chosen) return chosen
  }

  const joinedTag = tags.find((tag) => tag.id.startsWith("joined-"))
  return joinedTag ?? tags[0] ?? null
}
