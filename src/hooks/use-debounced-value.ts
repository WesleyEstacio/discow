"use client"

import { useEffect, useState } from "react"

/**
 * Returns `value`, but only after it has stopped changing for `delayMs`.
 * Used to avoid firing a network request on every keystroke.
 */
export function useDebouncedValue<Value>(value: Value, delayMs: number): Value {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debouncedValue
}
