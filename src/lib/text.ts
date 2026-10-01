/** Normaliza para busca sem acento e sem caixa (pt-BR). */
export const normalize = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

/** "1 tarefa" / "3 tarefas". Plural irregular via terceiro argumento. */
export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Iniciais de um nome: "Ana Beatriz Lopes" → "AL". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] ?? "";
  return (first + last).toLocaleUpperCase("pt-BR");
}
