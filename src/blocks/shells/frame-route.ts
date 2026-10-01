"use client";

import { useEffect, useState } from "react";

/*
 * Rotas dos blocos do showcase: cada tela é `#/frame/<slug>` e o registro
 * aberto vai na query do hash (`#/frame/ats-candidate?id=c1`).
 *
 * No SEU app troque por rotas de verdade (Next: /candidatos/[id] + useParams).
 * Mantenha a mesma forma: lista → detalhe por id, detalhe → lista com volta.
 */

type Params = Record<string, string | number | undefined | null>;

/** "#/frame/erp-order?id=12". Segundo argumento: id (string) ou objeto de parâmetros. */
export function frameHref(slug: string, params?: Params | string) {
  const q = new URLSearchParams();
  const obj: Params = typeof params === "string" ? { id: params } : params ?? {};
  Object.entries(obj).forEach(([k, v]) => v != null && v !== "" && q.set(k, String(v)));
  const s = q.toString();
  return `#/frame/${slug}${s ? `?${s}` : ""}`;
}

/** Navega para outra tela do mesmo produto. */
export function go(slug: string, params?: Params | string) {
  location.hash = frameHref(slug, params).slice(1);
}

function readHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.hash.split("?")[1] ?? "");
}

/** Parâmetros da tela atual (`?id=…`), atualizados quando o hash muda. */
export function useFrameParams() {
  const [params, setParams] = useState(readHashParams);
  useEffect(() => {
    const on = () => setParams(readHashParams());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return params;
}

/** Um parâmetro da tela. Com `fallback`, nunca vem vazio (ex.: o primeiro registro). */
export function useFrameParam(name: string): string | null;
export function useFrameParam(name: string, fallback: string): string;
export function useFrameParam(name: string, fallback?: string) {
  return useFrameParams().get(name) || fallback || null;
}

/** Navega para um href já montado ("#/frame/app-notifications"). */
export function goTo(href: string) {
  location.hash = href.replace(/^#/, "");
}

/** Alias de useFrameParams (nome usado nas telas de Configurações/Aplicação). */
export const useFrameQuery = useFrameParams;

/** Troca só parâmetros da tela atual (abre/fecha detalhe por ?id=) sem mudar de tela. */
export function setFrameQuery(params: Record<string, string | undefined>) {
  const hash = window.location.hash.slice(1);
  const base = hash.split("?")[0];
  const q = readHashParams();
  Object.entries(params).forEach(([k, v]) => (v === undefined || v === "" ? q.delete(k) : q.set(k, v)));
  const s = q.toString();
  const next = `${base}${s ? `?${s}` : ""}`;
  if (next !== hash) window.location.hash = next;
}
