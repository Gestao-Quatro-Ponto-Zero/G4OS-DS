"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { ArrowUpRight, Inbox } from "lucide-react";
import { forwardRef, useEffect, useId, useState } from "react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ForwardedRef,
  JSXElementConstructor,
  ReactNode,
  RefAttributes,
} from "react";
import { cn } from "../lib/cn";
import { tintFill } from "../lib/color";
import { initials as initialsOf } from "../lib/text";

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
// JSXElementConstructor (e não ComponentType): com @types/react@18 o
// ComponentType compara propTypes, e o Link do Next (href: string | UrlObject)
// deixaria de ser aceito.
type LinkLike = JSXElementConstructor<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string } & RefAttributes<HTMLAnchorElement>
>;
// eslint-disable-next-line jsx-a11y/anchor-has-content -- o conteúdo chega por props.children
let LinkComponent: LinkLike = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>((props, ref) => <a ref={ref} {...props} />);
export function setLinkComponent(component: LinkLike) {
  LinkComponent = component;
}
// forwardRef (e não ref como prop do React 19): no React 18 o Base UI precisa
// da ref para ancorar tooltip/menu quando o link é o gatilho.
export const DsLink = forwardRef(function DsLink(
  props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string },
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const C = LinkComponent;
  return <C {...props} ref={ref} />;
});

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

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "away" | "busy" | "offline";

const avatarDim: Record<AvatarSize, string> = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-10 w-10 text-[14px]",
  xl: "h-14 w-14 text-[18px]",
};
const avatarCountDim: Record<AvatarSize, string> = {
  xs: "h-5 min-w-5 text-[10px]",
  sm: "h-7 min-w-7 text-[11px]",
  md: "h-8 min-w-8 text-[11px]",
  lg: "h-10 min-w-10 text-[12.5px]",
  xl: "h-14 min-w-14 text-[14px]",
};
const statusFill: Record<AvatarStatus, string> = { online: "bg-ok", away: "bg-amber", busy: "bg-rose", offline: "bg-line-strong" };
const statusLabel: Record<AvatarStatus, string> = { online: "online", away: "ausente", busy: "ocupado", offline: "offline" };

/**
 * Pessoa. Iniciais brancas sobre a tinta da pessoa (#3f3f46 padrão, #202124
 * para o responsável); com `src`, a foto (as iniciais ficam de reserva se a
 * imagem falhar). `status` põe o ponto de presença; `badge` um selo de ícone
 * (verificado, papel). `shape="square"` para contas de serviço e bots.
 */
export function Avatar({
  initials,
  tint,
  size = "md",
  name,
  src,
  status,
  badge,
  shape = "circle",
  className,
}: {
  /** Padrão: calculadas a partir de `name`. */
  initials?: string;
  tint?: string;
  size?: AvatarSize;
  name?: string;
  /** Foto. Sem ela (ou se falhar), as iniciais. */
  src?: string;
  /** Ponto de presença no canto. */
  status?: AvatarStatus;
  /** Selo no canto (ícone 10–12 px): verificado, admin, bot. */
  badge?: ReactNode;
  shape?: "circle" | "square";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const text = initials ?? (name ? initialsOf(name) : "—");
  const showImg = src && !failed;
  const round = shape === "square" ? (size === "xs" || size === "sm" ? "rounded-md" : "rounded-lg") : "rounded-full";
  const label = name ? (status ? `${name} (${statusLabel[status]})` : name) : undefined;
  const face = (
    <span
      className={cn(
        // ds-audit-ignore white-black: iniciais brancas sobre `tint` escuro (identidade da pessoa)
        "inline-grid shrink-0 place-items-center overflow-hidden align-middle text-center font-medium leading-none whitespace-nowrap text-white",
        avatarDim[size],
        round,
        !(status || badge) && className,
      )}
      style={showImg ? undefined : { background: tintFill(tint) }}
      title={name}
      aria-label={status || badge ? undefined : label}
      role={!(status || badge) && name ? "img" : undefined}
      data-avatar=""
    >
      {showImg ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <span className="block leading-none">{text}</span>}
    </span>
  );
  if (!status && !badge) return face;
  return (
    <span className={cn("relative inline-flex shrink-0 align-middle", className)} role={name ? "img" : undefined} aria-label={label} data-avatar="">
      {face}
      {status && (
        <span
          aria-hidden
          className={cn("absolute bottom-0 right-0 block rounded-full ring-2 ring-surface", statusFill[status], size === "xs" || size === "sm" ? "h-2 w-2" : size === "xl" ? "h-3.5 w-3.5" : "h-2.5 w-2.5")}
        />
      )}
      {badge && !status && (
        <span
          aria-hidden
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-primary text-on-primary ring-2 ring-surface [&_svg]:h-2.5 [&_svg]:w-2.5",
            size === "xl" ? "h-5 w-5 [&_svg]:h-3 [&_svg]:w-3" : "h-4 w-4",
          )}
        >
          {badge}
        </span>
      )}
    </span>
  );
}

/**
 * Até `max` avatares e um "+N" com os nomes restantes no title.
 * `stacked` sobrepõe (pilha compacta em cards e cabeçalhos); `total` usa
 * a contagem real quando a lista veio paginada; `action` fica no fim
 * (ex.: botão "Adicionar pessoa").
 */
export function AvatarGroup({
  people,
  max = 4,
  size = "sm",
  stacked = false,
  total,
  action,
  className,
}: {
  people: { name: string; initials?: string; tint?: string; src?: string }[];
  max?: number;
  size?: AvatarSize;
  stacked?: boolean;
  /** Total real (quando `people` é só uma amostra). */
  total?: number;
  action?: ReactNode;
  className?: string;
}) {
  if (!people.length && !action) return null;
  const count = total ?? people.length;
  const shown = people.slice(0, max);
  const extra = count - shown.length;
  const ring = stacked ? "ring-2 ring-surface" : undefined;
  return (
    <span className={cn("inline-flex shrink-0 items-center", stacked ? "-space-x-1.5" : "gap-1.5", className)} data-avatar-group="">
      {shown.map((p, i) => (
        <Avatar key={`${p.name}-${i}`} {...p} size={size} className={ring} />
      ))}
      {extra > 0 && (
        <span
          className={cn("inline-grid shrink-0 place-items-center rounded-full bg-soft px-1 leading-none text-muted", avatarCountDim[size], ring)}
          title={people.slice(max).map((p) => p.name).join(", ") || undefined}
          role="img"
          aria-label={`Mais ${extra} ${extra === 1 ? "pessoa" : "pessoas"}`}
        >
          +{extra}
        </span>
      )}
      {action && <span className={cn("inline-flex shrink-0", stacked && "pl-2.5")}>{action}</span>}
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
        "entity-avatar grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-tile text-[13px] font-medium",
        className,
      )}
      style={{ background: `color-mix(in oklab, ${tint} var(--ds-mark-bg), transparent)`, color: `color-mix(in oklab, ${tint} var(--ds-mark-text), var(--ds-ink))` }}
      aria-hidden="true"
    >
      {logo ? (
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
    primary: "ui-button-primary ui-button-solid bg-primary text-on-primary hover:bg-primary/90",
    ghost: "ui-button-outline bg-surface text-ink ring-1 ring-line hover:bg-soft",
    danger: "ui-button-solid bg-rose text-on-ink hover:bg-rose/90",
    quiet: "ui-button-text bg-transparent text-muted hover:bg-soft hover:text-ink",
    "split-left": "ui-button-outline rounded-r-none bg-surface text-ink ring-1 ring-line hover:bg-soft",
    "split-right": "ui-button-solid rounded-l-none bg-primary text-on-primary hover:bg-primary/90",
  };
  return cn(
    "ui-button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium leading-5 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
    sizes,
    variants[variant],
    className,
  );
}

/**
 * Um primário por área. `ghost` para o resto. `danger` só dentro de uma
 * confirmação (nunca como botão solto na tela). `quiet` para ações terciárias
 * em linha. Com `href`, vira link com a mesma aparência.
 * `disabled` + `disabledReason`: continua focável (aria-disabled), não
 * dispara e explica o motivo num tooltip ("Indisponível na demonstração").
 */
export const Button = forwardRef(function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  type = "button",
  disabled,
  disabledReason,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  href?: string;
  /** Por que está desabilitado. Mostra tooltip no hover/foco e é lido pelo leitor de tela. */
  disabledReason?: ReactNode;
}, ref: ForwardedRef<HTMLButtonElement>) {
  const reasonId = useId();
  const cls = buttonClass({ variant, size, className });
  if (href && !disabled)
    return (
      <DsLink ref={ref as unknown as ForwardedRef<HTMLAnchorElement>} href={href} className={cls}>
        {children}
      </DsLink>
    );
  if (disabled && disabledReason) {
    return (
      <BaseTooltip.Root>
        <BaseTooltip.Trigger
          delay={150}
          render={
            <button
              ref={ref}
              type={type}
              className={cls}
              {...rest}
              aria-disabled="true"
              aria-describedby={reasonId}
              onClick={(e) => e.preventDefault()}
            >
              {children}
              <span id={reasonId} className="sr-only">
                {disabledReason}
              </span>
            </button>
          }
        />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner side="top" sideOffset={6} collisionPadding={12} className="z-[100]">
            <BaseTooltip.Popup className="max-w-[260px] origin-[var(--transform-origin)] rounded-md bg-ink px-2 py-1 text-[12px] leading-snug text-on-ink shadow-raised transition-[opacity,scale] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
              {disabledReason}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    );
  }
  return (
    <button ref={ref} type={type} className={cls} disabled={disabled} {...rest}>
      {children}
    </button>
  );
});

/** Botão quadrado só com ícone. `label` é obrigatório (aria-label + title). */
export const IconButton = forwardRef(function IconButton({
  label,
  children,
  size = "md",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: "sm" | "md" }, ref: ForwardedRef<HTMLButtonElement>) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:h-4 [&_svg]:w-4",
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

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
  hint: hintProp,
  description,
  action,
  icon,
  framed = true,
}: {
  title: string;
  /** Uma frase sobre o que falta ou o que fazer. Igual a `description` (mesmo nome de StateView). */
  hint?: ReactNode;
  /** Alias de `hint`, com o nome usado em StateView. */
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  /** false dentro de um painel/lista que já tem borda. */
  framed?: boolean;
}) {
  const hint = hintProp ?? description;
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

/**
 * Área rolável de uma tela, com margens responsivas e entrada suave.
 * `width` limita a largura do conteúdo E do cabeçalho juntos (PageHeading,
 * PageToolbar e corpo ficam no mesmo eixo; o fundo fixo do cabeçalho segue
 * de ponta a ponta). Não envolva o corpo num `mx-auto max-w-*` próprio:
 * o título fica desalinhado do conteúdo.
 *   full 100% · wide 1200px · medium 1024px · narrow 896px · reading 720px
 */
export function Page({
  children,
  className,
  density,
  width = "full",
}: {
  children: ReactNode;
  className?: string;
  density?: "comfortable" | "compact";
  /** Largura máxima do conteúdo (cabeçalho incluso). Padrão: full. */
  width?: "full" | "wide" | "medium" | "narrow" | "reading";
}) {
  return (
    <div
      data-density={density}
      data-ds-content=""
      data-page-width={width === "full" ? undefined : width}
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
      aria-label={label ?? "Progresso"}
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

/** Tecla de atalho. `size="sm"` dentro de itens densos; `md` ao lado de texto corrido. */
export function Kbd({ children, size = "sm", className }: { children: ReactNode; size?: "sm" | "md"; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded border border-line bg-soft font-sans text-muted",
        size === "md" ? "h-6 min-w-6 px-1.5 text-[12px]" : "h-5 min-w-5 px-1 text-[11px]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

const macKeys: Record<string, string> = { mod: "⌘", cmd: "⌘", ctrl: "⌃", alt: "⌥", option: "⌥", shift: "⇧", enter: "↵", backspace: "⌫", esc: "Esc", tab: "⇥", up: "↑", down: "↓", left: "←", right: "→" };
const pcKeys: Record<string, string> = { mod: "Ctrl", cmd: "Ctrl", ctrl: "Ctrl", alt: "Alt", option: "Alt", shift: "Shift", enter: "Enter", backspace: "Backspace", esc: "Esc", tab: "Tab", up: "↑", down: "↓", left: "←", right: "→" };

/** true no macOS/iOS (para escolher ⌘ ou Ctrl). Falso no servidor e no primeiro render. */
export function useIsMac() {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    setMac(/mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform ?? navigator.platform ?? navigator.userAgent));
  }, []);
  return mac;
}

/** Converte nomes de tecla ("mod", "shift", "enter") no símbolo da plataforma. */
export function keyLabel(key: string, mac: boolean) {
  const k = key.toLowerCase();
  return (mac ? macKeys : pcKeys)[k] ?? (key.length === 1 ? key.toUpperCase() : key);
}

/**
 * Combinação de teclas. Com `keys`, "mod" vira ⌘ no Mac e Ctrl nos outros
 * (o mesmo para shift, alt, enter). Ou passe Kbd como filhos.
 *
 *   <KbdGroup keys={["mod", "K"]} />   → ⌘ K  /  Ctrl K
 */
export function KbdGroup({ keys, children, size, label, className }: { keys?: string[]; children?: ReactNode; size?: "sm" | "md"; /** Nome para leitor de tela (padrão: as teclas por extenso). */ label?: string; className?: string }) {
  const mac = useIsMac();
  const shown = keys?.map((k) => keyLabel(k, mac));
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={label ?? shown?.join(" + ")} role={shown ? "img" : undefined}>
      {shown
        ? shown.map((k, i) => (
            <Kbd key={`${k}-${i}`} size={size}>
              {k}
            </Kbd>
          ))
        : children}
    </span>
  );
}
