import { cn } from "@/lib/utils";

export function StatusDot({ up }: { up: boolean }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
      {up && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-signal-up animate-breathe-ring" />
      )}
      <span
        className={cn(
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          up ? "bg-signal-up animate-breathe" : "bg-signal-down"
        )}
      />
    </span>
  );
}
