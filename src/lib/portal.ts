"use client";
import { useCallback, useState } from "react";

/**
 * Popups (Select, Combobox, Menu, DatePicker) precisam renderizar DENTRO do
 * `<dialog>` modal ancestral, senão o `inert` do top layer os bloqueia.
 * Use o ref no gatilho e passe `container` para o Portal do Base UI.
 */
export function usePortalContainer<T extends HTMLElement = HTMLButtonElement>() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const ref = useCallback((element: T | null) => {
    if (element) setContainer(element.closest("dialog") ?? document.body);
  }, []);
  return [ref, container] as const;
}
