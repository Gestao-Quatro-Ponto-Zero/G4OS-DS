import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect no navegador, useEffect no servidor. O React 18 avisa
 * ("useLayoutEffect does nothing on the server") a cada render no servidor
 * (Next, Remix); o 19 não avisa mais. Os componentes importam com o nome
 * `useLayoutEffect` para o lint de dependências continuar valendo.
 */
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
