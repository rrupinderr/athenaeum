"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLibrary } from "./LibraryProvider";

const tabs = [
  { href: "/directors", label: "Directors" },
  { href: "/genres", label: "Genres" },
  { href: "/books", label: "Books" },
];

export function LibraryShell({
  children,
  search,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
}: {
  children: React.ReactNode;
  search?: string;
  onSearchChange?: (v: string) => void;
  stateFilter?: "all" | "watched" | "favorites";
  onStateFilterChange?: (v: "all" | "watched" | "favorites") => void;
}) {
  const pathname = usePathname();
  const { library, loading, error, toastMsg, toastKind, clearToast } = useLibrary();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(8,8,12,0.88)] backdrop-blur-xl px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="mr-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#a67c2e] flex items-center justify-center text-sm font-bold text-black">
            A
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">
              Athen<span className="text-[var(--accent)]">aeum</span>
            </h1>
            <p className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
              Films · Series · Books
            </p>
          </div>
        </div>

        <nav className="flex gap-1.5">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
                pathname.startsWith(t.href)
                  ? "bg-[var(--accent)] text-black border-[var(--accent)] font-bold"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {onSearchChange && (
          <input
            type="search"
            placeholder="Search…"
            value={search || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-3 py-2 pl-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm w-64 max-w-full bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27%237c7c8e%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.006a5 5 0 1 1 0-10 5 5 0 0 1 0 10z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[length:16px] bg-[position:12px_center]"
          />
        )}

        {onStateFilterChange && pathname !== "/books" && (
          <div className="flex gap-1.5">
            {(["all", "watched", "favorites"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onStateFilterChange(f)}
                className={`px-3 py-1.5 rounded-full text-xs border capitalize ${
                  stateFilter === f
                    ? "border-[#a67c2e] bg-[var(--surface2)] text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </header>

      {error && (
        <div className="bg-amber-950/40 border-b border-amber-800/50 text-amber-200 text-sm px-6 py-2 text-center">
          {error}
        </div>
      )}

      {loading && !library && (
        <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
          Loading library…
        </div>
      )}

      {library && children}

      {toastMsg && (
        <div
          role="status"
          onClick={clearToast}
          className={`fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-xl shadow-lg text-sm cursor-pointer max-w-sm ${
            toastKind === "err"
              ? "bg-red-950 border border-red-800 text-red-100"
              : "bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)]"
          }`}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
