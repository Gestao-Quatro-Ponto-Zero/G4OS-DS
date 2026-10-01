"use client";

import Link from "next/link";
import { setLinkComponent } from "@g4os/ds";

// Componentes do DS com `href` passam a usar o Link do Next (navegação sem recarregar).
setLinkComponent(Link);

/** Renderize uma vez no layout raiz. Não desenha nada. */
export function DsSetup() {
  return null;
}
