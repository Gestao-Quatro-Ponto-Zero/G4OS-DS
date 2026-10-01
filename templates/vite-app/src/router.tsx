// Roteador mínimo (History API) para o starter. Num app maior, troque por React Router
// ou TanStack Router e registre o Link deles com setLinkComponent (ver docs/guias/vite.md).
import { forwardRef, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { setLinkComponent } from "@g4ai/ds";

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

export function navigate(href: string) {
  window.history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

const Link = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(function Link({ href, onClick, children, ...props }, ref) {
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || props.target === "_blank" || /^[a-z]+:/i.test(href)) return;
    e.preventDefault();
    navigate(href);
  };
  return (
    <a ref={ref} href={href} onClick={go} {...props}>
      {children}
    </a>
  );
});

/** Chame uma vez: todos os componentes do DS com `href` passam a navegar sem recarregar. */
export function setupLinks() {
  setLinkComponent(Link);
}
