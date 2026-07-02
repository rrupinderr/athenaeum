"use client";

import type { SubtitleInfo } from "@/types/library";
import { WebSearchIcon } from "./icons/WebSearchIcon";

function ccMeta(subtitles?: SubtitleInfo) {
  const src = subtitles?.source || "none";
  const ccClass =
    src === "external" || src === "both"
      ? "badge-cc-ok"
      : src === "embedded"
        ? "badge-cc-embed"
        : "badge-cc-none";
  const ccLabel = src === "embedded" ? "⊡" : "CC";
  const ccTitle =
    src === "none"
      ? "No subtitles — click to search"
      : [
          subtitles?.languages?.length ? `External: ${subtitles.languages.join(", ")}` : null,
          subtitles?.embedded_languages?.length
            ? `Embedded: ${subtitles.embedded_languages.join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Subtitles available";
  return { ccClass, ccLabel, ccTitle, src };
}

function ToolbarBtn({
  active,
  activeClass,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  activeClass?: string;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`badge-icon ${active ? activeClass : ""}`}
    >
      {children}
    </button>
  );
}

export function CardPosterOverlay({
  watched,
  favorite,
  subtitles,
  onToggleWatched,
  onToggleFavorite,
  onSubtitleClick,
  onWebSearch,
  onExplore,
  onDelete,
  hideToggles,
  tvProgress,
  readProgress,
}: {
  watched: boolean;
  favorite: boolean;
  subtitles?: SubtitleInfo;
  onToggleWatched?: () => void;
  onToggleFavorite?: () => void;
  onSubtitleClick?: () => void;
  onWebSearch?: () => void;
  onExplore?: () => void;
  onDelete?: () => void;
  hideToggles?: boolean;
  tvProgress?: { watched: number; total: number };
  readProgress?: number | null;
}) {
  const { ccClass, ccLabel, ccTitle, src } = ccMeta(subtitles);
  const showCc = onSubtitleClick != null;

  const stop = (e: React.MouseEvent, fn?: () => void) => {
    e.stopPropagation();
    fn?.();
  };

  return (
    <>
      <div className="status-icon-row absolute top-2 right-2 z-10 flex gap-1 flex-nowrap items-center pointer-events-none">
        {tvProgress && tvProgress.total > 0 && (
          <span
            className={`badge-icon badge-progress ${tvProgress.watched >= tvProgress.total ? "badge-watched" : ""}`}
            title={`${tvProgress.watched} / ${tvProgress.total} watched`}
          >
            {tvProgress.watched >= tvProgress.total ? "✓" : `${tvProgress.watched}/${tvProgress.total}`}
          </span>
        )}
        {!tvProgress && watched && (
          <span className="badge-icon badge-watched pointer-events-auto" title="Watched">
            ✓
          </span>
        )}
        {favorite && (
          <span className="badge-icon badge-fav pointer-events-auto" title="Favorite">
            ★
          </span>
        )}
        {readProgress != null && readProgress > 0 && (
          <span className="badge-icon badge-cc-embed pointer-events-auto" title="Reading progress">
            {Math.round(readProgress)}%
          </span>
        )}
        {showCc && (
          <button
            type="button"
            className={`badge-icon ${ccClass} pointer-events-auto`}
            title={ccTitle}
            onClick={(e) => stop(e, onSubtitleClick)}
          >
            {ccLabel}
          </button>
        )}
      </div>

      <div
        className="card-poster-toolbar absolute inset-x-0 top-0 z-20 flex items-center gap-1 p-2 pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        {!hideToggles && onToggleWatched && (
          <ToolbarBtn
            active={watched}
            activeClass="badge-watched"
            title={watched ? "Mark unwatched" : "Mark watched"}
            onClick={(e) => stop(e, onToggleWatched)}
          >
            ✓
          </ToolbarBtn>
        )}
        {!hideToggles && onToggleFavorite && (
          <ToolbarBtn
            active={favorite}
            activeClass="badge-fav"
            title={favorite ? "Remove favorite" : "Add favorite"}
            onClick={(e) => stop(e, onToggleFavorite)}
          >
            ★
          </ToolbarBtn>
        )}
        {showCc && (
          <ToolbarBtn
            active={src !== "none"}
            activeClass={ccClass}
            title={ccTitle}
            onClick={(e) => stop(e, onSubtitleClick)}
          >
            {ccLabel}
          </ToolbarBtn>
        )}
        {onWebSearch && (
          <ToolbarBtn title="Search 1337x" onClick={(e) => stop(e, onWebSearch)}>
            <WebSearchIcon size={12} />
          </ToolbarBtn>
        )}
        {onExplore && (
          <ToolbarBtn title="Open folder" onClick={(e) => stop(e, onExplore)}>
            📁
          </ToolbarBtn>
        )}
        {onDelete && (
          <ToolbarBtn title="Delete folder" onClick={(e) => stop(e, onDelete)}>
            🗑
          </ToolbarBtn>
        )}
      </div>
    </>
  );
}
