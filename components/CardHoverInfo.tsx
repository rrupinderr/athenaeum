"use client";

export function CardHoverInfo({
  directors,
  cast,
  genres,
  overview,
  showOverview = false,
  reserveToolbar = false,
  onDirectorClick,
  activeDirector,
  onCastClick,
}: {
  directors?: string[];
  cast?: string[];
  genres?: string[];
  overview?: string | null;
  showOverview?: boolean;
  reserveToolbar?: boolean;
  onDirectorClick?: (director: string) => void;
  activeDirector?: string | null;
  onCastClick?: (name: string) => void;
}) {
  const hasDirectors = Boolean(directors?.length);
  const hasCast = Boolean(cast?.length);
  const hasGenres = Boolean(genres?.length);
  const hasOverview = showOverview && Boolean(overview?.trim());

  if (!hasDirectors && !hasCast && !hasGenres && !hasOverview) return null;

  return (
    <div
      className={`card-hover-info absolute inset-x-0 bottom-0 z-[8] px-2.5 pt-12 bg-gradient-to-t from-black/95 via-black/82 to-transparent transition-opacity pointer-events-none ${
        activeDirector ? "opacity-100" : "opacity-0 group-hover/poster:opacity-100"
      } ${reserveToolbar ? "pb-12" : "pb-2.5"}`}
    >
      {hasDirectors && (
        <p className="text-[0.62rem] leading-snug mb-1">
          <span className="text-white/55 uppercase tracking-wide text-[0.55rem]">Director · </span>
          {directors!.map((name, i) => (
            <span key={`dir-${name}-${i}`}>
              {i > 0 && <span className="text-white/90">, </span>}
              {onDirectorClick ? (
                <button
                  type="button"
                  className={`person-link pointer-events-auto hover:underline ${
                    activeDirector === name ? "text-[var(--accent2-bright)]" : "text-white/90"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDirectorClick(name);
                  }}
                >
                  {name}
                </button>
              ) : (
                <span className="text-white/90">{name}</span>
              )}
            </span>
          ))}
        </p>
      )}
      {hasCast && (
        <p className="text-[0.62rem] leading-snug">
          <span className="text-white/55 uppercase tracking-wide text-[0.55rem]">Cast · </span>
          {cast!.map((name, i) => (
            <span key={`cast-${name}-${i}`}>
              {i > 0 && <span className="text-white/85">, </span>}
              {onCastClick ? (
                <button
                  type="button"
                  className="person-link pointer-events-auto text-white/85 hover:underline hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onCastClick(name);
                  }}
                >
                  {name}
                </button>
              ) : (
                <span className="text-white/85">{name}</span>
              )}
            </span>
          ))}
        </p>
      )}
      {!hasDirectors && !hasCast && hasOverview && (
        <p className="text-[0.68rem] text-white/92 leading-snug line-clamp-4">{overview}</p>
      )}
      {!hasDirectors && !hasCast && !hasOverview && hasGenres && (
        <p className="text-[0.65rem] text-white/80 line-clamp-2">{genres!.slice(0, 4).join(" · ")}</p>
      )}
    </div>
  );
}
