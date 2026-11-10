"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "../lib/cn";
import { useTheme, type ThemeMode } from "../lib/theme";
import { Menu } from "./overlays-extra";

/**
 * Alternador Claro · Escuro · Sistema. Sem props usa o próprio useTheme();
 * passe `mode`/`onChange` se o estado já vive no app.
 * `compact` mostra só ícones (sidebar recolhida, cabeçalho denso).
 * `variant="menu"` vira um botão de ícone que abre as três opções: para barra de topo e rail, onde
 * o alternador de três posições não cabe.
 */
export function ThemeToggle({
  mode,
  onChange,
  compact = false,
  variant = "segmented",
  className,
}: {
  mode?: ThemeMode;
  onChange?: (mode: ThemeMode) => void;
  compact?: boolean;
  variant?: "segmented" | "menu";
  className?: string;
}) {
  // Controlado (mode/onChange vindos de fora): o hook interno só lê, não aplica nada.
  const own = useTheme("system", { apply: mode === undefined });
  const value = mode ?? own.mode;
  const set = onChange ?? own.setMode;
  const options: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: "Claro", Icon: Sun },
    { value: "dark", label: "Escuro", Icon: Moon },
    { value: "system", label: "Sistema", Icon: Monitor },
  ];
  if (variant === "menu") {
    const Current = options.find((o) => o.value === value)?.Icon ?? Monitor;
    return (
      <Menu
        label={`Tema: ${options.find((o) => o.value === value)?.label ?? "Sistema"}`}
        align="end"
        triggerVariant="icon"
        triggerClassName={className}
        trigger={<Current className="h-4 w-4" aria-hidden />}
        items={[{ type: "radio", value, onValueChange: (v) => set(v as ThemeMode), options: options.map(({ value: v, label, Icon }) => ({ value: v, label, icon: <Icon aria-hidden /> })) }]}
      />
    );
  }
  return (
    <div className={cn("segmented-control", className)} role="group" aria-label="Tema">
      {options.map(({ value: v, label, Icon }) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => set(v)} title={label} aria-label={compact ? label : undefined}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {!compact && label}
        </button>
      ))}
    </div>
  );
}
