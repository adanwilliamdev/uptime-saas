"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Monitor, MonitorCreate, PingLog, UptimeStats } from "@/types";

const KEY = "monitors";

export function useMonitors() {
  return useQuery({
    queryKey: [KEY],
    queryFn: async () => (await api.get<Monitor[]>("/monitors")).data,
    refetchInterval: 10_000, // atualiza a cada 10s
  });
}

export function useCreateMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MonitorCreate) =>
      (await api.post<Monitor>("/monitors", data)).data,
    onSuccess: (created) => {
      qc.setQueryData<Monitor[]>([KEY], (old) => (old ? [created, ...old] : [created]));
      toast.success("Monitor criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar monitor"),
  });
}

export function useUpdateMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MonitorCreate> }) =>
      (await api.patch<Monitor>(`/monitors/${id}`, data)).data,
    onSuccess: (updated) => {
      qc.setQueryData<Monitor[]>([KEY], (old) =>
        old ? old.map((m) => (m.id === updated.id ? updated : m)) : []
      );
      toast.success("Monitor atualizado!");
    },
  });
}

export function useDeleteMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/monitors/${id}`);
    },
    onSuccess: (_, id) => {
      qc.setQueryData<Monitor[]>([KEY], (old) => old?.filter((m) => m.id !== id) ?? []);
      toast.success("Monitor removido");
    },
  });
}

export function useMonitorLogs(monitorId: string, hours = 24) {
  return useQuery({
    queryKey: ["logs", monitorId, hours],
    queryFn: async () =>
      (await api.get<PingLog[]>(`/monitors/${monitorId}/logs`, { params: { hours } })).data,
    enabled: !!monitorId,
    refetchInterval: 15_000,
  });
}

export function useMonitorUptime(monitorId: string, days = 7) {
  return useQuery({
    queryKey: ["uptime", monitorId, days],
    queryFn: async () =>
      (await api.get<UptimeStats>(`/monitors/${monitorId}/uptime`, { params: { days } })).data,
    enabled: !!monitorId,
    refetchInterval: 30_000,
  });
}
