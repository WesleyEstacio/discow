import { CheckCircle2Icon, CircleDashedIcon, CircleMinusIcon } from "lucide-react"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Badge } from "@/components/ui/badge"
import { requireStudioAdmin } from "@/lib/studio/admin"
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

const STATE_BADGES: Record<IntegrationState, { label: string; icon: typeof CheckCircle2Icon; className: string }> = {
  connected: { label: "Configurado", icon: CheckCircle2Icon, className: "text-emerald-300 border-emerald-400/40" },
  "not-configured": { label: "Não configurado", icon: CircleMinusIcon, className: "text-amber-300 border-amber-400/40" },
  planned: { label: "Planejado", icon: CircleDashedIcon, className: "text-muted-foreground" },
}

function hasEnvironmentValue(...variableNames: string[]): boolean {
  return variableNames.every((variableName) => Boolean(process.env[variableName]?.trim()))
}

export default async function StudioSettingsPage() {
  const admin = await requireStudioAdmin()
  const adminCount = (process.env.ADMIN_EMAILS ?? "").split(",").filter((email) => email.trim()).length

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

  return (
    <>
      <StudioPageHeader
        eyebrow="Configurações"
        title="Integrações e padrões da marca"
        description="Status das conexões e regras do Studio. Nenhuma credencial é exibida nem enviada ao navegador."
      />
      <div className="flex flex-col gap-12 px-6 py-8 md:px-10">
        <section aria-labelledby="integrations" className="flex flex-col gap-4">
          <h2 id="integrations" className="font-heading text-lg font-medium">Integrações</h2>
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {integrations.map((integration) => {
              const badge = STATE_BADGES[integration.state]
              const BadgeIcon = badge.icon
              return (
                <li key={integration.name} className="grid gap-2 p-5 md:grid-cols-[1fr_auto]">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm">{integration.purpose}</p>
                    <p className="text-sm text-muted-foreground">{integration.detail}</p>
                  </div>
                  <Badge variant="outline" className={`h-fit w-fit ${badge.className}`}>
                    <BadgeIcon aria-hidden="true" />
                    {badge.label}
                  </Badge>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="access" className="flex flex-col gap-3">
            <h2 id="access" className="font-heading text-lg font-medium">Acesso</h2>
            <p className="text-sm text-muted-foreground">
              Entrou como <span className="text-foreground">{admin.email}</span>. {adminCount} e-mail(s) autorizado(s) em
              ADMIN_EMAILS. Quem não está na lista recebe uma página 404.
            </p>
          </section>

          <section aria-labelledby="brand-defaults" className="flex flex-col gap-3">
            <h2 id="brand-defaults" className="font-heading text-lg font-medium">Padrões da marca</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Tamanho dos slides</dt>
              <dd>{SLIDE_WIDTH} × {SLIDE_HEIGHT} px (4:5)</dd>
              <dt className="text-muted-foreground">Tipografia</dt>
              <dd>Geist (Regular e Bold)</dd>
              <dt className="text-muted-foreground">Site nas chamadas</dt>
              <dd>{DISCOWS_WEBSITE}</dd>
              <dt className="text-muted-foreground">Idioma padrão</dt>
              <dd>Português</dd>
            </dl>
          </section>
        </div>

        <section aria-labelledby="usage-rights" className="flex max-w-3xl flex-col gap-3">
          <h2 id="usage-rights" className="font-heading text-lg font-medium">Capas e direitos de uso</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Capas obtidas por API não vêm automaticamente licenciadas para marketing. Confira os termos de cada provedor antes de publicar.</li>
            <li>Os slides mostram as capas inteiras, sem cortes, sobreposições ou filtros, e creditam a fonte (Spotify ou Cover Art Archive) no rodapé.</li>
            <li>Quando o uso não estiver claro, troque a capa por uma imagem que você tenha autorização para usar (campo &ldquo;Link da capa&rdquo; do álbum) ou use um slide de texto.</li>
            <li>O Studio não faz scraping nem contorna limites das APIs.</li>
          </ul>
        </section>
      </div>
    </>
  )
}
