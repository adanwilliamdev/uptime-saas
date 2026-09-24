"use client";

export function PulseStrip({
  active,
  down,
  total,
}: {
  active: number;
  down: number;
  total: number;
}) {
  const allOperational = down === 0 && total > 0;
  const headline =
    total === 0
      ? "Sem monitores ainda"
      : allOperational
      ? "Tudo operacional"
      : `${down} ${down === 1 ? "interrupção" : "interrupções"} detectada${down === 1 ? "" : "s"}`;

  const lineColor = total === 0 ? "hsl(var(--muted-foreground))" : allOperational ? "hsl(var(--signal-up))" : "hsl(var(--signal-down))";

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-panel">
      <svg
        viewBox="0 0 800 90"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-[0.35]"
        aria-hidden="true"
      >
        <path
          d="M0 45 L120 45 L145 12 L170 78 L195 45 L340 45 L365 22 L385 68 L405 45 L560 45 L585 12 L610 78 L635 45 L800 45"
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          className="animate-pulse-line"
        />
      </svg>

      <div className="relative flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{headline}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verificações contínuas dos seus endpoints
          </p>
        </div>

        <div className="flex items-center gap-6 sm:gap-8">
          <Stat label="Ativos" value={active} tone="up" />
          <Stat label="Fora do ar" value={down} tone={down > 0 ? "down" : "default"} />
          <Stat label="Total" value={total} tone="default" />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "up" | "down" | "default";
}) {
  const color =
    tone === "up" ? "text-signal-up" : tone === "down" ? "text-signal-down" : "text-foreground";
  return (
    <div className="text-right">
      <div className={`font-data text-2xl font-medium ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
