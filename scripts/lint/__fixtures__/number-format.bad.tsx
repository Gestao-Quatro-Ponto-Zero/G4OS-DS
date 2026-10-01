// expect 5
export const fmt = (v: number) => "R$ " + v.toFixed(2);
export const usd = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });
export const tpl = (v: number) => `R$ ${v}`;
