"use client";

import { useRouter } from "next/navigation";
import { useDiscover } from "./DiscoverContext";

export function useDirectorNavigation() {
  const router = useRouter();
  const { closeDiscover } = useDiscover();

  function navigateToDirector(name: string) {
    closeDiscover();
    router.push(`/directors?d=${encodeURIComponent(name)}`);
  }

  return { onDirectorClick: navigateToDirector };
}
