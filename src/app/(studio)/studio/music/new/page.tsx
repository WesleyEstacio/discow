import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { AlbumForm } from "@/components/studio/album-form"
import { StudioPageHeader } from "@/components/studio/studio-page-header"
import { Button } from "@/components/ui/button"
import { createManualAlbumAction } from "@/lib/studio/album-actions"
import { requireStudioAdmin } from "@/lib/studio/admin"

export const metadata = { title: "Cadastrar álbum" }

export default async function NewAlbumPage() {
  await requireStudioAdmin()

  return (
    <>
      <StudioPageHeader
        eyebrow="Biblioteca musical"
        title="Cadastrar álbum manualmente"
        description="Para quando as APIs não têm o álbum ou estão fora do ar. Preencha só o que você sabe — nada é completado automaticamente."
        actions={
          <Button variant="ghost" render={<Link href="/studio/music" />} nativeButton={false}>
            <ArrowLeftIcon data-icon="inline-start" />
            Voltar
          </Button>
        }
      />
      <div className="px-6 py-8 md:px-10">
        <AlbumForm action={createManualAlbumAction} defaults={null} submitLabel="Salvar álbum" />
      </div>
    </>
  )
}
