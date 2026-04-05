import Link from "next/link";

const links = [
  { href: "/stocks", label: "Market" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/trade", label: "Simulator" },
] as const;

export function Navbar() {
  return (
    <header className="border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          NEPSELab
        </Link>
        <nav className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
