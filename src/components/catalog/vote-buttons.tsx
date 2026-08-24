"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { voteUpload } from "@/actions/votes";
import { cn } from "@/lib/utils";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type VoteState = { score: number; myVote: 1 | -1 | null };

/**
 * Aprovar/reprovar um envio. Visível para todos (o placar é público), mas só
 * clicável para quem está logado — visitante vê o convite para entrar.
 */
export function VoteButtons({
  uploadId,
  score,
  myVote,
  canVote,
  revalidate,
}: {
  uploadId: string;
  score: number;
  myVote: 1 | -1 | null;
  canVote: boolean;
  revalidate: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic<VoteState, 1 | -1>(
    { score, myVote },
    (state, value) => {
      // Repetir o mesmo voto desfaz; trocar de lado move o placar em 2.
      if (state.myVote === value) {
        return { score: state.score - value, myVote: null };
      }
      const delta = state.myVote === null ? value : value * 2;
      return { score: state.score + delta, myVote: value };
    },
  );

  function submit(value: 1 | -1) {
    if (!canVote) {
      toast.info("Entre na sua conta para avaliar envios.");
      return;
    }
    startTransition(async () => {
      setOptimistic(value);
      const result = await voteUpload(uploadId, value, revalidate);
      if (!result.ok) toast.error(result.message ?? "Não foi possível votar.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1">
      <VoteButton
        label="Aprovar"
        active={optimistic.myVote === 1}
        activeClass="bg-neon-green/20 text-neon-green"
        onClick={() => submit(1)}
        disabled={!canVote}
      >
        <ThumbsUp className="size-4" />
      </VoteButton>

      <span
        className={cn(
          "min-w-8 text-center font-mono text-sm font-bold tabular-nums",
          optimistic.score > 0 && "text-neon-green",
          optimistic.score < 0 && "text-destructive",
          optimistic.score === 0 && "text-muted-foreground",
        )}
        aria-label={`Saldo de aprovações: ${optimistic.score}`}
      >
        {optimistic.score > 0 ? `+${optimistic.score}` : optimistic.score}
      </span>

      <VoteButton
        label="Reprovar"
        active={optimistic.myVote === -1}
        activeClass="bg-destructive/20 text-destructive"
        onClick={() => submit(-1)}
        disabled={!canVote}
      >
        <ThumbsDown className="size-4" />
      </VoteButton>
    </div>
  );
}

function VoteButton({
  label,
  active,
  activeClass,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active: boolean;
  activeClass: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const button = (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full p-2 text-muted-foreground transition-colors outline-none",
        "hover:bg-white/10 hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring",
        active && activeClass,
        disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>
        {disabled ? "Entre para avaliar" : label}
      </TooltipContent>
    </Tooltip>
  );
}
