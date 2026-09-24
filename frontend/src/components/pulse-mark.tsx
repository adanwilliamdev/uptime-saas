export function PulseMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" className="stroke-border" strokeWidth="1" />
      <path
        d="M4 16h5l2.2-6.5L15 22l3-11.5L20.4 16H28"
        className="stroke-primary"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
