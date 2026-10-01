"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatIsoBr, type Holiday } from "../lib/dates";
import { usePortalContainer } from "../lib/portal";
import { Calendar } from "./dates";
import { fieldClass } from "./forms";
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
 * ("YYYY-MM-DD"), nunca Date com hora. Nada de <input type="date">.
 */
export function DatePicker({
  value,
  onValueChange,
  label,
  disabled,
  className,
  min,
  max,
  businessDaysOnly,
  extraHolidays,
  placeholder = "Selecione a data",
  triggerContent,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  /** Só dias úteis (fins de semana e feriados nacionais desabilitados). */
  businessDaysOnly?: boolean;
  extraHolidays?: Holiday[];
  placeholder?: string;
  triggerContent?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [triggerRef, container] = usePortalContainer();
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        ref={triggerRef}
        disabled={disabled}
        aria-label={label}
        className={triggerContent ? className : cn(fieldClass, "flex items-center justify-between gap-2 text-left font-normal", className)}
      >
        {triggerContent ?? (
          <>
            <span className={cn(!value && "text-muted")}>{value ? formatIsoDate(value) : placeholder}</span>
            <CalendarDays className="size-4 shrink-0 text-muted" />
          </>
        )}
      </Popover.Trigger>
      <Popover.Portal container={container}>
        <Popover.Positioner sideOffset={6} align="start" collisionPadding={8} className="z-[100]">
          <Popover.Popup className={popupClass} aria-label={`Calendário · ${label}`}>
            <Calendar
              selected={value || null}
              min={min}
              max={max}
              businessDaysOnly={businessDaysOnly}
              extraHolidays={extraHolidays}
              label={label}
              onDayClick={(iso) => {
                onValueChange(iso);
                setOpen(false);
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
