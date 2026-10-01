"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { ArrowRight, Check, Clock, Copy, CornerDownLeft, ImageOff, MoveHorizontal, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { Kbd, KbdGroup } from "./primitives";

/*
 * Interação e marketing. Regras (docs/padroes/interacao.md):
 *   · animação serve para orientar (de onde veio, para onde foi), nunca para enfeitar
 *   · toda animação tem versão estática com prefers-reduced-motion
 *   · superfícies de marketing (hero, landing) usam o mesmo tipo e as mesmas cores do produto
 */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

const backdrop =
  "fixed inset-0 z-[90] min-h-dvh bg-[var(--ds-backdrop)] backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0";
const center = "fixed left-1/2 top-1/2 z-[95] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 outline-none";

/* ------------------------------------------------------------------ */
/* InputModal                                                          */
/* ------------------------------------------------------------------ */

/**
 * Modal de uma pergunta só: um campo grande e Enter para enviar. Para
 * "criar com IA", renomear, colar um link, convidar por e-mail. Sugestões
 * opcionais preenchem o campo.
 */
export function InputModal({
  open,
  onClose,
  onSubmit,
  title,
  description,
  placeholder = "Descreva o que você precisa…",
  submitLabel = "Continuar",
  icon,
  suggestions,
  multiline = false,
  initialValue = "",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: ReactNode;
  placeholder?: string;
  submitLabel?: string;
  icon?: ReactNode;
  suggestions?: string[];
  multiline?: boolean;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);
  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    onClose();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey) && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };
  const field = "block w-full resize-none border-0 bg-transparent text-[16px] leading-relaxed text-ink outline-none placeholder:text-muted";
  return (
    <BaseDialog.Root open={open} onOpenChange={(n) => !n && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdrop} />
        <BaseDialog.Popup
          className={cn(
            center,
            "max-w-[600px] overflow-hidden rounded-2xl border border-line bg-popover text-ink shadow-overlay transition-[opacity,translate,scale] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:data-starting-style:scale-[0.97]",
          )}
        >
          <div className="flex items-start gap-3 px-5 pt-5">
            <span className="mt-0.5 inline-grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-soft text-ink-soft ring-1 ring-line [&_svg]:h-4 [&_svg]:w-4">{icon ?? <Sparkles aria-hidden />}</span>
            <div className="min-w-0 flex-1">
              <BaseDialog.Title className="m-0 text-[15px] font-semibold leading-snug">{title}</BaseDialog.Title>
              {description && <BaseDialog.Description className="m-0 mt-0.5 text-[12.5px] text-muted">{description}</BaseDialog.Description>}
            </div>
            <BaseDialog.Close aria-label="Fechar" className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink">
              <X className="h-4 w-4" />
            </BaseDialog.Close>
          </div>
          <div className="px-5 pb-3 pt-4">
            {multiline ? (
              <textarea autoFocus rows={4} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={onKey} placeholder={placeholder} aria-label={title} className={field} />
            ) : (
              <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={onKey} placeholder={placeholder} aria-label={title} className={cn(field, "h-10")} />
            )}
          </div>
          {suggestions && suggestions.length > 0 && !value && (
            <div className="flex flex-wrap gap-1.5 px-5 pb-4">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => setValue(s)} className="rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-ink-soft hover:border-line-strong hover:text-ink">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-line bg-soft/50 px-5 py-3">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
              {multiline ? <KeyCombo keys={["⌘", "↵"]} /> : <Kbd>↵</Kbd>} para {submitLabel.toLowerCase()} · <Kbd>Esc</Kbd> fecha
            </span>
            <button type="button" onClick={submit} disabled={!value.trim()} className="ui-button-primary inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-on-primary hover:bg-primary/90 disabled:opacity-40">
              {submitLabel}
              <CornerDownLeft className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedModal                                                       */
/* ------------------------------------------------------------------ */

/**
 * Modal com entrada coreografada (sobe, desfoca → nítido, conteúdo em
 * cascata). Para momentos de marca: boas-vindas, novidade, conquista.
 * Decisões do dia a dia continuam no Modal comum.
 */
export function AnimatedModal({
  open,
  onClose,
  title,
  description,
  media,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  /** Imagem/ilustração no topo (ocupa a largura). */
  media?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const w = { sm: "max-w-[400px]", md: "max-w-[520px]", lg: "max-w-[720px]" }[size];
  const stagger = (i: number): CSSProperties => ({ animationDelay: `${80 + i * 60}ms` });
  return (
    <BaseDialog.Root open={open} onOpenChange={(n) => !n && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdrop} />
        <BaseDialog.Popup
          className={cn(
            center,
            w,
            "flex max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-2xl border border-line bg-popover text-ink shadow-overlay",
            "transition-[opacity,scale,translate,filter] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-ending-style:opacity-0 data-starting-style:opacity-0",
            "motion-safe:data-starting-style:translate-y-[calc(-50%+12px)] motion-safe:data-starting-style:scale-[0.96] motion-safe:data-starting-style:blur-[6px] motion-safe:data-ending-style:scale-[0.98]",
          )}
        >
          {media && <div className="relative shrink-0 overflow-hidden border-b border-line bg-soft">{media}</div>}
          <BaseDialog.Close aria-label="Fechar" className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-popover/80 text-muted backdrop-blur hover:bg-soft hover:text-ink">
            <X className="h-4 w-4" />
          </BaseDialog.Close>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <BaseDialog.Title className="enter m-0 text-[18px] font-semibold leading-snug tracking-tight" style={stagger(0)}>
              {title}
            </BaseDialog.Title>
            {description && (
              <BaseDialog.Description className="enter m-0 mt-1.5 text-[13.5px] leading-relaxed text-muted" style={stagger(1)}>
                {description}
              </BaseDialog.Description>
            )}
            {children && (
              <div className="enter mt-4" style={stagger(2)}>
                {children}
              </div>
            )}
          </div>
          {footer && (
            <div className="enter flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-soft/40 px-6 py-4" style={stagger(3)}>
              {footer}
            </div>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/* ------------------------------------------------------------------ */
/* LimitDialog                                                         */
/* ------------------------------------------------------------------ */

/**
 * Alerta de limite (taxa de uso, cota do plano, créditos de IA). Explica o
 * motivo, conta o tempo até liberar e oferece a saída (upgrade/admin).
 * Quando o tempo acaba, o botão vira "Tentar de novo".
 */
export function LimitDialog({
  open,
  onClose,
  retryIn,
  onRetry,
  onUpgrade,
  title = "Você atingiu o limite de uso",
  description = "Muitas solicitações em pouco tempo. Aguarde para continuar ou aumente o limite do seu plano.",
  usage,
  upgradeLabel = "Ver planos",
}: {
  open: boolean;
  onClose: () => void;
  /** Segundos até liberar. */
  retryIn: number;
  onRetry?: () => void;
  onUpgrade?: () => void;
  title?: string;
  description?: ReactNode;
  /** Ex.: { used: 500, limit: 500, unit: "solicitações/hora" } */
  usage?: { used: number; limit: number; unit: string };
  upgradeLabel?: string;
}) {
  const [left, setLeft] = useState(retryIn);
  useEffect(() => {
    if (!open) return;
    setLeft(retryIn);
    const end = Date.now() + retryIn * 1000;
    const id = window.setInterval(() => {
      const v = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(v);
      if (!v) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [open, retryIn]);
  const mmss = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  const pct = retryIn ? ((retryIn - left) / retryIn) * 100 : 100;
  return (
    <AlertDialog.Root open={open} onOpenChange={(n) => !n && onClose()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={backdrop} />
        <AlertDialog.Popup className={cn(center, "max-w-[420px] overflow-hidden rounded-2xl border border-line bg-popover text-ink shadow-overlay transition-[opacity,scale] duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:data-starting-style:scale-[0.97]")}>
          <div className="px-6 pb-5 pt-6">
            <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-amber-soft text-amber ring-1 ring-amber/20">
              <Clock className="h-5 w-5" aria-hidden />
            </span>
            <AlertDialog.Title className="m-0 mt-4 text-[17px] font-semibold leading-snug tracking-tight">{title}</AlertDialog.Title>
            <AlertDialog.Description className="m-0 mt-1.5 text-[13.5px] leading-relaxed text-muted">{description}</AlertDialog.Description>
            <div className="mt-5 rounded-xl border border-line bg-soft/60 px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] text-muted">{left > 0 ? "Libera em" : "Liberado"}</span>
                <span className="font-mono text-[22px] font-semibold tabular-nums tracking-tight" aria-live="polite" aria-atomic>
                  {mmss}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
              </div>
              {usage && (
                <p className="m-0 mt-2 text-[11.5px] tabular-nums text-muted">
                  {formatNumber(usage.used)} de {formatNumber(usage.limit)} {usage.unit}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-soft/40 px-6 py-4">
            {left > 0 ? (
              <button type="button" onClick={onClose} className="inline-flex h-9 items-center rounded-lg bg-surface px-3.5 text-[13px] font-medium text-ink ring-1 ring-line hover:bg-soft">
                Aguardar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onRetry?.();
                  onClose();
                }}
                className="inline-flex h-9 items-center rounded-lg bg-surface px-3.5 text-[13px] font-medium text-ink ring-1 ring-line hover:bg-soft"
              >
                Tentar de novo
              </button>
            )}
            {onUpgrade && (
              <button type="button" onClick={onUpgrade} className="ui-button-primary inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-on-primary hover:bg-primary/90">
                {upgradeLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/* ------------------------------------------------------------------ */
/* ImageSphere                                                         */
/* ------------------------------------------------------------------ */

export type SphereImage = { src: string; alt: string };

/**
 * Esfera 3D de imagens (distribuição de Fibonacci): arraste para girar,
 * inércia ao soltar, setas do teclado giram. Gira sozinha devagar; parada
 * com prefers-reduced-motion. Clique numa imagem chama onSelect (abra no
 * Lightbox). Para vitrines (clientes, time, portfólio), não para dados.
 */
export function ImageSphere({
  images,
  size = 420,
  itemSize = 64,
  autoRotate = true,
  onSelect,
  label = "Galeria em esfera",
  className,
}: {
  images: SphereImage[];
  size?: number;
  itemSize?: number;
  autoRotate?: boolean;
  onSelect?: (index: number) => void;
  label?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const rot = useRef({ x: -0.25, y: 0.4, vx: 0, vy: 0.0025 });
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);
  const hover = useRef(false);
  const [box, setBox] = useState(size);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox(Math.min(size, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);
  const points = useMemo(() => {
    const n = images.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    return images.map((_, i) => {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      return [Math.cos(th) * r, y, Math.sin(th) * r] as const;
    });
  }, [images]);
  // Só anima enquanto visível na tela e com a aba ativa (economiza CPU/bateria).
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let inView = false;
    const update = () => setVisible(inView && document.visibilityState === "visible");
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  useEffect(() => {
    let raf = 0;
    const radius = box / 2 - itemSize / 2;
    const render = () => {
      const r = rot.current;
      if (!drag.current) {
        const spin = autoRotate && !reduced && !hover.current ? 0.0025 : 0;
        r.vy += (spin - r.vy) * 0.02;
        r.vx *= 0.94;
        r.y += r.vy;
        r.x = Math.max(-1.2, Math.min(1.2, r.x + r.vx));
      }
      const cy = Math.cos(r.y), sy = Math.sin(r.y), cx = Math.cos(r.x), sx = Math.sin(r.x);
      points.forEach(([px, py, pz], i) => {
        const el = items.current[i];
        if (!el) return;
        const x1 = px * cy + pz * sy;
        const z1 = -px * sy + pz * cy;
        const y2 = py * cx - z1 * sx;
        const z2 = py * sx + z1 * cx;
        const depth = (z2 + 1) / 2; // 0 atrás · 1 na frente
        const scale = 0.55 + depth * 0.55;
        el.style.transform = `translate(-50%, -50%) translate3d(${x1 * radius}px, ${y2 * radius}px, 0) scale(${scale})`;
        el.style.opacity = String(0.25 + depth * 0.75);
        el.style.zIndex = String(Math.round(depth * 100));
        el.style.filter = depth < 0.4 ? `blur(${(0.4 - depth) * 4}px)` : "none";
        el.tabIndex = depth > 0.55 ? 0 : -1;
      });
      if (visible) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render); // desenha ao menos um quadro, mesmo pausada
    return () => cancelAnimationFrame(raf);
  }, [points, box, itemSize, autoRotate, reduced, visible]);
  const onDown = (e: ReactPointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    d.moved += Math.abs(dx) + Math.abs(dy);
    const r = rot.current;
    r.vy = dx * 0.006;
    r.vx = -dy * 0.006;
    r.y += r.vy;
    r.x = Math.max(-1.2, Math.min(1.2, r.x + r.vx));
  };
  const onUp = () => {
    window.setTimeout(() => (drag.current = null), 0);
  };
  const onKey = (e: KeyboardEvent) => {
    const r = rot.current;
    if (e.key === "ArrowLeft") r.vy = -0.05;
    else if (e.key === "ArrowRight") r.vy = 0.05;
    else if (e.key === "ArrowUp") r.vx = 0.05;
    else if (e.key === "ArrowDown") r.vx = -0.05;
    else return;
    e.preventDefault();
  };
  return (
    <div ref={wrap} className={cn("mx-auto w-full", className)} style={{ maxWidth: size }}>
      <div
        role="group"
        aria-label={`${label}. Arraste ou use as setas para girar.`}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerEnter={() => (hover.current = true)}
        onPointerLeave={() => (hover.current = false)}
        className="relative cursor-grab touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-muted/40 active:cursor-grabbing"
        style={{ width: box, height: box }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-[12%] rounded-full" style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--ds-accent) 16%, transparent), transparent 70%)" }} />
        {images.map((img, i) => (
          <button
            key={i}
            ref={(el) => {
              items.current[i] = el;
            }}
            type="button"
            aria-label={img.alt}
            onClick={() => {
              if ((drag.current?.moved ?? 0) > 6) return;
              onSelect?.(i);
            }}
            className="absolute left-1/2 top-1/2 overflow-hidden rounded-xl border border-line bg-soft shadow-raised will-change-transform focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ width: itemSize, height: itemSize }}
          >
            <img src={img.src} alt="" draggable={false} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Marquee e LogoCloud                                                 */
/* ------------------------------------------------------------------ */

const marqueeCss = `@keyframes ds-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.ds-marquee-track{animation:ds-marquee var(--ds-marquee-duration,40s) linear infinite}
.ds-marquee:hover .ds-marquee-track,.ds-marquee:focus-within .ds-marquee-track{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.ds-marquee-track{animation:none;flex-wrap:wrap;justify-content:center;width:100%!important}.ds-marquee-track>[data-dup]{display:none}}`;

/**
 * Faixa que rola sozinha (logos, depoimentos curtos). Pausa no hover/foco;
 * com movimento reduzido vira grade estática. Bordas com fade.
 */
export function Marquee({ children, duration = 40, gap = 48, fade = true, className }: { children: ReactNode; duration?: number; gap?: number; fade?: boolean; className?: string }) {
  return (
    <div
      className={cn("ds-marquee relative overflow-hidden", className)}
      style={fade ? { maskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)" } : undefined}
    >
      <style>{marqueeCss}</style>
      <div className="ds-marquee-track flex w-max items-center" style={{ ["--ds-marquee-duration" as string]: `${duration}s` }}>
        <div className="flex shrink-0 items-center" style={{ gap, paddingRight: gap }}>
          {children}
        </div>
        <div data-dup="" aria-hidden className="flex shrink-0 items-center" style={{ gap, paddingRight: gap }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export type Logo = { name: string; src?: string; mark?: ReactNode };

/** Logos de clientes/parceiros em tom neutro (sem competir com a marca). */
export function LogoCloud({ title, logos, scrolling = false, className }: { title?: ReactNode; logos: Logo[]; scrolling?: boolean; className?: string }) {
  const items = logos.map((l) => (
    <span key={l.name} className="inline-flex shrink-0 items-center gap-2 text-[17px] font-semibold tracking-tight text-muted grayscale transition-colors hover:text-ink-soft" title={l.name}>
      {l.src ? <img src={l.src} alt={l.name} className="h-7 w-auto" /> : (
        <>
          {l.mark}
          {l.name}
        </>
      )}
    </span>
  ));
  return (
    <div className={cn("min-w-0", className)}>
      {title && <p className="m-0 mb-6 text-center text-[12.5px] text-muted">{title}</p>}
      {scrolling ? <Marquee>{items}</Marquee> : <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">{items}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Seções de marketing                                                 */
/* ------------------------------------------------------------------ */

/** Moldura de janela de navegador para prints do produto. */
export function ScreenFrame({ children, url, className }: { children: ReactNode; url?: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-surface shadow-overlay", className)}>
      <div className="flex h-9 items-center gap-3 border-b border-line bg-soft px-3">
        <span className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          ))}
        </span>
        {url && <span className="mx-auto max-w-[60%] truncate rounded-md bg-surface px-3 py-0.5 text-[11px] text-muted ring-1 ring-line">{url}</span>}
        <span className="w-10" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * Hero de página pública/landing. Variantes:
 *   centered  selo, título grande, texto, CTAs e mídia embaixo (padrão)
 *   split     texto à esquerda, mídia à direita
 *   image     imagem de fundo desfocada em tela cheia, texto claro por cima
 * Entrada em cascata; estática com movimento reduzido.
 */
export function HeroSection({
  variant = "centered",
  badge,
  title,
  description,
  actions,
  media,
  image,
  footnote,
  className,
}: {
  variant?: "centered" | "split" | "image";
  badge?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  media?: ReactNode;
  /** URL da imagem de fundo (variant="image"). */
  image?: string;
  footnote?: ReactNode;
  className?: string;
}) {
  const s = (i: number): CSSProperties => ({ animationDelay: `${i * 90}ms` });
  const onImage = variant === "image";
  const badgeEl = badge && (
    <span
      className={cn(
        "enter inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12.5px] font-medium",
        // ds-audit-ignore white-black: texto sobre foto do hero (escura nos dois modos)
        onImage ? "border-white/20 bg-white/10 text-white backdrop-blur" : "border-line bg-surface text-ink-soft shadow-surface",
      )}
      style={s(0)}
    >
      {badge}
    </span>
  );
  const text = (
    <>
      {badgeEl}
      <h1
        className={cn("enter m-0 mt-5 text-balance text-[36px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[52px] lg:text-[60px]", onImage ? "text-white" : "text-ink") /* ds-audit-ignore white-black: sobre foto */}
        style={{ ...s(1), lineHeight: 1.08 }}
      >
        {title}
      </h1>
      {description && (
        <p className={cn("enter m-0 mt-5 text-pretty text-[16px] leading-relaxed sm:text-[18px]", onImage ? "text-white/75" /* ds-audit-ignore white-black: sobre foto */ : "text-muted", variant !== "split" && "mx-auto max-w-[620px]")} style={s(2)}>
          {description}
        </p>
      )}
      {actions && (
        <div className={cn("enter mt-8 flex flex-wrap gap-3", variant !== "split" && "justify-center")} style={s(3)}>
          {actions}
        </div>
      )}
      {footnote && (
        <p className={cn("enter m-0 mt-4 text-[12.5px]", onImage ? "text-white/60" /* ds-audit-ignore white-black: sobre foto */ : "text-muted")} style={s(4)}>
          {footnote}
        </p>
      )}
    </>
  );
  if (variant === "split")
    return (
      <section className={cn("mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:py-24", className)}>
        <div className="min-w-0">{text}</div>
        {media && (
          <div className="enter min-w-0" style={s(3)}>
            {media}
          </div>
        )}
      </section>
    );
  if (onImage)
    return (
      <section className={cn("relative isolate overflow-hidden bg-navy", className)}>
        {image && <img src={image} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover opacity-60 blur-[6px]" />}
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--ds-navy) 55%, transparent), var(--ds-navy))" }} />
        <div className="mx-auto flex min-h-[560px] max-w-[900px] flex-col items-center justify-center px-5 py-24 text-center sm:px-8">{text}</div>
        {media && <div className="mx-auto max-w-[1100px] px-5 pb-16 sm:px-8">{media}</div>}
      </section>
    );
  return (
    <section className={cn("relative isolate overflow-hidden", className)}>
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[520px]" style={{ background: "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--ds-accent) 14%, transparent), transparent 70%)" }} />
      <div className="mx-auto max-w-[900px] px-5 pb-12 pt-20 text-center sm:px-8 sm:pt-28">{text}</div>
      {media && (
        <div className="enter mx-auto max-w-[1160px] px-5 pb-16 sm:px-8" style={s(4)}>
          {media}
        </div>
      )}
    </section>
  );
}

export type Feature = { icon?: ReactNode; title: string; description: ReactNode; href?: string };

/** Grade de recursos: ícone, título, descrição. 3 ou 4 colunas. */
export function FeatureGrid({ title, description, kicker, items, cols = 3, className }: { title?: ReactNode; description?: ReactNode; kicker?: ReactNode; items: Feature[]; cols?: 2 | 3 | 4; className?: string }) {
  const lg = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" }[cols];
  return (
    <section className={cn("mx-auto max-w-[1200px] px-5 py-16 sm:px-8", className)}>
      {(title || kicker) && (
        <header className="mx-auto mb-10 max-w-[640px] text-center">
          {kicker && <p className="m-0 mb-3 text-[12px] font-medium uppercase tracking-[0.1em] text-accent-deep">{kicker}</p>}
          {title && <h2 className="m-0 text-balance text-[30px] font-semibold tracking-[-0.03em]">{title}</h2>}
          {description && <p className="m-0 mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
        </header>
      )}
      <div className={cn("grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2", lg)}>
        {items.map((f) => (
          <div key={f.title} className="bg-surface p-6">
            {f.icon && <span className="mb-4 inline-grid h-9 w-9 place-items-center rounded-lg bg-soft text-ink ring-1 ring-line [&_svg]:h-[18px] [&_svg]:w-[18px]">{f.icon}</span>}
            <h3 className="m-0 text-[15px] font-semibold">{f.title}</h3>
            <p className="m-0 mt-1.5 text-[13.5px] leading-relaxed text-muted">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Depoimento: citação, pessoa, cargo e empresa. */
export function Testimonial({
  quote,
  name,
  role,
  avatar,
  logo,
  variant = "card",
  className,
}: {
  quote: ReactNode;
  name: string;
  role?: string;
  avatar?: string;
  logo?: ReactNode;
  variant?: "card" | "large";
  className?: string;
}) {
  const person = (
    <figcaption className="flex items-center gap-3">
      <ImageWithFallback src={avatar} alt={name} fallback={name} className="h-10 w-10 rounded-full" />
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium">{name}</div>
        {role && <div className="text-[12.5px] text-muted">{role}</div>}
      </div>
      {logo && <div className="ml-auto text-muted">{logo}</div>}
    </figcaption>
  );
  if (variant === "large")
    return (
      <figure className={cn("mx-auto max-w-[760px] px-5 py-16 text-center", className)}>
        <blockquote className="m-0 text-balance text-[22px] font-medium leading-[1.45] tracking-[-0.015em] sm:text-[26px]">“{quote}”</blockquote>
        <div className="mt-8 inline-flex">{person}</div>
      </figure>
    );
  return (
    <figure className={cn("m-0 flex flex-col justify-between gap-6 rounded-2xl border border-line bg-surface p-6", className)}>
      <blockquote className="m-0 text-[14px] leading-relaxed text-ink">“{quote}”</blockquote>
      {person}
    </figure>
  );
}

/** Faixa de números de impacto (landing, relatório). Conta ao entrar na tela. */
export function StatsBand({ stats, className }: { stats: { value: number; label: string; format?: (n: number) => string; prefix?: string; suffix?: string }[]; className?: string }) {
  return (
    <section className={cn("mx-auto max-w-[1200px] px-5 sm:px-8", className)}>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface px-6 py-7">
            <dt className="text-[13px] text-muted">{s.label}</dt>
            <dd className="m-0 mt-2 text-[34px] font-semibold tabular-nums tracking-[-0.03em]">
              {s.prefix}
              <NumberTicker value={s.value} format={s.format} />
              {s.suffix}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* NumberTicker                                                        */
/* ------------------------------------------------------------------ */

/** Número que conta até o valor ao entrar na tela. Com movimento reduzido, mostra o final. */
export function NumberTicker({ value, format = (n) => formatNumber(n), duration = 1200, className }: { value: number; format?: (n: number) => string; duration?: number; className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const started = useRef(false);
  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    setShown(0);
    started.current = false;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(value * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, reduced]);
  const isInt = Number.isInteger(value);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      <span aria-hidden>{format(isInt ? Math.round(shown) : shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* BeforeAfter                                                         */
/* ------------------------------------------------------------------ */

/**
 * Comparação antes/depois com alça arrastável (e setas do teclado).
 * Para redesign, tratamento de imagem, dashboards antigo × novo.
 */
export function BeforeAfter({
  before,
  after,
  beforeLabel = "Antes",
  afterLabel = "Depois",
  initial = 50,
  aspect = "16 / 9",
  className,
}: {
  before: SphereImage;
  after: SphereImage;
  beforeLabel?: string;
  afterLabel?: string;
  initial?: number;
  aspect?: string;
  className?: string;
}) {
  const [pos, setPos] = useState(initial);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const setFrom = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={box}
      className={cn("relative touch-none select-none overflow-hidden rounded-xl border border-line bg-soft", className)}
      style={{ aspectRatio: aspect }}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setFrom(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && setFrom(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      <img src={after.src} alt={after.alt} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      <img src={before.src} alt={before.alt} draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <span className="absolute left-3 top-3 rounded-md bg-ink/70 px-2 py-0.5 text-[11.5px] font-medium text-on-ink backdrop-blur">{beforeLabel}</span>
      <span className="absolute right-3 top-3 rounded-md bg-ink/70 px-2 py-0.5 text-[11.5px] font-medium text-on-ink backdrop-blur">{afterLabel}</span>
      <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-surface shadow-raised" style={{ left: `${pos}%` }}>
        <button
          type="button"
          role="slider"
          aria-label="Posição da comparação"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
            else if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
            else return;
            e.preventDefault();
          }}
          className="absolute left-1/2 top-1/2 inline-grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-line bg-surface text-ink shadow-raised"
        >
          <MoveHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Imagem, cópia, atalhos                                              */
/* ------------------------------------------------------------------ */

/**
 * Imagem com esqueleto enquanto carrega e alternativa quando falha
 * (iniciais do nome ou ícone). Nunca mostra o ícone quebrado do navegador.
 */
export function ImageWithFallback({ src, alt, fallback, className, imgClassName }: { src?: string; alt: string; /** Nome para gerar iniciais no fallback. */ fallback?: string; className?: string; imgClassName?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">(src ? "loading" : "error");
  const prevSrc = useRef(src);
  useEffect(() => {
    if (prevSrc.current === src) return; // só reinicia quando a imagem muda de verdade
    prevSrc.current = src;
    setState(src ? "loading" : "error");
  }, [src]);
  const initials = fallback
    ? fallback
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "";
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden bg-soft text-muted ring-1 ring-line", className)}>
      {state !== "ok" && (
        <span className={cn("absolute inset-0 grid place-items-center", state === "loading" && "motion-safe:animate-pulse")} role={state === "error" ? "img" : undefined} aria-label={state === "error" ? alt : undefined}>
          {state === "error" && (initials ? <span className="text-[12px] font-medium text-ink-soft">{initials}</span> : <ImageOff className="h-4 w-4" aria-hidden />)}
        </span>
      )}
      {src && state !== "error" && (
        <img
          ref={(el) => {
            // Imagem em cache/data URI pode terminar de carregar antes do onLoad existir.
            if (el?.complete && state === "loading") setState(el.naturalWidth ? "ok" : "error");
          }}
          src={src}
          alt={alt}
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          className={cn("h-full w-full object-cover transition-opacity duration-200", state === "ok" ? "opacity-100" : "opacity-0", imgClassName)} />
      )}
    </span>
  );
}

/** Copia um texto e confirma com ✓ por 1,5 s. Ícone só ou com rótulo. */
export function CopyButton({ value, label = "Copiar", copiedLabel = "Copiado", iconOnly = false, className }: { value: string; label?: string; copiedLabel?: string; iconOnly?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      aria-label={iconOnly ? (copied ? copiedLabel : label) : undefined}
      title={iconOnly ? label : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-medium text-ink-soft hover:bg-soft hover:text-ink",
        iconOnly ? "h-8 w-8" : "h-8 border border-line bg-surface px-2.5",
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
      {!iconOnly && <span aria-live="polite">{copied ? copiedLabel : label}</span>}
    </button>
  );
}

/**
 * Combinação de teclas: ["⌘", "K"] → ⌘ K. Nomes ("mod", "shift", "enter")
 * viram o símbolo da plataforma (⌘ no Mac, Ctrl nos outros). Igual a KbdGroup.
 */
export function KeyCombo({ keys, className }: { keys: string[]; className?: string }) {
  return <KbdGroup keys={keys} className={className} />;
}
