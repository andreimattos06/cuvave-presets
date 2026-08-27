import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getUploadForEdit,
  listBands,
  listPedalModels,
} from "@/lib/data/catalog";
import { UploadWizard } from "@/components/upload/upload-wizard";

export const metadata: Metadata = {
  title: "Enviar presets — M-Vave Presets",
};

export default async function UploadPage({ searchParams }: PageProps<"/enviar">) {
  const params = await searchParams;
  const songId = typeof params.musica === "string" ? params.musica : undefined;
  const editingId = typeof params.editar === "string" ? params.editar : undefined;

  const user = await getCurrentUser();
  if (!user) {
    // Leva a música e o envio junto: sem eles, quem clicou em "Editar" e teve
    // de entrar na conta cairia num formulário em branco depois do login.
    const query = new URLSearchParams();
    if (songId) query.set("musica", songId);
    if (editingId) query.set("editar", editingId);
    const next = query.size ? `/enviar?${query}` : "/enviar";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const [bands, models] = await Promise.all([listBands(), listPedalModels()]);

  // Modo edição: o envio precisa existir e ser do próprio usuário, senão 404 —
  // abrir um formulário em branco esconderia o motivo.
  let seed;
  if (editingId) {
    const upload = await getUploadForEdit(editingId, user.id);
    if (!upload || !upload.song.band) notFound();
    seed = {
      uploadId: upload.id,
      title: upload.title,
      note: upload.note,
      song: { id: upload.song.id, title: upload.song.title },
      band: upload.song.band,
      tracks: upload.tracks,
    };
  }

  let preselectedSong;
  if (songId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("songs")
      .select("id, title, band:bands ( id, name )")
      .eq("id", songId)
      .maybeSingle();

    if (data?.band) {
      preselectedSong = {
        id: data.id,
        title: data.title,
        band: { id: data.band.id, name: data.band.name },
      };
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {seed ? "Editar envio" : "Enviar presets"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {seed
            ? "Ajuste o que precisar e salve. Os votos e as visualizações que este envio já recebeu continuam valendo."
            : "Monte o arranjo como você toca: uma faixa por instrumento e até 8 presets por faixa, para trocar o som ao longo da música."}
        </p>
      </header>

      <div className="mt-10">
        {models.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
            Nenhuma pedaleira cadastrada no catálogo. Rode o seed em
            supabase/seed/0001_pedal_models.sql.
          </p>
        ) : (
          <UploadWizard
            bands={bands}
            models={models}
            preselectedSong={preselectedSong}
            seed={seed}
          />
        )}
      </div>
    </div>
  );
}
