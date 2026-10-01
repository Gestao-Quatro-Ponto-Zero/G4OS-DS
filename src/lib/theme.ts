"use client";

import { useCallback, useEffect, useState } from "react";

/*
 * Tema (claro/escuro/sistema) e marca (preset de cliente) aplicados no <html>:
 *   <html data-theme="dark" data-brand="oceano">
 * Persistem em localStorage e sincronizam entre abas e iframes da mesma origem.
 *
 * Para evitar "flash" do tema errado, rode `themeScript` antes do React:
 *   <script dangerouslySetInnerHTML={{ __html: themeScript }} />   (no <head>)
 */

export type ThemeMode = "light" | "dark" | "system";
export const THEME_KEY = "ds-theme";
export const BRAND_KEY = "ds-brand";

/** Presets de themes.css. "g4" = padrão (sem atributo). */
export const brandPresets = [
  { id: "g4", label: "G4 (padrão)", primary: "#202124", accent: "#b9915b" },
  { id: "g4-institucional", label: "G4 Institucional", primary: "#001f35", accent: "#b9915b" },
  { id: "oceano", label: "Oceano", primary: "#1554d1", accent: "#1554d1" },
  { id: "floresta", label: "Floresta", primary: "#1f5f45", accent: "#c8963e" },
  { id: "vinho", label: "Vinho", primary: "#7a1f35", accent: "#b57b4a" },
  { id: "grafite", label: "Grafite quadrado", primary: "#2b2d31", accent: "#6b6e76" },
  { id: "violeta", label: "Violeta", primary: "#5b3fd1", accent: "#8a6cf0" },
  { id: "pergaminho", label: "Pergaminho (ref. Anthropic)", primary: "#b85a3a", accent: "#d97757" },
  { id: "ledger", label: "Ledger (ref. Stripe)", primary: "#533afd", accent: "#533afd" },
  { id: "caderno", label: "Caderno (ref. Notion)", primary: "#0075de", accent: "#ffb110" },
] as const;

/** Presets de tipografia (eixo independente da cor): <html data-type="…">. */
export const typePresets = [
  { id: "g4", label: "G4 · Figtree", sample: "Figtree" },
  { id: "editorial", label: "Editorial · Serifa nos títulos", sample: "Source Serif 4" },
  { id: "tecnica", label: "Técnica · IBM Plex", sample: "IBM Plex Sans" },
  { id: "neutra", label: "Neutra · Inter", sample: "Inter" },
  { id: "suave", label: "Suave · Manrope", sample: "Manrope" },
] as const;
export const TYPE_KEY = "ds-type";

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const LOCAL_EVENT = "ds-theme-change";
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* modo privado: segue sem persistir */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: { key, value } }));
};

/** Aplica tema/marca no documento (ou em outro elemento raiz). */
export function applyTheme(mode: ThemeMode, brand?: string, root: HTMLElement = document.documentElement, type?: string) {
  const changed = root.getAttribute("data-theme") !== mode || (root.getAttribute("data-brand") ?? "g4") !== (brand ?? "g4");
  // Troca de tema sem "animar" cores: desliga transições por um quadro (como o next-themes).
  let restore: (() => void) | undefined;
  if (changed && typeof document !== "undefined" && root === document.documentElement) {
    const style = document.createElement("style");
    style.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.appendChild(style);
    restore = () => {
      void getComputedStyle(document.body).opacity; // força o recálculo antes de religar
      setTimeout(() => style.remove(), 1);
    };
  }
  root.setAttribute("data-theme", mode);
  if (brand && brand !== "g4") root.setAttribute("data-brand", brand);
  else root.removeAttribute("data-brand");
  if (type !== undefined) {
    if (type && type !== "g4") root.setAttribute("data-type", type);
    else root.removeAttribute("data-type");
  }
  restore?.();
}

/** Tema efetivo agora ("system" resolvido pelo SO). */
export function resolvedTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Estado de tema + marca com persistência. Use UMA vez no topo do app e
 * passe para o ThemeToggle (ou use o próprio hook dentro dele).
 */
export function useTheme(initial: ThemeMode = "system", options: { apply?: boolean } = {}) {
  const { apply = true } = options;
  // Sem valor salvo, herda o que já está no <html> (outra instância ou themeScript aplicou antes).
  const fromDom = (attr: string) => (typeof document !== "undefined" ? document.documentElement.getAttribute(attr) : null);
  const [mode, setModeState] = useState<ThemeMode>(() => ((typeof window !== "undefined" && ((read(THEME_KEY) as ThemeMode) || (fromDom("data-theme") as ThemeMode))) || initial));
  const [brand, setBrandState] = useState<string>(() => (typeof window !== "undefined" && (read(BRAND_KEY) || fromDom("data-brand"))) || "g4");
  const [type, setTypeState] = useState<string>(() => (typeof window !== "undefined" && (read(TYPE_KEY) || fromDom("data-type"))) || "g4");

  useEffect(() => {
    if (apply) applyTheme(mode, brand, document.documentElement, type);
  }, [mode, brand, type, apply]);
  useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key === THEME_KEY && e.newValue) setModeState(e.newValue as ThemeMode);
      if (e.key === BRAND_KEY && e.newValue) setBrandState(e.newValue);
      if (e.key === TYPE_KEY && e.newValue) setTypeState(e.newValue);
    };
    // Outras instâncias do hook no MESMO documento (storage só avisa outras abas/iframes).
    const local = (e: Event) => {
      const { key, value } = (e as CustomEvent<{ key: string; value: string }>).detail;
      if (key === THEME_KEY) setModeState(value as ThemeMode);
      if (key === BRAND_KEY) setBrandState(value);
      if (key === TYPE_KEY) setTypeState(value);
    };
    window.addEventListener("storage", on);
    window.addEventListener(LOCAL_EVENT, local);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener(LOCAL_EVENT, local);
    };
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    write(THEME_KEY, m);
    setModeState(m);
  }, []);
  const setBrand = useCallback((b: string) => {
    write(BRAND_KEY, b);
    setBrandState(b);
  }, []);
  const setType = useCallback((t: string) => {
    write(TYPE_KEY, t);
    setTypeState(t);
  }, []);
  return { mode, setMode, brand, setBrand, type, setType, resolved: resolvedTheme(mode) };
}

/** Script inline para o <head>: aplica o tema salvo antes da primeira pintura. */
export const themeScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem("${THEME_KEY}")||"system",b=localStorage.getItem("${BRAND_KEY}"),y=localStorage.getItem("${TYPE_KEY}");d.setAttribute("data-theme",t);if(b&&b!=="g4")d.setAttribute("data-brand",b);if(y&&y!=="g4")d.setAttribute("data-type",y)}catch(e){}})();`;
