"use client";

import { useCallback, useEffect, useState } from "react";
import { ReactReader } from "react-reader";

export default function EpubReaderClient({
  bookId,
  url,
  title,
}: {
  bookId: string;
  url: string;
  title: string;
}) {
  const [location, setLocation] = useState<string | number>(0);

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then((s) => {
        const prog = s.book_progress?.[bookId];
        if (prog?.cfi) setLocation(prog.cfi);
        else if (prog?.page) setLocation(prog.page);
      })
      .catch(() => {});
  }, [bookId]);

  const saveProgress = useCallback(
    (cfi: string) => {
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookId,
          book_progress: { cfi, updated: new Date().toISOString() },
        }),
      }).catch(() => {});
    },
    [bookId]
  );

  return (
    <div className="h-[calc(100vh-56px)] bg-[#0f0f15]">
      <ReactReader
        url={url}
        title={title}
        location={location}
        locationChanged={(loc: string) => {
          setLocation(loc);
          saveProgress(loc);
        }}
      />
    </div>
  );
}
