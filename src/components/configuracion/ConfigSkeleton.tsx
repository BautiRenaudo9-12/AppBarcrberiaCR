export default function ConfigSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-white/10 rounded-3xl overflow-hidden"
        >
          <div className="bg-white/5 px-5 py-4 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-5 w-20 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="w-9 h-5 rounded-full bg-white/5 animate-pulse" />
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-12 rounded bg-white/5 animate-pulse" />
                <div className="h-9 rounded-xl bg-white/5 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-12 rounded bg-white/5 animate-pulse" />
                <div className="h-9 rounded-xl bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
              <div className="h-9 rounded-xl bg-white/5 animate-pulse" />
            </div>
            <div className="grid grid-cols-5 gap-2 mt-2">
              <div className="col-span-4 h-9 rounded-xl bg-white/5 animate-pulse" />
              <div className="col-span-1 h-9 rounded-xl bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}