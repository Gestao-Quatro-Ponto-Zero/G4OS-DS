"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import { CalendarClock, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Globe, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import {
  addBusinessDays,
  addDays,
  addMonths,
  businessDaysBetween,
  comparePeriod,
  daysBetween,
  describeDue,
  describeTimeZone,
  endOfMonth,
  endOfWeek,
  formatDateLong,
  formatDayMonth,
  formatIsoBr,
  formatRange,
  holidayName,
  isBusinessDay,
  isoWeek,
  maskDateTyping,
  matchPeriod,
  minutesOf,
  monthNames,
  monthShort,
  parseDateInput,
  parseTimeInput,
  periodPresets,
  quarterOf,
  resolvePeriod,
  startOfMonth,
  startOfWeek,
  timeSlots,
  toDate,
  todayIso,
  weekdayInitials,
  weekdayMon,
  weekdayNames,
  weekdayShort,
  type CompareMode,
  type Holiday,
  type IsoDate,
  type IsoRange,
  type PeriodPreset,
} from "../lib/dates";
import { formatRelative } from "../lib/format";
import { usePortalContainer } from "../lib/portal";
import { popupClass } from "./overlays";
import { Sheet } from "./overlays-extra";
import { Button } from "./primitives";

/*
 * Datas e horários. Regras (docs/padroes/datas.md · showcase Formulários › Datas):
 *   · valor é ISO só-data ("2026-09-30"); horário "HH:MM"; nada de <input type="date">
 *   · digitar é sempre possível (dd/mm/aaaa, "sexta", "em 3 dias"); o calendário ajuda
 *   · semana começa na segunda; feriados nacionais marcados; "dias úteis" é explícito
 *   · períodos: presets primeiro, intervalo livre depois, comparação opcional
 */

/* ================================================================== */
/* Moldura de campo (mesma anatomia de inputs.tsx)                     */
/* ================================================================== */

function Field({ label, hint, error, optional, htmlFor, descId, className, children }: { label?: string; hint?: ReactNode; error?: ReactNode; optional?: boolean; htmlFor?: string; descId: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("mb-5 min-w-0", className)}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] text-muted">
          {label}
          {optional && <span className="ml-1 text-muted/80">(opcional)</span>}
        </label>
      )}
      {children}
      {(error || hint) && (
        <p id={descId} className={cn("m-0 mt-1.5 text-[12px] leading-5", error ? "text-rose" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

const shell = "focus-field flex h-10 w-full items-center rounded-lg border bg-surface text-[14px] text-ink transition-[border-color,box-shadow]";
const triggerBtn =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-left text-[14px] text-ink outline-none hover:border-line-strong focus-visible:border-muted data-popup-open:border-muted disabled:cursor-not-allowed disabled:opacity-50";

/** Popover padrão dos seletores (portal dentro de <dialog> quando preciso). */
function PickerPopover({
  open,
  onOpenChange,
  trigger,
  triggerLabel,
  triggerClassName,
  children,
  align = "start",
  disabled,
  render,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  triggerLabel: string;
  triggerClassName?: string;
  children: ReactNode;
  align?: "start" | "end" | "center";
  disabled?: boolean;
  /** Gatilho customizado (ex.: botão de ícone dentro do campo). */
  render?: boolean;
}) {
  const [ref, container] = usePortalContainer();
  return (
    <BasePopover.Root open={open} onOpenChange={onOpenChange}>
      <BasePopover.Trigger ref={ref} disabled={disabled} aria-label={triggerLabel} className={render ? triggerClassName : cn(triggerBtn, triggerClassName)}>
        {trigger}
      </BasePopover.Trigger>
      <BasePopover.Portal container={container}>
        <BasePopover.Positioner sideOffset={6} align={align} collisionPadding={8} className="z-[100]">
          <BasePopover.Popup className={cn(popupClass, "max-w-[calc(100vw-16px)] overflow-hidden")} aria-label={triggerLabel}>
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639.98px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

/* ================================================================== */
/* Calendar                                                            */
/* ================================================================== */

export type CalendarEvent = { date: IsoDate; label?: string; tone?: "neutral" | "accent" | "ok" | "warn" | "bad" | "info" };

export type CalendarProps = {
  /** single: um dia · range: início/fim · multiple: vários dias. */
  mode?: "single" | "range" | "multiple";
  selected?: IsoDate | null;
  range?: Partial<IsoRange>;
  values?: IsoDate[];
  /** Clique/Enter num dia. Os seletores decidem o que fazer com ele. */
  onDayClick?: (iso: IsoDate) => void;
  /** Mês visível (qualquer dia dele). Com onMonthChange é controlado; sem, é o mês inicial. */
  month?: IsoDate;
  onMonthChange?: (month: IsoDate) => void;
  /** 1 ou 2 meses lado a lado. */
  months?: 1 | 2;
  min?: IsoDate;
  max?: IsoDate;
  isDisabled?: (iso: IsoDate) => boolean;
  /** Só dias úteis habilitados (fim de semana e feriado ficam desabilitados). */
  businessDaysOnly?: boolean;
  /** Marca feriados nacionais (padrão: sim) + feriados extras (estaduais, da empresa). */
  showHolidays?: boolean;
  extraHolidays?: Holiday[];
  weekNumbers?: boolean;
  /** Pontinhos por dia (agenda, vencimentos). */
  events?: CalendarEvent[];
  /** Período de comparação desenhado tracejado. */
  compare?: Partial<IsoRange>;
  /** Linha inteira (semana) destacada no hover/seleção — para WeekPicker. */
  weekMode?: boolean;
  now?: IsoDate;
  className?: string;
  /** Rótulo acessível da grade. */
  label?: string;
};

const toneDotClass = { neutral: "bg-ink-soft/50", accent: "bg-accent", ok: "bg-ok", warn: "bg-amber", bad: "bg-rose", info: "bg-blue" };

/**
 * Grade de calendário própria (sem dependência), no tema do DS. Teclado:
 * setas (dia/semana), PageUp/PageDown (mês; com Shift, ano), Home/End
 * (início/fim da semana), Enter/Espaço seleciona. Clique no título troca
 * mês/ano rápido.
 */
export function Calendar({
  mode = "single",
  selected,
  range,
  values,
  onDayClick,
  month,
  onMonthChange,
  months = 1,
  min,
  max,
  isDisabled,
  businessDaysOnly,
  showHolidays = true,
  extraHolidays = [],
  weekNumbers,
  events,
  compare,
  weekMode,
  now = todayIso(),
  className,
  label = "Calendário",
}: CalendarProps) {
  const initial = startOfMonth(month ?? selected ?? range?.from ?? values?.[0] ?? now);
  const [ownMonth, setOwnMonth] = useState(initial);
  // Controlado só com onMonthChange; `month` sozinho é o mês inicial.
  const controlled = month != null && onMonthChange != null;
  const visible = startOfMonth(controlled ? month : ownMonth);
  const setVisible = (m: IsoDate) => {
    const sm = startOfMonth(m);
    if (!controlled) setOwnMonth(sm);
    onMonthChange?.(sm);
  };
  const [focus, setFocus] = useState<IsoDate>(selected ?? range?.from ?? values?.[0] ?? (now.slice(0, 7) === visible.slice(0, 7) ? now : visible));
  const [hover, setHover] = useState<IsoDate | null>(null);
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const grid = useRef<HTMLDivElement>(null);
  const hadFocus = useRef(false);

  const eventsByDay = useMemo(() => {
    const map = new Map<IsoDate, CalendarEvent[]>();
    events?.forEach((e) => map.set(e.date, [...(map.get(e.date) ?? []), e]));
    return map;
  }, [events]);

  const disabled = (iso: IsoDate) => (min != null && iso < min) || (max != null && iso > max) || (businessDaysOnly && !isBusinessDay(iso, extraHolidays)) || !!isDisabled?.(iso);

  // Range com prévia no hover (depois do primeiro clique).
  const pendingRange = mode === "range" && range?.from && !range.to && hover ? (hover < range.from ? { from: hover, to: range.from } : { from: range.from, to: hover }) : range;

  const move = (to: IsoDate) => {
    hadFocus.current = true;
    setFocus(to);
    const end = endOfMonth(addMonths(visible, months - 1));
    if (to < visible) setVisible(to);
    else if (to > end) setVisible(addMonths(startOfMonth(to), -(months - 1)));
  };
  useEffect(() => {
    if (!hadFocus.current) return;
    grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${focus}"]`)?.focus();
  }, [focus, visible]);

  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    const map: Record<string, () => IsoDate> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
      Home: () => startOfWeek(focus),
      End: () => endOfWeek(focus),
    };
    if (map[k]) {
      e.preventDefault();
      move(map[k]());
    } else if ((k === "Enter" || k === " ") && !disabled(focus)) {
      e.preventDefault();
      onDayClick?.(focus);
    }
  };

  const monthBlock = (offset: number) => {
    const first = addMonths(visible, offset);
    const start = startOfWeek(first);
    const weeks: IsoDate[][] = [];
    for (let w = 0; w < 6; w++) weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)));
    const inMonth = (iso: IsoDate) => iso.slice(0, 7) === first.slice(0, 7);
    const trimmed = weeks.filter((w, i) => i < 4 || w.some(inMonth)); // sem 6ª linha vazia
    return (
      <div key={offset} className="min-w-0">
        <div className="mb-2 flex h-8 items-center justify-center">
          <button
            type="button"
            onClick={() => setView(view === "days" ? "months" : "days")}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13.5px] font-semibold capitalize hover:bg-soft"
            aria-label={`${monthNames[toDate(first).getMonth()]} de ${first.slice(0, 4)}: trocar mês e ano`}
          >
            {monthNames[toDate(first).getMonth()]} {first.slice(0, 4)}
            {offset === 0 && <ChevronDown className="h-3.5 w-3.5 text-muted" />}
          </button>
        </div>
        <table role="grid" aria-label={`${label}, ${monthNames[toDate(first).getMonth()]} de ${first.slice(0, 4)}`} className="border-separate border-spacing-y-0.5">
          <thead>
            <tr>
              {weekNumbers && <th className="w-7 text-[10.5px] font-normal text-muted/70">sem</th>}
              {weekdayInitials.map((d, i) => (
                <th key={i} scope="col" abbr={weekdayShort[i]} className="h-7 w-9 text-center text-[11.5px] font-normal text-muted">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trimmed.map((week) => {
              const weekSelected = weekMode && selected && week.includes(selected);
              const weekHover = weekMode && hover && week.includes(hover);
              return (
                <tr key={week[0]} className={cn(weekMode && "group/week")} onPointerLeave={() => setHover(null)}>
                  {weekNumbers && <td className="text-center text-[10.5px] tabular-nums text-muted/70">{isoWeek(week[0])}</td>}
                  {week.map((iso, i) => {
                    const out = !inMonth(iso);
                    if (out && months === 2) return <td key={iso} className="h-9 w-9" />;
                    const off = disabled(iso);
                    const holiday = showHolidays ? holidayName(iso, extraHolidays) : undefined;
                    const isToday = iso === now;
                    const r = pendingRange;
                    const isStart = mode === "range" && r?.from === iso;
                    const isEnd = mode === "range" && r?.to === iso;
                    const inRange = mode === "range" && r?.from && r?.to && iso > r.from && iso < r.to;
                    const isSel = (mode === "single" && !weekMode && selected === iso) || (mode === "multiple" && values?.includes(iso)) || isStart || isEnd;
                    const inCompare = compare?.from && compare?.to && iso >= compare.from && iso <= compare.to;
                    const dayEvents = eventsByDay.get(iso);
                    const wk = weekSelected || weekHover;
                    const labelText = `${weekdayNames[toDate(iso).getDay()]}, ${Number(iso.slice(8))} de ${monthNames[toDate(iso).getMonth()]} de ${iso.slice(0, 4)}${isToday ? ", hoje" : ""}${holiday ? `, feriado: ${holiday}` : ""}${dayEvents?.length ? `, ${dayEvents.length} ${dayEvents.length === 1 ? "evento" : "eventos"}` : ""}`;
                    return (
                      <td
                        key={iso}
                        role="gridcell"
                        aria-selected={!!isSel || !!inRange || !!weekSelected}
                        className={cn(
                          "relative h-9 w-9 p-0",
                          (inRange || (isStart && r?.to && r.to !== iso) || (isEnd && r?.from && r.from !== iso)) && "bg-primary/10",
                          isStart && r?.to && r.to !== iso && "rounded-l-lg",
                          isEnd && r?.from && r.from !== iso && "rounded-r-lg",
                          wk && (weekSelected ? "bg-primary/12" : "bg-soft"),
                          wk && i === 0 && "rounded-l-lg",
                          wk && i === 6 && "rounded-r-lg",
                          inCompare && !inRange && !isSel && "bg-accent-soft/80",
                          inCompare && !inRange && !isSel && (iso === compare?.from || i === 0) && "rounded-l-lg",
                          inCompare && !inRange && !isSel && (iso === compare?.to || i === 6) && "rounded-r-lg",
                        )}
                      >
                        <button
                          type="button"
                          data-iso={iso}
                          tabIndex={iso === focus ? 0 : -1}
                          disabled={off}
                          aria-label={labelText}
                          aria-current={isToday ? "date" : undefined}
                          title={holiday}
                          onClick={() => {
                            setFocus(iso);
                            onDayClick?.(iso);
                          }}
                          onPointerEnter={() => setHover(iso)}
                          className={cn(
                            "relative grid h-9 w-9 place-items-center rounded-lg text-[13px] tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/40",
                            out && "text-muted/50",
                            !out && isWeekendIso(iso) && !isSel && "text-muted",
                            !isSel && !off && "hover:bg-soft",
                            isSel && "bg-primary font-medium text-on-primary hover:bg-primary/90",
                            off && "cursor-not-allowed text-muted/40 line-through decoration-muted/40",
                            isToday && !isSel && "font-semibold text-ink",
                          )}
                        >
                          {Number(iso.slice(8))}
                          {isToday && !isSel && <span aria-hidden className="absolute bottom-1 h-[3px] w-3 rounded-full bg-accent" />}
                          {holiday && !out && <span aria-hidden className={cn("absolute right-1 top-1 h-1.5 w-1.5 rounded-full", isSel ? "bg-on-primary" : "bg-amber")} />}
                          {dayEvents && !out && (
                            <span aria-hidden className="absolute bottom-0.5 flex gap-0.5">
                              {dayEvents.slice(0, 3).map((ev, k) => (
                                <span key={k} className={cn("h-1 w-1 rounded-full", isSel ? "bg-on-primary" : toneDotClass[ev.tone ?? "neutral"])} />
                              ))}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const nav = (dir: -1 | 1) => setVisible(addMonths(visible, dir * (view === "years" ? 144 : view === "months" ? 12 : 1)));
  const baseYear = Number(visible.slice(0, 4));
  return (
    <div className={cn("relative w-fit select-none p-3", className)} ref={grid} onKeyDown={view === "days" ? onKey : undefined}>
      <div className="absolute inset-x-3 top-3 z-[1] flex justify-between">
        <button type="button" onClick={() => nav(-1)} aria-label={view === "days" ? "Mês anterior" : "Anterior"} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => nav(1)} aria-label={view === "days" ? "Próximo mês" : "Próximo"} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {view === "days" ? (
        <div className={cn("flex gap-6", months === 2 && "flex-col sm:flex-row")}>{Array.from({ length: months }, (_, i) => monthBlock(i))}</div>
      ) : view === "months" ? (
        <div className="w-[252px]">
          <div className="mb-2 flex h-8 items-center justify-center">
            <button type="button" onClick={() => setView("years")} className="rounded-md px-2 py-1 text-[13.5px] font-semibold tabular-nums hover:bg-soft">
              {baseYear}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {monthShort.map((m, i) => {
              const iso = `${baseYear}-${String(i + 1).padStart(2, "0")}-01`;
              const on = visible.slice(5, 7) === iso.slice(5, 7);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setVisible(iso);
                    setView("days");
                  }}
                  className={cn("h-10 rounded-lg text-[13px] capitalize", on ? "bg-primary font-medium text-on-primary" : "hover:bg-soft", now.slice(0, 7) === iso.slice(0, 7) && !on && "font-semibold")}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="w-[252px]">
          <div className="mb-2 flex h-8 items-center justify-center text-[13.5px] font-semibold tabular-nums">
            {baseYear - 5}–{baseYear + 6}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => baseYear - 5 + i).map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setVisible(`${y}${visible.slice(4)}`);
                  setView("months");
                }}
                className={cn("h-10 rounded-lg text-[13px] tabular-nums", y === baseYear ? "bg-primary font-medium text-on-primary" : "hover:bg-soft", String(y) === now.slice(0, 4) && y !== baseYear && "font-semibold")}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const isWeekendIso = (iso: IsoDate) => weekdayMon(iso) >= 5;

/* ================================================================== */
/* DateInput                                                           */
/* ================================================================== */

/**
 * Data digitável. Aceita dd/mm/aaaa (com máscara), atalhos ("hoje",
 * "sexta", "em 3 dias", "+5du", "fim do mês") e o calendário no ícone.
 * Abaixo, confirma o que entendeu: "sexta, 03/10/2026".
 */
export function DateInput({
  value,
  onChange,
  label,
  hint,
  error,
  optional,
  placeholder = "dd/mm/aaaa ou “sexta”",
  min,
  max,
  businessDaysOnly,
  extraHolidays,
  clearable = true,
  disabled,
  now = todayIso(),
  className,
  id,
}: {
  value: IsoDate | "";
  onChange: (iso: IsoDate | "") => void;
  label?: string;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  placeholder?: string;
  min?: IsoDate;
  max?: IsoDate;
  businessDaysOnly?: boolean;
  extraHolidays?: Holiday[];
  clearable?: boolean;
  disabled?: boolean;
  now?: IsoDate;
  className?: string;
  id?: string;
}) {
  const auto = useId();
  const inputId = id ?? auto;
  const descId = `${inputId}-desc`;
  const [text, setText] = useState(value ? formatIsoBr(value) : "");
  const [typing, setTyping] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!typing) setText(value ? formatIsoBr(value) : "");
  }, [value, typing]);

  const parsed = text ? parseDateInput(text, now) : undefined;
  const outOfBounds = (iso?: IsoDate) =>
    iso && ((min && iso < min) ? `A data mínima é ${formatIsoBr(min)}.` : max && iso > max ? `A data máxima é ${formatIsoBr(max)}.` : businessDaysOnly && !isBusinessDay(iso, extraHolidays) ? `${formatDateLong(iso)} não é dia útil.` : undefined);
  const ownError = typing && text && !parsed ? "Não entendi essa data. Use dd/mm/aaaa ou “sexta”, “em 3 dias”." : outOfBounds(typing ? parsed : value || undefined);
  const shownError = error ?? ownError;
  const preview = typing && parsed ? formatDateLong(parsed) : value ? formatDateLong(value) : undefined;

  const commit = () => {
    setTyping(false);
    if (!text) return onChange("");
    if (parsed && !outOfBounds(parsed)) onChange(parsed);
  };

  return (
    <Field label={label} hint={shownError ? undefined : preview ? <span className="inline-block first-letter:uppercase">{preview}</span> : hint} error={shownError} optional={optional} htmlFor={inputId} descId={descId} className={className}>
      <div className={cn(shell, shownError ? "border-rose/50" : "border-line", disabled && "bg-soft/60 text-muted")}>
        <input
          id={inputId}
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={shownError || hint || preview ? descId : undefined}
          autoComplete="off"
          inputMode="text"
          onChange={(e) => {
            setTyping(true);
            setText(maskDateTyping(e.target.value));
          }}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "ArrowDown" && e.altKey) setOpen(true);
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted"
        />
        {clearable && value && !disabled && (
          <button
            type="button"
            aria-label="Limpar data"
            onClick={() => {
              setText("");
              onChange("");
            }}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <PickerPopover
          open={open}
          onOpenChange={setOpen}
          render
          disabled={disabled}
          triggerLabel={label ? `Abrir calendário · ${label}` : "Abrir calendário"}
          triggerClassName="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted outline-none hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/30"
          trigger={<CalendarDays className="h-4 w-4" />}
          align="end"
        >
          <Calendar
            selected={value || null}
            min={min}
            max={max}
            businessDaysOnly={businessDaysOnly}
            extraHolidays={extraHolidays}
            now={now}
            label={label}
            onDayClick={(iso) => {
              setTyping(false);
              onChange(iso);
              setOpen(false);
            }}
          />
          <div className="flex flex-wrap gap-1 border-t border-line px-3 py-2">
            {[
              ["Hoje", now],
              ["Amanhã", addDays(now, 1)],
              ["Em 5 dias úteis", addBusinessDays(now, 5, extraHolidays)],
              ["Fim do mês", endOfMonth(now)],
            ].map(([l, iso]) => (
              <button
                key={l}
                type="button"
                disabled={!!outOfBounds(iso)}
                onClick={() => {
                  setTyping(false);
                  onChange(iso);
                  setOpen(false);
                }}
                className="rounded-md px-2 py-1 text-[12px] text-ink-soft hover:bg-soft hover:text-ink disabled:opacity-40"
              >
                {l}
              </button>
            ))}
          </div>
        </PickerPopover>
      </div>
    </Field>
  );
}

/* ================================================================== */
/* DateRangePicker                                                     */
/* ================================================================== */

export type DateRangeValue = {
  from: IsoDate;
  to: IsoDate;
  /** Preset que gerou o intervalo (se algum). */
  preset?: PeriodPreset;
  compare?: CompareMode;
  /** Calculado a partir de `compare`. */
  compareRange?: IsoRange;
};

const defaultRangePresets: PeriodPreset[] = ["today", "yesterday", "last7", "last30", "last90", "this_week", "this_month", "last_month", "this_quarter", "ytd", "last12m"];

/**
 * Período com presets, dois meses, comparação e contagem de dias úteis.
 * Aplica só no "Aplicar" (dashboards recalculam caro). No celular vira
 * folha inferior com um mês.
 */
export function DateRangePicker({
  value,
  onChange,
  label = "Período",
  presets = defaultRangePresets,
  allowCompare = true,
  min,
  max,
  extraHolidays,
  now = todayIso(),
  align = "end",
  className,
  triggerClassName,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  label?: string;
  presets?: PeriodPreset[];
  allowCompare?: boolean;
  min?: IsoDate;
  max?: IsoDate;
  extraHolidays?: Holiday[];
  now?: IsoDate;
  align?: "start" | "end";
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const mobile = useIsMobile();
  const [draft, setDraft] = useState<Partial<IsoRange>>({ from: value.from, to: value.to });
  const [compare, setCompare] = useState<CompareMode>(value.compare ?? "none");
  const [month, setMonth] = useState(startOfMonth(value.from || now));
  useEffect(() => {
    if (open) {
      setDraft({ from: value.from, to: value.to });
      setCompare(value.compare ?? "none");
      setMonth(addMonths(startOfMonth(value.to || now), mobile ? 0 : -1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const complete = draft.from && draft.to ? (draft as IsoRange) : undefined;
  const preset = complete ? matchPeriod(complete, now) : undefined;
  const cmp = complete ? comparePeriod(complete, compare) : undefined;
  const summary = (r: Partial<IsoRange>, p?: PeriodPreset) => (p ? periodPresets.find((x) => x.id === p)?.label : formatRange(r)) || "Escolha o período";
  const shownPreset = value.preset ?? matchPeriod(value, now);

  const apply = () => {
    if (!complete) return;
    onChange({ ...complete, preset, compare, compareRange: cmp });
    setOpen(false);
  };
  const pickDay = (iso: IsoDate) => {
    if (!draft.from || (draft.from && draft.to)) setDraft({ from: iso, to: undefined });
    else if (iso < draft.from) setDraft({ from: iso, to: draft.from });
    else setDraft({ from: draft.from, to: iso });
  };

  const body = (
    <div className="flex max-h-[80dvh] flex-col sm:flex-row">
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line p-2 sm:w-44 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r">
        {presets.map((id) => {
          const p = periodPresets.find((x) => x.id === id)!;
          const on = preset === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                const r = resolvePeriod(id, now);
                setDraft(r);
                setMonth(addMonths(startOfMonth(r.to), mobile ? 0 : -1));
              }}
              className={cn("flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-left text-[12.5px]", on ? "bg-primary font-medium text-on-primary" : "text-ink-soft hover:bg-soft hover:text-ink")}
            >
              {p.label}
              {on && <Check className="hidden h-3.5 w-3.5 sm:block" />}
            </button>
          );
        })}
        <span className={cn("shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px]", complete && !preset ? "bg-soft font-medium text-ink" : "text-muted")}>Personalizado</span>
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
          <RangeTextBox label="De" value={draft.from} now={now} onChange={(iso) => setDraft((d) => ({ from: iso, to: d.to && d.to >= iso ? d.to : undefined }))} />
          <span className="text-muted">→</span>
          <RangeTextBox label="Até" value={draft.to} now={now} onChange={(iso) => setDraft((d) => (d.from && iso < d.from ? { from: iso, to: d.from } : { from: d.from ?? iso, to: iso }))} />
        </div>
        <Calendar
          mode="range"
          months={mobile ? 1 : 2}
          range={draft}
          compare={cmp}
          month={month}
          onMonthChange={setMonth}
          onDayClick={pickDay}
          min={min}
          max={max}
          extraHolidays={extraHolidays}
          now={now}
          label={label}
          className="mx-auto"
        />
        {allowCompare && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2.5 text-[12.5px]">
            <span className="text-muted">Comparar com</span>
            <div className="segmented-control" role="group" aria-label="Comparar com">
              {(
                [
                  ["none", "Nada"],
                  ["previous", "Período anterior"],
                  ["year", "Ano anterior"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} type="button" aria-pressed={compare === k} onClick={() => setCompare(k)}>
                  {l}
                </button>
              ))}
            </div>
            {cmp && (
              <span className="inline-flex items-center gap-1.5 text-muted">
                <span aria-hidden className="h-3 w-3 rounded-[3px] bg-accent-soft ring-1 ring-accent/40" />
                {formatRange(cmp)}
              </span>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-soft/40 px-3 py-2.5">
          <span className="text-[12px] tabular-nums text-muted" aria-live="polite">
            {complete ? (
              <>
                <span className="font-medium text-ink">{daysBetween(complete.from, complete.to) + 1} dias</span> · {businessDaysBetween(complete.from, complete.to, extraHolidays)} dias úteis
              </>
            ) : draft.from ? (
              "Escolha o fim do período"
            ) : (
              "Escolha o início do período"
            )}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" disabled={!complete} onClick={apply}>
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const trigger = (
    <>
      <CalendarDays className="h-4 w-4 shrink-0 text-muted" />
      <span className="min-w-0 truncate">
        <span className="font-medium">{summary(value, shownPreset)}</span>
        {value.compareRange && <span className="text-muted"> · vs. {formatRange(value.compareRange)}</span>}
      </span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
    </>
  );

  if (mobile)
    return (
      <div className={className}>
        <button type="button" className={cn(triggerBtn, "max-w-full", triggerClassName)} onClick={() => setOpen(true)} aria-label={`${label}: ${summary(value, shownPreset)}`}>
          {trigger}
        </button>
        <Sheet open={open} onClose={() => setOpen(false)} title={label} side="bottom">
          <div className="-m-5">{body}</div>
        </Sheet>
      </div>
    );
  return (
    <div className={className}>
      <PickerPopover open={open} onOpenChange={setOpen} align={align} triggerLabel={`${label}: ${summary(value, shownPreset)}`} triggerClassName={cn("max-w-full", triggerClassName)} trigger={trigger}>
        {body}
      </PickerPopover>
    </div>
  );
}

/** Caixinha de data digitável usada dentro do DateRangePicker. */
function RangeTextBox({ label, value, onChange, now }: { label: string; value?: IsoDate; onChange: (iso: IsoDate) => void; now: IsoDate }) {
  const [text, setText] = useState(value ? formatIsoBr(value) : "");
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(value ? formatIsoBr(value) : "");
  }, [value, focused]);
  const parsed = text ? parseDateInput(text, now) : undefined;
  const commit = () => parsed && parsed !== value && onChange(parsed);
  return (
    <label className={cn("focus-field flex h-8 w-[132px] items-center gap-1.5 rounded-md border bg-surface px-2 text-[12.5px]", text && !parsed ? "border-rose/50" : "border-line")}>
      <span className="text-muted">{label}</span>
      <input
        value={text}
        placeholder="dd/mm/aaaa"
        aria-label={`${label} (data)`}
        onFocus={(e) => {
          setFocused(true);
          e.currentTarget.select();
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        onChange={(e) => setText(maskDateTyping(e.target.value))}
        className="h-full min-w-0 flex-1 bg-transparent tabular-nums outline-none placeholder:text-muted/70"
      />
    </label>
  );
}

/* ================================================================== */
/* MultiDatePicker                                                     */
/* ================================================================== */

/** Vários dias soltos (folgas, datas de treinamento, entregas). Chips removíveis. */
export function MultiDatePicker({
  values,
  onChange,
  label,
  hint,
  max: maxCount,
  min,
  maxDate,
  businessDaysOnly,
  now = todayIso(),
  className,
}: {
  values: IsoDate[];
  onChange: (values: IsoDate[]) => void;
  label: string;
  hint?: ReactNode;
  /** Máximo de dias selecionáveis. */
  max?: number;
  min?: IsoDate;
  maxDate?: IsoDate;
  businessDaysOnly?: boolean;
  now?: IsoDate;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const sorted = [...values].sort();
  const full = maxCount != null && values.length >= maxCount;
  const toggle = (iso: IsoDate) => onChange(values.includes(iso) ? values.filter((v) => v !== iso) : full ? values : [...values, iso]);
  const descId = useId();
  return (
    <Field label={label} hint={hint ?? (maxCount ? `${values.length} de ${maxCount} dias` : undefined)} descId={descId} className={className}>
      <div className="flex flex-wrap items-center gap-1.5">
        {sorted.map((iso) => (
          <span key={iso} className="inline-flex h-8 items-center gap-1 rounded-md border border-line bg-surface pl-2.5 pr-1 text-[12.5px]">
            <span className="tabular-nums">{formatDayMonth(iso, Number(now.slice(0, 4)))}</span>
            <span className="text-muted">{weekdayShort[weekdayMon(iso)]}</span>
            <button type="button" aria-label={`Remover ${formatIsoBr(iso)}`} onClick={() => toggle(iso)} className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-soft hover:text-ink">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <PickerPopover
          open={open}
          onOpenChange={setOpen}
          triggerLabel={`Adicionar dias · ${label}`}
          triggerClassName="h-8 border-dashed px-2.5 text-[12.5px] text-ink-soft"
          trigger={
            <>
              <CalendarDays className="h-3.5 w-3.5 text-muted" /> {values.length ? "Adicionar dia" : "Escolher dias"}
            </>
          }
        >
          <Calendar mode="multiple" values={values} onDayClick={toggle} min={min} max={maxDate} businessDaysOnly={businessDaysOnly} now={now} isDisabled={(iso) => full && !values.includes(iso)} label={label} />
          <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[12px] text-muted">
            <span className="tabular-nums">
              {values.length} {values.length === 1 ? "dia" : "dias"}
              {maxCount ? ` de ${maxCount}` : ""}
            </span>
            <Button size="sm" onClick={() => setOpen(false)}>
              Pronto
            </Button>
          </div>
        </PickerPopover>
      </div>
    </Field>
  );
}

/* ================================================================== */
/* WeekPicker                                                          */
/* ================================================================== */

/** Uma semana (seg–dom). Valor = segunda-feira ISO. Para relatórios e escalas semanais. */
export function WeekPicker({ value, onChange, label = "Semana", now = todayIso(), className }: { value: IsoDate; onChange: (monday: IsoDate) => void; label?: string; now?: IsoDate; className?: string }) {
  const [open, setOpen] = useState(false);
  const monday = value ? startOfWeek(value) : "";
  return (
    <div className={className}>
      <PickerPopover
        open={open}
        onOpenChange={setOpen}
        triggerLabel={`${label}: ${monday ? formatRange({ from: monday, to: endOfWeek(monday) }) : "escolher"}`}
        trigger={
          <>
            <CalendarDays className="h-4 w-4 text-muted" />
            {monday ? (
              <span>
                <span className="font-medium">Semana {isoWeek(monday)}</span> <span className="text-muted">· {formatRange({ from: monday, to: endOfWeek(monday) })}</span>
              </span>
            ) : (
              <span className="text-muted">Escolher semana</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </>
        }
      >
        <Calendar
          weekMode
          weekNumbers
          selected={monday || null}
          now={now}
          label={label}
          onDayClick={(iso) => {
            onChange(startOfWeek(iso));
            setOpen(false);
          }}
        />
        <div className="flex gap-1 border-t border-line px-3 py-2">
          {[
            ["Esta semana", startOfWeek(now)],
            ["Semana passada", startOfWeek(addDays(now, -7))],
            ["Próxima", startOfWeek(addDays(now, 7))],
          ].map(([l, iso]) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                onChange(iso);
                setOpen(false);
              }}
              className="rounded-md px-2 py-1 text-[12px] text-ink-soft hover:bg-soft hover:text-ink"
            >
              {l}
            </button>
          ))}
        </div>
      </PickerPopover>
    </div>
  );
}

/* ================================================================== */
/* Mês, trimestre, ano                                                 */
/* ================================================================== */

type GridPeriodKind = "month" | "quarter" | "year";

function PeriodGrid({
  kind,
  value,
  rangeEnd,
  onPick,
  now,
  min,
  max,
}: {
  kind: GridPeriodKind;
  /** "2026-09" | "2026-T3" | "2026" */
  value?: string;
  rangeEnd?: string;
  onPick: (v: string) => void;
  now: IsoDate;
  min?: string;
  max?: string;
}) {
  const initialYear = Number((value ?? now).slice(0, 4));
  const [year, setYear] = useState(initialYear);
  const nowKey = kind === "month" ? now.slice(0, 7) : kind === "quarter" ? `${now.slice(0, 4)}-T${quarterOf(now)}` : now.slice(0, 4);
  const items: { key: string; label: string; hint?: string }[] =
    kind === "month"
      ? monthShort.map((m, i) => ({ key: `${year}-${String(i + 1).padStart(2, "0")}`, label: m }))
      : kind === "quarter"
        ? [1, 2, 3, 4].map((q) => ({ key: `${year}-T${q}`, label: `${q}º tri`, hint: `${monthShort[(q - 1) * 3]}–${monthShort[(q - 1) * 3 + 2]}` }))
        : Array.from({ length: 12 }, (_, i) => year - 7 + i).map((y) => ({ key: String(y), label: String(y) }));
  const step = kind === "year" ? 12 : 1;
  const lo = value && rangeEnd ? (value < rangeEnd ? value : rangeEnd) : undefined;
  const hi = value && rangeEnd ? (value < rangeEnd ? rangeEnd : value) : undefined;
  return (
    <div className="w-[268px] p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Anterior" onClick={() => setYear((y) => y - step)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[13.5px] font-semibold tabular-nums">{kind === "year" ? `${year - 7}–${year + 4}` : year}</span>
        <button type="button" aria-label="Próximo" onClick={() => setYear((y) => y + step)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className={cn("grid gap-1.5", kind === "quarter" ? "grid-cols-2" : "grid-cols-3")}>
        {items.map((it) => {
          const on = it.key === value || it.key === rangeEnd;
          const between = lo && hi && it.key > lo && it.key < hi;
          const off = (min && it.key < min) || (max && it.key > max);
          return (
            <button
              key={it.key}
              type="button"
              disabled={!!off}
              aria-pressed={on}
              onClick={() => onPick(it.key)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg text-[13px] capitalize tabular-nums",
                kind === "quarter" ? "h-14" : "h-10",
                on ? "bg-primary font-medium text-on-primary" : between ? "bg-primary/10" : "hover:bg-soft",
                it.key === nowKey && !on && "font-semibold ring-1 ring-inset ring-line-strong",
                off && "opacity-35",
              )}
            >
              {it.label}
              {it.hint && <span className={cn("text-[11px] font-normal", on ? "text-on-primary/75" : "text-muted")}>{it.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const describeMonth = (v: string) => `${monthNames[Number(v.slice(5, 7)) - 1]} de ${v.slice(0, 4)}`;

/**
 * Mês ("2026-09") ou intervalo de meses. Para competência, fechamento,
 * fatura, folha. `range` liga seleção de/até.
 */
export function MonthPicker({
  value,
  onChange,
  range,
  label = "Mês",
  min,
  max,
  now = todayIso(),
  className,
}: {
  /** "2026-09"; com range, o início. */
  value: string;
  onChange: (value: string, rangeEnd?: string) => void;
  /** Fim do intervalo de meses (liga o modo intervalo). */
  range?: { end?: string };
  label?: string;
  min?: string;
  max?: string;
  now?: IsoDate;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const text = !value ? "Escolher mês" : range?.end && range.end !== value ? `${describeMonth(value)} – ${describeMonth(range.end)}` : describeMonth(value);
  return (
    <div className={className}>
      <PickerPopover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          setPendingStart(null);
        }}
        triggerLabel={`${label}: ${text}`}
        trigger={
          <>
            <CalendarDays className="h-4 w-4 text-muted" />
            <span className={cn("first-letter:uppercase", !value && "text-muted")}>{text}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </>
        }
      >
        <PeriodGrid
          kind="month"
          value={pendingStart ?? value}
          rangeEnd={range && !pendingStart ? range.end : undefined}
          min={min}
          max={max}
          now={now}
          onPick={(k) => {
            if (!range) {
              onChange(k);
              setOpen(false);
            } else if (!pendingStart) setPendingStart(k);
            else {
              const [a, b] = pendingStart < k ? [pendingStart, k] : [k, pendingStart];
              onChange(a, b);
              setPendingStart(null);
              setOpen(false);
            }
          }}
        />
        {range && <p className="m-0 border-t border-line px-3 py-2 text-[12px] text-muted">{pendingStart ? "Agora escolha o mês final." : "Escolha o mês inicial."}</p>}
      </PickerPopover>
    </div>
  );
}

/** Trimestre ("2026-T3"). Para metas, OKRs, fechamento trimestral. */
export function QuarterPicker({ value, onChange, label = "Trimestre", now = todayIso(), className }: { value: string; onChange: (value: string) => void; label?: string; now?: IsoDate; className?: string }) {
  const [open, setOpen] = useState(false);
  const text = value ? `${value.slice(6)}º trimestre de ${value.slice(0, 4)}` : "Escolher trimestre";
  return (
    <div className={className}>
      <PickerPopover
        open={open}
        onOpenChange={setOpen}
        triggerLabel={`${label}: ${text}`}
        trigger={
          <>
            <CalendarDays className="h-4 w-4 text-muted" />
            <span className={cn(!value && "text-muted")}>{text}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </>
        }
      >
        <PeriodGrid
          kind="quarter"
          value={value}
          now={now}
          onPick={(k) => {
            onChange(k);
            setOpen(false);
          }}
        />
      </PickerPopover>
    </div>
  );
}

/** Ano ("2026"). Para exercício fiscal, safra, safra de coorte. */
export function YearPicker({ value, onChange, label = "Ano", now = todayIso(), className }: { value: string; onChange: (value: string) => void; label?: string; now?: IsoDate; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <PickerPopover
        open={open}
        onOpenChange={setOpen}
        triggerLabel={`${label}: ${value || "escolher"}`}
        trigger={
          <>
            <CalendarDays className="h-4 w-4 text-muted" />
            <span className={cn("tabular-nums", !value && "text-muted")}>{value || "Escolher ano"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </>
        }
      >
        <PeriodGrid
          kind="year"
          value={value}
          now={now}
          onPick={(k) => {
            onChange(k);
            setOpen(false);
          }}
        />
      </PickerPopover>
    </div>
  );
}

/* ================================================================== */
/* Horário                                                             */
/* ================================================================== */

/**
 * Horário 24h digitável ("9", "930", "9h30", "14:30") com lista de sugestões
 * a cada `step` minutos. Horário comercial em destaque; fora dele, mais claro.
 */
export function TimePicker({
  value,
  onChange,
  label,
  hint,
  error,
  step = 30,
  min = "00:00",
  max = "24:00",
  businessHours = ["08:00", "18:00"],
  showTimeZone,
  disabled,
  className,
  id,
}: {
  value: string;
  onChange: (hhmm: string) => void;
  label?: string;
  hint?: ReactNode;
  error?: ReactNode;
  step?: 5 | 10 | 15 | 30 | 60;
  min?: string;
  max?: string;
  businessHours?: [string, string];
  showTimeZone?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const auto = useId();
  const inputId = id ?? auto;
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (open) setTimeout(() => list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "center" }), 0);
  }, [open]);
  const parsed = text ? parseTimeInput(text) : undefined;
  const bad = text && !parsed ? "Horário inválido. Ex.: 9h30, 14:00." : parsed && (parsed < min || parsed >= (max === "24:00" ? "24:00" : max)) ? `Entre ${min} e ${max}.` : undefined;
  const slots = timeSlots(min, max, step);
  const inBusiness = (t: string) => t >= businessHours[0] && t < businessHours[1];
  const commit = () => parsed && !bad && onChange(parsed);
  return (
    <Field label={label} hint={bad ? undefined : hint ?? (showTimeZone ? describeTimeZone() : undefined)} error={error ?? bad} htmlFor={inputId} descId={`${inputId}-d`} className={className}>
      <div className={cn(shell, error || bad ? "border-rose/50" : "border-line", "w-[140px]", disabled && "bg-soft/60")}>
        <Clock className="ml-3 h-4 w-4 shrink-0 text-muted" aria-hidden />
        <input
          id={inputId}
          value={text}
          disabled={disabled}
          placeholder="--:--"
          inputMode="numeric"
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="h-full min-w-0 flex-1 bg-transparent px-2 tabular-nums outline-none placeholder:text-muted"
        />
        <PickerPopover
          open={open}
          onOpenChange={setOpen}
          render
          disabled={disabled}
          triggerLabel="Escolher horário"
          triggerClassName="mr-1 grid h-8 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink"
          trigger={<ChevronDown className="h-3.5 w-3.5" />}
          align="end"
        >
          <div ref={list} role="listbox" aria-label="Horários" className="max-h-64 w-36 overflow-y-auto p-1">
            {slots.map((t) => (
              <button
                key={t}
                type="button"
                role="option"
                aria-selected={t === value}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] tabular-nums",
                  t === value ? "bg-primary font-medium text-on-primary" : inBusiness(t) ? "text-ink hover:bg-soft" : "text-muted hover:bg-soft",
                )}
              >
                {t}
                {t === value && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </PickerPopover>
      </div>
    </Field>
  );
}

/** Data + horário. Valor "2026-10-03T14:30" (hora local, sem fuso). */
export function DateTimePicker({
  value,
  onChange,
  label,
  hint,
  step = 15,
  min,
  showTimeZone = true,
  now = todayIso(),
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint?: ReactNode;
  step?: 5 | 10 | 15 | 30 | 60;
  min?: IsoDate;
  showTimeZone?: boolean;
  now?: IsoDate;
  className?: string;
}) {
  const [date, time] = value ? value.split("T") : ["", ""];
  return (
    <fieldset className={cn("m-0 mb-5 min-w-0 border-0 p-0", className)}>
      <legend className="mb-1.5 p-0 text-[12.5px] text-muted">{label}</legend>
      <div className="flex flex-wrap items-start gap-2">
        <DateInput value={date} onChange={(d) => onChange(d ? `${d}T${time || "09:00"}` : "")} label={undefined} min={min} now={now} className="mb-0 min-w-[200px] flex-1" />
        <TimePicker value={time} onChange={(t) => onChange(`${date || now}T${t}`)} step={step} className="mb-0" />
      </div>
      {(hint || showTimeZone) && (
        <p className="m-0 mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
          {showTimeZone && <Globe className="h-3 w-3" aria-hidden />}
          {hint ?? describeTimeZone()}
        </p>
      )}
    </fieldset>
  );
}

/* ================================================================== */
/* Prazo                                                               */
/* ================================================================== */

/**
 * Prazo de tarefa/documento: atalhos que as pessoas realmente usam
 * (hoje, amanhã, 5 dias úteis, próxima segunda, fim do mês) + calendário.
 * O gatilho mostra a leitura relativa ("vence em 3 dias úteis"; vencido em rosa).
 */
export function DueDatePicker({
  value,
  onChange,
  label = "Prazo",
  now = todayIso(),
  businessDays = true,
  extraHolidays,
  className,
}: {
  value: IsoDate | "";
  onChange: (iso: IsoDate | "") => void;
  label?: string;
  now?: IsoDate;
  businessDays?: boolean;
  extraHolidays?: Holiday[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const due = value ? describeDue(value, now, { businessDays, extra: extraHolidays }) : undefined;
  const nextMonday = addDays(startOfWeek(now), 7);
  const quick: [string, IsoDate][] = [
    ["Hoje", now],
    ["Amanhã", addDays(now, 1)],
    ["Em 5 dias úteis", addBusinessDays(now, 5, extraHolidays)],
    ["Próxima segunda", nextMonday],
    ["Fim do mês", endOfMonth(now)],
  ];
  const tone = due?.tone === "bad" ? "text-rose" : due?.tone === "warn" ? "text-amber" : "text-ink";
  return (
    <div className={className}>
      <PickerPopover
        open={open}
        onOpenChange={setOpen}
        triggerLabel={`${label}: ${value ? `${formatDateLong(value)}, ${due?.label}` : "sem prazo"}`}
        triggerClassName="h-9"
        trigger={
          <>
            <CalendarClock className={cn("h-4 w-4", value ? tone : "text-muted")} />
            {value ? (
              <span className="text-[13px]">
                <span className="font-medium tabular-nums">{formatDayMonth(value, Number(now.slice(0, 4)))}</span> <span className={cn(tone === "text-ink" ? "text-muted" : tone)}>· {due?.label}</span>
              </span>
            ) : (
              <span className="text-[13px] text-muted">Definir prazo</span>
            )}
          </>
        }
      >
        <div className="flex flex-col sm:flex-row">
          <ul className="m-0 flex list-none gap-1 overflow-x-auto border-b border-line p-2 sm:w-48 sm:flex-col sm:border-b-0 sm:border-r">
            {quick.map(([l, iso]) => (
              <li key={l}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={cn("flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-md px-2.5 py-1.5 text-left text-[12.5px]", value === iso ? "bg-soft font-medium text-ink" : "text-ink-soft hover:bg-soft hover:text-ink")}
                >
                  {l}
                  <span className="text-[11.5px] tabular-nums text-muted">
                    {weekdayShort[weekdayMon(iso)]} {formatDayMonth(iso, Number(now.slice(0, 4)))}
                  </span>
                </button>
              </li>
            ))}
            {value && (
              <li className="sm:mt-auto">
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="w-full whitespace-nowrap rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-rose hover:bg-rose-soft/60"
                >
                  Remover prazo
                </button>
              </li>
            )}
          </ul>
          <Calendar
            selected={value || null}
            now={now}
            extraHolidays={extraHolidays}
            label={label}
            onDayClick={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
          />
        </div>
      </PickerPopover>
    </div>
  );
}

/* ================================================================== */
/* Agendamento (slots)                                                 */
/* ================================================================== */

export type Slot = { time: string; busy?: boolean };

/**
 * Escolha de data + horário disponível (entrevista, reunião, visita), no
 * estilo Calendly: dias com disponibilidade à esquerda, horários à direita.
 * `availability(iso)` devolve os slots do dia (busy = ocupado, aparece riscado).
 */
export function SlotPicker({
  availability,
  value,
  onChange,
  durations = [30, 45, 60],
  duration,
  onDurationChange,
  from,
  days = 14,
  now = todayIso(),
  timeZone = describeTimeZone(),
  className,
}: {
  availability: (iso: IsoDate, duration: number) => Slot[];
  value?: { date: IsoDate; time: string } | null;
  onChange: (value: { date: IsoDate; time: string }) => void;
  durations?: number[];
  duration?: number;
  onDurationChange?: (minutes: number) => void;
  /** Primeiro dia oferecido (padrão: hoje). */
  from?: IsoDate;
  /** Quantos dias adiante. */
  days?: number;
  now?: IsoDate;
  timeZone?: string;
  className?: string;
}) {
  const [ownDuration, setOwnDuration] = useState(duration ?? durations[0]);
  const dur = duration ?? ownDuration;
  const start = from ?? now;
  const last = addDays(start, days - 1);
  const free = (iso: IsoDate) => availability(iso, dur).some((s) => !s.busy);
  const [day, setDay] = useState<IsoDate>(value?.date ?? (Array.from({ length: days }, (_, i) => addDays(start, i)).find(free) ?? start));
  const slots = availability(day, dur);
  const mobile = useIsMobile();
  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="segmented-control" role="group" aria-label="Duração">
          {durations.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={dur === d}
              onClick={() => {
                setOwnDuration(d);
                onDurationChange?.(d);
              }}
            >
              {d} min
            </button>
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
          <Globe className="h-3.5 w-3.5" aria-hidden /> {timeZone}
        </span>
      </div>
      <div className="grid md:grid-cols-[auto_1fr]">
        <div className="border-b border-line md:border-b-0 md:border-r">
          {mobile ? (
            <div className="flex gap-1.5 overflow-x-auto p-3">
              {Array.from({ length: days }, (_, i) => addDays(start, i)).map((iso) => {
                const ok = free(iso);
                const on = iso === day;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={!ok}
                    aria-pressed={on}
                    onClick={() => setDay(iso)}
                    className={cn(
                      "flex w-12 shrink-0 flex-col items-center rounded-lg border py-1.5",
                      on ? "border-primary bg-primary text-on-primary" : ok ? "border-line hover:bg-soft" : "border-transparent text-muted/50",
                    )}
                  >
                    <span className="text-[10.5px] uppercase">{weekdayShort[weekdayMon(iso)]}</span>
                    <span className="text-[15px] font-semibold tabular-nums">{Number(iso.slice(8))}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <Calendar selected={day} min={start} max={last} now={now} isDisabled={(iso) => !free(iso)} onDayClick={setDay} label="Dias com horário livre" />
          )}
        </div>
        <div className="min-w-0 p-4">
          <p className="m-0 mb-3 text-[13.5px] font-medium first-letter:uppercase">{formatDateLong(day)}</p>
          {slots.some((s) => !s.busy) ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4" role="listbox" aria-label={`Horários em ${formatDateLong(day)}`}>
              {slots.map((s) => {
                const on = value?.date === day && value.time === s.time;
                return (
                  <button
                    key={s.time}
                    type="button"
                    role="option"
                    aria-selected={on}
                    disabled={s.busy}
                    onClick={() => onChange({ date: day, time: s.time })}
                    className={cn(
                      "h-10 rounded-lg border text-[13px] font-medium tabular-nums transition-colors",
                      on ? "border-primary bg-primary text-on-primary" : s.busy ? "cursor-not-allowed border-transparent bg-soft/60 text-muted/60 line-through" : "border-line text-ink hover:border-primary/60 hover:bg-primary/5",
                    )}
                    aria-label={`${s.time}${s.busy ? ", ocupado" : ""}`}
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="m-0 rounded-lg border border-dashed border-line px-3 py-6 text-center text-[13px] text-muted">Sem horários livres neste dia. Escolha outro.</p>
          )}
          {value && (
            <p className="m-0 mt-4 rounded-lg bg-soft px-3 py-2 text-[12.5px] text-ink-soft" aria-live="polite">
              <span className="font-medium text-ink first-letter:uppercase">{formatDateLong(value.date)}</span>, das {value.time} às {hhmmAdd(value.time, dur)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
const hhmmAdd = (t: string, min: number) => {
  const m = minutesOf(t) + min;
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
/** Alias: mesmo componente com o nome do padrão de produto. */
export const AvailabilityPicker = SlotPicker;

/* ================================================================== */
/* Exibição                                                            */
/* ================================================================== */

/**
 * Tempo relativo ("há 5 min", "ontem") com a data exata no title e em
 * <time dateTime>. Atualiza sozinho a cada minuto.
 */
export function RelativeTime({ date, className }: { date: Date | string | number; className?: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  const d = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? toDate(date) : new Date(date);
  const exact = d.toLocaleString("pt-BR", { dateStyle: "full", timeStyle: typeof date === "string" && date.length === 10 ? undefined : "short" });
  return (
    <time dateTime={d.toISOString()} title={exact} className={cn("tabular-nums", className)}>
      {formatRelative(d)}
    </time>
  );
}

/**
 * Data em formato de "folhinha": mês em cima, dia grande. Para listas de
 * eventos, vencimentos e agenda. `tone` pinta vencido/hoje.
 */
export function DateBadge({ date, tone, size = "md", className }: { date: IsoDate; tone?: "neutral" | "accent" | "warn" | "bad"; size?: "sm" | "md"; className?: string }) {
  const d = toDate(date);
  const tones = {
    neutral: "border-line bg-surface text-ink [&>span:first-child]:bg-soft [&>span:first-child]:text-muted",
    accent: "border-accent/40 bg-surface text-ink [&>span:first-child]:bg-accent-soft [&>span:first-child]:text-accent-deep",
    warn: "border-amber/30 bg-surface text-ink [&>span:first-child]:bg-amber-soft [&>span:first-child]:text-amber",
    bad: "border-rose/30 bg-surface text-rose [&>span:first-child]:bg-rose-soft [&>span:first-child]:text-rose",
  };
  return (
    <span className={cn("inline-flex shrink-0 flex-col overflow-hidden rounded-lg border text-center leading-none", size === "sm" ? "w-9" : "w-11", tones[tone ?? "neutral"], className)} aria-label={formatDateLong(date)} role="img">
      <span className={cn("block py-0.5 font-medium uppercase tracking-wide", size === "sm" ? "text-[10px]" : "text-[10.5px]")}>{monthShort[d.getMonth()]}</span>
      <span className={cn("block font-semibold tabular-nums", size === "sm" ? "py-1 text-[14px]" : "py-1.5 text-[17px]")}>{d.getDate()}</span>
    </span>
  );
}

/* ================================================================== */
/* Calendário de eventos                                               */
/* ================================================================== */

export type AgendaEvent = { id: string; date: IsoDate; title: string; time?: string; end?: string; tone?: CalendarEvent["tone"]; meta?: ReactNode };

const eventTone = {
  neutral: "bg-soft text-ink-soft",
  accent: "bg-accent-soft text-accent-deep",
  ok: "bg-ok-soft text-ok",
  warn: "bg-amber-soft text-amber",
  bad: "bg-rose-soft text-rose",
  info: "bg-info-soft text-blue",
};

/**
 * Mês inteiro com eventos em chips (agenda, entregas, entrevistas).
 * Até `maxPerDay` por dia + "+N mais". No celular vira agenda em lista.
 */
export function MonthCalendar({
  events,
  month,
  onMonthChange,
  onDayClick,
  onEventClick,
  maxPerDay = 2,
  now = todayIso(),
  showHolidays = true,
  className,
}: {
  events: AgendaEvent[];
  month?: IsoDate;
  onMonthChange?: (month: IsoDate) => void;
  onDayClick?: (iso: IsoDate) => void;
  onEventClick?: (event: AgendaEvent) => void;
  maxPerDay?: number;
  now?: IsoDate;
  showHolidays?: boolean;
  className?: string;
}) {
  const [own, setOwn] = useState(startOfMonth(month ?? now));
  const visible = startOfMonth(month ?? own);
  const set = (m: IsoDate) => {
    if (month == null) setOwn(startOfMonth(m));
    onMonthChange?.(startOfMonth(m));
  };
  const mobile = useIsMobile();
  const byDay = useMemo(() => {
    const map = new Map<IsoDate, AgendaEvent[]>();
    [...events].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")).forEach((e) => map.set(e.date, [...(map.get(e.date) ?? []), e]));
    return map;
  }, [events]);
  const start = startOfWeek(visible);
  const end = endOfWeek(endOfMonth(visible));
  const cells: IsoDate[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) cells.push(d);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
      <h3 className="m-0 text-[15px] font-semibold capitalize">
        {monthNames[toDate(visible).getMonth()]} <span className="font-normal text-muted">{visible.slice(0, 4)}</span>
      </h3>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => set(now)}>
          Hoje
        </Button>
        <button type="button" aria-label="Mês anterior" onClick={() => set(addMonths(visible, -1))} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Próximo mês" onClick={() => set(addMonths(visible, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (mobile)
    return (
      <div className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
        {header}
        <MiniAgenda events={events.filter((e) => e.date.slice(0, 7) === visible.slice(0, 7))} onEventClick={onEventClick} now={now} className="p-3" />
      </div>
    );

  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
      {header}
      <div className="grid grid-cols-7 border-b border-line bg-soft/50 text-[11.5px] text-muted">
        {weekdayShort.map((d) => (
          <div key={d} className="px-2 py-1.5 capitalize">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((iso, i) => {
          const list = byDay.get(iso) ?? [];
          const out = iso.slice(0, 7) !== visible.slice(0, 7);
          const holiday = showHolidays ? holidayName(iso) : undefined;
          const rest = list.length - maxPerDay;
          return (
            <div
              key={iso}
              className={cn("group/day min-h-[104px] min-w-0 border-line p-1.5", i % 7 !== 6 && "border-r", i < cells.length - 7 && "border-b", out && "bg-soft/40", isWeekendIso(iso) && !out && "bg-soft/20")}
            >
              <div className="mb-1 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => onDayClick?.(iso)}
                  aria-label={formatDateLong(iso)}
                  className={cn(
                    "grid h-6 min-w-6 place-items-center rounded-full px-1 text-[12px] tabular-nums",
                    iso === now ? "bg-primary font-semibold text-on-primary" : out ? "text-muted/60" : "text-ink-soft hover:bg-soft",
                  )}
                >
                  {Number(iso.slice(8))}
                </button>
                {holiday && !out && (
                  <span className="truncate text-[10.5px] text-amber" title={holiday}>
                    {holiday}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {list.slice(0, rest > 0 ? maxPerDay : list.length).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onEventClick?.(e)}
                    title={`${e.time ? `${e.time} · ` : ""}${e.title}`}
                    className={cn("flex w-full min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11.5px] leading-tight hover:brightness-95", eventTone[e.tone ?? "neutral"])}
                  >
                    {e.time && <span className="shrink-0 tabular-nums opacity-80">{e.time}</span>}
                    <span className="truncate">{e.title}</span>
                  </button>
                ))}
                {rest > 0 && (
                  <DayOverflow count={rest} iso={iso} events={list} onEventClick={onEventClick} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayOverflow({ count, iso, events, onEventClick }: { count: number; iso: IsoDate; events: AgendaEvent[]; onEventClick?: (e: AgendaEvent) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <PickerPopover open={open} onOpenChange={setOpen} render triggerLabel={`Mais ${count} eventos em ${formatDateLong(iso)}`} triggerClassName="w-full rounded px-1.5 py-0.5 text-left text-[11.5px] font-medium text-muted hover:bg-soft hover:text-ink" trigger={<>+{count} mais</>}>
      <div className="w-64 p-2">
        <p className="m-0 px-1.5 pb-1.5 text-[12px] font-medium first-letter:uppercase">{formatDateLong(iso)}</p>
        {events.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => {
              setOpen(false);
              onEventClick?.(e);
            }}
            className={cn("mb-0.5 flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[12px]", eventTone[e.tone ?? "neutral"])}
          >
            {e.time && <span className="tabular-nums opacity-80">{e.time}</span>}
            <span className="truncate">{e.title}</span>
          </button>
        ))}
      </div>
    </PickerPopover>
  );
}

/** Agenda em lista, agrupada por dia (celular, painel lateral, “próximos”). */
export function MiniAgenda({ events, onEventClick, now = todayIso(), limit, className }: { events: AgendaEvent[]; onEventClick?: (e: AgendaEvent) => void; now?: IsoDate; limit?: number; className?: string }) {
  const days = useMemo(() => {
    const map = new Map<IsoDate, AgendaEvent[]>();
    [...events]
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""))
      .slice(0, limit)
      .forEach((e) => map.set(e.date, [...(map.get(e.date) ?? []), e]));
    return [...map.entries()];
  }, [events, limit]);
  if (!days.length) return <p className={cn("m-0 py-6 text-center text-[13px] text-muted", className)}>Nada agendado.</p>;
  const rel = (iso: IsoDate) => (iso === now ? "Hoje" : iso === addDays(now, 1) ? "Amanhã" : iso === addDays(now, -1) ? "Ontem" : undefined);
  return (
    <ol className={cn("m-0 list-none space-y-3 p-0", className)}>
      {days.map(([iso, list]) => (
        <li key={iso} className="flex gap-3">
          <DateBadge date={iso} tone={iso === now ? "accent" : iso < now ? "neutral" : "neutral"} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[12px] text-muted">
              {rel(iso) ? <span className="font-medium text-ink">{rel(iso)} · </span> : null}
              <span className="capitalize">{weekdayNames[toDate(iso).getDay()]}</span>
              {holidayName(iso) && <span className="text-amber"> · {holidayName(iso)}</span>}
            </p>
            <ul className="m-0 mt-1 list-none space-y-1 p-0">
              {list.map((e) => (
                <li key={e.id}>
                  <button type="button" onClick={() => onEventClick?.(e)} className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left hover:bg-soft">
                    <span aria-hidden className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", toneDotClass[e.tone ?? "neutral"])} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{e.title}</span>
                      {(e.time || e.meta) && (
                        <span className="block truncate text-[12px] text-muted">
                          {e.time && (
                            <span className="tabular-nums">
                              {e.time}
                              {e.end ? `–${e.end}` : ""}
                            </span>
                          )}
                          {e.time && e.meta ? " · " : ""}
                          {e.meta}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}

