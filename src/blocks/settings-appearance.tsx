import { Check, Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { Badge, Button, Delta, SettingsSection, Switch, ThemeToggle, brandPresets, cn, notify, typePresets, useTheme } from "@g4os/ds";
import { useState } from "react";
import { org } from "./data/workspace";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Aparência e marca",
  description: "Modo claro/escuro/sistema, marca do cliente (white-label) e tipografia aplicados ao vivo no app inteiro, com prévia e restauração.",
  category: "Configurações",
  order: 2,
  height: 900,
} as const;

/*
 * White-label em uma tela: a pessoa escolhe modo e o administrador escolhe a
 * marca e a tipografia da organização. Tudo vem de lib/theme (useTheme) e dos
 * presets em themes.css; nenhum componente muda.
 */

const modes = [
  { value: "light" as const, label: "Claro", Icon: Sun },
  { value: "dark" as const, label: "Escuro", Icon: Moon },
  { value: "system" as const, label: "Sistema", Icon: Monitor },
];

function MiniPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-page" aria-hidden>
      <div className="flex">
        <div className="hidden w-24 shrink-0 space-y-1.5 border-r border-line bg-rail p-2.5 sm:block">
          <div className="h-2 w-12 rounded bg-ink/80" />
          <div className="mt-3 h-5 rounded-md border border-line bg-surface" />
          <div className="h-5 rounded-md" />
          <div className="h-5 rounded-md" />
        </div>
        <div className="min-w-0 flex-1 space-y-2.5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-[15px] tracking-tight [font-weight:var(--ds-display-weight)]">
              Visão geral
            </span>
            <span className="rounded-md bg-primary px-2 py-1 text-[10.5px] font-medium text-on-primary">Novo</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-surface p-2">
              <div className="text-[10px] text-muted">Receita</div>
              <div className="mt-0.5 flex items-center justify-between text-[13px] font-semibold tabular-nums">
                R$ 412 mil <Delta value={0.12} />
              </div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2">
              <div className="text-[10px] text-muted">Meta</div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                <div className="h-full w-2/3 rounded-full bg-accent" />
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Badge tone="ok">Pago</Badge>
            <Badge tone="accent">Premium</Badge>
            <span className="text-[11px] font-medium text-blue">Ver detalhes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsAppearanceBlock() {
  const theme = useTheme("light");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [compact, setCompact] = useState(false);
  const reset = () => {
    theme.setMode("light");
    theme.setBrand("g4");
    theme.setType("g4");
    notify("Aparência restaurada para o padrão G4");
  };

  return (
    <SettingsShell
      slug="settings-appearance"
      title="Aparência e marca"
      description="O modo é pessoal. Marca e tipografia valem para todo o workspace e aparecem para clientes em propostas e no portal."
      actions={
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw /> Restaurar padrão
        </Button>
      }
    >
      <SettingsSection title="Modo" description="“Sistema” acompanha o claro/escuro do seu computador ou celular.">
        <div className="grid grid-cols-3 gap-2.5">
          {modes.map(({ value, label, Icon }) => {
            const on = theme.mode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => theme.setMode(value)}
                className={cn("flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-[13px] transition-colors", on ? "border-primary bg-surface font-medium text-ink ring-1 ring-primary" : "border-line bg-surface text-ink-soft hover:bg-soft")}
              >
                <Icon className="h-5 w-5" strokeWidth={1.65} />
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          Versão compacta para o menu do usuário: <ThemeToggle compact mode={theme.mode} onChange={theme.setMode} />
        </div>
      </SettingsSection>

      <SettingsSection title="Marca do workspace" description={`Cores e cantos que a ${org.name} usa. Clientes veem a mesma marca no portal e nas propostas.`}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {brandPresets.map((b) => {
            const on = theme.brand === b.id;
            return (
              <button
                key={b.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  theme.setBrand(b.id);
                  notify(`Marca “${b.label}” aplicada ao workspace`);
                }}
                className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors", on ? "border-primary bg-surface ring-1 ring-primary" : "border-line bg-surface hover:bg-soft")}
              >
                <span aria-hidden className="flex shrink-0">
                  <span className="h-6 w-6 rounded-full border border-line-strong" style={{ background: b.primary }} />
                  <span className="-ml-2 h-6 w-6 rounded-full border border-line-strong" style={{ background: b.accent }} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{b.label}</span>
                {on && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <p className="m-0 mb-2 text-[12px] text-muted">Prévia</p>
          <MiniPreview />
        </div>
      </SettingsSection>

      <SettingsSection title="Tipografia" description="A fonte dos títulos dá o tom; o corpo continua legível em tabelas densas.">
        <div className="space-y-2">
          {typePresets.map((t) => {
            const on = theme.type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => theme.setType(t.id)}
                className={cn("flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors", on ? "border-primary bg-surface ring-1 ring-primary" : "border-line bg-surface hover:bg-soft")}
              >
                <span className="w-10 shrink-0 text-[24px] leading-none text-ink" style={{ fontFamily: `"${t.sample}", system-ui` }}>
                  Aa
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">{t.label}</span>
                  <span className="block truncate text-[12px] text-muted" style={{ fontFamily: `"${t.sample}", system-ui` }}>
                    Proposta comercial · Grupo Aurora · R$ 412.380,00
                  </span>
                </span>
                {on && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="Acessibilidade" description="Preferências só suas, neste navegador.">
        <div className="space-y-1">
          <Switch label="Reduzir animações" checked={reduceMotion} onCheckedChange={(v) => { setReduceMotion(v); notify(v ? "Animações reduzidas" : "Animações normais", undefined, "info"); }} />
          <Switch label="Tabelas compactas por padrão" checked={compact} onCheckedChange={(v) => { setCompact(v); notify(v ? "Densidade compacta ativada" : "Densidade confortável", undefined, "info"); }} />
        </div>
      </SettingsSection>
    </SettingsShell>
  );
}
