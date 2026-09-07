// Caps how many artists any one person can favorite from the artist page.
// Deliberately not in favorite-artists.ts (server-only) or
// favorite-artist-actions.ts ("use server" files can only export async
// functions), so client components (the FavoriteArtistButton) can import it
// too - same reasoning as src/lib/favorite-constants.ts.
export const MAX_FAVORITE_ARTISTS = 20
