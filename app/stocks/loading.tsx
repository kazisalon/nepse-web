export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-80 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-black/30" />
    </div>
  );
}

