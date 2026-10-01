import { ArrowUpRight, Inbox } from "lucide-react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentType,
  ReactNode,
} from "react";
import { cn } from "../lib/cn";

/* ------------------------------------------------------------------ */
/* Link adapter                                                        */
/* ------------------------------------------------------------------ */

/**
 * Componentes que navegam aceitam `href`. Por padrão renderizam `<a>`.
 * Em Next.js, registre o `Link` uma vez, num módulo "use client" importado
 * pelo layout raiz (nenhuma outra configuração é necessária):
 *
 *   import Link from "next/link";
 *   import { setLinkComponent } from "@g4ai/ds";
 *   setLinkComponent(Link);
 */
type LinkLike = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>;
let LinkComponent: LinkLike = (props) => <a {...props} />;
export function setLinkComponent(component: LinkLike) {
  LinkComponent = component;
}
export function DsLink(
  props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string },
) {
  const C = LinkComponent;
  return <C {...props} />;
}

/* ------------------------------------------------------------------ */
/* Tons                                                                */
/* ------------------------------------------------------------------ */

/** Os únicos tons semânticos. Cor nunca aparece sem um rótulo ou motivo. */
export type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "accent";

export const toneDot: Record<Tone, string> = {
  neutral: "bg-line-strong",
  ok: "bg-ok",
  warn: "bg-amber",
  bad: "bg-rose",
  info: "bg-blue",
  accent: "bg-accent",
};
export const toneText: Record<Tone, string> = {
  neutral: "text-ink",
  ok: "text-ok",
  warn: "text-amber",
  bad: "text-rose",
  info: "text-blue",
  accent: "text-accent-deep",
};

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

/**
 * Pessoa. Iniciais brancas sobre tinta escura (#3f3f46 padrão, #202124 para o
 * responsável). Nunca use foto aqui; foto é outro componente.
 */
export function Avatar({
  initials,
  tint,
  size = "md",
  name,
}: {
  initials: string;
  tint?: string;
  size?: "sm" | "md" | "lg";
  name?: string;
}) {
  const dim =
    size === "sm"
      ? "h-7 w-7 text-[11px]"
      : size === "lg"
        ? "h-10 w-10 text-sm"
        : "h-8 w-8 text-[11px]";
  return (
    <span
      className={cn(
        // ds-audit-ignore white-black: iniciais brancas sobre `tint` escuro (identidade da pessoa)
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full align-middle text-center font-medium leading-none whitespace-nowrap text-white",
        dim,
      )}
      style={{ background: tint ?? "#3f3f46" }}
      title={name}
      aria-label={name}
      role={name ? "img" : undefined}
      data-avatar=""
    >
      <span className="block leading-none">{initials}</span>
    </span>
  );
}

/** Até `max` avatares e um "+N" com os nomes restantes no title. */
export function AvatarGroup({
  people,
  max = 4,
}: {
  people: { name: string; initials: string; tint?: string }[];
  max?: number;
}) {
  if (!people.length) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5" data-avatar-group="">
      {people.slice(0, max).map((p, i) => (
        <Avatar key={`${p.name}-${i}`} {...p} size="sm" />
      ))}
      {people.length > max && (
        <span
          className="inline-grid h-7 min-w-7 shrink-0 place-items-center rounded-full bg-soft px-1 text-[11px] leading-none text-muted"
          title={people.slice(max).map((p) => p.name).join(", ")}
          aria-label={`Mais ${people.length - max} pessoas`}
        >
          +{people.length - max}
        </span>
      )}
    </span>
  );
}

/**
 * Marca de uma entidade (cliente, empresa, produto): quadrado arredondado com
 * a cor da entidade a 6 % de opacidade e as iniciais na cor cheia.
 */
export function EntityMark({
  name,
  initials,
  tint = "var(--ds-ink)",
  logo,
  className,
}: {
  name: string;
  initials?: string;
  tint?: string;
  logo?: string;
  className?: string;
}) {
  const text =
    initials ??
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  return (
    <span
      className={cn(
        "entity-avatar grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[10px] text-[13px] font-medium",
        className,
      )}
      style={{ background: `color-mix(in oklab, ${tint} var(--ds-mark-bg), transparent)`, color: `color-mix(in oklab, ${tint} var(--ds-mark-text), var(--ds-ink))` }}
      aria-hidden="true"
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-full w-full object-contain" />
      ) : (
        text
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Badge, Dot                                                          */
/* ------------------------------------------------------------------ */

/**
 * Rótulo curto de estado. Fundo -soft + texto forte + anel de 15 %.
 * `neutral` é o padrão; use tom só quando o estado pede leitura.
 */
export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  const tones: Record<Tone, string> = {
    neutral: "bg-soft text-ink-soft ring-line",
    ok: "bg-ok-soft text-ok ring-ok/15",
    warn: "bg-amber-soft/60 text-amber ring-amber/15",
    bad: "bg-rose-soft/60 text-rose ring-rose/15",
    info: "bg-info-soft/60 text-blue ring-blue/15",
    accent: "bg-accent-soft text-accent-deep ring-accent/25",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium leading-none ring-1 [&_svg]:h-3 [&_svg]:w-3",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Ponto de 6px. Sempre acompanhado de texto ou `label` (vira aria-label). */
export function Dot({ tone = "neutral", label }: { tone?: Tone; label?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      title={label}
      className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", toneDot[tone])}
    />
  );
}

/** Marcador de prioridade crítica, colado ao título. Só existe para "crítica". */
export function CriticalFlag({ label = "Crítica", title }: { label?: string; title?: string }) {
  return (
    <span
      className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-md border border-rose/20 bg-rose-soft px-1.5 py-0.5 align-middle text-[10px] font-semibold leading-4 text-rose"
      title={title}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 22V4a1 1 0 0 1 1-1h11l-2 4 2 4H5" />
      </svg>
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

export type ButtonVariant = "primary" | "ghost" | "danger" | "quiet" | "split-left" | "split-right";

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  className?: string;
} = {}) {
  const sizes = size === "sm" ? "min-h-9 px-3 py-2 text-[13px]" : "min-h-10 px-4 py-2.5 text-[13.5px]";
  const variants: Record<ButtonVariant, string> = {
    primary: "ui-button-primary bg-primary text-on-primary hover:bg-primary/90",
    ghost: "bg-surface text-ink ring-1 ring-line hover:bg-soft",
    danger: "bg-rose text-on-ink hover:bg-rose/90",
    quiet: "bg-transparent text-muted hover:bg-soft hover:text-ink",
    "split-left": "rounded-r-none bg-surface text-ink ring-1 ring-line hover:bg-soft",
    "split-right": "rounded-l-none bg-primary text-on-primary hover:bg-primary/90",
  };
  return cn(
    "ui-button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium leading-5 disabled:opacity-40 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
    sizes,
    variants[variant],
    className,
  );
}

/**
 * Um primário por área. `ghost` para o resto. `danger` só dentro de uma
 * confirmação (nunca como botão solto na tela). `quiet` para ações terciárias
 * em linha. Com `href`, vira link com a mesma aparência.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  href?: string;
}) {
  const cls = buttonClass({ variant, size, className });
  if (href)
    return (
      <DsLink href={href} className={cls}>
        {children}
      </DsLink>
    );
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}

/** Botão quadrado só com ícone. `label` é obrigatório (aria-label + title). */
export function IconButton({
  label,
  children,
  size = "md",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-ink disabled:opacity-40 [&_svg]:h-4 [&_svg]:w-4",
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Chip de filtro binário. Ligado = tinta escura, desligado = contorno. */
export function FilterChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] transition-colors",
        on ? "bg-primary font-medium text-on-primary ring-1 ring-primary" : "bg-surface text-ink-soft ring-1 ring-line hover:bg-soft",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Leitura                                                             */
/* ------------------------------------------------------------------ */

/** Par rótulo/valor para leitura (não edição). */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[12.5px] text-muted">{label}</div>
      <div className="mt-1.5 break-words text-[15px] font-medium leading-relaxed text-ink">{children}</div>
    </div>
  );
}

/**
 * Linha de fatos de um registro: "Marco M07 · Período 12–26 set · Responsável Ana".
 * Substitui cartões de "detalhes" empilhados no topo de páginas de registro.
 */
export function FactLine({ facts }: { facts: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px]">
      {facts.map((f) => (
        <div key={f.label} className="inline-flex min-w-0 items-center gap-1.5">
          <dt className="text-muted">{f.label}</dt>
          <dd className="m-0 truncate font-medium text-ink">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Estado vazio. Diga o que falta e ofereça a próxima ação. */
export function Empty({
  title,
  hint,
  action,
  icon,
  framed = true,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: ReactNode;
  /** false dentro de um painel/lista que já tem borda. */
  framed?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[160px] flex-col items-center justify-center px-5 py-6 text-center",
        framed && "rounded-xl border border-dashed border-line",
      )}
      role="status"
    >
      <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-soft/60 text-muted [&_svg]:h-5 [&_svg]:w-5">
        {icon ?? <Inbox strokeWidth={1.5} aria-hidden />}
      </span>
      <p className="m-0 text-[14px] font-medium">{title}</p>
      {hint && <p className="m-0 mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Área rolável de uma tela, com margens responsivas e entrada suave. */
export function Page({
  children,
  className,
  density,
}: {
  children: ReactNode;
  className?: string;
  density?: "comfortable" | "compact";
}) {
  return (
    <div
      data-density={density}
      data-ds-content=""
      className={cn("page-inset enter h-full overflow-y-auto bg-page", className)}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Números                                                             */
/* ------------------------------------------------------------------ */

/**
 * Indicador. O valor é o protagonista (22px, tabular). O tom pinta o valor só
 * em warn/bad: número bom não precisa gritar.
 */
export function Metric({
  label,
  value,
  icon,
  tone = "neutral",
  bar,
  hint,
  href,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "bad";
  /** 0–100: régua de 20 segmentos abaixo do valor. */
  bar?: number;
  hint?: ReactNode;
  href?: string;
}) {
  const tones = {
    neutral: { icon: "bg-soft text-ink-soft", value: "text-ink", seg: "bg-ink" },
    ok: { icon: "bg-ok-soft text-ok", value: "text-ink", seg: "bg-ok" },
    warn: { icon: "bg-amber-soft text-amber", value: "text-amber", seg: "bg-ink" },
    bad: { icon: "bg-rose-soft text-rose", value: "text-rose", seg: "bg-rose" },
  }[tone];
  const filled = bar != null ? Math.round(Math.max(0, Math.min(100, bar)) / 5) : 0;
  const body = (
    <>
      {icon && (
        <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl [&_svg]:h-4 [&_svg]:w-4", tones.icon)}>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <div className="text-[12px] leading-snug text-muted">{label}</div>
        <div className={cn("mt-1 text-[22px] font-semibold leading-tight tabular-nums tracking-tight", tones.value)}>{value}</div>
        {hint && <div className="mt-1 text-[12px] leading-relaxed text-muted">{hint}</div>}
        {bar != null && (
          <div className="mt-2 flex max-w-[100px] gap-px" aria-hidden>
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className={cn("h-1.5 min-w-0 flex-1 rounded-[1px]", i < filled ? tones.seg : "bg-line")} />
            ))}
          </div>
        )}
      </div>
    </>
  );
  const cls = cn(
    "metric-panel flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3",
    href && "surface-interactive hover:border-line-strong",
  );
  return href ? (
    <DsLink href={href} className={cls}>
      {body}
    </DsLink>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Grade de células separadas por 1px de linha (sem gaps brancos). */
export function StatGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-2xl border border-line bg-line",
        cols === 4 ? "grid-cols-2 lg:grid-cols-4" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {children}
    </div>
  );
}
export function StatCell({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "ok" | "warn" | "bad";
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className={cn("mt-0.5 text-[17px] font-semibold tracking-tight tabular-nums", tone ? toneText[tone] : "text-ink")}>{value}</div>
      {hint && <div className="mt-0.5 text-[12px] text-muted">{hint}</div>}
    </div>
  );
}

/** Progresso fino (1px ou 4px). Dourado = progresso de marca; ink = neutro. */
export function Meter({
  value,
  tone = "ink",
  thick = false,
  label,
}: {
  value: number;
  tone?: "ink" | "accent" | "ok" | "warn" | "bad";
  thick?: boolean;
  label?: string;
}) {
  const fill = { ink: "bg-ink", accent: "bg-accent", ok: "bg-ok", warn: "bg-amber", bad: "bg-rose" }[tone];
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("w-full overflow-hidden rounded-full bg-line", thick ? "h-1" : "h-px")}
    >
      <div className={cn("h-full rounded-full", fill)} style={{ width: `${Math.max(pct ? 4 : 0, pct)}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

/**
 * Superfície branca, borda de 1px, raio 12. Interativo só com href/onClick
 * (aí ganha hover de borda e sombra). Para card com link principal E botões
 * internos, use LinkedCard.
 */
export function Card({
  children,
  className,
  href,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const cls = cn(
    "surface-card block rounded-xl border border-line bg-surface px-4 py-3 text-left",
    (href || onClick) && "surface-interactive hover:border-line-strong",
    className,
  );
  if (href)
    return (
      <DsLink href={href} className={cls}>
        {children}
      </DsLink>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cn(cls, "w-full")}>
        {children}
      </button>
    );
  return <div className={cls}>{children}</div>;
}

/**
 * Card com um destino principal (o título) e ações secundárias clicáveis.
 * O link do título estica sobre o card inteiro via CSS; botões ficam por cima.
 */
export function LinkedCard({
  href,
  title,
  children,
  aside,
  className,
}: {
  href: string;
  title: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("linked-card surface-card surface-interactive rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong", className)}>
      <div className="flex items-start justify-between gap-3">
        <DsLink href={href} className="card-primary-link min-w-0 text-[14px] font-medium leading-snug text-ink">
          {title}
        </DsLink>
        {aside}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

/** "Abrir ↗" discreto no pé de um card clicável. */
export function CardAction({ children }: { children: ReactNode }) {
  return (
    <span className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-soft">
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 text-muted" aria-hidden />
    </span>
  );
}

/** Seção titulada dentro de uma página de conteúdo (não é card). */
export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[14px] font-medium">{title}</h2>
        {action && <div className="shrink-0 text-[12.5px] text-muted">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** Tecla de atalho. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-soft px-1 font-sans text-[11px] text-muted">
      {children}
    </kbd>
  );
}
