import Link from "next/link";
import { Eye, Music2, ThumbsUp } from "lucide-react";
import type { TopUpload } from "@/lib/data/catalog";

/**
 * Os presets mais vistos, em lista rolável — ocupa pouco espaço logo abaixo da
 * busca e ainda cabe tudo que identifica o envio: música, banda, preset, autor
 * e o placar.
 */
export function MostViewedList({ uploads }: { uploads: TopUpload[] }) {
  return (
    <ol className="glass max-h-[19rem] divide-y divide-white/[0.06] overflow-y-auto rounded-xl text-left">
      {uploads.map((upload, index) => (
        <li key={upload.id}>
          <Link
            href={`/bandas/${upload.song?.band?.slug}/${upload.song?.slug}/${upload.id}`}
            className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-white/[0.05] sm:px-4"
          >
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Music2 className="size-4" />
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-background text-[9px] font-bold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium leading-tight">
                {upload.song?.title ?? "Música removida"}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {upload.song?.band?.name}
                </span>
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                <span className="text-accent">{upload.title}</span>
                {upload.author && <> · @{upload.author.username}</>}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 text-xs tabular-nums">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Eye className="size-3.5" />
                {upload.views}
              </span>
              <span className="inline-flex items-center gap-1 text-neon-green">
                <ThumbsUp className="size-3.5" />
                {upload.approvals}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
