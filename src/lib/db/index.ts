import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "@/lib/db/schema"

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("Missing DATABASE_URL. Add it to .env.local.")
  }
  return url
}

const sql = neon(getDatabaseUrl())

export const db = drizzle(sql, { schema })
