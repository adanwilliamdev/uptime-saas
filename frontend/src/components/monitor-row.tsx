"use client";

import { useState } from "react";
import { Trash2, Clock } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { useMonitorLogs, useMonitorUptime } from "@/hooks/useMonitors";
import { StatusDot } from "@/components/status-dot";
import { Button } from "@/components/ui/button";
import type { Monitor } from "@/types";

export function MonitorRow({
  monitor,
  onDelete,
  isDeleting,
}: {
  monitor: Monitor;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const { data: logs = [] } = useMonitorLogs(monitor.id, 24);
  const { data: uptime } = useMonitorUptime(monitor.id, 7);

  const sparkData = logs
    .slice()
    .reverse()
    .map((log, i) => ({ i, ms: log.response_time_ms, up: log.is_up }));

  const lineColor = monitor.is_active ? "hsl(var(--signal-up))" : "hsl(var(--signal-down))";

  return (
    <div className="group flex items-center gap-4 border-b border-border px-1 py-4 last:border-b-0">
      <StatusDot up={monitor.is_active} />

      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[15px] font-medium">{monitor.name}</div>
        <div className="truncate font-data text-xs text-muted-foreground">{monitor.url}</div>
      </div>

      <div className="hidden h-9 w-28 shrink-0 sm:block">
        {sparkData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
              <Line
                type="monotone"
                dataKey="ms"
                stroke={lineColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-px w-full self-center bg-border" />
        )}
      </div>

      <div className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground md:flex">
        <Clock className="h-3 w-3" />
        <span className="font-data">{monitor.interval_seconds}s</span>
      </div>

      <div className="w-16 shrink-0 text-right font-data text-sm">
        {uptime ? `${uptime.avg_latency_ms.toFixed(0)}ms` : "—"}
      </div>

      <div className="w-16 shrink-0 text-right font-data text-sm">
        {uptime ? `${uptime.uptime_percent.toFixed(1)}%` : "—"}
      </div>

      <div className="shrink-0">
        {confirming ? (
          <div className="flex items-center gap-1.5">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(monitor.id)}
              disabled={isDeleting}
            >
              {isDeleting ? "Removendo..." : "Confirmar"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => setConfirming(true)}
            aria-label={`Remover ${monitor.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
