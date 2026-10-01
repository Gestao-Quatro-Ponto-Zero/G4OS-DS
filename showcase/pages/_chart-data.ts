// Dados de exemplo compartilhados pelas páginas de gráficos.
export const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set"];
export const revenue = months.map((m, i) => ({
  mes: m,
  receita: Math.round(310000 + i * 14500 + Math.sin(i * 1.3) * 22000),
  meta: 320000 + i * 15000,
  anterior: Math.round(280000 + i * 11000 + Math.cos(i) * 15000),
}));
export const channels = months.map((m, i) => ({
  mes: m,
  organico: 420 + i * 30 + Math.round(Math.sin(i) * 60),
  pago: 300 + i * 18 + Math.round(Math.cos(i) * 50),
  indicacao: 120 + i * 9,
}));
export const cash = months.map((m, i) => {
  const entradas = 520000 + Math.round(Math.sin(i * 0.9) * 90000);
  const saidas = 480000 + Math.round(Math.cos(i * 1.1) * 110000);
  return { mes: m, entradas, saidas: -saidas, saldo: entradas - saidas };
});
export const visitors = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(2026, 6, 2 + i);
  return {
    dia: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
    desktop: Math.round(1800 + Math.sin(i / 4) * 600 + Math.sin(i / 1.7) * 280 + i * 6),
    mobile: Math.round(1200 + Math.cos(i / 5) * 420 + Math.sin(i / 1.3) * 200 + i * 4),
  };
});
export const funnel = [
  { label: "Visitantes", value: 48200 },
  { label: "Leads", value: 6120, hint: "formulário ou chat" },
  { label: "Qualificados", value: 2380 },
  { label: "Propostas", value: 610 },
  { label: "Ganhos", value: 212 },
];
export const hiring = [
  { label: "Candidaturas", value: 1240 },
  { label: "Triagem", value: 420 },
  { label: "Entrevista RH", value: 138 },
  { label: "Entrevista técnica", value: 64 },
  { label: "Oferta", value: 18 },
  { label: "Contratados", value: 14 },
];
export const sources = [
  { label: "Google orgânico", value: 2140 },
  { label: "LinkedIn Ads", value: 1480 },
  { label: "Indicação de clientes", value: 920 },
  { label: "Eventos", value: 610 },
  { label: "E-mail marketing", value: 470 },
  { label: "Parceiros", value: 290 },
];
export const mix = [
  { label: "Assinaturas", value: 612000 },
  { label: "Serviços", value: 238000 },
  { label: "Treinamentos", value: 141000 },
  { label: "Outros", value: 42000 },
];
export const stock = [
  { label: "Eletrônicos", value: 1840000 },
  { label: "Móveis", value: 960000 },
  { label: "Papelaria", value: 420000 },
  { label: "Limpeza", value: 310000 },
  { label: "Alimentos", value: 280000 },
  { label: "Embalagens", value: 190000 },
  { label: "EPI", value: 120000 },
  { label: "Outros", value: 80000 },
];
export const dre = [
  { label: "Receita bruta", value: 1033000, kind: "total" as const },
  { label: "Impostos", value: -142000 },
  { label: "Custos", value: -371000 },
  { label: "Margem", value: 520000, kind: "total" as const },
  { label: "Pessoal", value: -214000 },
  { label: "Marketing", value: -88000 },
  { label: "Adm.", value: -61000 },
  { label: "Financeiro", value: 12000 },
  { label: "Lucro", value: 169000, kind: "total" as const },
];
export const deals = [
  ["Atlas Engenharia", 180, 42, 8, "Enterprise"],
  ["Nortesul Log", 92, 30, 5, "Mid-market"],
  ["Café Aurora", 18, 12, 2, "PME"],
  ["Grupo Vértice", 240, 64, 9, "Enterprise"],
  ["Clínica Viva", 36, 21, 3, "PME"],
  ["Rede Horizonte", 128, 51, 6, "Mid-market"],
  ["Pátria Seguros", 310, 88, 10, "Enterprise"],
  ["Mercado Bom Dia", 24, 9, 2, "PME"],
  ["TecnoAgro", 76, 38, 4, "Mid-market"],
  ["Studio Norte", 12, 7, 1, "PME"],
  ["Farmácias Sol", 150, 47, 7, "Enterprise"],
  ["Imobiliária Lar", 44, 26, 3, "Mid-market"],
].map(([label, x, y, size, group], i) => ({ id: String(i), label: label as string, x: x as number, y: y as number, size: size as number, group: group as string }));
export const cohorts = {
  rows: ["jan/26", "fev/26", "mar/26", "abr/26", "mai/26", "jun/26"],
  columns: ["M0", "M1", "M2", "M3", "M4", "M5"],
  values: [
    [100, 88, 81, 77, 74, 71],
    [100, 90, 84, 80, 77, null],
    [100, 86, 79, 75, null, null],
    [100, 91, 86, null, null, null],
    [100, 89, null, null, null, null],
    [100, null, null, null, null, null],
  ],
};
export const hours = {
  rows: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  columns: ["8h", "10h", "12h", "14h", "16h", "18h", "20h"],
  values: [
    [12, 34, 21, 40, 38, 22, 6],
    [15, 38, 25, 44, 41, 20, 5],
    [14, 36, 28, 46, 39, 24, 7],
    [11, 32, 24, 42, 44, 26, 8],
    [9, 28, 30, 35, 31, 18, 12],
    [3, 8, 12, 9, 6, 4, 2],
  ],
};
export const sankey = {
  nodes: [
    { id: "org", label: "Orgânico", column: 0 },
    { id: "ads", label: "Anúncios", column: 0 },
    { id: "ind", label: "Indicação", column: 0 },
    { id: "qual", label: "Qualificado", column: 1 },
    { id: "desc", label: "Descartado", column: 1 },
    { id: "won", label: "Ganho", column: 2 },
    { id: "lost", label: "Perdido", column: 2 },
    { id: "open", label: "Em aberto", column: 2 },
  ],
  links: [
    { source: "org", target: "qual", value: 520 },
    { source: "org", target: "desc", value: 380 },
    { source: "ads", target: "qual", value: 410 },
    { source: "ads", target: "desc", value: 540 },
    { source: "ind", target: "qual", value: 260 },
    { source: "ind", target: "desc", value: 60 },
    { source: "qual", target: "won", value: 312 },
    { source: "qual", target: "lost", value: 498 },
    { source: "qual", target: "open", value: 380 },
  ],
};
export const activity = Array.from({ length: 182 }, (_, i) => {
  const d = new Date(2026, 8, 30);
  d.setDate(d.getDate() - i);
  const wd = d.getDay();
  const noise = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1; // determinístico
  const v = wd === 0 || wd === 6 ? Math.round(noise * 2) : Math.round(Math.max(0, 6 + Math.sin(i / 6) * 5 + (noise - 0.4) * 6));
  return { date: d.toISOString().slice(0, 10), value: v };
});

/* ---------------- Gráficos v2 (área, barras, linhas, pizza, radar, radial) ---------------- */
// Vendas por canal, jan–jun (duas séries, estilo "desktop × mobile").
export const sales6 = [
  { mes: "jan", online: 186000, loja: 80000 },
  { mes: "fev", online: 305000, loja: 200000 },
  { mes: "mar", online: 237000, loja: 120000 },
  { mes: "abr", online: 73000, loja: 190000 },
  { mes: "mai", online: 209000, loja: 130000 },
  { mes: "jun", online: 214000, loja: 140000 },
];
// Leads por dia (90 dias) com duas origens, para os interativos.
export const leadsDaily = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(2026, 6, 3 + i);
  const wd = d.getDay();
  const weekend = wd === 0 || wd === 6 ? 0.55 : 1;
  return {
    dia: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
    organico: Math.round((210 + Math.sin(i / 5) * 60 + Math.sin(i / 1.9) * 28 + i * 0.9) * weekend),
    pago: Math.round((150 + Math.cos(i / 6) * 45 + Math.sin(i / 1.4) * 22 + i * 0.6) * weekend),
  };
});
export const regions = [
  { regiao: "Sudeste", vendas: 1840000 },
  { regiao: "Sul", vendas: 920000 },
  { regiao: "Nordeste", vendas: 760000 },
  { regiao: "Centro-Oeste", vendas: 410000 },
  { regiao: "Norte", vendas: 190000 },
];
export const stagesDeals = [
  { etapa: "Qualificação", negocios: 42, cor: "var(--ds-chart-6)" },
  { etapa: "Diagnóstico", negocios: 31, cor: "var(--ds-chart-2)" },
  { etapa: "Proposta", negocios: 18, cor: "var(--ds-chart-3)" },
  { etapa: "Negociação", negocios: 11, cor: "var(--ds-chart-4)" },
  { etapa: "Fechamento", negocios: 6, cor: "var(--ds-ok)" },
];
export const profit6 = [
  { mes: "abr", resultado: 42000 },
  { mes: "mai", resultado: -18000 },
  { mes: "jun", resultado: 27000 },
  { mes: "jul", resultado: -9000 },
  { mes: "ago", resultado: 61000 },
  { mes: "set", resultado: 38000 },
];
export const conversion9 = months.map((m, i) => ({
  mes: m,
  pme: Number((14.1 - i * 0.55 + Math.sin(i) * 0.6).toFixed(1)),
  mid: Number((11.6 + Math.cos(i) * 0.5 + i * 0.06).toFixed(1)),
}));
export const pieChannels = [
  { key: "organico", label: "Orgânico", value: 2140 },
  { key: "pago", label: "Anúncios", value: 1480 },
  { key: "indicacao", label: "Indicação", value: 920 },
  { key: "eventos", label: "Eventos", value: 610 },
  { key: "outros", label: "Outros", value: 470 },
];
export const pieRings = [
  { label: "2026", items: [{ label: "Assinaturas", value: 612 }, { label: "Serviços", value: 238 }, { label: "Treinamentos", value: 141 }] },
  { label: "2025", items: [{ label: "Assinaturas", value: 480 }, { label: "Serviços", value: 260 }, { label: "Treinamentos", value: 98 }] },
];
export const radarAxes = ["Técnica", "Comunicação", "Liderança", "Cultura", "Negócio", "Inglês"];
export const radarA = { label: "Marina Costa", values: [4.5, 4, 3, 4.5, 3.5, 4] };
export const radarB = { label: "Rafael Lima", values: [3.5, 4.5, 4, 3.5, 4, 3] };
export const radarIdeal = { label: "Perfil da vaga", values: [4, 4, 3.5, 4, 3, 3.5] };
