"use client";

import { AlertTriangle, CheckCircle2, Info, LoaderCircle, RotateCw } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber, formatPercent } from "../lib/format";
import { useReducedMotion } from "../lib/motion";
import { chartColor } from "./charts";
import { useLinkedHighlight, type LinkedHighlight } from "./charts-kit";
import { OperationButton, OperationFeedback, notify, useOperation } from "./feedback";
import { ConfirmDialog } from "./overlays";
import { Button } from "./primitives";

/*
 * Capacidade: quanto de uma cota está ocupado e por quê. Uma barra
 * horizontal segmentada por categoria (CapacityBar), a legenda ligada
 * (CapacityLegend) e o cartão completo com varredura e limpeza
 * (CapacityBreakdown). Para composição de um limite (armazenamento, cota de
 * envio, assentos), nunca para série temporal.
 */

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

/**
 * Bytes em unidade legível, base 1000 como o sistema operacional mostra:
 * 357_800_000_000 → "357,8 GB". Espaço inseparável entre número e unidade.
 */
export function formatStorage(bytes: number, digits = 1) {
  const sign = bytes < 0 ? -1 : 1;
  let v = Math.abs(bytes);
  let u = 0;
  while (u < STORAGE_UNITS.length - 1 && Number(v.toFixed(digits)) >= 1000) {
    v /= 1000;
    u++;
  }
  return `${formatNumber(sign * v, u === 0 ? 0 : digits)}\u00A0${STORAGE_UNITS[u]}`;
}

/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */

/** Uma categoria da cota (Documentos, Gravações, Lixeira…). */
export type CapacitySegment = {
  id: string;
  label: string;
  /** Quanto ocupa, na mesma unidade de `total`. */
  value: number;
  /** Cor explícita (token: `var(--color-…)`). Padrão: `chartColor(i)`. */
  color?: string;
  /** Ícone lucide da categoria (legenda e linha de status). */
  icon?: ReactNode;
  /** O que há dentro, em uma frase. Aparece na linha de status quando a categoria está em foco. */
  description?: ReactNode;
};

type ShownSegment = CapacitySegment & { color: string };

const OTHERS_ID = "__outros";
const sum = (xs: { value: number }[]) => xs.reduce((s, x) => s + x.value, 0);

/** Até 6 categorias com cor própria; acima disso, as 5 primeiras e "Outros" em chart-6. */
function groupSegments(segments: CapacitySegment[], othersLabel: string): ShownSegment[] {
  const list: CapacitySegment[] =
    segments.length > 6 ? [...segments.slice(0, 5), { id: OTHERS_ID, label: othersLabel, value: sum(segments.slice(5)), color: chartColor(5) }] : segments;
  return list.map((s, i) => ({ ...s, color: s.color ?? chartColor(i) }));
}

/** Corta os valores até a fração varrida (a varredura enche da esquerda para a direita). */
function revealSegments<T extends { value: number }>(segments: T[], scanned?: number): T[] {
  if (scanned == null || scanned >= 1) return segments;
  let budget = sum(segments) * Math.max(0, scanned);
  return segments.map((s) => {
    const value = Math.max(0, Math.min(s.value, budget));
    budget -= s.value;
    return { ...s, value };
  });
}

const share = (value: number, total: number) => (total > 0 ? value / total : 0);

/** Valor que desliza até o novo número (o total desce quando algo é limpo). */
function useTweenedValue(value: number, instant: boolean, duration = 700) {
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  current.current = shown;
  useEffect(() => {
    if (instant) {
      setShown(value);
      return;
    }
    const from = current.current;
    if (from === value) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setShown(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, instant, duration]);
  return shown;
}

/* ------------------------------------------------------------------ */
/* Textura                                                             */
/* ------------------------------------------------------------------ */

function DotTexture({ id, color, opacity }: { id: string; color: string; opacity: number }) {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-200 motion-reduce:transition-none" style={{ opacity }}>
      <defs>
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect x="2" y="2" width="2" height="2" rx="0.5" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* CapacityBar                                                         */
/* ------------------------------------------------------------------ */

/**
 * Barra de capacidade segmentada: cada categoria ocupa a fração da cota
 * (`total`), o resto é espaço livre em gelo. Segmentos focáveis (setas,
 * Home/End), hover/foco acende o segmento e esmaece os outros; ligue à
 * legenda com o mesmo `highlight` (`useLinkedHighlight`). Até 6 cores.
 */
export function CapacityBar({
  segments,
  total,
  label,
  scanned,
  highlight: highlightProp,
  clearing,
  height = 48,
  texture = true,
  tooltip = true,
  format = formatStorage,
  othersLabel = "Outros",
  className,
}: {
  segments: CapacitySegment[];
  /** Tamanho da cota (100 % da barra). */
  total: number;
  /** Nome acessível da barra ("Uso do armazenamento"). Obrigatório. */
  label: string;
  /** 0–1: fração já varrida. A barra enche até ali, com a frente de varredura. Omita quando terminou. */
  scanned?: number;
  /** Realce compartilhado com a legenda (`useLinkedHighlight<string>()`). */
  highlight?: LinkedHighlight<string>;
  /** Id da categoria sendo limpa agora: o segmento esmaece até encolher. */
  clearing?: string | null;
  /** Altura em px. */
  height?: number;
  /** Textura de pontos sutil sobre cada segmento. */
  texture?: boolean;
  /** Etiqueta com nome, tamanho e % sobre o segmento em foco. */
  tooltip?: boolean;
  format?: (n: number) => string;
  /** Nome do grupo que junta as categorias além da 6ª. */
  othersLabel?: string;
  className?: string;
}) {
  const own = useLinkedHighlight<string>();
  const hl = highlightProp ?? own;
  const reduced = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const grouped = groupSegments(segments, othersLabel);
  const shown = revealSegments(grouped, scanned);
  const scanning = scanned != null && scanned < 1;
  const used = sum(shown);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const focusable = shown.map((s, i) => (s.value > 0 ? i : -1)).filter((i) => i >= 0);
  const tabStop = focusable.includes(focusIndex) ? focusIndex : (focusable[0] ?? -1);

  const move = (e: KeyboardEvent<HTMLDivElement>, i: number) => {
    const at = focusable.indexOf(i);
    let next: number | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = focusable[Math.min(focusable.length - 1, at + 1)];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = focusable[Math.max(0, at - 1)];
    else if (e.key === "Home") next = focusable[0];
    else if (e.key === "End") next = focusable[focusable.length - 1];
    if (next == null) return false;
    e.preventDefault();
    setFocusIndex(next);
    refs.current[next]?.focus();
    return true;
  };

  const ease = reduced || scanning ? undefined : "width 520ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease";
  let start = 0;
  const geometry = shown.map((s) => {
    const left = share(start, total) * 100;
    start += s.value;
    return { left, width: share(s.value, total) * 100 };
  });
  const activeIndex = shown.findIndex((s) => s.id === hl.active);
  const active = activeIndex >= 0 ? shown[activeIndex] : null;

  return (
    <div className={cn("relative flex min-w-0 flex-col", className)}>
      <div role="group" aria-label={label} className="relative flex overflow-hidden rounded-lg border border-line bg-soft" style={{ height }}>
        {texture && <DotTexture id={`${uid}-free`} color="var(--color-line-strong)" opacity={0.4} />}
        {shown.map((s, i) => {
          const isActive = hl.active === s.id;
          const dimmed = hl.isDimmed(s.id);
          const isClearing = clearing === s.id;
          const bind = hl.bind(s.id);
          const width = geometry[i].width;
          const style = {
            "--seg": s.color,
            width: `${width}%`,
            minWidth: s.value > 0 ? 3 : 0,
            transition: ease,
            opacity: isClearing ? 0.4 : dimmed ? 0.38 : 1,
            boxShadow: s.value > 0 ? "inset 0 0 0 1px color-mix(in oklab, var(--seg) 62%, transparent)" : undefined,
            background: `color-mix(in oklab, var(--seg) ${isActive ? 55 : 30}%, transparent)`,
          } as CSSProperties;
          return (
            <div
              key={s.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="button"
              tabIndex={i === tabStop ? 0 : -1}
              aria-label={`${s.label}: ${format(s.value)}, ${formatPercent(share(s.value, total), 0)} do total`}
              aria-pressed={hl.pinned === s.id}
              aria-hidden={s.value <= 0 || undefined}
              className={cn(
                "relative h-full shrink-0 cursor-pointer overflow-hidden outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink",
                isClearing && "motion-safe:animate-pulse",
              )}
              style={style}
              onMouseEnter={bind.onMouseEnter}
              onMouseLeave={bind.onMouseLeave}
              onFocus={() => {
                setFocusIndex(i);
                bind.onFocus();
              }}
              onBlur={bind.onBlur}
              onClick={bind.onClick}
              onKeyDown={(e) => {
                if (!move(e, i)) bind.onKeyDown(e);
              }}
            >
              {texture && <DotTexture id={`${uid}-${i}`} color={s.color} opacity={isActive ? 0.95 : isClearing ? 0.25 : 0.6} />}
            </div>
          );
        })}
        {scanning && used > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-12 -translate-x-full"
            style={{
              left: `${share(used, total) * 100}%`,
              background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-ink) 22%, transparent))",
              boxShadow: "inset -2px 0 0 color-mix(in oklab, var(--color-ink) 70%, transparent)",
            }}
          />
        )}
      </div>
      {tooltip && active && active.value > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[12px] leading-snug text-on-ink shadow-raised"
          style={{ left: `${Math.min(88, Math.max(12, geometry[activeIndex].left + geometry[activeIndex].width / 2))}%` }}
        >
          {active.label} · <span className="tabular-nums">{format(active.value)}</span> · <span className="tabular-nums">{formatPercent(share(active.value, total), 0)}</span>
        </span>
      )}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Categoria</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Do total</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((s) => (
            <tr key={s.id}>
              <th scope="row">{s.label}</th>
              <td>{format(s.value)}</td>
              <td>{formatPercent(share(s.value, total), 0)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Livre</th>
            <td>{format(Math.max(0, total - used))}</td>
            <td>{formatPercent(share(Math.max(0, total - used), total), 0)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CapacityLegend                                                      */
/* ------------------------------------------------------------------ */

/**
 * Legenda da barra em grade (3 → 2 → 1 colunas pela largura do contêiner):
 * ícone ou amostra de cor + categoria + tamanho. Passe o mesmo `highlight`
 * da `CapacityBar`: hover/foco aqui acende o segmento lá.
 */
export function CapacityLegend({
  segments,
  highlight: highlightProp,
  format = formatStorage,
  othersLabel = "Outros",
  className,
}: {
  segments: CapacitySegment[];
  highlight?: LinkedHighlight<string>;
  format?: (n: number) => string;
  othersLabel?: string;
  className?: string;
}) {
  const own = useLinkedHighlight<string>();
  const hl = highlightProp ?? own;
  const shown = groupSegments(segments, othersLabel);
  return (
    <div className={cn("@container min-w-0", className)}>
      <ul className="m-0 grid list-none grid-cols-1 gap-x-3 gap-y-0.5 p-0 @md:grid-cols-2 @2xl:grid-cols-3">
        {shown.map((s) => {
          const isActive = hl.active === s.id;
          const dimmed = hl.isDimmed(s.id);
          const bind = hl.bind(s.id);
          return (
            <li key={s.id} className="min-w-0">
              <button
                type="button"
                aria-pressed={hl.pinned === s.id}
                onMouseEnter={bind.onMouseEnter}
                onMouseLeave={bind.onMouseLeave}
                onFocus={bind.onFocus}
                onBlur={bind.onBlur}
                onClick={bind.onClick}
                onKeyDown={bind.onKeyDown}
                className={cn(
                  "flex w-full min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 motion-reduce:transition-none",
                  isActive ? "bg-soft text-ink" : dimmed ? "text-muted hover:bg-soft" : "text-ink-soft hover:bg-soft",
                )}
              >
                <span
                  aria-hidden
                  className={cn("flex h-4 w-4 shrink-0 items-center justify-center transition-opacity [&_svg]:h-4 [&_svg]:w-4", dimmed ? "opacity-45" : "opacity-100")}
                  style={{ color: s.color }}
                >
                  {s.icon ?? <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                <span className={cn("shrink-0 tabular-nums", isActive ? "text-ink-soft" : "text-muted")}>{format(s.value)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CapacityBreakdown                                                   */
/* ------------------------------------------------------------------ */

/** Recomendação de limpeza: frase com o tamanho, verbo + objeto no botão. */
export type CapacitySuggestion = {
  id: string;
  /** `warn` para o que pede atenção (cota quase cheia); padrão `info`. */
  tone?: "info" | "warn";
  /** A frase com o porquê ("A lixeira guarda 41,2 GB…"). */
  text: ReactNode;
  /** Verbo + objeto ("Esvaziar lixeira"). */
  actionLabel: string;
  /** Texto do botão enquanto executa. Padrão "Liberando…". */
  busyLabel?: string;
  /** Categoria afetada: usa o ícone dela e esmaece o segmento enquanto executa. */
  category?: string;
  /** Faz a limpeza e devolve quanto liberou. Rejeite com Error para mostrar o erro com "Tentar novamente". */
  onAction: () => Promise<{ freed: number }>;
  /** Irreversível: passa por ConfirmDialog (tom danger). */
  destructive?: boolean;
  /** Textos do ConfirmDialog. Padrão: título = `${actionLabel}?`. */
  confirm?: { title?: string; description?: ReactNode; confirmLabel?: string };
  /** Reversível: o toast oferece "Desfazer" e chama isto. */
  undo?: () => void;
  /** Toast ao terminar (particípio + objeto). Sem ele e sem `undo`, só a linha de status informa. */
  doneMessage?: string;
};

const DEFAULT_SCAN_PATHS = ["Documentos", "Imagens", "Gravações", "Anexos", "Versões", "Lixeira"];

/**
 * Cartão de capacidade completo: total usado (desce animado quando algo é
 * limpo), linha de status (caminho em varredura, categoria em foco ou o
 * resultado da limpeza), barra, legenda e uma recomendação por vez com a
 * ação. Destrutiva passa por ConfirmDialog; erro vira OperationFeedback.
 * `simulateScan` anima uma varredura de demonstração ao montar e em
 * "Varrer de novo"; no app, controle por `scanning` + `scanProgress` + `scanPath`.
 */
export function CapacityBreakdown({
  segments,
  total,
  label = "Uso do armazenamento",
  usedLabel,
  suggestions = [],
  doneLabel = "Nada mais vale a pena limpar agora.",
  scanning = false,
  scanProgress,
  scanPath,
  onRescan,
  simulateScan,
  format = formatStorage,
  barHeight = 64,
  className,
}: {
  segments: CapacitySegment[];
  total: number;
  /** Nome acessível da barra. */
  label?: string;
  /** Texto depois do total. Padrão: `de ${format(total)} usados`. */
  usedLabel?: string;
  /** Recomendações em ordem; uma aparece por vez e some depois de feita. */
  suggestions?: CapacitySuggestion[];
  /** Quando não sobra recomendação. */
  doneLabel?: string;
  /** Varredura em andamento (controlado). */
  scanning?: boolean;
  /** 0–1 durante a varredura (controlado). */
  scanProgress?: number;
  /** Onde a varredura está agora ("Drive › Comercial › Propostas 2026"). */
  scanPath?: ReactNode;
  /** Mostra "Varrer de novo". Com `simulateScan`, é chamado ao reiniciar. */
  onRescan?: () => void;
  /** Demonstração: anima uma varredura ao montar e ao varrer de novo. `true` ou `{ duration, paths }`. */
  simulateScan?: boolean | { duration?: number; paths?: string[] };
  format?: (n: number) => string;
  /** Altura da barra em px. */
  barHeight?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const hl = useLinkedHighlight<string>();
  const op = useOperation({ busyLabel: "Liberando…" });
  const sim = simulateScan ? (typeof simulateScan === "object" ? simulateScan : {}) : null;
  const simDuration = sim?.duration ?? 2600;
  const paths = sim?.paths ?? DEFAULT_SCAN_PATHS;
  const [simRun, setSimRun] = useState(0);
  const [simProgress, setSimProgress] = useState(sim ? 0 : 1);
  const [done, setDone] = useState<string[]>([]);
  const [clearing, setClearing] = useState<string | null>(null);
  const [result, setResult] = useState<{ freed: number } | null>(null);
  const [confirming, setConfirming] = useState<CapacitySuggestion | null>(null);
  const hasSim = Boolean(sim);

  useEffect(() => {
    if (!hasSim) return;
    if (reduced) {
      setSimProgress(1);
      return;
    }
    setSimProgress(0);
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / simDuration);
      setSimProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasSim, simRun, simDuration, reduced]);

  const progress = hasSim ? simProgress : scanning ? Math.min(1, Math.max(0, scanProgress ?? 0)) : 1;
  const isScanning = progress < 1;
  const grouped = groupSegments(segments, "Outros");
  const revealed = revealSegments(grouped, progress);
  const used = sum(revealed);
  const usedFinal = sum(grouped);
  const shownUsed = useTweenedValue(used, reduced || isScanning);
  const free = Math.max(0, total - usedFinal);
  const current = isScanning ? undefined : suggestions.find((s) => !done.includes(s.id));
  const focused = !isScanning && hl.active ? grouped.find((s) => s.id === hl.active) : undefined;
  const path = scanPath ?? (hasSim ? paths[Math.min(paths.length - 1, Math.floor(progress * paths.length))] : undefined);

  const rescan = () => {
    setDone([]);
    setResult(null);
    op.reset();
    if (hasSim) setSimRun((n) => n + 1);
    onRescan?.();
  };

  const execute = (s: CapacitySuggestion) =>
    void op.run(async () => {
      setClearing(s.category ?? s.id);
      setResult(null);
      try {
        const { freed } = await s.onAction();
        setDone((d) => [...d, s.id]);
        setResult({ freed });
        if (s.undo || s.doneMessage) {
          const undo = s.undo;
          notify(
            s.doneMessage ?? `${format(freed)} liberados`,
            undo
              ? () => {
                  undo();
                  setDone((d) => d.filter((id) => id !== s.id));
                  setResult(null);
                }
              : undefined,
          );
        }
      } finally {
        setClearing(null);
      }
    });

  const act = (s: CapacitySuggestion) => (s.destructive ? setConfirming(s) : execute(s));
  const currentSegment = current?.category ? grouped.find((g) => g.id === current.category) : undefined;
  const clearingSuggestion = clearing ? suggestions.find((s) => (s.category ?? s.id) === clearing) : undefined;

  let status: ReactNode;
  if (isScanning) {
    status = (
      <>
        <span className="font-medium text-ink-soft">Calculando</span>
        {path && <span className="min-w-0 truncate font-mono text-[12px] text-muted">{path}</span>}
      </>
    );
  } else if (focused) {
    status = (
      <>
        <span aria-hidden className="flex h-4 w-4 shrink-0 items-center justify-center self-center [&_svg]:h-4 [&_svg]:w-4" style={{ color: focused.color }}>
          {focused.icon ?? <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: focused.color }} />}
        </span>
        <span className="font-medium text-ink">{focused.label}</span>
        <span className="tabular-nums text-muted">{format(focused.value)}</span>
        {focused.description && <span className="min-w-0 basis-full text-muted sm:basis-auto">{focused.description}</span>}
      </>
    );
  } else if (clearingSuggestion) {
    status = (
      <>
        <LoaderCircle aria-hidden className="h-4 w-4 shrink-0 self-center text-muted motion-safe:animate-spin" />
        <span className="font-medium text-ink-soft">{clearingSuggestion.busyLabel ?? "Liberando espaço"}</span>
      </>
    );
  } else if (result) {
    status = (
      <>
        <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 self-center text-ok" />
        <span className="font-medium text-ink">Liberados {format(result.freed)}</span>
        <span className="tabular-nums text-muted">· {format(free)} disponíveis</span>
      </>
    );
  } else {
    status = <span className="tabular-nums text-muted">{format(free)} disponíveis</span>;
  }

  const announce = isScanning
    ? "Calculando o uso do armazenamento"
    : clearing
      ? "Liberando espaço"
      : result
        ? `Liberados ${format(result.freed)}. ${format(free)} disponíveis.`
        : `${format(usedFinal)} de ${format(total)} usados.`;

  return (
    <section aria-label={label} className={cn("flex min-w-0 flex-col rounded-xl border border-line bg-surface", className)}>
      <div className="flex flex-col gap-4 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="m-0 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[24px] font-semibold tracking-tight tabular-nums text-ink">{format(shownUsed)}</span>
              <span className="text-[13.5px] text-muted">{usedLabel ?? `de ${format(total)} usados`}</span>
            </p>
            <p className="m-0 flex min-h-5 min-w-0 flex-wrap items-baseline gap-x-2 text-[13px] leading-5">{status}</p>
          </div>
          {(onRescan || hasSim) && (
            <Button size="sm" variant="quiet" className="shrink-0" onClick={rescan} disabled={isScanning || Boolean(clearing)} disabledReason={isScanning ? "Varredura em andamento" : "Aguarde a limpeza terminar"}>
              <RotateCw aria-hidden className={cn(isScanning && "motion-safe:animate-spin")} /> Varrer de novo
            </Button>
          )}
        </div>
        <CapacityBar segments={grouped} total={total} label={label} scanned={isScanning ? progress : undefined} highlight={hl} clearing={clearing} height={barHeight} tooltip={false} format={format} />
        <CapacityLegend segments={revealed} highlight={hl} format={format} />
      </div>
      <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:px-5">
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {isScanning ? (
            <p className="m-0 flex items-center gap-2 text-[13px] text-muted">
              <LoaderCircle aria-hidden className="h-4 w-4 shrink-0 motion-safe:animate-spin" /> Procurando o que dá para liberar
            </p>
          ) : current ? (
            <>
              <p className="m-0 flex min-w-0 flex-[1_1_16rem] items-start gap-2 text-[13px] leading-5 text-ink-soft">
                <span aria-hidden className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4" style={{ color: current.tone === "warn" ? "var(--color-amber)" : (currentSegment?.color ?? "var(--color-muted)") }}>
                  {current.tone === "warn" ? <AlertTriangle /> : (currentSegment?.icon ?? <Info />)}
                </span>
                <span className="min-w-0">{current.text}</span>
              </p>
              <OperationButton operation={op} busyLabel={current.busyLabel} size="sm" variant="ghost" onClick={() => act(current)}>
                {current.actionLabel}
              </OperationButton>
            </>
          ) : (
            <p className="m-0 flex items-center gap-2 text-[13px] text-ink-soft">
              <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-ok" /> {doneLabel}
            </p>
          )}
        </div>
        <OperationFeedback operation={op} inline />
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        tone="danger"
        title={confirming?.confirm?.title ?? `${confirming?.actionLabel ?? ""}?`}
        description={confirming?.confirm?.description}
        confirmLabel={confirming?.confirm?.confirmLabel ?? confirming?.actionLabel ?? "Confirmar"}
        onConfirm={() => {
          if (confirming) execute(confirming);
        }}
      />
    </section>
  );
}
