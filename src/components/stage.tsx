"use client";

import { ArrowUpRight } from "lucide-react";
import type { ComponentProps, CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { Button } from "./primitives";

/*
 * Camada expressiva (palcos). Para páginas públicas (anatomia I), boas-vindas,
 * onboarding e estados vazios de destaque: o produto em cena, sobre uma
 * paisagem feita de tokens. Nunca atrás de dados de trabalho (lista, tabela,
 * formulário, painel). CSS em src/styles/stage.css; regras em
 * docs/padroes/palcos.md.
 */

export type StageTone = "dawn" | "sea" | "dusk" | "brand";

/**
 * Palco: superfície expressiva com céu, dois morros e grão, todos de tokens
 * (segue tema e marca). Ponha nele peças reais do produto (`Glass`), figuras
 * (`FloatingFigure`) ou uma demonstração. Tons: `dawn` (padrão), `sea`,
 * `dusk`, `brand` (tinge pelo primary da marca). Um palco por dobra; nunca
 * atrás de dados de trabalho.
 */
export function Stage({
  tone = "dawn",
  grain = true,
  as: Tag = "div",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & {
  tone?: StageTone;
  /** Grão sutil que faz o gradiente ler como imagem. Padrão: ligado. */
  grain?: boolean;
  as?: ElementType;
}) {
  return (
    <Tag className={cn("ds-stage", className)} data-tone={tone === "dawn" ? undefined : tone} data-grain={grain ? "" : undefined} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Céu do hero: a luz do palco de ponta a ponta, sem borda, sumindo na página
 * embaixo. Envolve o hero inteiro (título, CTAs, cena). Sob um cabeçalho fixo
 * transparente, use `-mt-16 pt-16` para o céu passar por trás dele.
 */
export function StageSky({ grain = false, as: Tag = "section", className, children, ...rest }: HTMLAttributes<HTMLElement> & { grain?: boolean; as?: ElementType }) {
  return (
    <Tag className={cn("ds-sky", className)} data-grain={grain ? "" : undefined} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Vidro: uma peça do produto sobre o palco (cartão de rotina, aprovação,
 * notificação), fosca para a paisagem aparecer atrás. `solid` troca o blur por
 * tinta: use em peças que se movem ou ficam dentro de algo que anima (o blur
 * recalcula a cada quadro).
 */
export function Glass({ solid, as: Tag = "div", className, children, ...rest }: HTMLAttributes<HTMLElement> & { solid?: boolean; as?: ElementType }) {
  return (
    <Tag className={cn("ds-glass rounded-2xl", className)} data-solid={solid ? "" : undefined} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Sobretítulo de seção pública: monoespaçado, caixa alta, com o número do
 * capítulo ("01 / Na prática"). Ritmo de leitura, não navegação.
 */
export function Kicker({ index, children, className }: { index?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <p className={cn("m-0 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft", className)}>
      {index != null && <>{index} / </>}
      {children}
    </p>
  );
}

/** Título de capítulo e de chamada final: 34 px no celular, 48 px a partir de 640 px. */
export const chapterTitleClass = "m-0 text-balance text-[34px] font-medium leading-[1.04] tracking-[-0.035em] sm:text-[48px]";

/**
 * Capítulo de página pública: uma ideia por seção. Sobretítulo, uma frase de
 * título e um parágrafo curto ao lado da cena que mostra a ideia (um `Stage`
 * com o produto). `flip` alterna o lado; `wide` dá mais espaço à cena. No
 * celular o texto vem antes da cena. `id` torna o capítulo alvo da navegação
 * do `SiteHeader` (com folga para o cabeçalho fixo).
 */
export function Chapter({
  id,
  index,
  kicker,
  title,
  description,
  children,
  flip,
  wide,
  className,
}: {
  id?: string;
  /** Número do capítulo no sobretítulo ("01"). */
  index?: ReactNode;
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** A cena: em geral um `Stage` com peças reais do produto. */
  children?: ReactNode;
  flip?: boolean;
  wide?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto grid max-w-[1200px] scroll-mt-20 items-center gap-8 px-4 py-14 sm:px-8 lg:gap-16 lg:py-20",
        children ? (wide ? "lg:grid-cols-[0.8fr_1.4fr]" : "lg:grid-cols-[1fr_1.2fr]") : undefined,
        className,
      )}
    >
      <div className={cn("grid max-w-[480px] gap-4", flip && "lg:order-2")}>
        {kicker && <Kicker index={index}>{kicker}</Kicker>}
        <h2 className={chapterTitleClass}>{title}</h2>
        {description && <p className="m-0 text-[17px] leading-[1.55] text-ink-soft">{description}</p>}
      </div>
      {children && <div className="min-w-0">{children}</div>}
    </section>
  );
}

/**
 * Chamada principal de página pública: pílula com a seta num círculo, que
 * anda e gira no hover. Uma por dobra (hero e chamada final). Com `href`, é
 * link. Ações secundárias ao lado: `Button variant="quiet" shape="pill"`.
 */
export function CtaButton({ children, icon, className, ...rest }: Omit<ComponentProps<typeof Button>, "variant" | "shape" | "size"> & { icon?: ReactNode }) {
  return (
    <Button {...rest} shape="pill" className={cn("group py-1.5! pr-1.5! pl-5!", className)}>
      {children}
      <span className="ds-cta-arrow grid h-7 w-7 place-items-center rounded-full bg-on-primary text-primary" aria-hidden>
        {icon ?? <ArrowUpRight />}
      </span>
    </Button>
  );
}

export type SiteHeaderLink = { label: string; href?: string; onSelect?: () => void };

/**
 * Cabeçalho de site público (anatomia I). No topo, ocupa a largura sem fundo
 * sobre o céu do hero; com `floating` (a página rolou, ver `useScrolled`),
 * recolhe numa pílula de vidro. A linha mantém 64 px nos dois estados: nada
 * abaixo se move. No celular mostra só a marca e as ações.
 */
export function SiteHeader({
  brand,
  links = [],
  actions,
  floating = false,
  label = "Seções",
  className,
}: {
  /** Marca: logo + nome do produto. */
  brand: ReactNode;
  /** Seções da página (rolagem) ou páginas do site. Até 6. */
  links?: SiteHeaderLink[];
  /** Entrar / começar: um `Button size="sm" shape="pill"`. */
  actions?: ReactNode;
  /** A página rolou: o cabeçalho vira pílula flutuante. */
  floating?: boolean;
  /** Nome acessível da navegação. */
  label?: string;
  className?: string;
}) {
  return (
    <header className={cn("sticky top-0 z-[var(--z-sticky-shell)] flex h-16 items-center px-3 sm:px-6", className)}>
      <div
        className={cn(
          "ds-site-header-bar mx-auto flex w-full items-center gap-6 rounded-full border",
          floating ? "h-12 max-w-[920px] border-line/70 bg-surface/75 pr-1.5 pl-3.5 shadow-overlay backdrop-blur-xl sm:pl-4" : "h-16 max-w-[1200px] border-transparent px-1 sm:px-2",
        )}
        data-floating={floating ? "" : undefined}
      >
        <span className="flex min-w-0 items-center gap-2.5">{brand}</span>
        {links.length > 0 && (
          <nav aria-label={label} className={cn("mx-auto hidden items-center gap-0.5 rounded-full border p-1 transition-colors duration-500 md:flex", floating ? "border-transparent" : "border-line bg-surface/70")}>
            {links.map((link) => (
              <Button key={link.label} variant="quiet" size="sm" shape="pill" href={link.href} onClick={link.onSelect} className="min-h-8! py-1!">
                {link.label}
              </Button>
            ))}
          </nav>
        )}
        {actions && <div className={cn("flex items-center gap-2", links.length > 0 ? "ml-auto md:ml-0" : "ml-auto")}>{actions}</div>}
      </div>
    </header>
  );
}

/**
 * Figura que flutua sobre o palco (rosto de agente, ícone de app, peça), com
 * a sombra no chão respirando junto. `delay` (0–2) desencontra vizinhas;
 * `paused` para a figura quando ela sai de cena ou fica atrás de um véu.
 */
export function FloatingFigure({ children, delay = 0, shadow = true, paused, className }: { children: ReactNode; delay?: 0 | 1 | 2; shadow?: boolean; paused?: boolean; className?: string }) {
  const data = { "data-delay": delay || undefined, "data-paused": paused ? "" : undefined };
  return (
    <span className={cn("flex flex-col items-center", className)}>
      <span className="ds-float" {...data}>
        {children}
      </span>
      {shadow && <span className="ds-float-shadow" aria-hidden {...data} />}
    </span>
  );
}

/**
 * Balão de fala sobre quem fala (uma figura no palco). `side` alinha a ponta
 * ao falante. Ao trocar a fala, mantenha o balão anterior com `leaving` até a
 * animação terminar (`useOutgoing` + `onAnimationEnd`): um balão nunca some
 * de repente.
 * `live` anuncia a fala nova a leitores de tela.
 */
export function SpeechBubble({
  side = "center",
  leaving,
  live,
  children,
  className,
  style,
  onAnimationEnd,
}: {
  side?: "left" | "center" | "right";
  leaving?: boolean;
  live?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onAnimationEnd?: () => void;
}) {
  return (
    <p
      className={cn("ds-bubble m-0 rounded-2xl bg-surface px-4 py-2.5 text-[14px] leading-snug text-ink shadow-overlay", !leaving && "enter", className)}
      data-side={side}
      data-leaving={leaving ? "" : undefined}
      aria-live={live && !leaving ? "polite" : undefined}
      aria-hidden={leaving || undefined}
      style={style}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </p>
  );
}
