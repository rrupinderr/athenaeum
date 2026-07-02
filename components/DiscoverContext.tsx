"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface DiscoverContextValue {
  discoverOpen: boolean;
  discoverQuery: string;
  openDiscover: (query: string) => void;
  closeDiscover: () => void;
}

const DiscoverContext = createContext<DiscoverContextValue | null>(null);

export function DiscoverProvider({ children }: { children: ReactNode }) {
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverQuery, setDiscoverQuery] = useState("");

  const openDiscover = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setDiscoverQuery(q);
    setDiscoverOpen(true);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  const closeDiscover = useCallback(() => setDiscoverOpen(false), []);

  const value = useMemo(
    () => ({ discoverOpen, discoverQuery, openDiscover, closeDiscover }),
    [discoverOpen, discoverQuery, openDiscover, closeDiscover]
  );

  return <DiscoverContext.Provider value={value}>{children}</DiscoverContext.Provider>;
}

export function useDiscover() {
  const ctx = useContext(DiscoverContext);
  if (!ctx) throw new Error("useDiscover must be used within DiscoverProvider");
  return ctx;
}
