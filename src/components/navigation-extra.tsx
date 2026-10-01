"use client";

import { NavigationMenu as BaseNav } from "@base-ui/react/navigation-menu";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { DsLink } from "./primitives";

/*
 * NavigationMenu: navegação de site/portal com painéis (equivalente ao
 * Navigation Menu do shadcn/ui). Para navegação de app, use Sidebar/AppShell.
 */

export type NavigationMenuLinkItem = {
  title: string;
  href: string;
  description?: string;
  icon?: ReactNode;
};

export type NavigationMenuEntry =
  | { label: string; href: string; active?: boolean }
  | {
      label: string;
      /** Links do painel. Com mais de 4, o painel vira duas colunas. */
      links: NavigationMenuLinkItem[];
      /** Destaque à esquerda do painel (card de produto, novidade). */
      feature?: ReactNode;
      active?: boolean;
    };

const triggerClass =
  "inline-flex h-9 select-none items-center gap-1 rounded-lg px-3 text-[13.5px] font-medium text-ink-soft no-underline outline-none transition-colors hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 data-popup-open:bg-soft data-popup-open:text-ink data-[active]:text-ink";

/**
 * Menu de navegação de site público, portal do cliente ou central de ajuda:
 * links diretos e painéis com links descritos (título + descrição + ícone).
 * Abre ao passar o mouse ou por teclado; links usam o componente de rota
 * configurado em setLinkComponent. No celular, esconda e use um Sheet/menu.
 */
export function NavigationMenu({ items, label, className }: { items: NavigationMenuEntry[]; /** Nome acessível ("Navegação principal"). */ label: string; className?: string }) {
  return (
    <BaseNav.Root aria-label={label} className={cn("relative", className)}>
      <BaseNav.List className="m-0 flex list-none items-center gap-0.5 p-0">
        {items.map((it) =>
          "links" in it ? (
            <BaseNav.Item key={it.label}>
              <BaseNav.Trigger className={triggerClass} data-active={it.active ? "" : undefined}>
                {it.label}
                <BaseNav.Icon className="text-muted transition-transform duration-200 data-popup-open:rotate-180 motion-reduce:transition-none">
                  <ChevronDown aria-hidden className="h-3.5 w-3.5" />
                </BaseNav.Icon>
              </BaseNav.Trigger>
              <BaseNav.Content className="w-[calc(100vw-32px)] p-2 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 sm:w-max">
                <div className={cn("flex flex-col gap-2 sm:flex-row", it.feature ? "sm:max-w-[640px]" : "sm:max-w-[560px]")}>
                  {it.feature && <div className="shrink-0 sm:w-52">{it.feature}</div>}
                  <ul className={cn("m-0 grid list-none gap-0.5 p-0", it.links.length > 4 && "sm:grid-cols-2")}>
                    {it.links.map((l) => (
                      <li key={l.href}>
                        <BaseNav.Link
                          href={l.href}
                          render={<DsLink href={l.href} />}
                          className="flex gap-3 rounded-lg p-2.5 text-ink no-underline outline-none hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-accent/40 sm:w-64"
                        >
                          {l.icon && <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft [&_svg]:h-4 [&_svg]:w-4">{l.icon}</span>}
                          <span className="min-w-0">
                            <span className="block text-[13.5px] font-medium leading-snug">{l.title}</span>
                            {l.description && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{l.description}</span>}
                          </span>
                        </BaseNav.Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </BaseNav.Content>
            </BaseNav.Item>
          ) : (
            <BaseNav.Item key={it.label}>
              <BaseNav.Link
                href={it.href}
                active={it.active}
                render={<DsLink href={it.href} />}
                aria-current={it.active ? "page" : undefined}
                className={triggerClass}
              >
                {it.label}
              </BaseNav.Link>
            </BaseNav.Item>
          ),
        )}
      </BaseNav.List>
      <BaseNav.Portal>
        <BaseNav.Positioner
          sideOffset={8}
          collisionPadding={{ top: 8, bottom: 8, left: 16, right: 16 }}
          collisionAvoidance={{ side: "none" }}
          className="z-[100] h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom] duration-200 ease-out data-instant:transition-none motion-reduce:transition-none"
        >
          <BaseNav.Popup className="relative h-[var(--popup-height)] w-[var(--popup-width)] origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-line bg-popover text-ink shadow-xl shadow-black/10 outline-none transition-[opacity,scale,width,height] duration-200 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none">
            <BaseNav.Viewport className="relative h-full w-full overflow-hidden" />
          </BaseNav.Popup>
        </BaseNav.Positioner>
      </BaseNav.Portal>
    </BaseNav.Root>
  );
}
