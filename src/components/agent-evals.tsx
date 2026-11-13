"use client";

import { Check, Scale, X } from "lucide-react";
import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatCurrency, formatNumber, formatPercent } from "../lib/format";
import { formatDuration } from "./ai";
import { Sparkline } from "./charts";
import { SegmentedControl } from "./navigation";
import { Button, IconButton } from "./primitives";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

/**
 * Resultado de um caso na versão candidata. `regression` = passava na base e falhou agora;
 * `improved` = falhava na base e passou agora; `pending` = ainda não rodou.
 */
export type EvalCaseStatus = "pass" | "fail" | "error" | "regression" | "improved" | "pending";
/** Um caso de teste da suíte. */
export type EvalCase = { id: string; title: string; status: EvalCaseStatus };
/** Uma categoria da suíte (Reembolso, Frete, Tom…) com os seus casos e o score da versão-base (fração). */
export type EvalCategory = { id: string; label: string; cases: EvalCase[]; baseline?: number };
/** Recorte da grade: todos, só falhas (falhou, erro, regressão), só regressões ou só melhorias. */
export type EvalFilter = "all" | "failed" | "regressions" | "improved";

const passing = (s: EvalCaseStatus) => s === "pass" || s === "improved";
const matches = (s: EvalCaseStatus, f: EvalFilter) =>
  f === "all" ? true : f === "failed" ? s === "fail" || s === "error" || s === "regression" : f === "regressions" ? s === "regression" : s === "improved";

/** Score de uma lista de casos já rodados (fração) ou `null` se nenhum rodou. */
function scoreOf(cases: EvalCase[]) {
  const done = cases.filter((c) => c.status !== "pending");
  return done.length ? done.filter((c) => passing(c.status)).length / done.length : null;
}

const statusWord: Record<EvalCaseStatus, string> = {
  pass: "Passou",
  fail: "Falhou",
  error: "Erro",
  regression: "Regressão",
  improved: "Melhorou",
  pending: "Pendente",
};

const dotClass: Record<EvalCaseStatus, string> = {
  pass: "bg-ok text-on-ink",
  improved: "bg-ok-soft text-ok ring-1 ring-inset ring-ok/40",
  fail: "bg-rose-soft text-rose",
  error: "bg-amber-soft text-amber",
  regression: "bg-surface text-rose ring-2 ring-inset ring-rose",
  pending: "bg-soft ring-1 ring-inset ring-line",
};

/** A forma de cada estado (além da cor): quadrado cheio, ×, !, × com contorno, ▲, vazio. */
function Glyph({ status }: { status: EvalCaseStatus }) {
  if (status === "pass" || status === "pending") return null;
  return (
    <svg viewBox="0 0 10 10" aria-hidden className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      {status === "fail" || status === "regression" ? (
        <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
      ) : status === "error" ? (
        <>
          <path d="M5 1.8v4" />
          <circle cx="5" cy="8.2" r="0.6" fill="currentColor" stroke="none" />
        </>
      ) : (
        <path d="M5 2L8.5 8H1.5Z" fill="currentColor" strokeWidth={1} strokeLinejoin="round" />
      )}
    </svg>
  );
}

/** Marca de um estado, para legenda e cabeçalhos (mesma forma do ponto da grade). */
export function EvalStatusMark({ status, size = "md" }: { status: EvalCaseStatus; size?: "sm" | "md" }) {
  return (
    <span aria-hidden className={cn("inline-grid shrink-0 place-items-center rounded-[3px]", size === "sm" ? "h-3 w-3" : "h-4 w-4", dotClass[status])}>
      <Glyph status={status} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* EvalDotGrid                                                         */
/* ------------------------------------------------------------------ */

/**
 * Resultado de uma suíte de avaliação caso a caso: por categoria, o score com a marca da
 * versão-base e uma grade de pontos (um por caso) que se preenche conforme os resultados chegam.
 * Cada estado tem forma além da cor (cheio, ×, !, contorno, ▲, vazio) e legenda. Os pontos são
 * botões numa só parada de Tab: setas percorrem (← → no caso, ↑ ↓ entre categorias), Enter abre.
 * O filtro (Todos, Falhas, Regressões, Melhorias) esmaece o que não entra no recorte.
 */
export function EvalDotGrid({
  categories,
  baselineLabel = "base",
  filter: filterProp,
  onFilterChange,
  selectedId,
  onOpenCase,
  label = "Resultados por caso",
  className,
}: {
  categories: EvalCategory[];
  /** Nome da versão-base na legenda e na marca da barra ("v11"). */
  baselineLabel?: string;
  /** Recorte controlado. Sem ele, a grade guarda o próprio. */
  filter?: EvalFilter;
  onFilterChange?: (filter: EvalFilter) => void;
  /** Caso aberto (destacado na grade). */
  selectedId?: string;
  onOpenCase?: (evalCase: EvalCase, category: EvalCategory) => void;
  /** Nome acessível da grade. */
  label?: string;
  className?: string;
}) {
  const [own, setOwn] = useState<EvalFilter>("all");
  const filter = filterProp ?? own;
  const setFilter = (f: EvalFilter) => {
    if (filterProp === undefined) setOwn(f);
    onFilterChange?.(f);
  };
  const all = useMemo(() => categories.flatMap((c) => c.cases), [categories]);
  const count = (f: EvalFilter) => all.filter((c) => matches(c.status, f)).length;
  // Posições navegáveis (só o que entra no recorte).
  const grid = useMemo(() => categories.map((cat) => cat.cases.filter((c) => matches(c.status, filter)).map((c) => c.id)), [categories, filter]);
  const flat = useMemo(() => grid.flat(), [grid]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const active = focusId && flat.includes(focusId) ? focusId : (selectedId && flat.includes(selectedId) ? selectedId : flat[0]);

  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!active) return;
    const row = grid.findIndex((r) => r.includes(active));
    const col = grid[row].indexOf(active);
    let next: string | undefined;
    if (e.key === "ArrowRight") next = flat[flat.indexOf(active) + 1];
    else if (e.key === "ArrowLeft") next = flat[flat.indexOf(active) - 1];
    else if (e.key === "Home") next = flat[0];
    else if (e.key === "End") next = flat[flat.length - 1];
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const step = e.key === "ArrowDown" ? 1 : -1;
      for (let r = row + step; r >= 0 && r < grid.length; r += step)
        if (grid[r].length) {
          next = grid[r][Math.min(col, grid[r].length - 1)];
          break;
        }
    } else return;
    e.preventDefault();
    if (!next) return;
    setFocusId(next);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-case="${CSS.escape(next)}"]`)?.focus();
  };

  return (
    <div className={cn("flex min-w-0 flex-col gap-4", className)}>
      <div className="-mx-1 max-w-full self-start overflow-x-auto px-1 pb-0.5">
      <SegmentedControl
        label="Recorte dos casos"
        value={filter}
        onChange={setFilter}
        className="w-max"
        options={[
          { value: "all", label: `Todos · ${formatNumber(all.length)}` },
          { value: "failed", label: `Falhas · ${formatNumber(count("failed"))}` },
          { value: "regressions", label: `Regressões · ${formatNumber(count("regressions"))}` },
          { value: "improved", label: `Melhorias · ${formatNumber(count("improved"))}` },
        ]}
      />
      </div>
      <div role="group" aria-label={label} onKeyDown={move} className="flex min-w-0 flex-col gap-4">
        {categories.map((cat) => {
          const score = scoreOf(cat.cases);
          const done = cat.cases.filter((c) => c.status !== "pending").length;
          return (
            <section key={cat.id} aria-label={cat.label} className="flex min-w-0 flex-col gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <h4 className="m-0 min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{cat.label}</h4>
                <span className="relative hidden h-1.5 w-24 shrink-0 rounded-full bg-soft sm:block" aria-hidden>
                  {score != null && <span className="absolute inset-y-0 left-0 rounded-full bg-ink/70 transition-[width] duration-300" style={{ width: `${score * 100}%` }} />}
                  {cat.baseline != null && <span className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-full bg-ink" style={{ left: `${cat.baseline * 100}%` }} />}
                </span>
                <span className="w-24 shrink-0 text-right text-[12.5px] tabular-nums">
                  {score == null ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <>
                      <span className={cn("font-medium", cat.baseline != null && Math.round(score * 100) < Math.round(cat.baseline * 100) ? "text-rose" : "text-ink")}>{formatPercent(score, 0)}</span>
                      {cat.baseline != null && <span className="text-muted"> / {formatPercent(cat.baseline, 0)}</span>}
                    </>
                  )}
                </span>
                <span className="sr-only">
                  {score == null ? "ainda sem resultado" : `${formatPercent(score, 0)} em ${done} de ${cat.cases.length} casos`}
                  {cat.baseline != null && `; ${baselineLabel} fez ${formatPercent(cat.baseline, 0)}`}
                </span>
              </div>
              <div className="flex min-w-0 flex-wrap gap-1">
                {cat.cases.map((c) => {
                  const on = matches(c.status, filter);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      data-case={c.id}
                      tabIndex={on && c.id === active ? 0 : -1}
                      disabled={!on}
                      aria-label={`${c.title}: ${statusWord[c.status]}`}
                      aria-pressed={selectedId === c.id}
                      title={`${c.title} · ${statusWord[c.status]}`}
                      onFocus={() => setFocusId(c.id)}
                      onClick={() => onOpenCase?.(c, cat)}
                      className={cn(
                        "grid h-4 w-4 shrink-0 place-items-center rounded-[3px] outline-none transition-[background-color,box-shadow,opacity] duration-200 focus-visible:ring-2 focus-visible:ring-muted/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                        dotClass[c.status],
                        !on && "opacity-20",
                        selectedId === c.id && "outline outline-2 outline-offset-1 outline-ink",
                        on && "cursor-pointer",
                      )}
                    >
                      <Glyph status={c.status} />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <ul aria-label="Legenda" className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1.5 p-0 text-[12px] text-ink-soft">
        {(["pass", "fail", "error", "regression", "improved", "pending"] as const).map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <EvalStatusMark status={s} size="sm" />
            {statusWord[s]}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-0.5 rounded-full bg-ink" />
          {baselineLabel}
        </li>
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EvalCaseCompare                                                     */
/* ------------------------------------------------------------------ */

/** Saída de uma versão num caso: rótulo ("Base · v11"), texto e nota do juiz (fração). */
export type EvalSide = { label: string; output: ReactNode; score: number };
/** Um caso aberto para comparar: entrada, saída da base e da candidata, rubrica do juiz. */
export type EvalCaseDetail = {
  id: string;
  title: string;
  category?: string;
  status: EvalCaseStatus;
  input: ReactNode;
  baseline: EvalSide;
  candidate: EvalSide;
  /** Critérios da rubrica: se cada versão cumpriu. */
  criteria: { label: string; baseline: boolean; candidate: boolean }[];
  /** Juiz (modelo ou pessoa) e o comentário dele. */
  judge?: { name: string; note?: ReactNode };
};

function Pass({ ok, who }: { ok: boolean; who: string }) {
  return ok ? <Check className="mx-auto h-4 w-4 text-ok" aria-label={`${who}: cumpriu`} /> : <X className="mx-auto h-4 w-4 text-rose" aria-label={`${who}: não cumpriu`} />;
}

/**
 * Um caso da avaliação aberto lado a lado: a entrada, o que a versão-base e a candidata
 * responderam, a rubrica do juiz (✓/× por critério nas duas) e a nota. Ações: aceitar a mudança
 * (a resposta nova passa a ser a esperada) ou abrir um chamado para corrigir.
 */
export function EvalCaseCompare({
  evalCase: c,
  onAccept,
  onOpenIssue,
  onClose,
  className,
}: {
  evalCase: EvalCaseDetail;
  /** "Aceitar mudança": a saída da candidata vira a referência do caso. */
  onAccept?: (evalCase: EvalCaseDetail) => void;
  onOpenIssue?: (evalCase: EvalCaseDetail) => void;
  onClose?: () => void;
  className?: string;
}) {
  const sides = [
    { key: "baseline" as const, side: c.baseline },
    { key: "candidate" as const, side: c.candidate },
  ];
  return (
    <section aria-label={`Caso: ${c.title}`} className={cn("flex min-w-0 flex-col rounded-xl border border-line bg-surface", className)}>
      <header className="flex min-w-0 items-start gap-3 border-b border-line px-4 py-3">
        <EvalStatusMark status={c.status} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="m-0 text-[12px] text-muted">
            {statusWord[c.status]}
            {c.category && ` · ${c.category}`}
          </p>
          <h3 className="m-0 text-[14px] font-medium leading-snug text-ink">{c.title}</h3>
        </div>
        {onClose && (
          <IconButton label="Fechar caso" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        )}
      </header>
      <div className="flex min-w-0 flex-col gap-4 px-4 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Entrada</p>
          <div className="rounded-lg border border-line bg-soft/60 px-3 py-2.5 text-[13px] leading-relaxed text-ink">{c.input}</div>
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          {sides.map(({ key, side }) => (
            <div key={key} className="flex min-w-0 flex-col gap-2 rounded-lg border border-line px-3 py-2.5">
              <div className="flex items-center gap-2">
                <p className="m-0 flex-1 text-[12px] font-medium text-ink-soft">{side.label}</p>
                <span className="text-[12px] tabular-nums text-muted">Nota {formatPercent(side.score, 0)}</span>
              </div>
              <div className="text-[13px] leading-relaxed text-ink [overflow-wrap:anywhere]">{side.output}</div>
            </div>
          ))}
        </div>
        {c.criteria.length > 0 && (
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="m-0 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
              <Scale aria-hidden className="h-3.5 w-3.5" /> Rubrica{c.judge && ` · juiz ${c.judge.name}`}
            </p>
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-[12.5px]">
                <thead className="bg-soft text-[11.5px] text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-1.5 text-left font-medium">
                      Critério
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3 py-1.5 text-center font-medium">
                      {c.baseline.label}
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3 py-1.5 text-center font-medium">
                      {c.candidate.label}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {c.criteria.map((k) => (
                    <tr key={k.label} className="border-t border-line">
                      <th scope="row" className="px-3 py-1.5 text-left font-normal text-ink">
                        {k.label}
                      </th>
                      <td className="px-2 py-1.5">
                        <Pass ok={k.baseline} who={c.baseline.label} />
                      </td>
                      <td className="px-2 py-1.5">
                        <Pass ok={k.candidate} who={c.candidate.label} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {c.judge?.note != null && <p className="m-0 text-[12.5px] leading-relaxed text-ink-soft">{c.judge.note}</p>}
          </div>
        )}
      </div>
      {(onAccept || onOpenIssue) && (
        <footer className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
          {onAccept && (
            <Button size="sm" onClick={() => onAccept(c)}>
              Aceitar mudança
            </Button>
          )}
          {onOpenIssue && (
            <Button size="sm" variant="ghost" onClick={() => onOpenIssue(c)}>
              Abrir chamado
            </Button>
          )}
        </footer>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* EvalRunHeader                                                       */
/* ------------------------------------------------------------------ */

/** Uma versão avaliada: rótulo ("v12") e modelo. */
export type EvalVersion = { label: string; model?: string };

/**
 * Cabeçalho de uma execução de suíte: candidata × base, juiz, score atual contra o da base, as
 * últimas execuções numa linha, custo e tempo estimados e a ação de rodar (passe um
 * `OperationButton`). Enquanto roda, `progress` mostra quantos casos já chegaram.
 */
export function EvalRunHeader({
  title,
  candidate,
  baseline,
  judge,
  caseCount,
  score,
  baselineScore,
  history = [],
  cost,
  durationMs,
  progress,
  action,
  className,
}: {
  /** Nome da suíte ou do agente avaliado. */
  title: string;
  candidate: EvalVersion;
  baseline: EvalVersion;
  /** Modelo ou pessoa que julga as respostas. */
  judge?: string;
  caseCount: number;
  /** Score da candidata (fração) ou `null` se ainda não rodou. */
  score: number | null;
  baselineScore: number;
  /** Últimas execuções, da mais antiga à mais recente (fração). */
  history?: { label: string; score: number }[];
  /** Custo estimado da execução, em reais. */
  cost?: number;
  /** Tempo estimado da execução. */
  durationMs?: number;
  /** Casos já rodados nesta execução. */
  progress?: { done: number; total: number };
  /** Ação de rodar (`OperationButton`). */
  action?: ReactNode;
  className?: string;
}) {
  const delta = score != null ? score - baselineScore : null;
  const pp = delta != null ? `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${formatNumber(Math.abs(delta) * 100, 1)} p.p.` : null;
  const chip = (v: EvalVersion) => (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-soft/60 px-2 py-0.5">
      {v.model && <span className="text-ink">{v.model}</span>}
      <span className="font-mono text-muted">{v.label}</span>
    </span>
  );
  return (
    <section aria-label={`Execução da suíte ${title}`} className={cn("flex min-w-0 flex-col gap-4", className)}>
      <div className="flex min-w-0 flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 className="m-0 text-[15px] font-medium text-ink">{title}</h3>
          <p className="m-0 text-[12.5px] text-muted">
            {candidate.label} contra {baseline.label} · {formatNumber(caseCount)} casos
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px]">
            {chip(candidate)}
            <span className="text-muted">contra</span>
            {chip(baseline)}
            {judge && (
              <>
                <span aria-hidden className="text-muted">
                  ·
                </span>
                <span className="text-muted">Juiz</span>
                <span className="rounded-md border border-line bg-soft/60 px-2 py-0.5 text-ink">{judge}</span>
              </>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="grid min-w-0 gap-4 border-t border-line pt-4 sm:grid-cols-[1fr_1.4fr_1fr]">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="m-0 text-[12px] text-muted">Score</p>
          {score == null ? (
            <p className="m-0 text-[17px] text-muted">{progress ? "Rodando…" : "Ainda não rodou"}</p>
          ) : (
            <p className="m-0 flex items-baseline gap-2">
              <span className="text-[22px] font-medium tabular-nums text-ink">{formatPercent(score)}</span>
              <span className={cn("text-[12.5px] tabular-nums", delta != null && delta < 0 ? "text-rose" : "text-muted")}>{pp}</span>
            </p>
          )}
          <p className="m-0 inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft">
            <span aria-hidden className="h-3 w-0.5 rounded-full bg-ink" />
            {baseline.label} fez <span className="tabular-nums">{formatPercent(baselineScore)}</span>
          </p>
          {progress && (
            <div className="flex flex-col gap-1 pt-1" role="status">
              <span className="relative h-1 w-full overflow-hidden rounded-full bg-soft" aria-hidden>
                <span className="absolute inset-y-0 left-0 rounded-full bg-ink transition-[width] duration-200" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} />
              </span>
              <span className="text-[12px] tabular-nums text-muted">
                {formatNumber(progress.done)} de {formatNumber(progress.total)} casos
              </span>
            </div>
          )}
        </div>
        {history.length >= 2 && (
          <div className="flex min-w-0 flex-col gap-1">
            <p className="m-0 text-[12px] text-muted">Últimas {history.length} execuções</p>
            <Sparkline values={history.map((h) => h.score)} width={200} height={40} area={false} />
            <p className="m-0 flex w-[200px] justify-between text-[11px] text-muted" aria-hidden>
              <span>{history[0].label}</span>
              <span>{history[history.length - 1].label}</span>
            </p>
            <p className="sr-only">{history.map((h) => `${h.label}: ${formatPercent(h.score)}`).join("; ")}</p>
          </div>
        )}
        <dl className="m-0 grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1">
          {cost != null && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] text-muted">Custo estimado</dt>
              <dd className="m-0 text-[13.5px] tabular-nums text-ink">cerca de {formatCurrency(cost)}</dd>
            </div>
          )}
          {durationMs != null && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] text-muted">Tempo estimado</dt>
              <dd className="m-0 text-[13.5px] tabular-nums text-ink">cerca de {formatDuration(durationMs)}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
