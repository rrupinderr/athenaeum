"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WebSearchIcon } from "./icons/WebSearchIcon";
import { useLibrary } from "./LibraryProvider";
import { DiscoverProvider, useDiscover } from "./DiscoverContext";
import { DiscoverPanel } from "./DiscoverPanel";
import type { StateFilter, TypeFilter } from "@/lib/filters";
import { buildWebSearchUrl } from "@/lib/web-search";

const tabs = [
  { href: "/directors", label: "Directors" },
  { href: "/genres", label: "Genres" },
  { href: "/books", label: "Books" },
];

function LibraryShellInner({
  children,
  search,
  onSearchChange,
  searchPlaceholder = "Search library…",
  stateFilter,
  onStateFilterChange,
  typeFilter,
  onTypeFilterChange,
  showTypeFilter = false,
}: {
  children: React.ReactNode;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  stateFilter?: StateFilter;
  onStateFilterChange?: (v: StateFilter) => void;
  typeFilter?: TypeFilter;
  onTypeFilterChange?: (v: TypeFilter) => void;
  showTypeFilter?: boolean;
}) {
  const pathname = usePathname();
  const { library, loading, error, toastMsg, toastKind, clearToast } = useLibrary();
  const { discoverOpen, discoverQuery, openDiscover, closeDiscover } = useDiscover();
  const isBooks = pathname.startsWith("/books");

  function handleDiscoverClick() {
    const q = search?.trim();
    if (!q) return;
    if (isBooks) {
      window.open(buildWebSearchUrl(q, null, "book"), "_blank", "noopener,noreferrer");
      return;
    }
    openDiscover(q);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(7,11,20,0.92)] backdrop-blur-xl px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="mr-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-sm font-bold text-white">
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
                  ? "bg-[var(--accent)] text-white border-[var(--accent)] font-bold"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent2-bright)]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {onSearchChange && (
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={search || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || isBooks) return;
                e.preventDefault();
                const q = search?.trim();
                if (!q) return;
                openDiscover(q);
              }}
              className="px-3 py-2 pl-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm w-64 max-w-full text-[var(--text)]"
            />
            <button
              type="button"
              title={isBooks ? "Search the web" : "Discover on TMDB"}
              aria-label={isBooks ? "Search the web" : "Discover on TMDB"}
              disabled={!search?.trim()}
              onClick={handleDiscoverClick}
              className={`p-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                discoverOpen && !isBooks
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[rgba(196,30,58,0.12)]"
                  : "border-[var(--border)] text-[var(--accent2-bright)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
              }`}
            >
              <WebSearchIcon size={18} />
            </button>
          </div>
        )}

        {showTypeFilter && onTypeFilterChange && (
          <div className="flex gap-1.5">
            {(["all", "movie", "tv"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onTypeFilterChange(f)}
                className={`px-3 py-1.5 rounded-full text-xs border capitalize ${
                  typeFilter === f
                    ? "border-[var(--accent2-bright)] bg-[var(--surface2)] text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {f === "all" ? "All" : f === "movie" ? "Movies" : "TV"}
              </button>
            ))}
          </div>
        )}

        {onStateFilterChange && (
          <div className="flex gap-1.5">
            {(["all", "watched", "favorites"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onStateFilterChange(f)}
                className={`px-3 py-1.5 rounded-full text-xs border capitalize ${
                  stateFilter === f
                    ? "border-[var(--accent)] bg-[var(--surface2)] text-[var(--text)]"
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
        <div className="bg-red-950/40 border-b border-red-900/50 text-red-200 text-sm px-6 py-2 text-center">
          {error}
        </div>
      )}

      {loading && !library && (
        <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
          Loading library…
        </div>
      )}

      {library && discoverOpen && !isBooks && (
        <DiscoverPanel
          query={discoverQuery || search || ""}
          typeFilter={typeFilter}
          stateFilter={stateFilter}
          onClose={closeDiscover}
        />
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

export function LibraryShell(props: React.ComponentProps<typeof LibraryShellInner>) {
  return (
    <DiscoverProvider>
      <LibraryShellInner {...props} />
    </DiscoverProvider>
  );
}