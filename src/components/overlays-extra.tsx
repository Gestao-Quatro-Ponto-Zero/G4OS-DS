"use client";
/* ds-audit-ignore-file white-black: Lightbox usa fundo preto fixo (bg-black/90) nos dois temas */

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { Check, ChevronLeft, ChevronRight, CornerDownLeft, Search, X } from "lucide-react";
import {
  Fragment,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";
import { normalize } from "../lib/text";
import { usePortalContainer } from "../lib/portal";
import { popupClass } from "./overlays";
import { Kbd } from "./primitives";

/*
 * Sobreposições complementares. Regra de escolha (docs/padroes/superficies.md):
 *   Tooltip        nome/atalho de um controle só-ícone. Nunca conteúdo essencial.
 *   HoverCard      prévia de uma entidade (pessoa, empresa) ao passar o mouse
 *                  num link. O link continua levando à página.
 *   Popover        explicação ou mini-formulário sob demanda (overlays.tsx)
 *   Menu           lista de ações; submenus, marcações e escolha única
 *   ContextMenu    atalho de clique direito. SEMPRE duplique as ações em um
 *                  menu visível (⋯): clique direito não é descobrível.
 *   Sheet          painel temporário (filtros, detalhes, carrinho). Vira
 *                  folha inferior no celular.
 *   Drawer         edição de registro com formulário longo (overlays.tsx)
 *   CommandPalette ⌘K: navegar e agir por teclado de qualquer lugar
 *   Lightbox       imagem em tela cheia com navegação
 */

const backdropClass =
  "fixed inset-0 z-[90] min-h-dvh bg-black/20 backdrop-blur-[1px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0";

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

/**
 * Rótulo curto em tinta escura. `children` precisa ser UM elemento que
 * aceite ref (button, a, IconButton). Envolva a tela com TooltipGroup para
 * que tooltips vizinhos abram sem atraso depois do primeiro.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  delay = 400,
  shortcut,
  disabled,
}: {
  content: ReactNode;
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  /** Teclas do atalho: ["⌘", "K"]. */
  shortcut?: string[];
  disabled?: boolean;
}) {
  if (disabled || !isValidElement(children)) return children;
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger delay={delay} render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6} collisionPadding={12} className="z-[100]">
          <BaseTooltip.Popup className="inline-flex max-w-[260px] origin-[var(--transform-origin)] items-center gap-2 rounded-md bg-ink px-2 py-1 text-[12px] leading-snug text-on-ink shadow-raised transition-[opacity,scale] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {content}
            {shortcut && (
              <span className="inline-flex gap-0.5">
                {shortcut.map((k) => (
                  <kbd key={k} className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-on-ink/15 px-1 font-sans text-[10.5px] text-on-ink/85">
                    {k}
                  </kbd>
                ))}
              </span>
            )}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

/** Agrupa tooltips: depois do primeiro, os vizinhos abrem na hora. */
export function TooltipGroup({ children, delay = 400 }: { children: ReactNode; delay?: number }) {
  return <BaseTooltip.Provider delay={delay}>{children}</BaseTooltip.Provider>;
}

/* ------------------------------------------------------------------ */
/* HoverCard                                                           */
/* ------------------------------------------------------------------ */

/**
 * Prévia de uma entidade ao passar o mouse num link (pessoa, empresa,
 * vaga). `children` é o link (UM elemento). O conteúdo é complementar: tudo
 * nele precisa existir também na página de destino.
 */
export function HoverCard({
  children,
  content,
  side = "bottom",
  width = 300,
  delay = 500,
}: {
  children: ReactElement;
  content: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  width?: number;
  delay?: number;
}) {
  return (
    <BasePreviewCard.Root>
      <BasePreviewCard.Trigger delay={delay} closeDelay={150} render={children} />
      <BasePreviewCard.Portal>
        <BasePreviewCard.Positioner side={side} sideOffset={8} collisionPadding={12} className="z-[100]">
          <BasePreviewCard.Popup className={cn(popupClass, "max-w-[calc(100vw-16px)] p-4")} style={{ width }}>
            {content}
          </BasePreviewCard.Popup>
        </BasePreviewCard.Positioner>
      </BasePreviewCard.Portal>
    </BasePreviewCard.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Menu e ContextMenu                                                  */
/* ------------------------------------------------------------------ */

export type MenuEntry =
  | { type?: "item"; label: string; icon?: ReactNode; shortcut?: string; onSelect?: () => void; href?: string; disabled?: boolean; tone?: "neutral" | "danger" }
  | { type: "separator" }
  | { type: "label"; label: string }
  | { type: "checkbox"; label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; icon?: ReactNode }
  | { type: "radio"; value: string; onValueChange: (value: string) => void; options: { value: string; label: string }[] }
  | { type: "submenu"; label: string; icon?: ReactNode; items: MenuEntry[] };

const itemClass =
  "flex w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] outline-none data-highlighted:bg-soft data-disabled:opacity-40 data-popup-open:bg-soft";
const menuPopup = cn(popupClass, "min-w-[200px] max-h-[var(--available-height)] overflow-y-auto p-1.5");

function MenuEntries({ items, container }: { items: MenuEntry[]; container?: HTMLElement | null }) {
  return (
    <>
      {items.map((it, i) => {
        const key = `${it.type ?? "item"}-${i}`;
        switch (it.type) {
          case "separator":
            return <BaseMenu.Separator key={key} className="my-1 h-px bg-line" />;
          case "label":
            return (
              <div key={key} className="px-2.5 pb-1 pt-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">
                {it.label}
              </div>
            );
          case "checkbox":
            return (
              <BaseMenu.CheckboxItem key={key} checked={it.checked} onCheckedChange={(c) => it.onCheckedChange(c)} closeOnClick={false} className={itemClass}>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">{it.icon}</span>
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                <BaseMenu.CheckboxItemIndicator className="shrink-0">
                  <Check className="h-4 w-4" aria-hidden />
                </BaseMenu.CheckboxItemIndicator>
              </BaseMenu.CheckboxItem>
            );
          case "radio":
            return (
              <BaseMenu.RadioGroup key={key} value={it.value} onValueChange={(v) => it.onValueChange(v as string)}>
                {it.options.map((o) => (
                  <BaseMenu.RadioItem key={o.value} value={o.value} closeOnClick={false} className={itemClass}>
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <BaseMenu.RadioItemIndicator>
                        <span className="block h-1.5 w-1.5 rounded-full bg-ink" />
                      </BaseMenu.RadioItemIndicator>
                    </span>
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  </BaseMenu.RadioItem>
                ))}
              </BaseMenu.RadioGroup>
            );
          case "submenu":
            return (
              <BaseMenu.SubmenuRoot key={key}>
                <BaseMenu.SubmenuTrigger className={itemClass}>
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">{it.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                </BaseMenu.SubmenuTrigger>
                <BaseMenu.Portal container={container}>
                  <BaseMenu.Positioner sideOffset={4} alignOffset={-6} collisionPadding={12} className="z-[100] outline-none">
                    <BaseMenu.Popup className={menuPopup}>
                      <MenuEntries items={it.items} container={container} />
                    </BaseMenu.Popup>
                  </BaseMenu.Positioner>
                </BaseMenu.Portal>
              </BaseMenu.SubmenuRoot>
            );
          default: {
            const cls = cn(itemClass, it.tone === "danger" && "text-rose data-highlighted:bg-rose-soft/60");
            const body = (
              <>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">{it.icon}</span>
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.shortcut && <span className="shrink-0 pl-4 text-[11.5px] tracking-wide text-muted">{it.shortcut}</span>}
              </>
            );
            return it.href ? (
              <BaseMenu.LinkItem key={key} href={it.href} closeOnClick className={cls}>
                {body}
              </BaseMenu.LinkItem>
            ) : (
              <BaseMenu.Item key={key} onClick={it.onSelect} disabled={it.disabled} className={cls}>
                {body}
              </BaseMenu.Item>
            );
          }
        }
      })}
    </>
  );
}

/**
 * Menu completo: itens com ícone e atalho, rótulos de grupo, separadores,
 * marcações (checkbox), escolha única (radio) e submenus. Para o "⋯" simples
 * de linha, ActionMenu basta.
 */
export function Menu({
  trigger,
  items,
  label,
  align = "start",
  side = "bottom",
  triggerClassName,
}: {
  /** Conteúdo do botão gatilho. */
  trigger: ReactNode;
  items: MenuEntry[];
  label: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  triggerClassName?: string;
}) {
  const [ref, container] = usePortalContainer();
  return (
    <BaseMenu.Root modal={false}>
      <BaseMenu.Trigger
        ref={ref}
        aria-label={label}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg bg-surface px-3 text-[13px] font-medium text-ink ring-1 ring-line outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent/40 data-popup-open:bg-soft [&_svg]:h-4 [&_svg]:w-4",
          triggerClassName,
        )}
      >
        {trigger}
      </BaseMenu.Trigger>
      <BaseMenu.Portal container={container}>
        <BaseMenu.Positioner side={side} align={align} sideOffset={6} collisionPadding={12} className="z-[100] outline-none">
          <BaseMenu.Popup className={menuPopup}>
            <MenuEntries items={items} container={container} />
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

/**
 * Clique direito (ou toque longo) sobre uma área. Atalho de poder: as mesmas
 * ações precisam existir num menu visível.
 */
export function ContextMenu({ children, items, className }: { children: ReactNode; items: MenuEntry[]; className?: string }) {
  return (
    <BaseContextMenu.Root>
      <BaseContextMenu.Trigger className={className}>{children}</BaseContextMenu.Trigger>
      <BaseContextMenu.Portal>
        <BaseContextMenu.Positioner className="z-[100] outline-none">
          <BaseContextMenu.Popup className={menuPopup}>
            <MenuEntries items={items} />
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Sheet                                                               */
/* ------------------------------------------------------------------ */

/**
 * Painel temporário que entra pela borda: filtros avançados, detalhes de um
 * item, carrinho, ajuda. Direita/esquerda no desktop; no celular vira folha
 * inferior (`responsive`). Para editar registro com formulário longo, use
 * Drawer.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  side = "right",
  responsive = true,
  width = 420,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  side?: "right" | "left" | "bottom";
  /** Abaixo de 640px, qualquer lado vira folha inferior. */
  responsive?: boolean;
  width?: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (!responsive) return;
    const mq = window.matchMedia("(max-width: 639.98px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [responsive]);
  const s = mobile ? "bottom" : side;
  const pos = {
    right: "inset-y-0 right-0 h-dvh border-l data-starting-style:translate-x-8 data-ending-style:translate-x-8",
    left: "inset-y-0 left-0 h-dvh border-r data-starting-style:-translate-x-8 data-ending-style:-translate-x-8",
    bottom: "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t data-starting-style:translate-y-8 data-ending-style:translate-y-8",
  }[s];
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdropClass} />
        <BaseDialog.Popup
          className={cn(
            "fixed z-[95] flex w-full flex-col border-line bg-surface text-ink shadow-overlay outline-none transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-ending-style:opacity-0 data-starting-style:opacity-0",
            pos,
          )}
          style={s === "bottom" ? undefined : { maxWidth: width }}
        >
          {s === "bottom" && <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong" />}
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <BaseDialog.Title className="m-0 text-[16px] font-semibold leading-snug tracking-tight">{title}</BaseDialog.Title>
              {description && <BaseDialog.Description className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">{description}</BaseDialog.Description>}
            </div>
            <BaseDialog.Close aria-label="Fechar" className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink">
              <X className="h-4 w-4" />
            </BaseDialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-soft/35 px-5 py-3.5">{footer}</footer>}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/* ------------------------------------------------------------------ */
/* CommandPalette                                                      */
/* ------------------------------------------------------------------ */

export type Command = {
  id: string;
  label: string;
  /** Grupo: "Navegar", "Criar", "Contatos"… */
  group: string;
  icon?: ReactNode;
  /** Texto à direita (contexto: empresa, módulo). */
  hint?: string;
  /** Atalho exibido: ["G", "C"] ou ["⌘", "N"]. */
  shortcut?: string[];
  /** Termos extras para a busca (sinônimos, siglas). */
  keywords?: string[];
  onSelect: () => void;
};

/** Pontuação de busca: prefixo > palavra > trecho > subsequência. 0 = fora. */
function score(query: string, cmd: Command) {
  const q = normalize(query.trim());
  if (!q) return 1;
  const hay = normalize([cmd.label, cmd.hint, ...(cmd.keywords ?? [])].filter(Boolean).join(" "));
  const label = normalize(cmd.label);
  if (label.startsWith(q)) return 100;
  if (label.split(/\s+/).some((w) => w.startsWith(q))) return 80;
  if (hay.includes(q)) return 60;
  let i = 0;
  for (const ch of hay) if (ch === q[i]) i++;
  return i === q.length ? 20 : 0;
}

/** Abre com ⌘K / Ctrl+K em qualquer lugar. */
export function useCommandShortcut(onOpen: () => void, key = "k") {
  const ref = useRef(onOpen);
  ref.current = onOpen;
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [key]);
}

/**
 * Paleta de comandos (⌘K): busca tolerante a acento e erro de digitação,
 * grupos, ↑↓ Enter, atalhos visíveis. Sem busca mostra `recent` primeiro.
 *
 *   const [open, setOpen] = useState(false);
 *   useCommandShortcut(() => setOpen(true));
 *   <CommandPalette open={open} onClose={() => setOpen(false)} commands={cmds} recent={["novo-negocio"]} />
 */
export function CommandPalette({
  open,
  onClose,
  commands,
  recent = [],
  placeholder = "Buscar ou executar um comando…",
  emptyLabel = "Nada encontrado",
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  /** Ids exibidos em "Recentes" quando a busca está vazia. */
  recent?: string[];
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const sections = useMemo(() => {
    const q = query.trim();
    if (!q) {
      const rec = recent.map((id) => commands.find((c) => c.id === id)).filter(Boolean) as Command[];
      const rest = commands.filter((c) => !recent.includes(c.id));
      const groups: { group: string; items: Command[] }[] = rec.length ? [{ group: "Recentes", items: rec }] : [];
      for (const c of rest) {
        const g = groups.find((x) => x.group === c.group);
        if (g) g.items.push(c);
        else groups.push({ group: c.group, items: [c] });
      }
      return groups;
    }
    const scored = commands.map((c) => ({ c, s: score(q, c) })).filter((x) => x.s > 0);
    const groups: { group: string; items: Command[]; best: number }[] = [];
    for (const { c, s } of scored.sort((a, b) => b.s - a.s)) {
      const g = groups.find((x) => x.group === c.group);
      if (g) g.items.push(c);
      else groups.push({ group: c.group, items: [c], best: s });
    }
    return groups;
  }, [query, commands, recent]);

  const flat = sections.flatMap((s) => s.items);
  const run = (cmd?: Command) => {
    if (!cmd) return;
    onClose();
    cmd.onSelect();
  };

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let idx = -1;
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdropClass} />
        <BaseDialog.Popup
          aria-label="Paleta de comandos"
          className="fixed left-1/2 top-[12dvh] z-[95] flex max-h-[min(560px,76dvh)] w-[calc(100vw-24px)] max-w-[620px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-overlay outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0"
        >
          <BaseDialog.Title className="sr-only">Paleta de comandos</BaseDialog.Title>
          <div className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-line px-4">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => (flat.length ? (a + 1) % flat.length : 0));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  run(flat[active]);
                }
              }}
              placeholder={placeholder}
              role="combobox"
              aria-expanded="true"
              aria-controls="command-list"
              aria-activedescendant={flat[active] ? `cmd-${flat[active].id}` : undefined}
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
              style={{ boxShadow: "none", border: 0 }}
            />
            <Kbd>Esc</Kbd>
          </div>
          <div ref={listRef} id="command-list" role="listbox" aria-label="Comandos" className="min-h-0 flex-1 overflow-y-auto p-2">
            {flat.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="m-0 text-[13.5px] font-medium">{emptyLabel}</p>
                <p className="m-0 mt-1 text-[12.5px] text-muted">Tente outro termo, sem acento ou abreviado.</p>
              </div>
            )}
            {sections.map((s) => (
              <Fragment key={s.group}>
                <div role="presentation" className="px-2.5 pb-1 pt-2.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">
                  {s.group}
                </div>
                {s.items.map((c) => {
                  idx++;
                  const i = idx;
                  const on = i === active;
                  return (
                    <div
                      key={`${s.group}-${c.id}`}
                      id={`cmd-${c.id}`}
                      role="option"
                      aria-selected={on}
                      data-index={i}
                      onPointerMove={() => setActive(i)}
                      onClick={() => run(c)}
                      className={cn("flex cursor-default items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px]", on && "bg-soft")}
                    >
                      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4", on ? "text-ink" : "text-muted")}>{c.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{c.label}</span>
                      {c.hint && <span className="hidden shrink-0 truncate text-[12px] text-muted sm:inline">{c.hint}</span>}
                      {c.shortcut && (
                        <span className="hidden shrink-0 gap-0.5 sm:inline-flex">
                          {c.shortcut.map((k) => (
                            <Kbd key={k}>{k}</Kbd>
                          ))}
                        </span>
                      )}
                      {on && !c.shortcut && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
          <footer className="hidden shrink-0 items-center gap-4 border-t border-line bg-soft/40 px-4 py-2 text-[11.5px] text-muted sm:flex">
            <span className="inline-flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>↵</Kbd> abrir
            </span>
            <span className="ml-auto tabular-nums">{flat.length} resultados</span>
          </footer>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Lightbox                                                            */
/* ------------------------------------------------------------------ */

export type LightboxImage = { src: string; alt: string; caption?: ReactNode };

/**
 * Imagem em tela cheia sobre fundo escuro, com ←/→, contador e legenda.
 * `index` controlado: null = fechado.
 */
export function Lightbox({ images, index, onIndexChange }: { images: LightboxImage[]; index: number | null; onIndexChange: (index: number | null) => void }) {
  const open = index != null;
  const img = index != null ? images[index] : undefined;
  const go = (d: number) => index != null && images.length > 1 && onIndexChange((index + d + images.length) % images.length);
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => !next && onIndexChange(null)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-[90] bg-graph/92 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <BaseDialog.Popup
          aria-label="Visualizador de imagem"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
          className="fixed inset-0 z-[95] flex flex-col text-white outline-none transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"
        >
          <BaseDialog.Title className="sr-only">{img?.alt ?? "Imagem"}</BaseDialog.Title>
          <header className="flex h-14 shrink-0 items-center justify-between px-4">
            <span className="text-[12.5px] tabular-nums text-white/70">{index != null ? `${index + 1} de ${images.length}` : ""}</span>
            <BaseDialog.Close aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </BaseDialog.Close>
          </header>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
            {img && <img key={img.src} src={img.src} alt={img.alt} className="max-h-full max-w-full rounded-lg object-contain animate-fade" />}
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Imagem anterior" className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Próxima imagem" className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          <footer className="flex min-h-16 shrink-0 items-center justify-center px-6 py-4 text-center text-[13px] text-white/75">{img?.caption ?? img?.alt}</footer>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
