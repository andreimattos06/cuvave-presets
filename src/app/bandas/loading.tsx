import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/site/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <PageHeaderSkeleton />
      <Skeleton className="mt-8 h-9 w-full max-w-md" />
      <div className="mt-8">
        <CardGridSkeleton />
      </div>
    </div>
  );
}
