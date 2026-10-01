"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatIsoBr, isBusinessDay, todayIso, type Holiday } from "../lib/dates";
import { usePortalContainer } from "../lib/portal";
import { Calendar } from "./dates";
import { fieldClass, sheetBackdropClass, sheetPositionerClass, useControlLabel, type ControlLabelProps, type PopupPresentation } from "./forms";
import { popupClass } from "./overlays";

/*
 * Seletor de data de botão (sem digitação). Mantido por compatibilidade:
 * para formulários prefira DateInput (digitável, com atalhos) de dates.tsx.
 * Desde a v0.2 usa o Calendar próprio do DS — react-day-picker não é mais
 * necessário.
 */

/** "2026-09-30" → "30/09/2026". */
export function formatIsoDate(iso: string) {
  return formatIsoBr(iso);
}

/**
 * Seletor de data (Popover + Calendar, pt-BR). Valor é só-data
 * ("YYYY-MM-DD"), nunca Date com hora, e é lido sem fuso (o dia não
 * "volta um" em UTC−3). Nada de <input type="date">: no iPhone ele abre em
 * inglês e carrega vazio. Vazio mostra `placeholder` (diga o que acontece
 * sem data: "Hoje (padrão)"); `clearable` volta para vazio. O rodapé tem
 * atalhos "Hoje"/"Limpar". No celular, o calendário abre como folha inferior.
 */
export function DatePicker({
  value,
  onValueChange,
  label,
  hideLabel,
  hint,
  error,
  optional,
  disabled,
  className,
  min,
  max,
  businessDaysOnly,
  extraHolidays,
  placeholder = "Selecione a data",
  triggerContent,
  clearable = false,
  shortcuts = true,
  now,
  id,
  presentation = "auto",
}: ControlLabelProps & {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  /** Só dias úteis (fins de semana e feriados nacionais desabilitados). */
  businessDaysOnly?: boolean;
  extraHolidays?: Holiday[];
  placeholder?: string;
  /** Gatilho próprio (ex.: chip). Sem rótulo visível: passe `hideLabel`. */
  triggerContent?: ReactNode;
  /** Botão × no campo para voltar a vazio. */
  clearable?: boolean;
  /** Rodapé com "Hoje" (e "Limpar" quando `clearable`). */
  shortcuts?: boolean;
  /** "Hoje" de referência (testes, fuso do servidor). Padrão: data local. */
  now?: string;
  id?: string;
  /** auto = folha inferior no celular; popover = sempre ancorado. */
  presentation?: PopupPresentation;
}) {
  const [open, setOpen] = useState(false);
  const [triggerRef, container] = usePortalContainer();
  const field = useControlLabel({ id, label, hideLabel: hideLabel ?? Boolean(triggerContent), hint, error, optional });
  const today = now ?? todayIso();
  const outOfRange = (iso: string) => (min && iso < min) || (max && iso > max) || (businessDaysOnly && !isBusinessDay(iso, extraHolidays));
  const pick = (iso: string) => {
    onValueChange(iso);
    setOpen(false);
  };
  const sheet = presentation === "auto";
  return field.wrap(
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className={cn("relative min-w-0", !triggerContent && "w-full")}>
        <Popover.Trigger
          ref={triggerRef}
          id={field.id}
          disabled={disabled}
          aria-label={value ? `${label}: ${formatIsoDate(value)}` : label}
          aria-describedby={field.describedBy}
          aria-invalid={field.invalid || undefined}
          className={
            triggerContent
              ? className
              : cn(
                  fieldClass,
                  "flex items-center justify-between gap-2 text-left font-normal outline-none hover:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:bg-soft/60 disabled:text-muted",
                  field.invalid && "border-rose/50",
                  clearable && value && "pr-16",
                  className,
                )
          }
        >
          {triggerContent ?? (
            <>
              <span className={cn("truncate tabular-nums", !value && "text-muted")}>{value ? formatIsoDate(value) : placeholder}</span>
              <CalendarDays aria-hidden className="size-4 shrink-0 text-muted" />
            </>
          )}
        </Popover.Trigger>
        {clearable && value && !disabled && !triggerContent && (
          <button
            type="button"
            aria-label={`Limpar ${label.toLocaleLowerCase("pt-BR")}`}
            onClick={() => onValueChange("")}
            className="absolute right-9 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink"
          >
            <X aria-hidden className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Popover.Portal container={container}>
        {sheet && <Popover.Backdrop className={sheetBackdropClass} />}
        <Popover.Positioner sideOffset={6} align="start" collisionPadding={12} className={cn("z-[100]", sheet && sheetPositionerClass)}>
          <Popover.Popup className={popupClass} aria-label={`Calendário · ${label}`}>
            <Calendar
              selected={value || null}
              min={min}
              max={max}
              businessDaysOnly={businessDaysOnly}
              extraHolidays={extraHolidays}
              now={today}
              label={label}
              onDayClick={pick}
            />
            {shortcuts && (
              <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
                <button
                  type="button"
                  disabled={Boolean(outOfRange(today))}
                  onClick={() => pick(today)}
                  className="rounded-md px-2 py-1 text-[12.5px] text-ink-soft hover:bg-soft hover:text-ink disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
                >
                  Hoje
                </button>
                {clearable && (
                  <button
                    type="button"
                    disabled={!value}
                    onClick={() => pick("")}
                    className="rounded-md px-2 py-1 text-[12.5px] text-ink-soft hover:bg-soft hover:text-ink disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
                  >
                    Limpar
                  </button>
                )}
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>,
  );
}
