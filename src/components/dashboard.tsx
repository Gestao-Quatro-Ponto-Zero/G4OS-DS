"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatDelta, formatNumber, formatPercent } from "../lib/format";
import { Sparkline } from "./charts";
import { Avatar, DsLink } from "./primitives";

/*
 * Peças de dashboard. Regras (docs/padroes/dashboards.md):
 *   · 3–5 KPIs no topo, cada um com comparação (delta) e período explícito
 *   · o delta sabe se subir é bom: custo que sobe é vermelho
 *   · um gráfico por pergunta; título do card = a pergunta respondida
 *   · nada de número sem unidade, nada de % sem base
 */

/* ------------------------------------------------------------------ */
/* Delta                                                               */
/* ------------------------------------------------------------------ */

/**
 * Variação contra um período. `value` é fração (0.125 = +12,5 %).
 * `goodWhen="down"` para custo, churn, tempo de resposta, inadimplência.
 */
export function Delta({
  value,
  goodWhen = "up",
  format = formatDelta,
  variant = "badge",
  className,
}: {
  value: number;
  goodWhen?: "up" | "down" | "neutral";
  format?: (n: number) => string;
  variant?: "badge" | "text";
  className?: string;
}) {
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const good = goodWhen === "neutral" || dir === "flat" ? null : dir === goodWhen;
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : ArrowRight;
  const tone = good == null ? "text-ink-soft" : good ? "text-ok" : "text-rose";
  const label = `${dir === "up" ? "subiu" : dir === "down" ? "caiu" : "estável"} ${format(value)}${good == null ? "" : good ? ", positivo" : ", negativo"}`;
  return (
    <span
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11.5px] font-medium tabular-nums leading-none",
        variant === "badge" && "rounded-md px-1.5 py-1 ring-1",
        variant === "badge" && (good == null ? "bg-soft ring-line" : good ? "bg-ok-soft/70 ring-ok/15" : "bg-rose-soft/60 ring-rose/15"),
        tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.2} aria-hidden />
      {format(value)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* KpiCard                                                             */
/* ------------------------------------------------------------------ */

/**
 * Indicador de topo de dashboard: rótulo, número grande, delta com período,
 * e opcionalmente sparkline ou meta. Clicável com href (leva ao detalhe).
 */
export function KpiCard({
  label,
  value,
  delta,
  goodWhen = "up",
  period = "vs. mês anterior",
  spark,
  icon,
  hint,
  footer,
  href,
  size = "md",
  className,
}: {
  label: string;
  value: ReactNode;
  /** Fração: 0.125 = +12,5 %. */
  delta?: number;
  goodWhen?: "up" | "down" | "neutral";
  /** Base da comparação. Sempre explícita. */
  period?: string;
  spark?: number[];
  icon?: ReactNode;
  hint?: ReactNode;
  footer?: ReactNode;
  href?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const sparkTone = delta == null || goodWhen === "neutral" ? "neutral" : (delta >= 0) === (goodWhen === "up") ? "neutral" : "bad";
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[12.5px] text-muted">
          {icon && <span className="inline-flex shrink-0 text-muted [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
          <span className="truncate">{label}</span>
        </div>
        {delta != null && <Delta value={delta} goodWhen={goodWhen} />}
      </div>
      {/* Valor e sparkline quebram linha em cards estreitos em vez de se sobrepor. */}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div className={cn("whitespace-nowrap font-semibold leading-none tracking-[-0.02em] tabular-nums", size === "lg" ? "text-[30px]" : "text-[24px]")}>{value}</div>
        {spark && <Sparkline values={spark} tone={sparkTone} width={84} height={30} className="ml-auto" />}
      </div>
      {(hint || (delta != null && period)) && (
        <div className="mt-2.5 text-[12px] leading-snug text-muted">
          {hint ?? period}
        </div>
      )}
      {footer && <div className="mt-3 border-t border-line pt-3">{footer}</div>}
    </>
  );
  const cls = cn("surface-card block min-w-0 rounded-xl border border-line bg-surface px-4 py-3.5", href && "surface-interactive hover:border-line-strong", className);
  return href ? (
    <DsLink href={href} className={cls}>
      {body}
    </DsLink>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Grade de KPIs: 1 coluna no celular, 2 no tablet, `cols` no desktop. */
export function KpiGrid({ children, cols = 4, className }: { children: ReactNode; cols?: 2 | 3 | 4 | 5; className?: string }) {
  const lg = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" }[cols];
  return <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", lg, className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* ChartCard                                                           */
/* ------------------------------------------------------------------ */

/**
 * Moldura de gráfico. O título é a pergunta que o gráfico responde
 * ("De onde vêm os leads?"), a descrição dá período e unidade.
 * `action` recebe o seletor de período (SegmentedControl) ou um menu.
 */
export function ChartCard({
  title,
  description,
  value,
  action,
  children,
  footer,
  insight,
  insightTrend,
  insightDetail,
  headerAside,
  flush = false,
  className,
}: {
  title: string;
  description?: ReactNode;
  /** Número-resumo abaixo do título (total do período). */
  value?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  /** Rodapé livre (com linha divisória). */
  footer?: ReactNode;
  /** Rodapé de leitura: a conclusão do gráfico ("Subiu 5,2 % este mês"). */
  insight?: ReactNode;
  /** Seta ao lado do insight. */
  insightTrend?: "up" | "down" | "flat";
  /** Segunda linha do insight (período, base). */
  insightDetail?: ReactNode;
  /**
   * Substitui o lado direito do cabeçalho por uma área própria, colada às
   * bordas (ex.: totais clicáveis por série, como no "Bar Chart – Interativo").
   */
  headerAside?: ReactNode;
  /** Gráfico encostado nas laterais (sem padding horizontal no corpo). */
  flush?: boolean;
  className?: string;
}) {
  const TrendIcon = insightTrend === "down" ? ArrowDownRight : insightTrend === "flat" ? ArrowRight : ArrowUpRight;
  return (
    <section className={cn("surface-card flex min-w-0 flex-col rounded-xl border border-line bg-surface", className)}>
      <header className={cn("flex items-stretch justify-between gap-3", headerAside ? "flex-wrap border-b border-line" : "items-start px-6 pt-5")}>
        <div className={cn("min-w-0", headerAside ? "w-full px-6 py-5 sm:w-auto sm:flex-1" : undefined)}>
          <h3 className="m-0 text-[15px] font-semibold leading-snug tracking-[-0.01em]">{title}</h3>
          {description && <p className="m-0 mt-1 text-[13px] text-muted">{description}</p>}
          {value != null && <div className="mt-2 text-[24px] font-semibold tabular-nums tracking-tight">{value}</div>}
        </div>
        {headerAside ? <div className="flex w-full min-w-0 flex-wrap items-stretch sm:w-auto">{headerAside}</div> : action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("min-w-0 flex-1 pb-5 pt-5", flush ? "px-2 sm:px-3" : "px-6")}>{children}</div>
      {insight && (
        <div className="px-6 pb-5 text-[13px]">
          <div className="flex items-center gap-1.5 font-medium text-ink">
            {insight}
            {insightTrend && <TrendIcon className="h-4 w-4 text-ink-soft" aria-hidden />}
          </div>
          {insightDetail && <div className="mt-1 text-muted">{insightDetail}</div>}
        </div>
      )}
      {footer && <footer className="border-t border-line px-6 py-3 text-[12px] text-muted">{footer}</footer>}
    </section>
  );
}

/**
 * Totais clicáveis no cabeçalho do ChartCard: cada um troca a série do
 * gráfico (padrão "Bar Chart – Interativo"). Use em `headerAside`.
 */
export function ChartCardTotals({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string; value: ReactNode }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex w-full sm:w-auto" role="tablist" aria-label="Série exibida">
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.key)}
            className={cn(
              "relative flex flex-1 flex-col justify-center gap-1 border-t border-line px-6 py-4 text-left transition-colors sm:border-l sm:border-t-0 sm:px-8",
              on ? "bg-soft" : "hover:bg-soft/60",
            )}
          >
            <span className="text-[12px] text-muted">{it.label}</span>
            <span className="text-[22px] font-semibold leading-none tabular-nums tracking-tight sm:text-[26px]">{it.value}</span>
            {on && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GoalMeter                                                           */
/* ------------------------------------------------------------------ */

/**
 * Progresso até uma meta (quota de vendas, orçamento, vagas preenchidas).
 * Marca de "esperado até hoje" opcional: mostra se está adiantado ou atrasado.
 */
export function GoalMeter({
  label,
  value,
  target,
  expected,
  format = (n) => formatNumber(n),
  className,
}: {
  label: string;
  value: number;
  target: number;
  /** Quanto já deveria ter sido atingido até hoje (ritmo linear, por ex.). */
  expected?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const pct = target ? value / target : 0;
  const behind = expected != null && value < expected;
  const fill = pct >= 1 ? "bg-ok" : behind ? "bg-amber" : "bg-ink";
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[13px] font-medium">{label}</span>
        <span className="shrink-0 text-[12px] tabular-nums text-muted">
          <span className="font-medium text-ink">{format(value)}</span> de {format(target)}
        </span>
      </div>
      <div
        className="relative mt-2 h-2 overflow-hidden rounded-full bg-soft ring-1 ring-inset ring-line"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full transition-[width] duration-500", fill)} style={{ width: `${Math.min(100, pct * 100)}%` }} />
        {expected != null && target > 0 && (
          <span aria-hidden className="absolute inset-y-[-2px] w-0.5 rounded bg-ink/60" style={{ left: `${Math.min(100, (expected / target) * 100)}%` }} />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[11.5px] tabular-nums text-muted">
        <span className={cn(pct >= 1 && "font-medium text-ok")}>{formatPercent(pct, 0)} da meta</span>
        {expected != null && <span className={cn(behind && "font-medium text-amber")}>{behind ? `${format(expected - value)} abaixo do ritmo` : "no ritmo"}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ActivityFeed                                                        */
/* ------------------------------------------------------------------ */

export type ActivityItem = {
  id: string;
  actor: { name: string; initials: string; tint?: string };
  /** Verbo + objeto: "moveu", "comentou em", "fechou". */
  action: ReactNode;
  target?: ReactNode;
  time: string;
  /** Trecho citado (comentário, nota). */
  quote?: ReactNode;
  icon?: ReactNode;
};

/** Feed de atividade recente (quem fez o quê em quê, quando). */
export function ActivityFeed({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <ol className={cn("list-none p-0", className)}>
      {items.map((it, i) => (
        <li key={it.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && <span aria-hidden className="absolute bottom-0 left-[13.5px] top-8 w-px bg-line" />}
          <span className="relative flex h-7 shrink-0">
            <Avatar {...it.actor} size="sm" name={it.actor.name} />
            {it.icon && (
              <span className="absolute -bottom-1.5 -right-2 inline-grid h-[15px] w-[15px] place-items-center rounded-full bg-surface text-muted ring-1 ring-line [&_svg]:h-2.5 [&_svg]:w-2.5">{it.icon}</span>
            )}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <p className="m-0 text-[13px] leading-snug text-ink-soft">
              <span className="font-medium text-ink">{it.actor.name}</span> {it.action} {it.target && <span className="font-medium text-ink">{it.target}</span>}
            </p>
            {it.quote && <div className="mt-1.5 rounded-lg border border-line bg-soft/60 px-3 py-2 text-[12.5px] leading-relaxed text-ink-soft">{it.quote}</div>}
            <p className="m-0 mt-1 text-[11.5px] text-muted">{it.time}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Leaderboard                                                         */
/* ------------------------------------------------------------------ */

export type LeaderRow = { id: string; name: string; initials?: string; tint?: string; value: number; sub?: ReactNode; delta?: number; href?: string };

/** Ranking de pessoas/contas (vendedores, recrutadores, clientes). Top 3 em destaque sutil. */
export function Leaderboard({
  rows,
  format = (n) => formatNumber(n),
  goodWhen = "up",
  showBar = true,
  className,
}: {
  rows: LeaderRow[];
  format?: (n: number) => string;
  goodWhen?: "up" | "down";
  showBar?: boolean;
  className?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className={cn("list-none divide-y divide-line p-0", className)}>
      {rows.map((r, i) => {
        const inner = (
          <>
            <span className={cn("w-5 shrink-0 text-center text-[12px] font-semibold tabular-nums", i < 3 ? "text-accent-deep" : "text-muted")}>{i + 1}</span>
            {r.initials && <Avatar initials={r.initials} tint={r.tint} size="sm" name={r.name} />}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{r.name}</div>
              {showBar ? (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-soft">
                  <div className="h-full rounded-full bg-ink/80" style={{ width: `${(r.value / max) * 100}%` }} />
                </div>
              ) : (
                r.sub && <div className="truncate text-[11.5px] text-muted">{r.sub}</div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[13px] font-semibold tabular-nums">{format(r.value)}</div>
              {r.delta != null ? <Delta value={r.delta} goodWhen={goodWhen} variant="text" /> : showBar && r.sub ? <div className="text-[11px] text-muted">{r.sub}</div> : null}
            </div>
          </>
        );
        return (
          <li key={r.id}>
            {r.href ? (
              <DsLink href={r.href} className="flex items-center gap-3 py-2.5 hover:bg-soft/40">
                {inner}
              </DsLink>
            ) : (
              <div className="flex items-center gap-3 py-2.5">{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Comparação lado a lado                                              */
/* ------------------------------------------------------------------ */

/** Dois números lado a lado (este mês × anterior; plano × real). */
export function CompareStat({
  label,
  current,
  previous,
  currentLabel = "Atual",
  previousLabel = "Anterior",
  format = (n) => formatNumber(n),
  goodWhen = "up",
}: {
  label: string;
  current: number;
  previous: number;
  currentLabel?: string;
  previousLabel?: string;
  format?: (n: number) => string;
  goodWhen?: "up" | "down";
}) {
  const delta = previous ? (current - previous) / Math.abs(previous) : 0;
  const max = Math.max(current, previous, 1);
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] text-muted">{label}</span>
        <Delta value={delta} goodWhen={goodWhen} />
      </div>
      {[
        [currentLabel, current, "bg-ink"],
        [previousLabel, previous, "bg-line-strong"],
      ].map(([l, v, c]) => (
        <div key={l as string} className="mt-2 flex items-center gap-3">
          <span className="w-16 shrink-0 text-[11.5px] text-muted">{l}</span>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-soft">
            <div className={cn("h-full rounded-full", c as string)} style={{ width: `${((v as number) / max) * 100}%` }} />
          </div>
          <span className="w-20 shrink-0 text-right text-[12.5px] font-medium tabular-nums">{format(v as number)}</span>
        </div>
      ))}
    </div>
  );
}
