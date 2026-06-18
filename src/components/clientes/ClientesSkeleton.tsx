import { User } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-white/10 rounded" />
          <div className="h-3 w-20 bg-white/5 rounded" />
        </div>
        <div className="w-10 h-10 bg-white/10 rounded-full" />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/10 rounded" />
          <div className="h-3 w-40 bg-white/10 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/10 rounded" />
          <div className="h-3 w-28 bg-white/10 rounded" />
        </div>
      </div>

      <div className="pt-2 mt-auto border-t border-white/5 flex justify-end">
        <div className="h-8 w-24 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="bg-card border border-white/10 p-4 rounded-xl flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 bg-white/10 rounded-lg" />
      <div className="space-y-1">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-5 w-12 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export function ClientesSkeleton() {
  return (
    <>
      <div data-stats className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsSkeleton />
      </div>

      <div data-grid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </>
  );
}
