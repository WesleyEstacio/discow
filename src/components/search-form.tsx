"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type SearchFormProps = {
  initialQuery?: string
  autoFocus?: boolean
}

export function SearchForm({ initialQuery = "", autoFocus = false }: SearchFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="album-search" className="sr-only">
            Search albums
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              id="album-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search albums on Spotify..."
              autoFocus={autoFocus}
            />
            <Button type="submit">
              <SearchIcon data-icon="inline-start" />
              Search
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </form>
  )
}
