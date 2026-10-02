"use client";

import { ArrowLeft, ArrowRight, Calendar, CircleCheck, User } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "../lib/layout-effect";
import { cn } from "../lib/cn";
import { formatDate, formatPercent } from "../lib/format";
import { Badge, IconButton } from "./primitives";

/*
 * Histórico e progresso no tempo.
 *   RevisionTimeline     · revisões de um documento/agente/configuração com um
 *                          "dial" de dias para navegar (dias sem revisão ficam apagados)
 *   ProjectProgressCard  · projeto com responsável, prazo, marcos e o próximo passo
 *
 * Movimento: só transição curta de posição, desligada com prefers-reduced-motion.
 */

/* ------------------------------------------------------------------ */
/* RevisionTimeline                                                    */
/* ------------------------------------------------------------------ */

export type Revision = {
  id: string;
  /** Dia da revisão, ISO `aaaa-mm-dd` (uma por dia; se houver várias, vale a última da lista). */
  date: string;
  title: ReactNode;
  /** Hora ou outro metadado curto ("16:40"). */
  time?: string;
  author?: ReactNode;
  /** `major` desenha a marca do dia mais alta e ganha o selo "Versão". */
  kind?: "major" | "minor";
  /** Selo extra ao lado do título ("Em produção"). */
  tag?: ReactNode;
  /** O que mudou. Lista curta, texto ou qualquer conteúdo. */
  content?: ReactNode;
};

const DAY = 86_400_000;
const parseDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const longDate = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "long", year: "numeric" }).replace(".", "");

type Tick = { key: string; date: Date; rev?: Revision; index?: number; future: boolean };

/**
 * Histórico de revisões navegável por dia. Em cima, o que mudou na revisão
 * escolhida; embaixo, anterior/próxima e um dial com um traço por dia (traço
 * cheio = houve revisão, apagado = não houve, tracejado = futuro). Teclado:
 * ←/→ trocam de revisão, Home/End vão à primeira/última.
 * Use para versões de agente, histórico de documento, alterações de configuração.
 */
export function RevisionTimeline({
  revisions,
  value,
  defaultValue,
  onChange,
  padDays = 14,
  futureDays = 7,
  today,
  height,
  label = "Histórico de revisões",
  className,
}: {
  revisions: Revision[];
  /** Id da revisão aberta (controlado). */
  value?: string;
  /** Id inicial. Padrão: a mais recente. */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Dias vazios desenhados antes da primeira revisão. */
  padDays?: number;
  /** Dias futuros (tracejados) depois de hoje. */
  futureDays?: number;
  /** "Hoje" do dial (ISO). Padrão: a data atual. Com SSR, passe-o para servidor e navegador desenharem o mesmo dial. */
  today?: string;
  /** Altura fixa da área de conteúdo (rola por dentro). Sem ela, cresce. */
  height?: number;
  /** Nome acessível do dial. */
  label?: string;
  className?: string;
}) {
  const ordered = useMemo(() => {
    const byDay = new Map<string, Revision>();
    [...revisions].sort((a, b) => a.date.localeCompare(b.date)).forEach((r) => byDay.set(r.date, r));
    return [...byDay.values()];
  }, [revisions]);

  const [inner, setInner] = useState(defaultValue ?? ordered[ordered.length - 1]?.id);
  const activeId = value ?? inner;
  const activeIndex = Math.max(0, ordered.findIndex((r) => r.id === activeId));
  const active = ordered[activeIndex];
  const select = (i: number) => {
    const r = ordered[Math.min(ordered.length - 1, Math.max(0, i))];
    if (!r) return;
    if (value === undefined) setInner(r.id);
    onChange?.(r.id);
  };

  const ticks = useMemo<Tick[]>(() => {
    if (!ordered.length) return [];
    const now = today ? parseDay(today) : new Date();
    now.setHours(0, 0, 0, 0);
    const first = parseDay(ordered[0].date).getTime() - padDays * DAY;
    const lastRev = parseDay(ordered[ordered.length - 1].date).getTime();
    const last = Math.max(lastRev, now.getTime()) + futureDays * DAY;
    const map = new Map(ordered.map((r, i) => [r.date, i]));
    const out: Tick[] = [];
    for (let t = first; t <= last; t += DAY) {
      const date = new Date(t);
      date.setHours(0, 0, 0, 0);
      const key = dayKey(date);
      const index = map.get(key);
      out.push({ key, date, rev: index != null ? ordered[index] : undefined, index, future: date.getTime() > now.getTime() });
    }
    return out;
  }, [ordered, padDays, futureDays, today]);

  const activeTick = ticks.findIndex((t) => t.index === activeIndex);
  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // Mede antes de pintar: o dial já nasce centrado (sem deslizar do x=0).
  useIsomorphicLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const STEP = 10; // largura do traço (4) + espaço
  const offset = width ? width / 2 - (activeTick * STEP + STEP / 2) : 0;

  if (!active) return null;

  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: activeIndex - 1, ArrowDown: activeIndex - 1, ArrowRight: activeIndex + 1, ArrowUp: activeIndex + 1, Home: 0, End: ordered.length - 1 };
    if (e.key in map) {
      e.preventDefault();
      select(map[e.key]);
    }
  };

  const activeDate = parseDay(active.date);

  return (
    <div className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <div className="min-h-0 px-5 pb-4 pt-4" style={height ? { height, overflowY: "auto" } : undefined} aria-live="polite">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="m-0 min-w-0 text-[15px] font-semibold">{active.title}</h3>
          {active.kind === "major" && <Badge>Versão</Badge>}
          {active.tag}
        </div>
        {(active.author || active.time) && (
          <p className="m-0 mt-1 text-[12px] text-muted">
            {active.author}
            {active.author && active.time && " · "}
            {active.time}
          </p>
        )}
        {active.content && <div className="mt-3 text-[13px] leading-relaxed text-ink-soft">{active.content}</div>}
      </div>

      <div className="border-t border-line bg-soft/60 pt-3">
        <div className="flex items-center justify-between gap-2 px-3">
          <IconButton label="Revisão anterior" onClick={() => select(activeIndex - 1)} disabled={activeIndex === 0}>
            <ArrowLeft />
          </IconButton>
          <div className="min-w-0 text-center">
            <div className="truncate text-[12px] font-medium tabular-nums text-ink-soft">{longDate(activeDate)}</div>
            <div className="text-[11px] tabular-nums text-muted">
              {activeIndex + 1} de {ordered.length}
            </div>
          </div>
          <IconButton label="Próxima revisão" onClick={() => select(activeIndex + 1)} disabled={activeIndex === ordered.length - 1}>
            <ArrowRight />
          </IconButton>
        </div>

        <div
          ref={trackRef}
          role="group"
          aria-roledescription="linha do tempo"
          tabIndex={0}
          aria-label={`${label}. Use as setas para trocar de revisão.`}
          onKeyDown={onKey}
          className="relative mt-1 h-16 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
          style={{ maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)" }}
        >
          <div className={cn("absolute bottom-0 left-0 flex items-end", width > 0 && "transition-transform duration-300 ease-out motion-reduce:transition-none")} style={{ transform: `translateX(${offset}px)`, visibility: width > 0 ? undefined : "hidden" }}>
            {ticks.map((t, i) => {
              const dist = Math.abs(i - activeTick);
              const bump = Math.exp(-(dist * dist) / (2 * 4.5 * 4.5));
              const h = (t.rev?.kind === "major" ? 20 : 14) + 30 * bump;
              const on = t.index === activeIndex;
              return (
                <button
                  key={t.key}
                  type="button"
                  tabIndex={-1}
                  disabled={!t.rev}
                  aria-label={t.rev ? `${formatDate(t.date)}` : undefined}
                  aria-hidden={!t.rev}
                  title={t.rev ? `${formatDate(t.date)} · ${typeof t.rev.title === "string" ? t.rev.title : ""}` : formatDate(t.date)}
                  onClick={() => t.index != null && select(t.index)}
                  className={cn("group flex h-16 shrink-0 items-end justify-center", t.rev ? "cursor-pointer" : "cursor-default")}
                  style={{ width: STEP }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "block w-1 rounded-t-full transition-[height,background-color] duration-200 ease-out motion-reduce:transition-none",
                      on ? "bg-primary" : t.rev ? "bg-line-strong group-hover:bg-ink-soft" : t.future ? "border-l-2 border-dashed border-line bg-transparent" : "bg-line/70",
                    )}
                    style={{ height: h }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ProjectProgressCard                                                 */
/* ------------------------------------------------------------------ */

export type Milestone = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Concluído, em andamento (o marco atual) ou a fazer. */
  status: "done" | "current" | "todo";
  /** Data prevista ou de conclusão (ISO). */
  date?: string;
};

/**
 * Projeto em um cartão: título, responsável, prazo, progresso e marcos numa
 * linha do tempo vertical; um único próximo passo no rodapé. Para implantação,
 * rollout de agente, obra, onboarding de cliente. Prazo estourado pinta só a data.
 */
export function ProjectProgressCard({
  title,
  subtitle,
  owner,
  due,
  late = false,
  milestones,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Responsável ("Ana Lopes"). */
  owner?: ReactNode;
  /** Prazo final (ISO). */
  due?: string;
  /** Prazo vencido: a data fica em `rose` com a palavra "Atrasado". */
  late?: boolean;
  milestones: Milestone[];
  /** O próximo passo: um `Button` (primário) ou link. */
  action?: ReactNode;
  className?: string;
}) {
  const done = milestones.filter((m) => m.status === "done").length;
  const pct = milestones.length ? done / milestones.length : 0;
  return (
    <section className={cn("surface-card flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <header className="px-4 pb-3 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0">
            <h3 className="m-0 text-[15px] font-semibold leading-snug">{title}</h3>
            {subtitle && <p className="m-0 mt-0.5 text-[12.5px] text-muted">{subtitle}</p>}
          </div>
          {due && (
            <span className={cn("inline-flex items-center gap-1 whitespace-nowrap text-[12px] tabular-nums", late ? "font-medium text-rose" : "text-muted")}>
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              {late && "Atrasado · "}
              {formatDate(due)}
            </span>
          )}
        </div>
        {owner && (
          <p className="m-0 mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft">
            <User className="h-3.5 w-3.5 text-muted" aria-hidden />
            {owner}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft" role="progressbar" aria-label="Progresso" aria-valuemin={0} aria-valuemax={milestones.length} aria-valuenow={done} aria-valuetext={`${done} de ${milestones.length} marcos`}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct * 100}%` }} />
          </div>
          <span className="shrink-0 text-[12px] tabular-nums text-muted">
            {done} de {milestones.length} · {formatPercent(pct, 0)}
          </span>
        </div>
      </header>
      <ol className="m-0 list-none border-t border-line px-4 py-3.5">
        {milestones.map((m, i) => {
          const last = i === milestones.length - 1;
          return (
            <li key={m.id} className="relative flex gap-3">
              {!last && <span aria-hidden className={cn("absolute bottom-0 left-[9.5px] top-6 w-px", m.status === "done" ? "bg-ink/30" : "bg-line")} />}
              <span className="relative z-[1] mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface" aria-hidden>
                {m.status === "done" ? (
                  <CircleCheck className="h-[18px] w-[18px] text-ok" />
                ) : m.status === "current" ? (
                  <span className="grid h-4 w-4 place-items-center rounded-full border-2 border-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-line-strong" />
                )}
              </span>
              <div className={cn("min-w-0 flex-1", !last && "pb-3.5")}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className={cn("text-[13px]", m.status === "current" ? "font-semibold text-ink" : m.status === "done" ? "text-ink-soft" : "text-muted")}>{m.title}</span>
                  {m.date && <span className="text-[11px] tabular-nums text-muted">{formatDate(m.date, { short: true })}</span>}
                </div>
                <span className="sr-only">{{ done: "concluído", current: "em andamento", todo: "a fazer" }[m.status]}</span>
                {m.description && <p className="m-0 mt-0.5 text-[12px] leading-snug text-muted">{m.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {action && <footer className="mt-auto border-t border-line bg-soft/60 px-4 py-3 [&>*]:w-full">{action}</footer>}
    </section>
  );
}
