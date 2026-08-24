import { Skeleton } from "@/components/ui/skeleton";
import { PedalBoardSkeleton } from "@/components/site/skeletons";

/**
 * A home consulta o catálogo antes de renderizar; sem este fallback o clique no
 * logo fica sem resposta visual até o banco responder — e parece um link morto.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <Skeleton className="h-7 w-80 rounded-full" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-44" />
        </div>
        <Skeleton className="h-9 w-full max-w-md" />
      </div>
      <div className="mt-14">
        <PedalBoardSkeleton />
      </div>
    </div>
  );
}
