import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Stock not found</h1>
      <p className="text-sm text-black/70 dark:text-white/70">That NEPSE symbol is not available in the current dataset.</p>
      <Link href="/stocks" className="text-sm font-medium hover:underline">
        Back to stocks
      </Link>
    </div>
  );
}

