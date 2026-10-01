import { version } from "react";

/*
 * `inert` funciona no React 18 e no 19.
 *
 * O React 19 trata `inert` como booleano (`inert={true}`); o React 18 não
 * conhece o atributo: descarta `true` com aviso ("non-boolean attribute") e o
 * conteúdo continua focável. No 18 o jeito certo é a string vazia (`inert=""`),
 * que o 19 por sua vez lê como falso. Por isso a versão decide o formato.
 */
const legacy = Number.parseInt(version, 10) < 19;

/**
 * Atributos para deixar um trecho inerte (fora do Tab, do clique e dos
 * leitores de tela) no React 18 e no 19. Espalhe no elemento:
 * `<div {...inertProps(!open)}>`. Nunca escreva `inert={…}` direto.
 */
export function inertProps(flag: boolean | undefined): { inert?: boolean } {
  if (!flag) return {};
  return (legacy ? { inert: "" } : { inert: true }) as unknown as { inert?: boolean };
}
