"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useReducedMotion } from "../lib/motion";
import { Button } from "./primitives";

/*
 * Ilustração em traço e cartão de primeira execução (camada expressiva:
 * onboarding, boas-vindas, estado vazio de destaque — regra 22a). Nunca atrás
 * de lista, tabela, formulário ou painel.
 */

/**
 * Traço de uma cena. Texto = caminho SVG em traço; objeto para dar um
 * preenchimento suave (`soft`, gelo translúcido) ou destacar o traço na cor
 * de destaque (`accent`).
 */
export type IllustrationPath = string | { d: string; tone?: "soft" | "accent" };

/** Quadro da ilustração: `label` vira o nome acessível (`role="img"`). Caminhos em viewBox 200 × 140. */
export type IllustrationFrame = { label: string; paths: IllustrationPath[] };

const dOf = (p: IllustrationPath) => (typeof p === "string" ? p : p.d);
const toneOf = (p: IllustrationPath) => (typeof p === "string" ? undefined : p.tone);
/** Assinatura de um caminho: letras de comando + quantidade de números. Igual = dá para fazer morph. */
const signature = (d: string) => `${d.replace(/[^a-zA-Z]/g, "")}:${(d.match(/-?\d*\.?\d+/g) ?? []).length}`;
const morphable = (frames: IllustrationFrame[]) =>
  frames.length > 1 &&
  frames.every((f) => f.paths.length === frames[0].paths.length) &&
  frames[0].paths.every((_, i) => frames.every((f) => signature(dOf(f.paths[i])) === signature(dOf(frames[0].paths[i]))));

const fillOf = (tone?: "soft" | "accent") => (tone === "soft" ? "color-mix(in oklab, currentColor 7%, transparent)" : "none");
const strokeOf = (tone?: "soft" | "accent") => (tone === "accent" ? "var(--color-accent-deep)" : "currentColor");

/**
 * Ilustração em traço que transiciona entre quadros quando `index` muda:
 * troca cruzada com leve deslocamento e escala, elemento a elemento; quando
 * todos os quadros têm caminhos de mesma estrutura, os traços se transformam
 * (morph). Com movimento reduzido, troca direta. Cor = `currentColor`
 * (defina com `text-ink`/`text-ink-soft` no pai).
 */
export function MorphIllustration({
  frames,
  index,
  strokeWidth = 2,
  className,
  style,
}: {
  frames: IllustrationFrame[];
  /** Quadro visível (0…frames.length-1). */
  index: number;
  /** Espessura do traço em unidades do viewBox (200 × 140). */
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const at = Math.max(0, Math.min(frames.length - 1, index));
  const current = frames[at];
  const morph = morphable(frames);
  const common = { fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };

  return (
    <svg viewBox="0 0 200 140" role="img" aria-label={current?.label} className={cn("block h-auto w-full overflow-visible", className)} style={style}>
      {morph ? (
        <g {...common}>
          {current.paths.map((p, i) => (
            <path
              key={i}
              d={dOf(p)}
              fill={fillOf(toneOf(p))}
              stroke={strokeOf(toneOf(p))}
              // `d` como propriedade CSS anima o traço onde o navegador suporta; nos outros, troca direta.
              style={{ d: `path("${dOf(p)}")`, transition: reduce ? "none" : "d 480ms cubic-bezier(.2,.7,.2,1), fill 300ms" } as CSSProperties}
            />
          ))}
        </g>
      ) : (
        frames.map((f, k) => {
          const on = k === at;
          return (
            <g key={k} aria-hidden {...common}>
              {f.paths.map((p, i) => (
                <path
                  key={i}
                  d={dOf(p)}
                  fill={fillOf(toneOf(p))}
                  stroke={strokeOf(toneOf(p))}
                  style={{
                    opacity: on ? 1 : 0,
                    transform: on ? "none" : `translateY(${k < at ? -6 : 6}px) scale(.94)`,
                    transformOrigin: "100px 70px",
                    transformBox: "view-box",
                    transition: reduce ? "none" : `opacity 280ms ease ${on ? 90 + i * 35 : 0}ms, transform 420ms cubic-bezier(.2,.7,.2,1) ${on ? 60 + i * 35 : 0}ms`,
                  }}
                />
              ))}
            </g>
          );
        })
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Cenas prontas                                                       */
/* ------------------------------------------------------------------ */

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;

/**
 * Quatro cenas de primeira execução, em traço: pasta (criar espaço), arquivos,
 * equipe e selo de conquista. Use com `MorphIllustration` ou `IntroCard`.
 */
export const onboardingScenes: IllustrationFrame[] = [
  {
    label: "Pasta nova com um sinal de mais",
    paths: [
      { d: "M62 58 V48 a5 5 0 0 1 5 -5 H86 a5 5 0 0 1 4 2 L94 50 H133 a5 5 0 0 1 5 5 V58", tone: "soft" },
      { d: "M66 58 H134 a8 8 0 0 1 8 8 V102 a8 8 0 0 1 -8 8 H66 a8 8 0 0 1 -8 -8 V66 a8 8 0 0 1 8 -8 Z", tone: "soft" },
      "M90 84 H110",
      { d: "M100 14 V32 M91 23 H109", tone: "accent" },
    ],
  },
  {
    label: "Três documentos chegando à pasta",
    paths: [
      { d: "M46 52 H74 L84 62 V108 H46 Z", tone: "soft" },
      "M74 52 V62 H84 M54 76 H76 M54 86 H70",
      { d: "M82 30 H114 L126 42 V114 H82 Z", tone: "soft" },
      "M114 30 V42 H126 M92 60 H116 M92 70 H116 M92 80 H108",
      { d: "M132 50 H156 L164 58 V104 H132 Z", tone: "soft" },
      { d: "M148 70 V90 M140 78 L148 70 L156 78", tone: "accent" },
    ],
  },
  {
    label: "Três pessoas lado a lado, uma sendo convidada",
    paths: [
      { d: circle(100, 50, 13), tone: "soft" },
      "M74 108 V102 a26 24 0 0 1 52 0 V108",
      circle(53, 62, 9.5),
      "M36 108 V104 a17 17 0 0 1 34 0 V108",
      circle(147, 62, 9.5),
      "M130 108 V104 a17 17 0 0 1 34 0 V108",
      { d: "M170 26 V42 M162 34 H178", tone: "accent" },
    ],
  },
  {
    label: "Selo de conquista com fitas e um visto",
    paths: [
      { d: "M88 86 L80 118 L92 111 L99 120 M112 86 L120 118 L108 111 L101 120", tone: "soft" },
      { d: circle(100, 60, 28), tone: "soft" },
      circle(100, 60, 20),
      { d: "M90 60 L97 67 L111 53", tone: "accent" },
      "M52 34 V44 M47 39 H57 M150 30 V38 M146 34 H154 M156 88 V94 M153 91 H159",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* IntroCard                                                           */
/* ------------------------------------------------------------------ */

/** Etapa do `IntroCard`: título, texto e, opcionalmente, o quadro da ilustração. */
export type IntroStep = { title: string; description: ReactNode; frame?: IllustrationFrame };

/**
 * Cartão compacto de primeira execução: ilustração em traço no topo (gelo),
 * "Etapa 1 de 4", título, texto, pontos de etapa, Voltar/Avançar (o último
 * vira "Começar") e "Pular". ←/→ trocam de etapa; o texto da etapa é
 * anunciado (`aria-live`). Controlado (`index` + `onIndexChange`) ou não.
 */
export function IntroCard({
  steps,
  index: controlled,
  onIndexChange,
  defaultIndex = 0,
  onFinish,
  onSkip,
  finishLabel = "Começar",
  skipLabel = "Pular",
  illustration,
  autoFocus = false,
  className,
}: {
  steps: IntroStep[];
  index?: number;
  onIndexChange?: (index: number) => void;
  defaultIndex?: number;
  /** Último passo: "Começar". */
  onFinish?: () => void;
  /** "Pular" no canto da ilustração; sem ele, o botão some. */
  onSkip?: () => void;
  finishLabel?: string;
  skipLabel?: string;
  /** Troca a ilustração padrão (`MorphIllustration` com o `frame` de cada etapa, ou `onboardingScenes`). */
  illustration?: (index: number) => ReactNode;
  /** Foca o cartão ao montar (←/→ funcionam de imediato). Use quando ele abre como diálogo. */
  autoFocus?: boolean;
  className?: string;
}) {
  const [own, setOwn] = useState(defaultIndex);
  const index = Math.max(0, Math.min(steps.length - 1, controlled ?? own));
  const titleId = useId();
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (autoFocus) root.current?.focus();
  }, [autoFocus]);
  const go = (n: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, n));
    if (next === index) return;
    if (controlled == null) setOwn(next);
    onIndexChange?.(next);
  };
  const last = index === steps.length - 1;
  const step = steps[index];
  const frames = steps.map((s, i) => s.frame ?? onboardingScenes[i % onboardingScenes.length]);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable='true']")) return;
    if (e.key === "ArrowRight" && !last) {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      go(index - 1);
    }
  };

  return (
    <section ref={root} tabIndex={-1} aria-labelledby={titleId} onKeyDown={onKeyDown} className={cn("w-full outline-none max-w-[440px] overflow-hidden rounded-2xl border border-line bg-surface shadow-lg shadow-black/5", className)}>
      <div className="relative border-b border-line bg-soft px-10 pb-6 pt-10 text-ink-soft">
        {onSkip && !last && (
          <button
            type="button"
            onClick={onSkip}
            className="absolute right-3 top-3 inline-flex h-8 items-center rounded-lg px-2.5 text-[12.5px] text-muted outline-none hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40"
          >
            {skipLabel}
          </button>
        )}
        <div className="mx-auto max-w-[260px]">{illustration ? illustration(index) : <MorphIllustration frames={frames} index={index} />}</div>
      </div>
      <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
        <div aria-live="polite" className="flex min-h-[124px] flex-col gap-1.5">
          <span className="text-[11.5px] tabular-nums text-muted">
            Etapa {index + 1} de {steps.length}
          </span>
          <h2 id={titleId} className="m-0 text-[18px] font-semibold tracking-tight text-ink">
            {step.title}
          </h2>
          <p className="m-0 text-[13.5px] leading-relaxed text-ink-soft">{step.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex flex-1 items-center gap-1.5">
            {steps.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none", i === index ? "w-5 bg-ink" : "w-1.5 bg-line-strong")} />
            ))}
          </span>
          <Button variant="ghost" onClick={() => go(index - 1)} className={cn(index === 0 && "invisible")}>
            <ArrowLeft /> Voltar
          </Button>
          <Button onClick={() => (last ? onFinish?.() : go(index + 1))}>
            {last ? (
              finishLabel
            ) : (
              <>
                Avançar <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
