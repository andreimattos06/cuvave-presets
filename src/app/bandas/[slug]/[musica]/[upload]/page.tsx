import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBandBySlug, getSongBySlug, getUploadById } from "@/lib/data/catalog";
import { getCurrentUser } from "@/lib/auth";
import { UploadViewer } from "@/components/catalog/upload-viewer";
import { VoteButtons } from "@/components/catalog/vote-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, ChevronLeft, Eye, PencilLine, ThumbsUp } from "lucide-react";
import { UploadActions } from "@/components/catalog/upload-actions";

type Params = PageProps<"/bandas/[slug]/[musica]/[upload]">;

/** Data curta, do jeito que se lê em português: 26/08/2026. */
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { upload: uploadId } = await params;
  const upload = await getUploadById(uploadId).catch(() => null);
  if (!upload) return { title: "Envio não encontrado" };
  return {
    title: `${upload.title} — M-Vave Presets`,
    description:
      upload.note ??
      `Presets enviados por @${upload.author?.username ?? "um guitarrista"}.`,
  };
}

export default async function UploadPage({ params }: Params) {
  const { slug, musica, upload: uploadId } = await params;

  const band = await getBandBySlug(slug);
  if (!band) notFound();

  const song = await getSongBySlug(band.id, musica);
  if (!song) notFound();

  const user = await getCurrentUser();
  const upload = await getUploadById(uploadId, user?.id);
  if (!upload) notFound();

  const songPath = `/bandas/${band.slug}/${song.slug}`;
  const initials = (upload.author?.username ?? "??").slice(0, 2).toUpperCase();
  const isOwner = user?.id === upload.author?.id;
  const presetCount = upload.tracks.reduce((sum, t) => sum + t.presets.length, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <Link
        href={songPath}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {song.title} — {band.name}
      </Link>

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-gradient sm:text-4xl">
            {upload.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Avatar className="size-6 border border-white/10">
                {upload.author?.avatar_url && (
                  <AvatarImage
                    src={upload.author.avatar_url}
                    alt={upload.author.username}
                  />
                )}
                <AvatarFallback className="bg-primary/20 text-[10px] text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              @{upload.author?.username ?? "usuário removido"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" />
              {upload.views}{" "}
              {upload.views === 1 ? "visualização" : "visualizações"}
            </span>
            <span className="inline-flex items-center gap-1 text-neon-green">
              <ThumbsUp className="size-3.5" />
              {upload.approvals}{" "}
              {upload.approvals === 1 ? "aprovação" : "aprovações"}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              Enviado em {shortDate(upload.created_at)}
            </span>
            {/* Só aparece quando houve edição de fato — repetir a data de envio
                em outra frase não diria nada a mais. */}
            {upload.updated_at > upload.created_at && (
              <span className="inline-flex items-center gap-1">
                <PencilLine className="size-3.5" />
                Editado em {shortDate(upload.updated_at)}
              </span>
            )}
          </div>

          {isOwner && (
            <div className="mt-3">
              <UploadActions
                uploadId={upload.id}
                title={upload.title}
                presetCount={presetCount}
              />
            </div>
          )}
        </div>

        <VoteButtons
          uploadId={upload.id}
          score={upload.score}
          myVote={upload.myVote}
          canVote={Boolean(user)}
          revalidate={`${songPath}/${upload.id}`}
        />
      </header>

      {upload.note && (
        <p className="mt-6 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
          {upload.note}
        </p>
      )}

      {!user && (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link
            href={`/login?next=${songPath}/${upload.id}`}
            className="text-primary hover:underline"
          >
            Entre na sua conta
          </Link>{" "}
          para aprovar ou reprovar este envio.
        </p>
      )}

      <div className="mt-8">
        <UploadViewer upload={upload} songTitle={song.title} />
      </div>
    </div>
  );
}
