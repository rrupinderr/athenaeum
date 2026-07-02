"use client";

import { useDiscover } from "./DiscoverContext";

export function useCastDiscover() {
  const { openDiscover } = useDiscover();

  function onCastClick(name: string) {
    openDiscover(name);
  }

  return { onCastClick };
}
