"use client";
/* ds-audit-ignore-file white-black: slides navy e palco de tela cheia têm fundo escuro fixo (não seguem o tema) */

import {
  ChevronLeft,
  ChevronRight,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Maximize2,
  Minimize2,
  NotebookText,
  Presentation,
} from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { Lightbox, type LightboxImage } from "./overlays-extra";

/*
 * Mídia e conteúdo: carrossel, apresentação (slides), galeria, arquivos.
 * Regras (docs/padroes/midia.md):
 *   · carrossel só para conteúdo equivalente e opcional (destaques, fotos);
 *     nunca esconda num carrossel algo que a pessoa precisa ver
 *   · autoplay desligado por padrão; se ligado, pausa no hover/foco e
 *     respeita "reduzir movimento"
 *   · toda imagem tem alt; arquivo mostra tipo, tamanho e quem enviou
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

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/* ------------------------------------------------------------------ */
/* AspectFrame                                                         */
/* ------------------------------------------------------------------ */

/** Moldura com proporção fixa (16/9, 4/3, 1/1) para imagem, vídeo, mapa. */
export function AspectFrame({ ratio = 16 / 9, children, className }: { ratio?: number; children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl border border-line bg-soft [&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover", className)} style={{ aspectRatio: String(ratio) }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carousel                                                            */
/* ------------------------------------------------------------------ */

/**
 * Carrossel com rolagem nativa (arrasta no toque, trackpad funciona),
 * encaixe por item, setas, pontos e ←/→ quando focado. `perView` itens
 * lado a lado no desktop; `perViewMobile` abaixo de 640px.
 */
export function Carousel({
  children,
  label,
  perView = 1,
  perViewMobile = 1,
  gap = 12,
  autoplay,
  arrows = true,
  dots = true,
  className,
}: {
  children: ReactNode;
  /** Nome do conjunto: "Destaques do mês". */
  label: string;
  perView?: number;
  perViewMobile?: number;
  gap?: number;
  /** Intervalo em ms. Pausa no hover/foco e com movimento reduzido. */
  autoplay?: number;
  arrows?: boolean;
  dots?: boolean;
  className?: string;
}) {
  const items = Children.toArray(children);
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const n = width && width < 640 ? perViewMobile : perView;
  const pages = Math.max(1, items.length - n + 1);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = (i + pages) % pages;
      const child = track.children[clamped] as HTMLElement | undefined;
      track.scrollTo({ left: child ? child.offsetLeft - track.offsetLeft : 0, behavior: reduced ? "auto" : "smooth" });
    },
    [pages, reduced],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const on = () => {
      const w = track.clientWidth;
      const step = (w + gap) / n;
      setIndex(Math.min(pages - 1, Math.round(track.scrollLeft / (step || 1))));
    };
    track.addEventListener("scroll", on, { passive: true });
    return () => track.removeEventListener("scroll", on);
  }, [gap, n, pages]);

  useEffect(() => {
    if (!autoplay || paused || reduced || pages < 2) return;
    const t = setInterval(() => goTo(index + 1), autoplay);
    return () => clearInterval(t);
  }, [autoplay, paused, reduced, index, pages, goTo]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") goTo(index + 1);
    else if (e.key === "ArrowLeft") goTo(index - 1);
    else return;
    e.preventDefault();
  };

  const arrow = "absolute top-1/2 z-[2] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-raised backdrop-blur hover:bg-surface disabled:opacity-0 sm:flex";

  return (
    <section
      ref={wrapRef}
      aria-roledescription="carrossel"
      aria-label={label}
      className={cn("relative min-w-0", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        role="group"
        aria-label={`${label}: slides`}
        tabIndex={0}
        onKeyDown={onKey}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-xl outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-muted/40 [&::-webkit-scrollbar]:hidden"
        style={{ gap }}
      >
        {items.map((child, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${items.length}`}
            className="min-w-0 shrink-0 snap-start"
            style={{ flexBasis: `calc((100% - ${gap * (n - 1)}px) / ${n})` }}
          >
            {child}
          </div>
        ))}
      </div>
      {arrows && pages > 1 && (
        <>
          <button type="button" aria-label="Anterior" onClick={() => goTo(index - 1)} disabled={!autoplay && index === 0} className={cn(arrow, "left-3")}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Próximo" onClick={() => goTo(index + 1)} disabled={!autoplay && index >= pages - 1} className={cn(arrow, "right-3")}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      {dots && pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" role="group" aria-label="Escolher slide">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => goTo(i)}
              className={cn("h-1.5 rounded-full transition-all duration-200", i === index ? "w-5 bg-ink" : "w-1.5 bg-line-strong hover:bg-ink-soft")}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Slides                                                              */
/* ------------------------------------------------------------------ */

/** Tamanho de desenho de todo slide. O visualizador escala para caber. */
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

type SlideTheme = "light" | "navy" | "soft";
const slideTheme: Record<SlideTheme, string> = {
  light: "bg-surface text-ink",
  navy: "bg-navy text-white",
  soft: "bg-soft text-ink",
};

/**
 * Tela base de um slide (1280×720). Linguagem do DS: margem de 80px,
 * Figtree, título grande com tracking negativo, fio dourado como marca.
 * `footer` = rodapé discreto (fonte do dado, nome do deck).
 */
export function Slide({ theme = "light", children, footer, className }: { theme?: SlideTheme; children: ReactNode; footer?: ReactNode; className?: string }) {
  return (
    <div className={cn("relative flex flex-col overflow-hidden font-sans", slideTheme[theme], className)} style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, padding: "72px 80px 56px" }}>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer && <div className={cn("mt-6 flex items-center justify-between text-[15px]", theme === "navy" ? "text-white/45" : "text-muted")}>{footer}</div>}
    </div>
  );
}

/** Rótulo pequeno acima do título do slide, com fio dourado. */
function SlideKicker({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className={cn("mb-6 flex items-center gap-3 text-[16px] font-medium uppercase tracking-[0.14em]", dark ? "text-accent" : "text-accent-deep")}>
      <span className="h-[2px] w-10 bg-accent" />
      {children}
    </div>
  );
}

/** Capa ou abertura de seção. */
export function SlideTitle({ kicker, title, subtitle, theme = "navy", footer }: { kicker?: ReactNode; title: ReactNode; subtitle?: ReactNode; theme?: SlideTheme; footer?: ReactNode }) {
  const dark = theme === "navy";
  return (
    <Slide theme={theme} footer={footer}>
      <div className="flex flex-1 flex-col justify-end">
        {kicker && <SlideKicker dark={dark}>{kicker}</SlideKicker>}
        <div role="heading" aria-level={2} className="m-0 max-w-[1000px] text-[76px] font-semibold tracking-[-0.035em]" style={{ lineHeight: 1.04 }}>{title}</div>
        {subtitle && <p style={{ lineHeight: 1.45 }} className={cn("m-0 mt-7 max-w-[820px] text-[26px]", dark ? "text-white/70" : "text-muted")}>{subtitle}</p>}
      </div>
    </Slide>
  );
}

/** Título + lista de pontos (até 5). */
export function SlideBullets({ kicker, title, items, theme = "light", footer }: { kicker?: ReactNode; title: ReactNode; items: ReactNode[]; theme?: SlideTheme; footer?: ReactNode }) {
  const dark = theme === "navy";
  return (
    <Slide theme={theme} footer={footer}>
      {kicker && <SlideKicker dark={dark}>{kicker}</SlideKicker>}
      <div role="heading" aria-level={3} className="m-0 max-w-[1000px] text-[48px] font-semibold tracking-[-0.03em]" style={{ lineHeight: 1.12 }}>{title}</div>
      <ul className="mt-12 flex list-none flex-col gap-6 p-0">
        {items.map((it, i) => (
          <li key={i} className="flex items-baseline gap-5 text-[26px] leading-snug">
            <span className={cn("w-9 shrink-0 text-[20px] font-semibold tabular-nums", dark ? "text-accent" : "text-accent-deep")}>{String(i + 1).padStart(2, "0")}</span>
            <span className={dark ? "text-white/85" : "text-ink-soft"}>{it}</span>
          </li>
        ))}
      </ul>
    </Slide>
  );
}

/** Duas colunas: texto à esquerda, gráfico/imagem/tabela à direita. */
export function SlideSplit({ kicker, title, left, right, theme = "light", footer }: { kicker?: ReactNode; title: ReactNode; left: ReactNode; right: ReactNode; theme?: SlideTheme; footer?: ReactNode }) {
  const dark = theme === "navy";
  return (
    <Slide theme={theme} footer={footer}>
      {kicker && <SlideKicker dark={dark}>{kicker}</SlideKicker>}
      <div role="heading" aria-level={3} className="m-0 max-w-[1000px] text-[44px] font-semibold tracking-[-0.03em]" style={{ lineHeight: 1.12 }}>{title}</div>
      <div className="mt-10 grid min-h-0 flex-1 grid-cols-[5fr_7fr] gap-14">
        <div className={cn("text-[22px] leading-[1.55]", dark ? "text-white/80" : "text-ink-soft")}>{left}</div>
        <div className="min-h-0 min-w-0">{right}</div>
      </div>
    </Slide>
  );
}

/** Números grandes (2–4) com rótulo e variação. */
export function SlideStat({
  kicker,
  title,
  stats,
  theme = "light",
  footer,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  stats: { label: ReactNode; value: ReactNode; delta?: ReactNode; good?: boolean }[];
  theme?: SlideTheme;
  footer?: ReactNode;
}) {
  const dark = theme === "navy";
  return (
    <Slide theme={theme} footer={footer}>
      {kicker && <SlideKicker dark={dark}>{kicker}</SlideKicker>}
      <div role="heading" aria-level={3} className="m-0 max-w-[1000px] text-[44px] font-semibold tracking-[-0.03em]" style={{ lineHeight: 1.12 }}>{title}</div>
      <div className="mt-auto grid gap-10" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0,1fr))` }}>
        {stats.map((s, i) => (
          <div key={i} className={cn("border-t-2 pt-6", dark ? "border-white/15" : "border-line")}>
            <div className="text-[80px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{s.value}</div>
            <div className={cn("mt-4 text-[20px]", dark ? "text-white/70" : "text-muted")}>{s.label}</div>
            {/* ds-audit-ignore * : verde claro legível sobre slide navy; 19px na escala do canvas 1280 */}
            {s.delta && <div className={cn("mt-2 text-[19px] font-medium", s.good === false ? "text-rose" : s.good ? (dark ? "text-[#8fd19e]" : "text-ok") : dark ? "text-white/70" : "text-ink-soft")}>{s.delta}</div>}
          </div>
        ))}
      </div>
    </Slide>
  );
}

/** Citação (cliente, pesquisa, entrevista). */
export function SlideQuote({ quote, author, role, theme = "soft", footer }: { quote: ReactNode; author: ReactNode; role?: ReactNode; theme?: SlideTheme; footer?: ReactNode }) {
  const dark = theme === "navy";
  return (
    <Slide theme={theme} footer={footer}>
      <div className="flex flex-1 flex-col justify-center">
        <span aria-hidden className={cn("text-[140px] font-semibold leading-[0.6]", dark ? "text-accent" : "text-accent")}>“</span>
        <blockquote className="m-0 mt-6 max-w-[1000px] text-[44px] font-medium leading-[1.25] tracking-[-0.02em]">{quote}</blockquote>
        <div className="mt-10 text-[22px]">
          <span className="font-semibold">{author}</span>
          {role && <span className={dark ? "text-white/60" : "text-muted"}> · {role}</span>}
        </div>
      </div>
    </Slide>
  );
}

/** Renderiza um slide de 1280×720 escalado para a largura disponível. */
export function SlideCanvas({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const scale = width / SLIDE_WIDTH;
  return (
    <div ref={ref} className={cn("relative w-full overflow-hidden", className)} style={{ aspectRatio: "16 / 9", ...style }}>
      {width > 0 && (
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, transform: `scale(${scale})` }}>
          {children}
        </div>
      )}
    </div>
  );
}

export type DeckSlide = { id: string; title: string; content: ReactNode; notes?: ReactNode };

/**
 * Visualizador de apresentação: palco 16:9, miniaturas, ←/→ (e PageUp/Down,
 * Home/End), F para tela cheia, barra de progresso, contador e notas do
 * apresentador. Os slides são componentes (Slide*), então o deck é código:
 * versionável, com dados reais e na linguagem do DS.
 */
export function SlideDeck({
  slides,
  title,
  initial = 0,
  showNotes: notesDefault = false,
  className,
}: {
  slides: DeckSlide[];
  title: string;
  initial?: number;
  showNotes?: boolean;
  className?: string;
}) {
  const [index, setIndex] = useState(Math.min(initial, slides.length - 1));
  const [notes, setNotes] = useState(notesDefault);
  const [full, setFull] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const go = (i: number) => setIndex(Math.max(0, Math.min(slides.length - 1, i)));

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  useEffect(() => {
    railRef.current?.querySelector<HTMLElement>(`[data-slide="${index}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [index]);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stageRef.current?.requestFullscreen?.();
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, () => void> = {
      ArrowRight: () => go(index + 1),
      ArrowDown: () => go(index + 1),
      PageDown: () => go(index + 1),
      " ": () => go(index + 1),
      ArrowLeft: () => go(index - 1),
      ArrowUp: () => go(index - 1),
      PageUp: () => go(index - 1),
      Home: () => go(0),
      End: () => go(slides.length - 1),
      f: toggleFull,
      F: toggleFull,
    };
    if (map[e.key] && !(e.target as HTMLElement).closest("button")) {
      e.preventDefault();
      map[e.key]();
    }
  };
  const current = slides[index];
  const tool = "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-muted hover:bg-soft hover:text-ink aria-pressed:bg-soft aria-pressed:text-ink [&_svg]:h-4 [&_svg]:w-4";

  return (
    <section
      aria-roledescription="apresentação"
      aria-label={title}
      // section rotulada = região; focável para navegar pelos slides com as setas
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onKeyDown={onKey}
      className={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface outline-none focus-visible:ring-2 focus-visible:ring-muted/30", className)}
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
        <Presentation className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        <p className="m-0 min-w-0 flex-1 truncate text-[13.5px] font-medium">{title}</p>
        <span className="text-[12px] tabular-nums text-muted" aria-live="polite">
          {index + 1} / {slides.length}
        </span>
        <span aria-hidden className="mx-1 h-4 w-px bg-line" />
        <button type="button" aria-pressed={notes} onClick={() => setNotes((n) => !n)} className={tool}>
          <NotebookText /> <span className="hidden sm:inline">Notas</span>
        </button>
        <button type="button" onClick={toggleFull} className={tool} aria-label="Tela cheia (F)" title="Tela cheia (F)">
          <Maximize2 />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        <div ref={railRef} className="flex shrink-0 gap-2 overflow-x-auto border-t border-line bg-soft/50 p-2.5 md:w-[188px] md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-r md:border-t-0" role="tablist" aria-label="Slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              data-slide={i}
              onClick={() => go(i)}
              className="group flex w-[132px] shrink-0 items-start gap-2 text-left md:w-full"
            >
              <span className={cn("mt-0.5 w-4 shrink-0 text-right text-[11px] tabular-nums", i === index ? "font-semibold text-ink" : "text-muted")}>{i + 1}</span>
              <span className={cn("block min-w-0 flex-1 overflow-hidden rounded-md ring-1 transition-shadow", i === index ? "ring-2 ring-accent" : "ring-line group-hover:ring-line-strong")}>
                <SlideCanvas>{s.content}</SlideCanvas>
              </span>
              <span className="sr-only">{s.title}</span>
            </button>
          ))}
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-soft/60">
          <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6">
            <div ref={stageRef} className={cn("relative w-full", full ? "flex h-full items-center justify-center bg-graph" : "max-w-[1100px]")}>
              <div className={cn("w-full overflow-hidden bg-surface", full ? "" : "rounded-lg shadow-raised ring-1 ring-line")} style={full ? { maxWidth: "calc(100dvh * 16 / 9)" } : undefined}>
                <SlideCanvas key={current.id} className="animate-fade">
                  {current.content}
                </SlideCanvas>
              </div>
              {full && (
                <button type="button" onClick={toggleFull} aria-label="Sair da tela cheia" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20">
                  <Minimize2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 px-3 pb-3 sm:px-6">
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Slide anterior" className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink hover:bg-soft disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Progresso da apresentação" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={slides.length}>
              <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
            </div>
            <button type="button" onClick={() => go(index + 1)} disabled={index === slides.length - 1} aria-label="Próximo slide" className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink hover:bg-soft disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {notes && (
            <div className="max-h-[30%] shrink-0 overflow-y-auto border-t border-line bg-surface px-5 py-3.5">
              <p className="m-0 mb-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">Notas do apresentador · {current.title}</p>
              <div className="text-[13px] leading-relaxed text-ink-soft">{current.notes ?? <span className="text-muted">Sem notas neste slide.</span>}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ImageGallery                                                        */
/* ------------------------------------------------------------------ */

/** Grade de imagens que abre em Lightbox. Recorte quadrado ou 4:3. */
export function ImageGallery({ images, columns = 4, ratio = 4 / 3, className }: { images: LightboxImage[]; columns?: 2 | 3 | 4 | 5; ratio?: number; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-3 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5" }[columns];
  return (
    <>
      <ul className={cn("grid list-none grid-cols-2 gap-2 p-0", cols, className)}>
        {images.map((img, i) => (
          <li key={img.src}>
            <button type="button" onClick={() => setOpen(i)} className="group block w-full overflow-hidden rounded-xl border border-line bg-soft outline-none focus-visible:ring-2 focus-visible:ring-muted/50" style={{ aspectRatio: String(ratio) }} aria-label={`Ampliar: ${img.alt}`}>
              <img src={img.src} alt={img.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox images={images} index={open} onIndexChange={setOpen} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* FileCard                                                            */
/* ------------------------------------------------------------------ */

/** 1536000 → "1,5 MB" */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${formatNumber(v, v < 10 ? 1 : 0)} ${units[u]}`;
}

type FileKind = "pdf" | "sheet" | "doc" | "image" | "video" | "archive" | "slides" | "other";
const kindOf = (name: string): FileKind => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "sheet";
  if (["doc", "docx", "txt", "md", "odt", "rtf"].includes(ext)) return "doc";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext)) return "image";
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["ppt", "pptx", "key", "odp"].includes(ext)) return "slides";
  return "other";
};
const kindStyle: Record<FileKind, { icon: ReactNode; cls: string; label: string }> = {
  pdf: { icon: <FileText />, cls: "bg-rose-soft text-rose", label: "PDF" },
  sheet: { icon: <FileSpreadsheet />, cls: "bg-ok-soft text-ok", label: "Planilha" },
  doc: { icon: <FileText />, cls: "bg-info-soft text-blue", label: "Documento" },
  image: { icon: <FileImage />, cls: "bg-accent-soft text-accent-deep", label: "Imagem" },
  video: { icon: <FileVideo />, cls: "bg-clay-soft text-clay", label: "Vídeo" },
  archive: { icon: <FileArchive />, cls: "bg-soft text-ink-soft", label: "Compactado" },
  slides: { icon: <Presentation />, cls: "bg-amber-soft text-amber", label: "Apresentação" },
  other: { icon: <File />, cls: "bg-soft text-muted", label: "Arquivo" },
};

/** Ícone de tipo de arquivo (pela extensão). */
export function FileIcon({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const k = kindStyle[kindOf(name)];
  const dim = { sm: "h-7 w-7 rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5", md: "h-9 w-9 rounded-lg [&_svg]:h-4 [&_svg]:w-4", lg: "h-12 w-12 rounded-xl [&_svg]:h-6 [&_svg]:w-6" }[size];
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center", dim, k.cls)}>
      {k.icon}
    </span>
  );
}

/**
 * Arquivo anexado: tipo, nome, tamanho, quem/quando. `progress` durante o
 * envio, `error` se falhou (com ação de tentar de novo em `actions`).
 * `variant="tile"` para grade; `row` para lista.
 */
export function FileCard({
  name,
  size,
  meta,
  href,
  actions,
  progress,
  error,
  preview,
  variant = "row",
  onOpen,
  selected,
  className,
}: {
  name: string;
  size?: number;
  meta?: ReactNode;
  href?: string;
  actions?: ReactNode;
  /** 0–100 enquanto envia. */
  progress?: number;
  error?: string;
  /** Miniatura (img) no modo tile. */
  preview?: string;
  variant?: "row" | "tile";
  onOpen?: () => void;
  selected?: boolean;
  className?: string;
}) {
  const kind = kindStyle[kindOf(name)];
  const sub = error ? (
    <span className="text-rose">{error}</span>
  ) : progress != null && progress < 100 ? (
    <span className="tabular-nums">Enviando… {Math.round(progress)}%</span>
  ) : (
    <>
      {kind.label}
      {size != null && <> · {formatBytes(size)}</>}
      {meta && <> · {meta}</>}
    </>
  );
  const title = href ? (
    <a href={href} className="card-primary-link truncate text-[13.5px] font-medium text-ink hover:underline" download>
      {name}
    </a>
  ) : onOpen ? (
    <button type="button" onClick={onOpen} className="card-primary-link block w-full truncate text-left text-[13.5px] font-medium text-ink">
      {name}
    </button>
  ) : (
    <span className="block truncate text-[13.5px] font-medium">{name}</span>
  );
  const bar =
    progress != null && progress < 100 && !error ? (
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={`Enviando ${name}`} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
    ) : null;

  if (variant === "tile")
    return (
      <div className={cn("linked-card surface-card group relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-surface", selected ? "border-ink ring-1 ring-ink" : error ? "border-rose/30" : "border-line", (href || onOpen) && "surface-interactive hover:border-line-strong", className)}>
        <div className="flex aspect-[4/3] items-center justify-center border-b border-line bg-soft/60">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <FileIcon name={name} size="lg" />}
        </div>
        <div className="flex min-w-0 items-start gap-2 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            {title}
            <div className="mt-0.5 truncate text-[11.5px] text-muted">{sub}</div>
            {bar}
          </div>
          {actions && <div className="relative z-[1] -mr-1 shrink-0">{actions}</div>}
        </div>
      </div>
    );

  return (
    <div className={cn("linked-card flex min-w-0 items-center gap-3 rounded-xl border bg-surface px-3 py-2.5", selected ? "border-ink ring-1 ring-ink" : error ? "border-rose/30" : "border-line", (href || onOpen) && "surface-interactive hover:border-line-strong", className)}>
      <FileIcon name={name} />
      <div className="min-w-0 flex-1">
        {title}
        <div className="mt-0.5 truncate text-[12px] text-muted">{sub}</div>
        {bar}
      </div>
      {actions && <div className="relative z-[1] flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
