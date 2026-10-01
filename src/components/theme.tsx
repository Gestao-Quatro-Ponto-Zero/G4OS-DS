"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "../lib/cn";
import { useTheme, type ThemeMode } from "../lib/theme";

/**
 * Alternador Claro · Escuro · Sistema. Sem props usa o próprio useTheme();
 * passe `mode`/`onChange` se o estado já vive no app.
 * `compact` mostra só ícones (sidebar recolhida, cabeçalho denso).
 */
export function ThemeToggle({
  mode,
  onChange,
  compact = false,
  className,
}: {
  mode?: ThemeMode;
  onChange?: (mode: ThemeMode) => void;
  compact?: boolean;
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
