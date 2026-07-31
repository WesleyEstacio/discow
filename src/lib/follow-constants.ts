// Page size for the Followers/Following list dialog. Shared between the
// server queries (src/lib/follows.ts), the "load more" server actions
// (src/lib/follow-actions.ts), and the client dialog itself
// (src/components/follow-list-dialog.tsx) so all three agree on what counts
// as "a full page" - and therefore whether there might be more to load.
// Deliberately not in follows.ts (server-only) or follow-actions.ts ("use
// server" files can only export async functions) so the client component can
// import it too.
export const FOLLOW_LIST_PAGE_SIZE = 30

// Caps how many accounts any one person can follow. Keeps the follow graph
// intentional (and the "Following" list short) instead of people mass-
// following everyone - revisit if that turns out to be too tight in
// practice.
export const MAX_FOLLOWING = 10
