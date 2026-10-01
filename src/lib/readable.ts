"use client";

import { useLayoutEffect, type RefObject } from "react";

/*
 * Texto legível sobre preenchimentos calculados (heatmap, treemap, barras
 * empilhadas com rótulo dentro): a cor do fundo só existe depois do CSS
 * resolver tokens, color-mix e o tema. Este módulo lê a cor final no DOM e
 * marca cada elemento com data-on="dark" | "light", e o CSS do DS escolhe
 * --ds-on-ink ou --ds-ink (src/styles/components.css).
 */

type Rgba = [number, number, number, number];

let ctx: CanvasRenderingContext2D | null = null;
/** Converte qualquer cor CSS resolvida (rgb, oklab, color(srgb …)) em RGBA 0–255 via canvas. */
function toRgba(css: string): Rgba | null {
  if (!css || css === "transparent") return [0, 0, 0, 0];
  if (typeof document === "undefined") return null;
  ctx ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2], d[3] / 255];
}

const over = (top: Rgba, bottom: Rgba): Rgba => {
  const a = top[3] + bottom[3] * (1 - top[3]);
  if (!a) return [0, 0, 0, 0];
  const ch = (i: number) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a;
  return [ch(0), ch(1), ch(2), a];
};

/** Cor de fundo efetivamente visível atrás de `el` (compõe transparências com os ancestrais). */
export function effectiveBackground(el: Element): Rgba {
  let color: Rgba = [0, 0, 0, 0];
  let node: Element | null = el;
  while (node && color[3] < 0.999) {
    const bg = toRgba(getComputedStyle(node).backgroundColor);
    if (bg) color = over(color, bg);
    node = node.parentElement;
  }
  return color[3] < 0.999 ? over(color, [255, 255, 255, 1]) : color;
}

const lum = ([r, g, b]: Rgba) => {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a: Rgba, b: Rgba) => {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** "dark" quando o texto claro (--ds-on-ink) lê melhor sobre o fundo de `el`; "light" quando a tinta lê melhor. */
export function surfaceTone(el: Element): "dark" | "light" {
  // Lê os tokens no próprio elemento: um subtree com data-theme próprio vale.
  const root = getComputedStyle(el);
  const ink = toRgba(root.getPropertyValue("--ds-ink").trim()) ?? [32, 33, 36, 1];
  const onInk = toRgba(root.getPropertyValue("--ds-on-ink").trim()) ?? [255, 255, 255, 1];
  const bg = effectiveBackground(el);
  return ratio(onInk, bg) > ratio(ink, bg) ? "dark" : "light";
}

/**
 * Marca com data-on os elementos `[data-fill]` dentro de `ref` e refaz quando o
 * tema/marca mudam. Use junto das classes `ds-on-fill` (texto principal) e
 * `ds-on-fill-soft` (texto secundário, sem perder contraste).
 */
export function useReadableFills(ref: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const run = () => host.querySelectorAll<HTMLElement>("[data-fill]").forEach((n) => n.setAttribute("data-on", surfaceTone(n)));
    run();
    const mo = new MutationObserver(run);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-brand", "class", "style"] });
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", run);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.("change", run);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
