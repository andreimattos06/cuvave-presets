import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBandBySlug,
  getSongBySlug,
  listUploadsForSong,
} from "@/lib/data/catalog";
import { getCurrentUser } from "@/lib/auth";
import { UploadCard } from "@/components/catalog/upload-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, UploadCloud } from "lucide-react";

type Params = PageProps<"/bandas/[slug]/[musica]">;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, musica } = await params;
  const band = await getBandBySlug(slug);
  if (!band) return { title: "Música não encontrada" };
  const song = await getSongBySlug(band.id, musica);
  return {
    title: song
      ? `${song.title} — ${band.name} — M-Vave Presets`
      : "Música não encontrada",
    description: song
      ? `Presets de pedaleira M-Vave para ${song.title}, de ${band.name}.`
      : undefined,
  };
}

export default async function SongPage({ params }: Params) {
  const { slug, musica } = await params;

  const band = await getBandBySlug(slug);
  if (!band) notFound();

  const song = await getSongBySlug(band.id, musica);
  if (!song) notFound();

  const user = await getCurrentUser();
  const uploads = await listUploadsForSong(song.id, user?.id);
  const path = `/bandas/${band.slug}/${song.slug}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <Link
        href={`/bandas/${band.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {band.name}
      </Link>

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-gradient">
            {song.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {band.name} · {uploads.length}{" "}
            {uploads.length === 1 ? "envio" : "envios"} ordenados por aprovação da
            comunidade
          </p>
        </div>

        <Button
          className="glow-violet"
          render={
            <Link href={`/enviar?musica=${song.id}`}>
              <UploadCloud className="size-4" />
              Enviar meus presets
            </Link>
          }
        />
      </header>

      {!user && uploads.length > 0 && (
        <p className="mt-6 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
          Você está navegando como visitante.{" "}
          <Link href={`/login?next=${path}`} className="text-primary hover:underline">
            Entre na sua conta
          </Link>{" "}
          para aprovar ou reprovar estes envios.
        </p>
      )}

      {uploads.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-white/10 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Ninguém enviou presets para esta música ainda.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            render={<Link href={`/enviar?musica=${song.id}`}>Ser o primeiro</Link>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {uploads.map((upload, index) => (
            <UploadCard
              key={upload.id}
              upload={upload}
              href={`${path}/${upload.id}`}
              rank={index + 1}
              canVote={Boolean(user)}
              revalidate={path}
            />
          ))}
        </div>
      )}
    </div>
  );
}
