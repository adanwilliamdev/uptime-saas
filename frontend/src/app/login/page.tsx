"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PulseMark } from "@/components/pulse-mark";
import { useLogin, useRegister } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const register = useRegister();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isPending = login.isPending || register.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "register") {
        await register.mutateAsync({ email, password });
        toast.success("Conta criada! Faça login para continuar.");
        setMode("login");
        return;
      }
      await login.mutateAsync({ email, password });
      router.push("/");
    } catch (err) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Não foi possível concluir. Verifique os dados e tente novamente.";
      toast.error(message);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Painel de marca */}
      <div className="relative hidden overflow-hidden bg-background lg:flex lg:flex-col lg:justify-between lg:p-12 bg-dot-grid">
        <svg
          viewBox="0 0 600 400"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.25]"
          aria-hidden="true"
        >
          <path
            d="M-20 220 L120 220 L150 160 L185 280 L215 220 L340 220 L370 130 L400 310 L430 220 L620 220"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="animate-pulse-line"
          />
        </svg>

        <div className="relative flex items-center gap-2.5">
          <PulseMark className="h-7 w-7" />
          <span className="font-display text-lg font-semibold tracking-tight">Uptime</span>
        </div>

        <div className="relative max-w-sm">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
            Saiba antes dos seus clientes.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Verificações contínuas dos seus endpoints, com histórico de latência e
            disponibilidade para cada monitor.
          </p>
        </div>
      </div>

      {/* Painel de formulário */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <PulseMark className="h-6 w-6" />
            <span className="font-display text-base font-semibold">Uptime</span>
          </div>

          <div className="mb-6 inline-flex rounded-md border border-border bg-panel p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={cn(
                "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
                mode === "login"
                  ? "bg-panel-hover text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={cn(
                "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
                mode === "register"
                  ? "bg-panel-hover text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Criar conta
            </button>
          </div>

          <h2 className="font-display text-xl font-semibold">
            {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
          </h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Entre para ver o status dos seus monitores."
              : "Leva menos de um minuto."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
