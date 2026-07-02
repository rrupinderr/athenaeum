import { Suspense } from "react";

import { LibraryProvider } from "@/components/LibraryProvider";

import { DirectorsView } from "@/components/DirectorsView";



export default function DirectorsPage() {

  return (

    <LibraryProvider>

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[var(--muted)]">Loading…</div>}>

        <DirectorsView />

      </Suspense>

    </LibraryProvider>

  );

}

