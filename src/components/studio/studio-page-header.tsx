type StudioPageHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
  actions?: React.ReactNode
}

export function StudioPageHeader({ title, description, eyebrow, actions }: StudioPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border px-6 py-8 md:flex-row md:items-end md:justify-between md:px-10">
      <div className="flex max-w-2xl flex-col gap-2">
        {eyebrow ? (
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
