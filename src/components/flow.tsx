"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { ArrowRight, Bell, Check, CheckCheck, ChevronDown, Pause, Play, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "../lib/cn";
import { popupClass } from "./overlays";
import { Button, Dot, DsLink, Meter, type Tone } from "./primitives";
import { Tooltip } from "./overlays-extra";
import { Stepper, type Step } from "./status";

/*
 * Fluxos de trabalho que todo app de gestão repete:
 *   SaveBar ............ alterações não salvas (Salvar / Descartar, ⌘S, aviso ao sair)
 *   FormWizard ......... formulário em etapas com validação por etapa
 *   Tour / useTour ..... tour guiado ancorado a elementos reais (onboarding de recurso)
 *   NotificationCenter . sino com caixa de notificações (não lidas, marcar todas)
 *   Announcement ....... pílula "Novo · …" para novidades e changelog
 *   AudioPlayer ........ gravação de ligação, entrevista ou mensagem de voz
 *   InlineSelect ....... status/etapa/papel como selo que abre menu (célula de tabela, card)
 */

/* ------------------------------------------------------------------ */
/* SaveBar                                                             */
/* ------------------------------------------------------------------ */

/**
 * Barra flutuante de alterações não salvas, colada ao rodapé da área que
 * rola. Fica inerte (fora do Tab e dos leitores de tela) enquanto não há
 * alteração. ⌘S/Ctrl+S salva; `warnOnLeave` pede confirmação do navegador
 * ao fechar a aba com alterações. Use em configurações e formulários longos
 * editados no lugar; em Drawer/Modal o rodapé do próprio diálogo resolve.
 */
export function SaveBar({
  dirty,
  onSave,
  onDiscard,
  saving = false,
  error,
  saveDisabledReason,
  message = "Alterações não salvas",
  saveLabel = "Salvar alterações",
  discardLabel = "Descartar",
  shortcut = true,
  warnOnLeave = true,
  className,
}: {
  dirty: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  saving?: boolean;
  /** Erro do último salvamento: a barra continua aberta e mostra o motivo. */
  error?: ReactNode;
  /** Bloqueia Salvar explicando o motivo (validação pendente). */
  saveDisabledReason?: string;
  message?: ReactNode;
  saveLabel?: string;
  discardLabel?: string;
  /** ⌘S / Ctrl+S salva enquanto houver alteração. */
  shortcut?: boolean;
  /** Aviso do navegador ao fechar/recarregar com alterações. */
  warnOnLeave?: boolean;
  className?: string;
}) {
  const open = dirty || Boolean(error);
  useEffect(() => {
    if (!shortcut || !dirty) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving && !saveDisabledReason) onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut, dirty, saving, saveDisabledReason, onSave]);
  useEffect(() => {
    if (!warnOnLeave || !dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [warnOnLeave, dirty]);
  return (
    <div
      role="region"
      aria-label="Alterações não salvas"
      inert={!open}
      className={cn(
        "pointer-events-none sticky bottom-4 z-30 mt-6 flex justify-center px-0 transition-[opacity,transform] duration-150 motion-reduce:transition-none",
        open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className,
      )}
    >
      <div className="pointer-events-auto flex w-full max-w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-popover py-2 pl-4 pr-2 shadow-toast sm:w-auto">
        <div className="min-w-0 flex-1 sm:flex-none" aria-live="polite">
          <span className="block text-[13px] font-medium">{message}</span>
          {error && <span className="block text-[12px] text-rose">{error}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {onDiscard && (
            <Button size="sm" variant="ghost" onClick={onDiscard} disabled={saving}>
              {discardLabel}
            </Button>
          )}
          <Button size="sm" onClick={onSave} disabled={saving || !dirty || Boolean(saveDisabledReason)} disabledReason={saveDisabledReason}>
            {saving ? "Salvando…" : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FormWizard                                                          */
/* ------------------------------------------------------------------ */

export type WizardStep = {
  id: string;
  label: string;
  hint?: string;
  content: ReactNode;
  /**
   * Valida antes de avançar. Devolva uma mensagem (ou lista) para bloquear;
   * null/undefined/"" deixa seguir. Pode ser assíncrona (consulta ao servidor).
   */
  validate?: () => string | string[] | null | undefined | Promise<string | string[] | null | undefined>;
  /** Etapa que pode ser pulada ("Pular por enquanto"). */
  optional?: boolean;
};

/**
 * Formulário em etapas: cadastro de vaga, pedido de compra, onboarding de
 * cliente. Etapas no topo (≥ 640 px) ou "Etapa 2 de 4" com barra no celular;
 * cada etapa valida antes de avançar e o erro aparece no topo da etapa, sem
 * perder o que foi digitado (os dados ficam no estado do app). Voltar nunca
 * valida. O foco vai para o título da etapa a cada troca.
 */
export function FormWizard({
  steps,
  onSubmit,
  submitLabel = "Concluir",
  onCancel,
  step: stepProp,
  onStepChange,
  title,
  className,
}: {
  steps: WizardStep[];
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
  /** Índice controlado (opcional). */
  step?: number;
  onStepChange?: (index: number) => void;
  /** Título do fluxo, acima das etapas. */
  title?: ReactNode;
  className?: string;
}) {
  const [inner, setInner] = useState(0);
  const index = Math.min(stepProp ?? inner, steps.length - 1);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const current = steps[index];
  const last = index === steps.length - 1;

  const go = useCallback(
    (to: number) => {
      setErrors([]);
      if (stepProp == null) setInner(to);
      onStepChange?.(to);
    },
    [stepProp, onStepChange],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index]);

  const next = async () => {
    setBusy(true);
    try {
      const result = await current.validate?.();
      const list = (Array.isArray(result) ? result : result ? [result] : []).filter(Boolean);
      if (list.length) {
        setErrors(list);
        return;
      }
      if (last) await onSubmit();
      else go(index + 1);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Não foi possível continuar. Tente de novo."]);
    } finally {
      setBusy(false);
    }
  };

  const stepperSteps: Step[] = steps.map((s, i) => ({ id: s.id, label: s.label, hint: s.hint, state: i < index ? "done" : i === index ? "current" : "upcoming" }));
  const headingId = useId();

  return (
    <section className={cn("min-w-0", className)} aria-labelledby={headingId}>
      {title && <h2 className="m-0 mb-4 text-[18px] font-semibold tracking-tight">{title}</h2>}
      <div className="hidden sm:block">
        <Stepper steps={stepperSteps} label="Etapas do formulário" />
      </div>
      <div className="sm:hidden">
        <p className="m-0 mb-2 text-[12.5px] text-muted">
          Etapa {index + 1} de {steps.length}
        </p>
        <Meter value={((index + 1) / steps.length) * 100} thick label={`Etapa ${index + 1} de ${steps.length}`} />
      </div>
      <div className="mt-6">
        <h3 id={headingId} ref={headingRef} tabIndex={-1} className="m-0 text-[15px] font-semibold outline-none">
          {current.label}
          {current.optional && <span className="ml-1.5 text-[12.5px] font-normal text-muted">(opcional)</span>}
        </h3>
        {current.hint && <p className="m-0 mt-1 text-[13px] text-muted">{current.hint}</p>}
        {errors.length > 0 && (
          <div role="alert" className="mt-4 rounded-lg border border-rose/30 bg-rose-soft px-3.5 py-2.5 text-[13px] text-rose">
            {errors.length === 1 ? (
              errors[0]
            ) : (
              <ul className="m-0 list-disc space-y-0.5 pl-4">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="mt-5">{current.content}</div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {onCancel && (
          <Button variant="quiet" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
        )}
        <span className="flex-1" />
        {index > 0 && (
          <Button variant="ghost" onClick={() => go(index - 1)} disabled={busy}>
            Voltar
          </Button>
        )}
        {current.optional && !last && (
          <Button variant="ghost" onClick={() => go(index + 1)} disabled={busy}>
            Pular por enquanto
          </Button>
        )}
        <Button onClick={next} disabled={busy}>
          {busy ? (last ? "Concluindo…" : "Verificando…") : last ? submitLabel : "Continuar"}
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tour                                                                */
/* ------------------------------------------------------------------ */

export type TourStep = {
  /** Seletor CSS ou ref do elemento real que a etapa explica. */
  target: string | RefObject<HTMLElement | null>;
  title: string;
  body: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
};

/**
 * Lembra se o tour já foi visto (localStorage, por chave) e controla
 * abrir/fechar. `start()` abre de novo (botão "Ver tour" na ajuda).
 */
export function useTour(storageKey: string, { autoStart = true }: { autoStart?: boolean } = {}) {
  const key = `ds-tour:${storageKey}`;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!autoStart) return;
    try {
      if (!localStorage.getItem(key)) setOpen(true);
    } catch {
      /* sem storage (modo privado): não abre sozinho */
    }
  }, [key, autoStart]);
  const finish = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignora */
    }
  }, [key]);
  return { open, start: () => setOpen(true), finish, onOpenChange: (o: boolean) => (o ? setOpen(true) : finish()) };
}

/**
 * Tour guiado: um balão por vez ancorado ao elemento real, com o elemento
 * destacado. Esc ou "Pular" fecha; ←/→ navegam. Etapas cujo alvo não está na
 * tela são puladas. Use para apresentar um recurso novo (3–5 etapas), nunca
 * para explicar o app inteiro: o que precisa de tour costuma precisar de
 * um rótulo melhor.
 */
export function Tour({
  steps,
  open,
  onOpenChange,
  onFinish,
  finishLabel = "Concluir",
}: {
  steps: TourStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish?: () => void;
  finishLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const resolve = useCallback((s: TourStep | undefined) => {
    if (!s || typeof document === "undefined") return null;
    return typeof s.target === "string" ? document.querySelector<HTMLElement>(s.target) : s.target.current;
  }, []);
  const available = useMemo(() => (open ? steps.map((s) => Boolean(resolve(s))) : []), [open, steps, resolve]);
  const visible = steps.filter((_, i) => available[i]);
  const pos = steps.slice(0, index).filter((_, i) => available[i]).length;

  useEffect(() => {
    if (open) setIndex(steps.findIndex((s) => resolve(s)) === -1 ? 0 : steps.findIndex((s) => resolve(s)));
  }, [open, steps, resolve]);

  useEffect(() => {
    if (!open) return;
    const el = resolve(steps[index]);
    setAnchor(el);
    if (!el) return;
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    el.setAttribute("data-tour-active", "");
    return () => el.removeAttribute("data-tour-active");
  }, [open, index, steps, resolve]);

  const move = (dir: 1 | -1) => {
    let i = index + dir;
    while (i >= 0 && i < steps.length && !available[i]) i += dir;
    if (i < 0) return;
    if (i >= steps.length) {
      onFinish?.();
      onOpenChange(false);
      return;
    }
    setIndex(i);
  };
  const step = steps[index];
  const isLast = pos === visible.length - 1;
  if (!open || !step || !anchor) return null;
  return (
    <BasePopover.Root open={open} onOpenChange={(o) => !o && onOpenChange(false)} modal={false}>
      <BasePopover.Portal>
        <BasePopover.Positioner anchor={anchor} side={step.side ?? "bottom"} sideOffset={10} collisionPadding={12} className="z-[var(--z-popup)]">
          <BasePopover.Popup
            className={cn(popupClass, "w-[min(320px,calc(100vw-24px))] p-4")}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === "ArrowRight") move(1);
              if (e.key === "ArrowLeft") move(-1);
            }}
          >
            <div className="flex items-start gap-2">
              <BasePopover.Title className="m-0 flex-1 text-[14px] font-semibold">{step.title}</BasePopover.Title>
              <button type="button" onClick={() => onOpenChange(false)} aria-label="Pular tour" className="-mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <BasePopover.Description render={<div />} className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              {step.body}
            </BasePopover.Description>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[12px] tabular-nums text-muted" aria-live="polite">
                {pos + 1} de {visible.length}
              </span>
              <span className="flex-1" />
              {pos > 0 && (
                <Button size="sm" variant="ghost" onClick={() => move(-1)}>
                  Voltar
                </Button>
              )}
              <Button size="sm" onClick={() => move(1)}>
                {isLast ? finishLabel : "Próximo"}
              </Button>
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

/* ------------------------------------------------------------------ */
/* NotificationCenter                                                  */
/* ------------------------------------------------------------------ */

export type NotificationItem = {
  id: string;
  title: ReactNode;
  body?: ReactNode;
  /** Já formatado ("há 5 min", "ontem"). */
  time: ReactNode;
  unread?: boolean;
  /** Avatar, EntityMark ou ícone. */
  media?: ReactNode;
  href?: string;
  onSelect?: () => void;
};

/**
 * Sino da barra superior com a caixa de notificações. Ponto só quando há não
 * lida (nunca o total); "Marcar todas como lidas" quando há o que marcar;
 * filtro Todas/Não lidas só a partir de 8 itens. Ao abrir um item, marque-o
 * como lido no app (`onSelect`). Para a página completa, use `footer`.
 */
export function NotificationCenter({
  items,
  onMarkAllRead,
  footer,
  title = "Notificações",
  emptyText = "Nada novo por aqui.",
  align = "end",
  className,
}: {
  items: NotificationItem[];
  onMarkAllRead?: () => void;
  footer?: { label: string; href: string };
  title?: string;
  emptyText?: string;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const unread = items.filter((i) => i.unread).length;
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const shown = filter === "unread" ? items.filter((i) => i.unread) : items;
  const showFilter = items.length >= 8 && unread > 0;
  return (
    <BasePopover.Root>
      <BasePopover.Trigger
        aria-label={unread ? `${title}, ${unread} não ${unread === 1 ? "lida" : "lidas"}` : title}
        className={cn("relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-ink data-popup-open:bg-soft data-popup-open:text-ink", className)}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {unread > 0 && (
          <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose ring-2 ring-surface" />
        )}
      </BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Positioner side="bottom" align={align} sideOffset={6} collisionPadding={8} className="z-[100]">
          <BasePopover.Popup className={cn(popupClass, "flex max-h-[min(560px,var(--available-height))] w-[min(380px,calc(100vw-16px))] flex-col overflow-hidden")}>
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <BasePopover.Title className="m-0 flex-1 text-[14px] font-semibold">{title}</BasePopover.Title>
              {onMarkAllRead && unread > 0 && (
                <button type="button" onClick={onMarkAllRead} className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-ink-soft hover:bg-soft hover:text-ink">
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                  Marcar todas como lidas
                </button>
              )}
            </div>
            {showFilter && (
              <div role="tablist" aria-label="Filtrar notificações" className="flex gap-1 border-b border-line px-3 py-2">
                {(
                  [
                    ["all", "Todas"],
                    ["unread", `Não lidas · ${unread}`],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={filter === v}
                    onClick={() => setFilter(v)}
                    className={cn("h-7 rounded-md px-2.5 text-[12.5px]", filter === v ? "bg-soft font-medium text-ink" : "text-muted hover:text-ink")}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
            {shown.length === 0 ? (
              <p className="m-0 px-4 py-10 text-center text-[13px] text-muted">{emptyText}</p>
            ) : (
              <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto overscroll-contain p-1.5">
                {shown.map((n) => {
                  const inner = (
                    <>
                      <span aria-hidden className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.unread ? "bg-blue" : "bg-transparent")} />
                      {n.media && <span className="shrink-0">{n.media}</span>}
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-[13px] leading-snug", n.unread ? "font-medium text-ink" : "text-ink-soft")}>{n.title}</span>
                        {n.body && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{n.body}</span>}
                        <span className="mt-1 block text-[11.5px] text-muted">
                          {n.time}
                          {n.unread && <span className="sr-only"> · não lida</span>}
                        </span>
                      </span>
                    </>
                  );
                  const cls = "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left no-underline hover:bg-soft";
                  return (
                    <li key={n.id}>
                      {n.href ? (
                        <DsLink href={n.href} className={cls} onClick={n.onSelect}>
                          {inner}
                        </DsLink>
                      ) : n.onSelect ? (
                        <button type="button" className={cls} onClick={n.onSelect}>
                          {inner}
                        </button>
                      ) : (
                        <div className={cls}>{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {footer && (
              <div className="border-t border-line p-1.5">
                <DsLink href={footer.href} className="flex h-9 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium text-ink no-underline hover:bg-soft">
                  {footer.label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </DsLink>
              </div>
            )}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Announcement                                                        */
/* ------------------------------------------------------------------ */

/**
 * Pílula de novidade: "Novo · Relatórios agendados →". Em cabeçalho de
 * página, hero de marketing ou topo da sidebar; leva ao changelog ou ao
 * recurso. Uma por vez; some quando a pessoa já viu (o app decide).
 */
export function Announcement({ tag = "Novo", children, href, onClick, className }: { tag?: string; children: ReactNode; href?: string; onClick?: () => void; className?: string }) {
  const inner = (
    <>
      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-deep">{tag}</span>
      <span className="min-w-0 truncate">{children}</span>
      {(href || onClick) && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />}
    </>
  );
  const cls = cn(
    "group inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-[12.5px] text-ink-soft no-underline",
    (href || onClick) && "transition-colors hover:border-line-strong hover:text-ink",
    className,
  );
  if (href)
    return (
      <DsLink href={href} className={cls}>
        {inner}
      </DsLink>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  return <span className={cls}>{inner}</span>;
}

/* ------------------------------------------------------------------ */
/* AudioPlayer                                                         */
/* ------------------------------------------------------------------ */

const fmtClock = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

/** Forma de onda estável a partir de uma semente (quando não há `peaks`). */
function fakePeaks(seed: string, n: number) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return Array.from({ length: n }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const base = 0.35 + 0.5 * Math.abs(Math.sin(i / 3.2 + (h % 7)));
    return Math.min(1, Math.max(0.12, base * (0.7 + ((h >>> 16) % 30) / 100)));
  });
}

/**
 * Gravação de ligação (CRM), entrevista (ATS) ou mensagem de voz (chat):
 * play/pausa, forma de onda clicável (←/→ voltam/avançam 5 s), tempo e
 * velocidade 1× · 1,5× · 2×. `peaks` (0–1) vem do servidor; sem ele, a
 * forma de onda é decorativa e estável.
 */
export function AudioPlayer({
  src,
  title,
  peaks,
  duration: durationProp,
  compact = false,
  captions,
  className,
}: {
  src: string;
  /** Nome acessível e rótulo visível ("Ligação com Ana · 12/09"). */
  title: string;
  peaks?: number[];
  /** Duração em segundos, quando já conhecida (mostra antes de carregar). */
  duration?: number;
  /** Bolha de mensagem de voz (sem título nem velocidade). */
  compact?: boolean;
  /** Legendas/transcrição em WebVTT (.vtt), quando houver. */
  captions?: string;
  className?: string;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(durationProp ?? 0);
  const [rate, setRate] = useState(1);
  const bars = useMemo(() => peaks ?? fakePeaks(src + title, compact ? 36 : 64), [peaks, src, title, compact]);
  const progress = duration ? time / duration : 0;

  useEffect(() => {
    const a = audio.current;
    if (a) a.playbackRate = rate;
  }, [rate]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  const seek = (t: number) => {
    const a = audio.current;
    if (!a || !duration) return;
    a.currentTime = Math.max(0, Math.min(duration, t));
    setTime(a.currentTime);
  };
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 5, ArrowLeft: -5, PageUp: 30, PageDown: -30 }[e.key as string];
    if (step != null) {
      e.preventDefault();
      seek(time + step);
    } else if (e.key === "Home") seek(0);
    else if (e.key === "End") seek(duration);
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-3", compact ? "rounded-2xl bg-soft px-2 py-1.5" : "rounded-xl border border-line bg-surface p-3", className)}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- legenda é opcional (`captions`); a transcrição completa fica ao lado do player */}
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      >
        {captions && <track kind="captions" src={captions} srcLang="pt-BR" label="Português" default />}
      </audio>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pausar ${title}` : `Ouvir ${title}`}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary/90"
      >
        {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="ml-0.5 h-4 w-4" aria-hidden />}
      </button>
      <div className="min-w-0 flex-1">
        {!compact && <div className="mb-1 truncate text-[13px] font-medium">{title}</div>}
        <div
          role="slider"
          tabIndex={0}
          aria-label={`Posição em ${title}`}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${fmtClock(time)} de ${fmtClock(duration)}`}
          onKeyDown={onKey}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * duration);
          }}
          className="flex h-8 min-w-0 cursor-pointer items-center gap-px rounded outline-none focus-visible:ring-2 focus-visible:ring-muted/50 sm:gap-[2px]"
        >
          {bars.map((p, i) => (
            <span
              key={i}
              aria-hidden
              className={cn("min-w-px flex-1 rounded-full transition-colors", i / bars.length < progress ? "bg-ink" : "bg-line-strong")}
              style={{ height: `${Math.round(p * 100)}%` }}
            />
          ))}
        </div>
      </div>
      <span className="shrink-0 text-[12px] tabular-nums text-muted">
        {playing || time > 0 ? fmtClock(time) : fmtClock(duration)}
        {!compact && duration > 0 && (playing || time > 0) && <span className="hidden sm:inline"> / {fmtClock(duration)}</span>}
      </span>
      {!compact && (
        <button
          type="button"
          onClick={() => setRate((r) => (r === 1 ? 1.5 : r === 1.5 ? 2 : 1))}
          aria-label={`Velocidade ${String(rate).replace(".", ",")}×. Trocar velocidade`}
          className="h-7 shrink-0 rounded-md px-2 text-[12px] font-medium tabular-nums text-ink-soft ring-1 ring-line hover:bg-soft"
        >
          {String(rate).replace(".", ",")}×
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* InlineSelect                                                        */
/* ------------------------------------------------------------------ */

export type InlineOption<V extends string = string> = { value: V; label: string; tone?: Tone; description?: string; disabled?: boolean };

/**
 * Status, etapa ou papel como **controle inline**: um selo com o valor atual
 * que abre um menu de opções. É o que vai numa célula de tabela, card de
 * kanban ou cabeçalho de registro, no lugar de um `Select` por linha
 * (regra 10). `label` é o nome acessível ("Etapa de Ana Lopes").
 * `disabledReason` explica por que não dá para trocar.
 */
export function InlineSelect<V extends string = string>({
  label,
  value,
  onValueChange,
  options,
  disabled = false,
  disabledReason,
  align = "start",
  className,
}: {
  label: string;
  value: V;
  onValueChange: (value: V) => void;
  options: InlineOption<V>[];
  disabled?: boolean;
  disabledReason?: string;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const current = options.find((o) => o.value === value);
  const blocked = disabled || Boolean(disabledReason);
  const trigger = (
    <BaseMenu.Trigger
      disabled={blocked}
      aria-label={`${label}: ${current?.label ?? "sem valor"}`}
      className={cn(
        "inline-flex h-7 max-w-full items-center gap-1.5 rounded-md bg-surface px-2 text-[12.5px] text-ink ring-1 ring-line transition-colors hover:bg-soft data-popup-open:bg-soft",
        blocked && "cursor-not-allowed text-ink-soft hover:bg-surface",
        className,
      )}
    >
      {current?.tone && <Dot tone={current.tone} />}
      <span className="truncate">{current?.label ?? "—"}</span>
      {!blocked && <ChevronDown className="h-3 w-3 shrink-0 text-muted" aria-hidden />}
    </BaseMenu.Trigger>
  );
  return (
    <BaseMenu.Root>
      {disabledReason ? (
        <Tooltip content={disabledReason}>
          <span className="inline-flex" tabIndex={0} role="group" aria-label={`${label}: ${current?.label ?? "sem valor"}. ${disabledReason}`}>
            {trigger}
          </span>
        </Tooltip>
      ) : (
        trigger
      )}
      <BaseMenu.Portal>
        <BaseMenu.Positioner align={align} sideOffset={4} collisionPadding={12} className="z-[var(--z-popup)]">
          <BaseMenu.Popup className={cn(popupClass, "max-h-[var(--available-height)] min-w-[180px] overflow-y-auto p-1.5")}>
            <BaseMenu.RadioGroup value={value} onValueChange={(v) => onValueChange(v as V)}>
              {options.map((o) => (
                <BaseMenu.RadioItem
                  key={o.value}
                  value={o.value}
                  disabled={o.disabled}
                  closeOnClick
                  className="flex w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] outline-none data-disabled:cursor-not-allowed data-disabled:text-muted data-highlighted:bg-soft"
                >
                  {o.tone && <Dot tone={o.tone} />}
                  <span className="min-w-0 flex-1">
                    <span className="block">{o.label}</span>
                    {o.description && <span className="block text-[12px] leading-snug text-muted">{o.description}</span>}
                  </span>
                  <BaseMenu.RadioItemIndicator className="shrink-0">
                    <Check className="h-4 w-4" aria-hidden />
                  </BaseMenu.RadioItemIndicator>
                </BaseMenu.RadioItem>
              ))}
            </BaseMenu.RadioGroup>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
