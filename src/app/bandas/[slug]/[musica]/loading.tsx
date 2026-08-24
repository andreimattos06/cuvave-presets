import {
  ListSkeleton,
  PageHeaderSkeleton,
  PedalBoardSkeleton,
} from "@/components/site/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <PedalBoardSkeleton />
      </div>
      <div className="mt-6">
        <ListSkeleton count={3} />
      </div>
    </div>
  );
}
