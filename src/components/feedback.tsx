"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Button, type ButtonVariant } from "./primitives";

/*
 * Feedback. Regras (docs/padroes/feedback.md):
 *  - Toast só depois que a ação TERMINOU (nunca no clique/submit).
 *  - Mensagem = verbo no passado + objeto: "Ciclo 02 arquivado".
 *  - "Desfazer" só quando existe operação inversa segura.
 *  - Enquanto confirma, quem informa é o botão ("Salvando…"), não um spinner solto.
 *  - Erro vira bloco com saída: "Tentar novamente" (recusa) ou
 *    "Verificar alteração" (resposta incerta).
 */

type Notice = { id: number; message: string; undo?: () => void; tone?: "ok" | "info" | "bad"; action?: NotifyAction };

/** Ação do toast que leva ao resultado ("Ver título", "Abrir pedido"). Verbo + objeto. */
export type NotifyAction = { label: string; onClick: () => void };
export type NotifyOptions = { undo?: () => void; action?: NotifyAction; tone?: Notice["tone"] };
const EVENT = "g4os-ds:feedback";
let seq = 0;

/**
 * Dispara um toast de qualquer lugar (não precisa de contexto React).
 * `notify("Pedido salvo")`, `notify("Ciclo arquivado", desfazer)` ou, com
 * opções, `notify("Pedido confirmado", { action: { label: "Ver título", onClick } })`.
 * Uma ação por toast: "Desfazer" (undo) vem antes da ação, se houver as duas.
 */
export function notify(message: string, undoOrOptions?: (() => void) | NotifyOptions, tone: Notice["tone"] = "ok") {
  if (typeof window === "undefined") return;
  const opts: NotifyOptions = typeof undoOrOptions === "function" ? { undo: undoOrOptions } : (undoOrOptions ?? {});
  window.dispatchEvent(new CustomEvent<Notice>(EVENT, { detail: { id: ++seq, message, undo: opts.undo, action: opts.action, tone: opts.tone ?? tone } }));
}

/** Monte uma vez perto da raiz (AppShell já monta). Um toast por vez, 6,5 s, pausa no hover/foco. */
export function Toaster({ duration = 6500 }: { duration?: number }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pause = () => clearTimeout(timer.current);
  const resume = () => {
    pause();
    timer.current = setTimeout(() => setNotice(null), duration);
  };
  useEffect(() => {
    const show = (event: Event) => {
      clearTimeout(timer.current);
      setNotice((event as CustomEvent<Notice>).detail);
      timer.current = setTimeout(() => setNotice(null), duration);
    };
    window.addEventListener(EVENT, show);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener(EVENT, show);
    };
  }, [duration]);
  const Icon = notice?.tone === "bad" ? XCircle : notice?.tone === "info" ? Info : CheckCircle2;
  return (
    <div className="feedback-host" aria-live="polite" aria-atomic="true">
      {notice && (
        <div className="feedback-toast" key={notice.id} onMouseEnter={pause} onMouseLeave={resume} onFocus={pause} onBlur={resume}>
          <Icon className={cn("h-4 w-4 shrink-0", notice.tone === "bad" ? "text-rose" : "text-blue")} aria-hidden />
          <span className="min-w-0 flex-1">{notice.message}</span>
          {notice.undo && (
            <button
              type="button"
              className="font-medium text-blue"
              onClick={() => {
                notice.undo?.();
                setNotice(null);
              }}
            >
              Desfazer
            </button>
          )}
          {notice.action && (
            <button
              type="button"
              className="whitespace-nowrap font-medium text-blue"
              onClick={() => {
                notice.action?.onClick();
                setNotice(null);
              }}
            >
              {notice.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Dispensar confirmação"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-soft"
            onClick={() => setNotice(null)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Aviso fixo dentro da página (não some). Para estado persistente, não para confirmação. */
export function Callout({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: "info" | "warn" | "bad" | "ok";
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const map = {
    info: { cls: "border-line bg-soft/60", icon: <Info className="h-4 w-4 text-blue" /> },
    ok: { cls: "border-ok/20 bg-ok-soft/60", icon: <CheckCircle2 className="h-4 w-4 text-ok" /> },
    warn: { cls: "border-amber/20 bg-amber-soft/40", icon: <AlertTriangle className="h-4 w-4 text-amber" /> },
    bad: { cls: "border-rose/20 bg-rose-soft/40", icon: <XCircle className="h-4 w-4 text-rose" /> },
  }[tone];
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", map.cls)}>
      <span className="mt-0.5 shrink-0" aria-hidden>
        {map.icon}
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-relaxed">
        {title && <p className="m-0 font-medium text-ink">{title}</p>}
        {children && <div className={cn("text-ink-soft", title && "mt-0.5")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Operação confirmada                                                 */
/* ------------------------------------------------------------------ */

/** Falha em que não se sabe se o servidor gravou (rede caiu, timeout). */
export class UncertainFailure extends Error {}

export type OperationSuccess = { message: string; undo?: () => void; /** Leva ao resultado ("Ver título"). */ action?: NotifyAction };

/**
 * Um gesto que espera confirmação, com a mesma forma em todo o produto.
 * Versão genérica (sem transporte): você passa a Promise.
 *
 *   const op = useOperation({ busyLabel: "Arquivando…" });
 *   <OperationButton operation={op} onClick={() =>
 *     op.run(() => api.archive(id), { message: "Ciclo arquivado", undo: () => api.restore(id) })
 *   }>Arquivar</OperationButton>
 *   <OperationFeedback operation={op} />
 *
 * `optimistic` aplica a mudança local antes e a reverte na falha.
 */
export function useOperation(options: { busyLabel?: string; fallback?: string } = {}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const last = useRef<null | (() => Promise<void>)>(null);
  const lock = useRef(false);
  const fallback = options.fallback ?? "Não foi possível confirmar a alteração.";

  async function execute(): Promise<string> {
    if (lock.current || !last.current) return "";
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await last.current();
      last.current = null;
      setUncertain(false);
      return "";
    } catch (failure) {
      const message = failure instanceof Error && failure.message ? failure.message : fallback;
      setUncertain(failure instanceof UncertainFailure);
      setError(message);
      return message;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function run(
    task: () => Promise<unknown>,
    success?: OperationSuccess | string,
    optimistic?: { apply: () => void; revert: () => void },
  ) {
    if (lock.current) return Promise.resolve("Aguarde a confirmação em andamento.");
    optimistic?.apply();
    last.current = async () => {
      try {
        await task();
      } catch (e) {
        optimistic?.revert();
        throw e;
      }
      const s = typeof success === "string" ? { message: success } : success;
      if (s) notify(s.message, { undo: s.undo, action: s.action });
    };
    return execute();
  }
  function reset() {
    if (lock.current) return;
    last.current = null;
    setError("");
    setUncertain(false);
  }
  return {
    busy,
    error,
    uncertain,
    pending: Boolean(error),
    busyLabel: options.busyLabel ?? "Salvando…",
    run,
    retry: execute,
    reset,
    setError,
  };
}
export type Operation = ReturnType<typeof useOperation>;

/** Bloco de erro com a saída certa. Nada aparece enquanto confirma ou depois do sucesso. */
export function OperationFeedback({
  operation,
  inline,
  className,
}: {
  operation: Pick<Operation, "busy" | "error" | "uncertain" | "retry" | "reset">;
  inline?: boolean;
  className?: string;
}) {
  if (!operation.error) return null;
  if (inline)
    return (
      <div role="alert" className={className ?? "mb-3 flex flex-wrap items-center gap-3 text-[13px] text-rose"}>
        {operation.error}
        <Button size="sm" disabled={operation.busy} onClick={() => void operation.retry()}>
          {operation.uncertain ? "Verificar alteração" : "Tentar novamente"}
        </Button>
      </div>
    );
  return (
    <div role="alert" className={className ?? "my-3 rounded-lg border border-line p-3 text-[13.5px]"}>
      <p className="m-0 text-rose">{operation.error}</p>
      {!operation.busy && (
        <div className="mt-2 flex flex-wrap gap-2">
          {operation.uncertain ? (
            <>
              <Button size="sm" onClick={() => void operation.retry()}>
                Verificar alteração
              </Button>
              <Button size="sm" variant="ghost" onClick={operation.reset}>
                Revisar alteração
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => void operation.retry()}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Botão que conta o progresso ("Salvando…") e se desabilita enquanto confirma ou após falha. */
export function OperationButton({
  operation,
  busyLabel,
  disabled,
  disabledReason,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  operation: Pick<Operation, "busy" | "pending" | "busyLabel">;
  busyLabel?: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  /** Por que está desabilitado (tooltip + leitor de tela), igual a Button. Não vale enquanto a operação roda. */
  disabledReason?: ReactNode;
}) {
  const running = operation.busy || operation.pending;
  return (
    <Button {...rest} disabled={disabled || running} disabledReason={disabled && !running ? disabledReason : undefined} aria-busy={operation.busy || undefined}>
      {operation.busy ? (busyLabel ?? operation.busyLabel) : children}
    </Button>
  );
}

/** Esqueleto de carregamento: blocos gelo com pulso suave. Mesma forma do conteúdo final. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-pulse rounded-md bg-soft", className)} />;
}

/** `true` depois de `ms`: atrasa o que só deve aparecer se a espera for longa (esqueleto, "Carregando…"). */
export function useDelayed(ms = 180) {
  const [shown, setShown] = useState(ms <= 0);
  useEffect(() => {
    if (ms <= 0) return;
    const timer = setTimeout(() => setShown(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return shown;
}

const rowWidths = ["w-2/5", "w-1/3", "w-1/2", "w-1/4", "w-2/5", "w-1/3"];

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className={cn("h-3.5", rowWidths[i % rowWidths.length])} />
            <Skeleton className="h-3 w-3/5 max-w-[320px]" />
          </div>
          <Skeleton className="h-3.5 w-14 shrink-0" />
        </div>
      ))}
    </>
  );
}
const skeletonList = "divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface";

/**
 * Linhas de uma lista enquanto ela abre: marca, duas linhas de texto e um valor à direita, dentro
 * da mesma moldura da lista final. Aparece só depois de `delay` ms.
 */
export function ListSkeleton({ label, rows = 4, delay = 180, className }: { /** Dito a leitores de tela: "Abrindo os membros". */ label: string; rows?: number; delay?: number; className?: string }) {
  const shown = useDelayed(delay);
  return (
    <div role="status" aria-label={label} data-shown={shown || undefined} className={cn("skeleton-delayed", skeletonList, className)}>
      <SkeletonRows rows={rows} />
    </div>
  );
}

/**
 * A página enquanto abre, na forma da anatomia que ela vai ter: cabeçalho, abas e o corpo certo
 * (linhas de lista, cartões de indicador e gráfico, registro com coluna de propriedades, seções de
 * configuração). Fica no lugar de "Carregando…" no canto. Aparece só depois de `delay` ms, então
 * uma página que abre da memória nunca pisca o esqueleto. Renderize dentro de `Page`.
 */
export function PageSkeleton({
  label,
  anatomy = "list",
  tabs = 0,
  rows = 5,
  delay = 180,
  className,
}: {
  /** Dito a leitores de tela: "Abrindo o time". */
  label: string;
  /** Forma do corpo: `list` (toolbar + linhas), `dashboard` (indicadores + gráfico), `record` (corpo + coluna de propriedades), `settings` (seções rótulo/campos). */
  anatomy?: "list" | "dashboard" | "record" | "settings";
  /** Quantas abas o cabeçalho tem (0 = sem abas). */
  tabs?: number;
  rows?: number;
  delay?: number;
  className?: string;
}) {
  const shown = useDelayed(delay);
  const record = anatomy === "record";
  return (
    <div role="status" aria-label={label} data-shown={shown || undefined} className={cn("skeleton-delayed", className)}>
      <div className="flex items-start gap-4">
        {record && <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />}
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-6 w-56 max-w-[60%]" />
          <Skeleton className="h-3.5 w-96 max-w-[85%]" />
        </div>
        <Skeleton className="hidden h-10 w-32 shrink-0 rounded-lg sm:block" />
      </div>
      {tabs > 0 && (
        <div className="mt-6 flex gap-5 border-b border-line pb-3">
          {Array.from({ length: tabs }, (_, i) => (
            <Skeleton key={i} className={cn("h-3.5", i % 2 ? "w-20" : "w-14")} />
          ))}
        </div>
      )}
      <div className="mt-6">
        {anatomy === "list" && (
          <>
            <div className="mb-4 flex gap-2">
              <Skeleton className="h-9 w-64 max-w-[60%] rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            <div className={skeletonList}>
              <SkeletonRows rows={rows} />
            </div>
          </>
        )}
        {anatomy === "dashboard" && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-line bg-surface p-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-4 rounded-xl border border-line bg-surface p-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-56 w-full rounded-lg" />
            </div>
          </>
        )}
        {record && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-6">
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className={skeletonList}>
                <SkeletonRows rows={Math.max(2, rows - 2)} />
              </div>
            </div>
            <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className={cn("h-3", i % 2 ? "w-24" : "w-32")} />
                </div>
              ))}
            </div>
          </div>
        )}
        {anatomy === "settings" && (
          <div className="divide-y divide-line">
            {Array.from({ length: Math.min(4, rows) }, (_, i) => (
              <div key={i} className="grid gap-4 py-6 first:pt-0 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="max-w-[560px] space-y-3">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  {i % 2 === 0 && <Skeleton className="h-10 w-2/3 rounded-lg" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
