"use client";

import type { CSSProperties } from "react";

export function CategoryChips({
  label,
  options,
  active,
  onChange,
  fadeBg,
}: {
  label: string;
  options: string[];
  active: string | null;
  onChange: (value: string | null) => void;
  /** CSS color for horizontal scroll fade edges (match sticky header bg) */
  fadeBg?: string;
}) {
  if (options.length === 0) return null;

  const wrapStyle = fadeBg ? ({ "--scroll-fade": fadeBg } as CSSProperties) : undefined;

  return (
    <div className="flex items-center gap-2 min-w-0 mb-3 chip-scroll-bar" style={wrapStyle}>
      <span className="text-[0.65rem] uppercase tracking-wider text-[var(--muted)] shrink-0 w-16">
        {label}
      </span>
      <div className="scroll-x-wrap">
        <div className="scroll-x-row">
          <button
            type="button"
            onClick={() => onChange(null)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs border transition-colors ${
              active === null
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent2-bright)] hover:text-[var(--text)]"
            }`}
          >
            All
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active === opt ? null : opt)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs border transition-colors max-w-[180px] truncate ${
                active === opt
                  ? "bg-[var(--accent2)] text-white border-[var(--accent2-bright)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent2-bright)] hover:text-[var(--text)]"
              }`}
              title={opt}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
