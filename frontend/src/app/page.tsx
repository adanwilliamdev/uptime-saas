"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, X } from "lucide-react";
import { useMonitors, useCreateMonitor, useDeleteMonitor } from "@/hooks/useMonitors";
import { isAuthenticated, logout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PulseMark } from "@/components/pulse-mark";
import { PulseStrip } from "@/components/pulse-strip";
import { MonitorRow } from "@/components/monitor-row";

export default function DashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  const { data: monitors = [], isLoading } = useMonitors();
  const createMonitor = useCreateMonitor();
  const deleteMonitor = useDeleteMonitor();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", interval_seconds: 60 });

  const total = monitors.length;
  const down = monitors.filter((m) => !m.is_active).length;
  const active = total - down;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMonitor.mutateAsync({
      name: form.name,
      url: form.url,
      interval_seconds: form.interval_seconds,
    });
    setForm({ name: "", url: "", interval_seconds: 60 });
    setShowForm(false);
  };

  if (checkingAuth) return null;

  return (
    <div className="min-h-screen bg-dot-grid">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PulseMark className="h-7 w-7" />
            <span className="font-display text-lg font-semibold tracking-tight">Uptime</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowForm((v) => !v)} size="sm">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? "Fechar" : "Novo monitor"}
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <div className="space-y-6">
          <PulseStrip active={active} down={down} total={total} />

          <div
            className={`grid overflow-hidden rounded-lg border border-border bg-panel transition-all duration-200 ${
              showForm ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] border-0 opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="api-principal"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required={showForm}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://api.exemplo.com/health"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    required={showForm}
                  />
                </div>
                <div>
                  <Label htmlFor="interval">Intervalo (s)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min={30}
                    value={form.interval_seconds}
                    onChange={(e) => setForm({ ...form, interval_seconds: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end md:col-span-3">
                  <Button type="submit" disabled={createMonitor.isPending}>
                    {createMonitor.isPending ? "Criando..." : "Criar monitor"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-panel px-5">
            {isLoading && (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
            )}
            {!isLoading && monitors.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <PulseMark className="h-8 w-8 opacity-60" />
                <p className="text-sm text-muted-foreground">
                  Nenhum monitor ainda. Adicione um endpoint para começar a receber pulsos.
                </p>
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" />
                  Novo monitor
                </Button>
              </div>
            )}
            {monitors.map((m) => (
              <MonitorRow
                key={m.id}
                monitor={m}
                onDelete={(id) => deleteMonitor.mutate(id)}
                isDeleting={deleteMonitor.isPending}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
