import { CheckCircle2Icon, CircleDashedIcon, CircleMinusIcon, ShieldCheckIcon } from "lucide-react"
import { DISCOWS_BRAND_PINK, DiscowsWordmark } from "@/components/brand/discows-wordmark"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Badge } from "@/components/ui/badge"
import { countStudioAdmins, requireStudioAdmin } from "@/lib/studio/admin"
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/lib/studio/slides"
import { DISCOWS_WEBSITE } from "@/lib/studio/templates/template-helpers"

export const metadata = { title: "Configurações" }

type IntegrationState = "connected" | "not-configured" | "planned"

type IntegrationStatus = {
  name: string
  purpose: string
  state: IntegrationState
  detail: string
}

const STATE_BADGES: Record<IntegrationState, { label: string; icon: typeof CheckCircle2Icon; className: string; iconFrameClassName: string }> = {
  connected: {
    label: "Configurado",
    icon: CheckCircle2Icon,
    className: "text-emerald-300 border-emerald-400/40",
    iconFrameClassName: "bg-emerald-400/10 text-emerald-300",
  },
  "not-configured": {
    label: "Não configurado",
    icon: CircleMinusIcon,
    className: "text-amber-300 border-amber-400/40",
    iconFrameClassName: "bg-amber-400/10 text-amber-300",
  },
  planned: { label: "Planejado", icon: CircleDashedIcon, className: "text-muted-foreground", iconFrameClassName: "bg-muted text-muted-foreground" },
}

const SETTINGS_CARD_CLASS_NAME = "flex flex-col gap-4 rounded-xl border border-border bg-card p-5"

const USAGE_RIGHTS_RULES = [
  "Capas obtidas por API não vêm automaticamente licenciadas para marketing. Confira os termos de cada provedor antes de publicar.",
  "Os slides mostram as capas inteiras, sem cortes, sobreposições ou filtros, e creditam a fonte (Spotify ou Cover Art Archive) no rodapé.",
  "Quando o uso não estiver claro, troque a capa por uma imagem que você tenha autorização para usar (campo “Link da capa” do álbum) ou use um slide de texto.",
  "O Studio não faz scraping nem contorna limites das APIs.",
]

function hasEnvironmentValue(...variableNames: string[]): boolean {
  return variableNames.every((variableName) => Boolean(process.env[variableName]?.trim()))
}

export default async function StudioSettingsPage() {
  const admin = await requireStudioAdmin()
  const adminCount = await countStudioAdmins()

  // Only whether each secret exists is read here - values never leave the server.
  const integrations: IntegrationStatus[] = [
    {
      name: "Spotify Web API",
      purpose: "Busca de álbuns, links do Spotify e capas.",
      state: hasEnvironmentValue("SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET") ? "connected" : "not-configured",
      detail: "Variáveis SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET. A mesma conta já usada pelo app Discows.",
    },
    {
      name: "MusicBrainz + Cover Art Archive",
      purpose: "Metadados abertos de lançamentos, gêneros e capas.",
      state: "connected",
      detail: "API pública, sem chave. Limite de cerca de 1 requisição por segundo.",
    },
    {
      name: "Last.fm",
      purpose: "Tags, climas e artistas semelhantes.",
      state: hasEnvironmentValue("LASTFM_API_KEY") ? "connected" : "not-configured",
      detail: "Crie uma chave em last.fm/api/account/create e defina LASTFM_API_KEY. Uso previsto na Fase 2.",
    },
    {
      name: "Provedor de IA",
      purpose: "Sugestões de títulos, textos dos slides e legendas.",
      state: hasEnvironmentValue("ANTHROPIC_API_KEY") ? "connected" : "not-configured",
      detail:
        "Por enquanto os textos são escritos manualmente no editor. Quando a chave for configurada, as sugestões de IA entram separadas dos metadados verificados e sinalizadas para revisão.",
    },
    {
      name: "Instagram (Meta Graph API)",
      purpose: "Publicação direta e métricas de desempenho.",
      state: "planned",
      detail:
        "Fase 3. Exige conta profissional, app na Meta e permissões aprovadas. Até lá a publicação é manual: exportar, copiar a legenda, publicar no app e marcar como publicada.",
    },
  ]

  const connectedIntegrationCount = integrations.filter((integration) => integration.state === "connected").length

  return (
    <>
      <StudioPageHeader
        eyebrow="Configurações"
        title="Integrações e padrões da marca"
        description="Status das conexões e regras do Studio. Nenhuma credencial é exibida nem enviada ao navegador."
      />
      <div className="flex flex-col gap-12 px-6 py-8 md:px-10">
        <section aria-labelledby="integrations" className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="integrations" className="font-heading text-lg font-medium">Integrações</h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {connectedIntegrationCount} de {integrations.length} configuradas
            </p>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-6">
            {integrations.map((integration) => {
              const badge = STATE_BADGES[integration.state]
              const BadgeIcon = badge.icon
              return (
                <li key={integration.name} className={SETTINGS_CARD_CLASS_NAME}>
                  <div className="flex items-start justify-between gap-3">
                    <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${badge.iconFrameClassName}`}>
                      <BadgeIcon className="size-5" />
                    </span>
                    <Badge variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-heading text-base font-semibold tracking-tight">{integration.name}</h3>
                    <p className="text-sm">{integration.purpose}</p>
                  </div>
                  <p className="mt-auto border-t border-border pt-4 text-sm text-muted-foreground">{integration.detail}</p>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="access" className={SETTINGS_CARD_CLASS_NAME}>
            <h2 id="access" className="font-heading text-lg font-medium">Acesso</h2>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary uppercase"
              >
                {admin.email.slice(0, 1)}
              </span>
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-sm font-medium">{admin.email}</p>
                <p className="text-xs text-muted-foreground">Você entrou como admin</p>
              </div>
            </div>
            <p className="mt-auto flex items-start gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {adminCount} conta(s) com papel de admin. Quem não é admin recebe uma página 404.
            </p>
          </section>

          <section aria-labelledby="brand-defaults" className={SETTINGS_CARD_CLASS_NAME}>
            <h2 id="brand-defaults" className="font-heading text-lg font-medium">Padrões da marca</h2>
            <div className="flex items-center justify-center rounded-lg bg-muted/40 py-6 text-foreground">
              <DiscowsWordmark height={40} inkColor="currentColor" accentColor={DISCOWS_BRAND_PINK} />
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Tamanho dos slides</dt>
              <dd>{SLIDE_WIDTH} × {SLIDE_HEIGHT} px (4:5)</dd>
              <dt className="text-muted-foreground">Tipografia</dt>
              <dd>Geist e Chewy, escolhidas por texto no editor</dd>
              <dt className="text-muted-foreground">Site nas chamadas</dt>
              <dd>{DISCOWS_WEBSITE}</dd>
              <dt className="text-muted-foreground">Idioma padrão</dt>
              <dd>Português</dd>
            </dl>
          </section>
        </div>

        <section aria-labelledby="usage-rights" className={SETTINGS_CARD_CLASS_NAME}>
          <h2 id="usage-rights" className="font-heading text-lg font-medium">Capas e direitos de uso</h2>
          <ul className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
            {USAGE_RIGHTS_RULES.map((rule) => (
              <li key={rule} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {rule}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
