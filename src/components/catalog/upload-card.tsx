import Link from "next/link";
import { cn } from "@/lib/utils";
import { VoteButtons } from "./vote-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { SongUpload } from "@/lib/data/catalog";
import { ChevronRight, Eye, ThumbsUp, Trophy } from "lucide-react";

/**
 * Linha da lista de envios de uma música: nome do envio, autor, visualizações e
 * aprovações. A pedaleira em si fica na página do envio — aqui é só a escolha.
 */
export function UploadCard({
  upload,
  href,
  rank,
  canVote,
  revalidate,
}: {
  upload: SongUpload;
  href: string;
  rank: number;
  canVote: boolean;
  revalidate: string;
}) {
  const initials = (upload.author?.username ?? "??").slice(0, 2).toUpperCase();
  const presetCount = upload.tracks.reduce((sum, t) => sum + t.presets.length, 0);

  return (
    <article
      className={cn(
        "glass rounded-xl transition-colors",
        rank === 1 && "border-primary/30",
      )}
    >
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold",
            rank === 1
              ? "bg-primary/20 text-primary"
              : "bg-white/[0.06] text-muted-foreground",
          )}
          aria-label={`${rank}º lugar em aprovação`}
        >
          {rank}
        </span>

        <Avatar className="size-8 border border-white/10">
          {upload.author?.avatar_url && (
            <AvatarImage
              src={upload.author.avatar_url}
              alt={upload.author.username}
            />
          )}
          <AvatarFallback className="bg-primary/20 text-xs text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <Link
            href={href}
            className="group flex items-center gap-1 font-medium transition-colors hover:text-primary"
          >
            <span className="truncate">{upload.title}</span>
            <ChevronRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="truncate">
              @{upload.author?.username ?? "usuário removido"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3" />
              {upload.views} {upload.views === 1 ? "visualização" : "visualizações"}
            </span>
            <span className="inline-flex items-center gap-1 text-neon-green">
              <ThumbsUp className="size-3" />
              {upload.approvals}{" "}
              {upload.approvals === 1 ? "aprovação" : "aprovações"}
            </span>
            <span>
              {upload.tracks.length}{" "}
              {upload.tracks.length === 1 ? "instrumento" : "instrumentos"} ·{" "}
              {presetCount} {presetCount === 1 ? "preset" : "presets"}
            </span>
          </p>
        </div>

        {rank === 1 && upload.score > 0 && (
          <Badge className="gap-1 bg-primary/15 text-primary">
            <Trophy className="size-3" />
            Mais aprovado
          </Badge>
        )}

        <VoteButtons
          uploadId={upload.id}
          score={upload.score}
          myVote={upload.myVote}
          canVote={canVote}
          revalidate={revalidate}
        />
      </div>

      {upload.note && (
        <p className="border-t border-white/[0.06] px-4 py-3 text-sm text-muted-foreground">
          {upload.note}
        </p>
      )}
    </article>
  );
}
