"use client";

import { Award, Crown, Sparkles } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { AiOrb, BrandHaze } from "./g4os";

type BrandTone = "kv" | "navy";
const ToneCtx = createContext<BrandTone>("navy");

/*
 * Momentos de marca G4. O tom padrão é o do KV G4 OS: gelo, névoa quente,
 * orb azul e título no gradiente de marca. `tone="navy"` mantém o painel
 * Navy Blue + Royal Gold + Royal Silver do manual de marca. São exceções intencionais numa interface neutra — capa, login,
 * conclusão de onboarding, capa de relatório, saudação da IA, conquista.
 * Regra (docs/fundamentos/marca.md): no máximo UM momento de marca por tela.
 */

/**
 * Painel de momento de marca. `tone="kv"` (padrão): gelo com névoa, orb da
 * IA e título no gradiente do KV. `tone="navy"`: painel escuro com brilho
 * dourado e grade fina (--ds-brand, texto em Royal Silver).
 */
export function BrandPanel({
  children,
  kicker,
  title,
  description,
  actions,
  glow = "top-right",
  grid = true,
  size = "md",
  tone = "kv",
  className,
}: {
  /** "kv" (padrão, claro) ou "navy" (painel escuro do manual de marca). */
  tone?: BrandTone;
  children?: ReactNode;
  kicker?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Onde fica o brilho dourado. "none" para um painel liso. */
  glow?: "top-right" | "top" | "bottom-left" | "none";
  /** Grade fina de fundo (textura de "papel técnico"). */
  grid?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const glowPos = { "top-right": "100% 0%", top: "50% 0%", "bottom-left": "0% 100%", none: "" }[glow];
  const pad = { sm: "p-5", md: "p-6 sm:p-8", lg: "p-8 sm:p-12" }[size];
  if (tone === "kv") {
    const orbAt = { "top-right": { right: "-12%", top: "-40%" }, top: { left: "50%", top: "-55%", marginLeft: -170 }, "bottom-left": { left: "-12%", bottom: "-45%" }, none: null }[glow];
    return (
      <ToneCtx.Provider value="kv">
        <section className={cn("relative isolate overflow-hidden rounded-2xl border border-line bg-page text-ink", pad, className)}>
          {glow !== "none" && <BrandHaze size={640} className="absolute -z-10" style={{ right: "-20%", top: "-60%" }} />}
          {orbAt && <AiOrb size={340} blur={18} className="absolute -z-10 opacity-60" style={orbAt} />}
          {kicker && <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-accent-deep">{kicker}</p>}
          {title && (
            <h2 className="m-0 text-balance text-[22px] leading-tight sm:text-[28px]" style={{ fontFamily: "var(--ds-font-display)", fontWeight: "var(--ds-display-weight)" as never, letterSpacing: "var(--ds-display-tracking)" }}>
              <span className="ds-gradient-text">{title}</span>
            </h2>
          )}
          {description && <p className="m-0 mt-2 max-w-[560px] text-[14px] leading-relaxed text-ink-soft">{description}</p>}
          {children && <div className={cn(title || description ? "mt-5" : undefined)}>{children}</div>}
          {actions && <div className="mt-6 flex flex-wrap gap-2">{actions}</div>}
        </section>
      </ToneCtx.Provider>
    );
  }
  return (
    <ToneCtx.Provider value="navy">
    <section className={cn("relative isolate overflow-hidden rounded-2xl bg-brand text-on-brand", pad, className)}>
      {glow !== "none" && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{ background: `radial-gradient(60% 70% at ${glowPos}, color-mix(in oklab, var(--ds-brand-accent) 26%, transparent), transparent 70%)` }}
        />
      )}
      {grid && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, var(--ds-on-brand) 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--ds-on-brand) 6%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
      )}
      {kicker && <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-brand-accent">{kicker}</p>}
      {title && (
        <h2 className="m-0 text-balance text-[22px] leading-tight sm:text-[26px]" style={{ fontFamily: "var(--ds-font-display)", fontWeight: "var(--ds-display-weight)" as never, letterSpacing: "var(--ds-display-tracking)" }}>
          {title}
        </h2>
      )}
      {description && <p className="m-0 mt-2 max-w-[560px] text-[14px] leading-relaxed text-on-brand/75">{description}</p>}
      {children && <div className={cn(title || description ? "mt-5" : undefined)}>{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap gap-2">{actions}</div>}
    </section>
    </ToneCtx.Provider>
  );
}

/**
 * Botão para usar DENTRO de BrandPanel. "gold" = ação principal do momento
 * de marca (Navy no tom KV, dourado no navy); "ghost" = secundária.
 */
export function BrandButton({
  children,
  variant = "gold",
  onClick,
  href,
  className,
}: {
  children: ReactNode;
  variant?: "gold" | "ghost";
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const tone = useContext(ToneCtx);
  const look =
    tone === "kv"
      ? variant === "gold"
        ? "bg-primary text-on-primary shadow-surface hover:bg-primary/90"
        : "bg-surface text-ink ring-1 ring-line-strong hover:bg-soft"
      : variant === "gold"
        ? "bg-brand-accent text-brand hover:bg-brand-accent/90"
        : "text-on-brand ring-1 ring-on-brand/25 hover:bg-on-brand/10";
  const cls = cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-[13.5px] font-medium transition-colors [&_svg]:h-4 [&_svg]:w-4", look, className);
  return href ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/**
 * Selo de marca: Premium, Founders, Conquista. Contorno dourado, sem
 * preenchimento forte — destaca sem gritar.
 */
export function BrandBadge({ children, kind = "premium", className }: { children?: ReactNode; kind?: "premium" | "founders" | "conquista"; className?: string }) {
  const Icon = kind === "founders" ? Crown : kind === "conquista" ? Award : Sparkles;
  const label = children ?? { premium: "Premium", founders: "Founders", conquista: "Conquista" }[kind];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5 ring-1",
        kind === "founders" ? "bg-founders/[0.06] text-founders ring-founders/25" : "bg-accent-soft text-accent-deep ring-accent/40",
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

/**
 * Conquista/marco atingido: ícone dourado em navy + texto. Use em feeds,
 * conclusão de meta, fim de onboarding — nunca como card de lista comum.
 */
export function AchievementCard({ title, description, icon, meta, className }: { title: ReactNode; description?: ReactNode; icon?: ReactNode; meta?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border border-accent/30 bg-surface p-4", className)}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-deep ring-1 ring-accent/30 [&_svg]:h-5 [&_svg]:w-5">{icon ?? <Award aria-hidden />}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium leading-snug">{title}</div>
        {description && <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{description}</div>}
      </div>
      {meta && <div className="shrink-0 text-[11.5px] tabular-nums text-muted">{meta}</div>}
    </div>
  );
}
