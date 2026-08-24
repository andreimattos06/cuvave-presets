import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { listBands, listPedalModels } from "@/lib/data/catalog";
import { UploadWizard } from "@/components/upload/upload-wizard";

export const metadata: Metadata = {
  title: "Enviar presets — Cuvave Presets",
};

export default async function UploadPage({ searchParams }: PageProps<"/enviar">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/enviar");

  const params = await searchParams;
  const songId = typeof params.musica === "string" ? params.musica : undefined;

  const [bands, models] = await Promise.all([listBands(), listPedalModels()]);

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
          Enviar presets
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Monte o arranjo como você toca: uma faixa por instrumento e até 8
          presets por faixa, para trocar o som ao longo da música.
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
          />
        )}
      </div>
    </div>
  );
}
