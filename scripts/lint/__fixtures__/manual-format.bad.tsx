// preset strict
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const pct = new Intl.NumberFormat("pt-BR", { style: "percent" });
