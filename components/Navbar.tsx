import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/stocks", label: "Market" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/trade", label: "Practice" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-500">
            <path
              d="M4 18V6M4 18H20M8 14l2-2 3 3 5-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>NEPSELab</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-sm text-black/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/10"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <form action="/stocks" className="hidden w-full max-w-md md:block">
          <label className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              name="q"
              placeholder="Search stocks, sectors…"
              className="w-full rounded-full border border-black/10 bg-white/70 py-2 pl-9 pr-3 text-sm text-black placeholder:text-black/50 outline-none ring-black/10 focus:ring-4 dark:border-white/15 dark:bg-black/20 dark:text-white dark:placeholder:text-white/50 dark:ring-white/20"
            />
          </label>
        </form>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-black/70 hover:bg-black/5 dark:border-white/15 dark:bg-black/20 dark:text-white/70 dark:hover:bg-white/10"
            aria-label="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 17H9m9-2V11a6 6 0 10-12 0v4l-2 2h16l-2-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-black/70 hover:bg-black/5 dark:border-white/15 dark:bg-black/20 dark:text-white/70 dark:hover:bg-white/10"
            aria-label="Messages"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4h16v12H7l-3 3V4z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-sm text-black/80 hover:bg-black/5 dark:border-white/15 dark:bg-black/20 dark:text-white/80 dark:hover:bg-white/10"
          >
            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
            <span className="hidden sm:inline">Account</span>
          </button>
        </div>
      </div>
    </header>
  );
}
