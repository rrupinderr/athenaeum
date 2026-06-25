"use client";

import type { SubtitleInfo } from "@/types/library";

export function StatusBadges({
  watched,
  favorite,
  subtitles,
  onSubtitleClick,
}: {
  watched: boolean;
  favorite: boolean;
  subtitles?: SubtitleInfo;
  onSubtitleClick?: () => void;
}) {
  const src = subtitles?.source || "none";
  const ccClass =
    src === "external" || src === "both"
      ? "badge-cc-ok"
      : src === "embedded"
        ? "badge-cc-embed"
        : "badge-cc-none";
  const ccLabel =
    src === "both"
      ? "CC ✓+⊡"
      : src === "external"
        ? "CC ✓"
        : src === "embedded"
          ? "CC ⊡"
          : "CC —";
  const ccTitle =
    src === "none"
      ? "No subtitles — click to search"
      : [
          subtitles?.languages?.length ? `External: ${subtitles.languages.join(", ")}` : null,
          subtitles?.embedded_languages?.length ? `Embedded: ${subtitles.embedded_languages.join(", ")}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Subtitles available";

  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end pointer-events-none">
      <div className="flex gap-1 flex-wrap justify-end pointer-events-auto">
        {watched && (
          <span className="badge-pill badge-watched" title="Watched">
            ✓ Watched
          </span>
        )}
        {favorite && (
          <span className="badge-pill badge-fav" title="Favorite">
            ★ Fav
          </span>
        )}
        <button
          type="button"
          className={`badge-pill ${ccClass} cursor-pointer`}
          title={ccTitle}
          onClick={(e) => {
            e.stopPropagation();
            onSubtitleClick?.();
          }}
        >
          {ccLabel}
        </button>
      </div>
    </div>
  );
}
