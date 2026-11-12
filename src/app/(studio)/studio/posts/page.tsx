import Link from "next/link"
import { PlusIcon, RowsIcon } from "lucide-react"
import { ALL_FILTER_OPTION, FilterSelect } from "@/components/studio/filter-select"
import { PostRowActions } from "@/components/studio/post-row-actions"
import { PostStatusBadge } from "@/components/studio/post-status-badge"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireStudioAdmin } from "@/lib/studio/admin"
import { formatStudioDate, formatStudioDateTime } from "@/lib/studio/labels"
import {
  isPostLanguage,
  isPostStatus,
  POST_LANGUAGE_LABELS,
  POST_LANGUAGES,
  POST_STATUS_LABELS,
  POST_STATUSES,
} from "@/lib/studio/post-status"
import { listStudioPosts, type StudioPostFilters } from "@/lib/studio/posts"
import { findTemplateName, STUDIO_TEMPLATES } from "@/lib/studio/templates"

export const metadata = { title: "Biblioteca de conteúdo" }

type ContentLibraryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(value: string | string[] | undefined): string | undefined {
  const firstValue = Array.isArray(value) ? value[0] : value
  return firstValue && firstValue !== ALL_FILTER_OPTION ? firstValue : undefined
}

function monthRange(month: string | undefined): Pick<StudioPostFilters, "scheduledFrom" | "scheduledUntil"> {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return {}
  const [year, monthNumber] = month.split("-").map(Number) as [number, number]
  return {
    scheduledFrom: new Date(Date.UTC(year, monthNumber - 1, 1, 3)),
    scheduledUntil: new Date(Date.UTC(year, monthNumber, 1, 3)),
  }
}

export default async function ContentLibraryPage({ searchParams }: ContentLibraryPageProps) {
  await requireStudioAdmin()
  const params = await searchParams
  const statusParam = readSearchParam(params.status)
  const languageParam = readSearchParam(params.language)
  const templateParam = readSearchParam(params.template)
  const monthParam = readSearchParam(params.month)

  const filters: StudioPostFilters = {
    status: isPostStatus(statusParam) ? statusParam : undefined,
    language: isPostLanguage(languageParam) ? languageParam : undefined,
    templateKey: templateParam,
    ...monthRange(monthParam),
  }
  const hasFilters = Boolean(filters.status || filters.language || filters.templateKey || monthParam)
  const posts = await listStudioPosts(filters)

  return (
    <>
      <StudioPageHeader
        eyebrow="Biblioteca de conteúdo"
        title="Publicações"
        description="Ideias, rascunhos, aprovadas e publicadas. Abra qualquer uma para continuar editando."
        actions={
          <Button render={<Link href="/studio/create" />} nativeButton={false}>
            <PlusIcon data-icon="inline-start" />
            Criar publicação
          </Button>
        }
      />

      <div className="flex flex-col gap-6 px-6 py-8 md:px-10">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <FilterSelect
            name="status"
            label="Status"
            value={filters.status ?? ALL_FILTER_OPTION}
            options={POST_STATUSES.map((status) => ({ value: status, label: POST_STATUS_LABELS[status] }))}
          />
          <FilterSelect
            name="template"
            label="Formato"
            value={filters.templateKey ?? ALL_FILTER_OPTION}
            options={STUDIO_TEMPLATES.map((template) => ({ value: template.key, label: template.name }))}
          />
          <FilterSelect
            name="language"
            label="Idioma"
            value={filters.language ?? ALL_FILTER_OPTION}
            options={POST_LANGUAGES.map((language) => ({ value: language, label: POST_LANGUAGE_LABELS[language] }))}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-month">Mês de publicação</Label>
            <Input id="filter-month" name="month" type="month" defaultValue={monthParam} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary">Filtrar</Button>
            {hasFilters ? (
              <Button variant="ghost" render={<Link href="/studio/posts" />} nativeButton={false}>
                Limpar
              </Button>
            ) : null}
          </div>
        </form>

        {posts.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RowsIcon />
              </EmptyMedia>
              <EmptyTitle>{hasFilters ? "Nenhuma publicação com esses filtros" : "Nenhuma publicação ainda"}</EmptyTitle>
              <EmptyDescription>
                {hasFilters ? "Ajuste ou limpe os filtros." : "Escolha um formato, selecione álbuns e gere o primeiro carrossel."}
              </EmptyDescription>
            </EmptyHeader>
            {hasFilters ? null : (
              <EmptyContent>
                <Button render={<Link href="/studio/create" />} nativeButton={false}>
                  <PlusIcon data-icon="inline-start" />
                  Criar publicação
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Publicação</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Idioma</TableHead>
                  <TableHead>Data prevista</TableHead>
                  <TableHead>Atualizada</TableHead>
                  <TableHead className="w-10"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-80">
                      <Link
                        href={`/studio/posts/${post.id}`}
                        className="block truncate rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {post.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">{post.slideCount} slides</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{findTemplateName(post.templateKey)}</TableCell>
                    <TableCell><PostStatusBadge status={post.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{POST_LANGUAGE_LABELS[post.language]}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {post.scheduledFor ? formatStudioDate(post.scheduledFor) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatStudioDateTime(post.updatedAt)}</TableCell>
                    <TableCell><PostRowActions postId={post.id} postTitle={post.title} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}
