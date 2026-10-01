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

type Notice = { id: number; message: string; undo?: () => void; tone?: "ok" | "info" | "bad" };
const EVENT = "g4os-ds:feedback";
let seq = 0;

/** Dispara um toast de qualquer lugar (não precisa de contexto React). */
export function notify(message: string, undo?: () => void, tone: Notice["tone"] = "ok") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Notice>(EVENT, { detail: { id: ++seq, message, undo, tone } }));
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

export type OperationSuccess = { message: string; undo?: () => void };

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
      if (s) notify(s.message, s.undo);
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
