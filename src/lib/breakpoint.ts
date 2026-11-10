"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Larguras em que o layout do DS muda. `mobile` é o limite da navegação de celular
 * (BottomNav, Sheet no lugar de Popover); `compact` é o do `sm:` do Tailwind (campos em tela cheia).
 */
export const breakpoints = { compact: 640, mobile: 768, tablet: 1024, desktop: 1280 } as const;

/**
 * Acompanha uma media query. No servidor e na primeira pintura devolve `initial` (padrão `false`),
 * para o HTML do servidor e o do cliente baterem; o valor real chega no primeiro efeito.
 */
export function useMediaQuery(query: string, initial = false) {
  const [match, setMatch] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/**
 * `true` abaixo de 768 px, o mesmo corte do `md:` e da navegação de celular do DS. Use para trocar
 * a superfície (Popover no desktop, Sheet no celular), nunca para esconder conteúdo: isso é CSS.
 * `below` muda o corte: `useIsMobile("compact")` segue o `sm:` (640 px).
 */
export function useIsMobile(below: keyof typeof breakpoints | number = "mobile") {
  const px = typeof below === "number" ? below : breakpoints[below];
  return useMediaQuery(`(max-width: ${px - 0.02}px)`);
}

/**
 * Bordas de uma linha que rola de lado: diz se há conteúdo escondido no começo e no fim, para
 * desenhar o esmaecido (classe `scroll-fade-x` + `data-edge-start`/`data-edge-end`). `deps` refaz a
 * medida quando o conteúdo muda.
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>, enabled = true, deps: unknown = null) {
  const [edge, setEdge] = useState({ start: false, end: false });
  useEffect(() => {
    const box = ref.current;
    if (!enabled || !box) return;
    const measure = () => {
      const next = { start: box.scrollLeft > 1, end: box.scrollLeft + box.clientWidth < box.scrollWidth - 1 };
      setEdge((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    measure();
    box.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(box);
    return () => {
      box.removeEventListener("scroll", measure);
      ro?.disconnect();
    };
  }, [ref, enabled, deps]);
  return edge;
}

/** Traz um item para dentro da área visível de uma linha que rola de lado, sem rolar a página. */
export function scrollIntoRow(box: HTMLElement | null, item: HTMLElement | null, margin = 24) {
  if (!box || !item || box.scrollWidth <= box.clientWidth) return;
  const left = item.offsetLeft - margin;
  const right = item.offsetLeft + item.offsetWidth + margin;
  if (left < box.scrollLeft) box.scrollLeft = Math.max(0, left);
  else if (right > box.scrollLeft + box.clientWidth) box.scrollLeft = right - box.clientWidth;
}
