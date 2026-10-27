"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const ALL_FILTER_OPTION = "all"

type FilterSelectProps = {
  name: string
  label: string
  value: string
  options: { value: string; label: string }[]
}

export function FilterSelect({ name, label, value, options }: FilterSelectProps) {
  const optionsWithAll = [{ value: ALL_FILTER_OPTION, label: "Todos" }, ...options]
  const labelsByValue = Object.fromEntries(optionsWithAll.map((option) => [option.value, option.label]))

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`filter-${name}`}>{label}</Label>
      <Select name={name} defaultValue={value}>
        <SelectTrigger id={`filter-${name}`} className="w-full">
          <SelectValue>{(selectedValue: string) => labelsByValue[selectedValue] ?? "Todos"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {optionsWithAll.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
