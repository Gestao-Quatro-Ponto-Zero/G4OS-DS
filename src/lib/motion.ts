"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useIsomorphicLayoutEffect as useLayoutEffect } from "./layout-effect";

/*
 * Movimento com contrato: o tempo só corre quando a pessoa vê, e movimento
 * reduzido mostra o fim da cena (não uma cena congelada no meio).
 * Ver docs/fundamentos/movimento.md e docs/padroes/palcos.md.
 */

const REDUCE = "(prefers-reduced-motion: reduce)";

/** Se a pessoa pediu menos movimento ao sistema. No servidor: `false`. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.(REDUCE).matches);

/** `prefersReducedMotion` como estado: muda junto com a preferência do sistema. */
export function useReducedMotion() {
  const [reduce, setReduce] = useState(prefersReducedMotion);
  useEffect(() => {
    const media = typeof window !== "undefined" ? window.matchMedia?.(REDUCE) : undefined;
    if (!media) return;
    const changed = () => setReduce(media.matches);
    changed();
    media.addEventListener?.("change", changed);
    return () => media.removeEventListener?.("change", changed);
  }, []);
  return reduce;
}

/**
 * Repete `run` a cada `ms` só enquanto a aba está visível. Numa aba oculta o
 * relógio para; ao voltar, um passo vencido roda logo e o ritmo recomeça.
 * Devolve a função que para tudo. Use no lugar de `setInterval` em cenas,
 * carrosséis e atualizações periódicas.
 */
export function everyVisible(run: () => void, ms: number) {
  if (typeof document === "undefined") return () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  let due = Date.now() + ms;
  const schedule = (wait: number) => {
    clearTimeout(timer);
    timer = setTimeout(tick, wait);
  };
  const tick = () => {
    if (document.hidden) return;
    run();
    due = Date.now() + ms;
    schedule(ms);
  };
  const visibility = () => {
    if (document.hidden) return clearTimeout(timer);
    schedule(Math.max(0, due - Date.now()));
  };
  document.addEventListener("visibilitychange", visibility);
  if (!document.hidden) schedule(ms);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", visibility);
  };
}

/** `everyVisible` como hook. `ms` nulo pausa. A função mais recente é sempre a chamada. */
export function useVisibleInterval(run: () => void, ms: number | null) {
  const latest = useRef(run);
  latest.current = run;
  useEffect(() => {
    if (ms == null) return;
    return everyVisible(() => latest.current(), ms);
  }, [ms]);
}

/**
 * O compasso de uma cena: 0, 1, … `count - 1`, um a cada `ms` com a aba
 * visível, e de novo do 0. Com movimento reduzido fica em `still` (por padrão
 * o último passo: a história inteira). `paused` segura o passo atual (fora da
 * tela, ou depois que a pessoa tocou).
 */
export function useBeat(count: number, ms: number, { still = count - 1, paused = false }: { still?: number; paused?: boolean } = {}) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState(0);
  useVisibleInterval(() => setBeat((value) => (value + 1) % count), reduce || paused ? null : ms);
  return reduce ? still : beat;
}

/**
 * Se o elemento já entrou na tela (uma vez). Uma cena começa quando a pessoa
 * chega nela, não ao carregar a página. Sem IntersectionObserver, conta como
 * visto. Devolve `[ref, visto]`: passe `ref` ao elemento.
 */
export function useInView<T extends Element>({ threshold = 0.35, once = true }: { threshold?: number; once?: boolean } = {}) {
  const [element, setElement] = useState<T | null>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (!element || (once && seen) || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible || !once) setSeen(visible);
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, seen, once, threshold]);
  return [setElement, seen] as const;
}

/**
 * Roda quando o navegador fica ocioso: dados abaixo da dobra, prévias e
 * pré-carregamentos que não podem atrasar a primeira tela. O Safari não tem
 * idle callback: uma espera curta substitui.
 */
export function whenIdle(run: () => void, timeout = 2_000) {
  if (typeof window === "undefined") return () => {};
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(run, 1_200);
  return () => clearTimeout(id);
}

/** Curva de viagem (igual a `--ease-travel`): saída lenta, trajeto claro, chegada suave. */
export const EASE_TRAVEL = "cubic-bezier(0.45, 0, 0.1, 1)";

/**
 * Uma pílula cujas palavras mudam: a largura vai da antiga à nova em vez de
 * saltar. Passe a ref do elemento e o que muda (`key`). Nada roda com
 * movimento reduzido. Uma leitura de layout por mudança, nunca em laço.
 */
export function useEasedWidth(element: RefObject<HTMLElement | null>, key: unknown, duration = 320) {
  const last = useRef<number | undefined>(undefined);
  useLayoutEffect(() => {
    const box = element.current;
    if (!box) return;
    const from = last.current;
    const to = box.getBoundingClientRect().width;
    last.current = to;
    if (!from || Math.abs(from - to) < 1 || prefersReducedMotion() || typeof box.animate !== "function") return;
    box.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration, easing: EASE_TRAVEL });
  }, [element, key, duration]);
}

/**
 * Uma lista ancorada no pé (conversa, feed): quando um item chega ou sai, os
 * que já estavam deslizam até o novo lugar em vez de pular. Compara a posição
 * do primeiro filho antes e depois de cada render e anima só `translate`
 * (compositor). Um deslize em curso continua de onde está. Nada roda quando o
 * primeiro filho é novo (outra história) ou com movimento reduzido.
 */
export function useGlide(box: RefObject<HTMLElement | null>, duration = 480) {
  const last = useRef<{ node: Element; top: number } | undefined>(undefined);
  useLayoutEffect(() => {
    const first = box.current?.firstElementChild as HTMLElement | null | undefined;
    if (!first) {
      last.current = undefined;
      return;
    }
    const before = last.current;
    last.current = { node: first, top: first.offsetTop };
    const moved = before?.node === first ? before.top - first.offsetTop : 0;
    if (!moved || prefersReducedMotion() || typeof first.animate !== "function") return;
    const now = Number.parseFloat(getComputedStyle(first).translate.split(" ")[1] ?? "0") || 0;
    const from = `0 ${now + moved}px`;
    for (const line of Array.from(box.current!.children)) {
      for (const running of line.getAnimations()) if (running.id === "ds-glide") running.cancel();
      line.animate([{ translate: from }, { translate: "0 0" }], { id: "ds-glide", duration, easing: EASE_TRAVEL });
    }
  });
}

/**
 * Se a área de rolagem já passou de `threshold` px. Devolve `{ scrolled,
 * onScroll }`: passe `onScroll` ao contêiner que rola (no DS, o documento não
 * rola). Sem contêiner, escute a janela com `{ window: true }`.
 */
export function useScrolled(threshold = 24, { window: onWindow = false }: { window?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!onWindow || typeof window === "undefined") return;
    const read = () => setScrolled(window.scrollY > threshold);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [onWindow, threshold]);
  const onScroll = (event: { currentTarget: { scrollTop: number } }) => {
    const past = event.currentTarget.scrollTop > threshold;
    setScrolled((value) => (value === past ? value : past));
  };
  return { scrolled, onScroll };
}

/**
 * O que estava na tela enquanto sai: quando `key` muda, devolve o valor
 * anterior até a animação de saída terminar (chame `done` no
 * `onAnimationEnd`). Assim um balão, um rótulo ou um cartão nunca some de
 * repente: o antigo sai enquanto o novo chega. Troca antes da pintura.
 */
export function useOutgoing<T>(value: T, key: unknown = value) {
  const shown = useRef({ value, key });
  const [leaving, setLeaving] = useState<{ value: T; key: unknown }>();
  useLayoutEffect(() => {
    if (Object.is(shown.current.key, key)) return;
    setLeaving(shown.current);
    shown.current = { value, key };
  }, [value, key]);
  return [leaving, () => setLeaving(undefined)] as const;
}
