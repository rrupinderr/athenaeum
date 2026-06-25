export function WebSearchIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a14.5 14.5 0 0 0 0 18" />
      <path d="M3 12h18" />
      <path d="M16 16l5 5" />
      <path d="M19 16v5h-5" />
    </svg>
  );
}
