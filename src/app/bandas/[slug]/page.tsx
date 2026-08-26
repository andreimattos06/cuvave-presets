import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBandBySlug, listSongsByBand } from "@/lib/data/catalog";
import { getCurrentUser } from "@/lib/auth";
import { NewSongForm } from "@/components/catalog/new-song-form";
import { ChevronLeft, ChevronRight, Music2, UploadCloud } from "lucide-react";

export async function generateMetadata({
  params,
}: PageProps<"/bandas/[slug]">): Promise<Metadata> {
  const band = await getBandBySlug((await params).slug);
  return {
    title: band ? `${band.name} — M-Vave Presets` : "Banda não encontrada",
  };
}

export default async function BandPage({ params }: PageProps<"/bandas/[slug]">) {
  const { slug } = await params;
  const band = await getBandBySlug(slug);
  if (!band) notFound();

  const [songs, user] = await Promise.all([
    listSongsByBand(band.id),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/bandas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Todas as bandas
      </Link>

      <header className="mt-6">
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-gradient">
          {band.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {songs.length} {songs.length === 1 ? "música cadastrada" : "músicas cadastradas"}
        </p>
      </header>

      {user && (
        <div className="mt-8">
          <NewSongForm bandId={band.id} />
        </div>
      )}

      {songs.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          Nenhuma música cadastrada para esta banda ainda.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08]">
          {songs.map((song) => (
            <li key={song.id}>
              <Link
                href={`/bandas/${band.slug}/${song.slug}`}
                className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-white/[0.04]"
              >
                <Music2 className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{song.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UploadCloud className="size-3" />
                    {song.uploadCount}{" "}
                    {song.uploadCount === 1 ? "envio" : "envios"}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
