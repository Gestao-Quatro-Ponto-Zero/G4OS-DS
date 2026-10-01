/**
 * Concatena classes. Não resolve conflito de utilitários Tailwind: se duas
 * classes disputam a mesma propriedade, decida no código, não na ordem.
 * (Se o projeto já usa tailwind-merge, pode trocar a implementação.)
 */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
