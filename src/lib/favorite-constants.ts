// Caps how many albums - and, separately, how many tracks - any one person
// can mark as a favorite (see resolveReleaseKind() in src/lib/release-kind.ts
// for how a favorite row is classified as one or the other). Deliberately
// not in favorites.ts (server-only) or favorite-actions.ts ("use server"
// files can only export async functions), so client components (the "Add
// favorite" dialog) can import it too - same reasoning as
// src/lib/follow-constants.ts.
export const MAX_FAVORITES_PER_KIND = 5
