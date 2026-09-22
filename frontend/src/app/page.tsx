"use client";

import { useState } from "react";
import { Activity, AlertTriangle, Gauge, Plus } from "lucide-react";
import { useMonitors, useCreateMonitor, useDeleteMonitor } from "@/hooks/useMonitors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
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

  return (
    <main className="container mx-auto py-10 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel de Uptime</h1>
          <p className="text-muted-foreground">Monitore seus endpoints em tempo real</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Monitor
        </Button>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monitores Ativos</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fora do Ar</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{down}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Gauge className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
      </section>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://api.exemplo.com/health"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
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
              <div className="md:col-span-3">
                <Button type="submit" disabled={createMonitor.isPending}>
                  {createMonitor.isPending ? "Criando..." : "Criar Monitor"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <section className="space-y-3">
        {isLoading && <p className="text-muted-foreground">Carregando...</p>}
        {!isLoading && monitors.length === 0 && (
          <p className="text-muted-foreground">Nenhum monitor cadastrado ainda.</p>
        )}
        {monitors.map((m) => (
          <Card key={m.id} className="flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{m.name}</span>
                <Badge variant={m.is_active ? "default" : "destructive"}>
                  {m.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{m.url}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMonitor.mutate(m.id)}
            >
              Remover
            </Button>
          </Card>
        ))}
      </section>
    </main>
  );
}
