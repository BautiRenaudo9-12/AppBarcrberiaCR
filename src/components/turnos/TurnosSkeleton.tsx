export default function TurnosSkeleton() {
  return (
    <div className="space-y-3 pb-10">
      <div className="flex justify-between items-center px-1">
        <div className="h-3 w-28 rounded-full bg-white/10 animate-pulse" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-white/10 rounded-xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-14 rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-20 rounded-full bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}