export default function HistorialSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <div className="h-3 w-24 rounded-full bg-white/10 animate-pulse" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-white/10 rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}