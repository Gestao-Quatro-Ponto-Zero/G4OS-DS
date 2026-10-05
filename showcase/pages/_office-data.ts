import type { OfficeDocument, Workbook } from "@g4ai/ds";

const produtos: [string, string, number, number, number][] = [
  ["G4 Scale", "Programa", 22, 24_900, 9_400],
  ["G4 Club", "Comunidade", 64, 7_800, 2_100],
  ["Gestão e Estratégia", "Imersão", 38, 12_500, 4_300],
  ["Vendas B2B", "Imersão", 41, 11_900, 4_100],
  ["Liderança", "Imersão", 27, 11_900, 4_400],
  ["Marketing Digital", "Imersão", 30, 10_400, 3_900],
  ["Finanças para CEOs", "Imersão", 17, 12_500, 4_700],
  ["G4 Skills", "Online", 520, 1_490, 310],
  ["Mentoria executiva", "Serviço", 11, 36_000, 21_000],
  ["Conselho consultivo", "Serviço", 7, 54_000, 30_500],
];

const vendedores: [string, string, number, number, number][] = [
  ["Ana Ribeiro", "Enterprise", 1_200_000, 1_356_000, 14],
  ["Bruno Takahashi", "Enterprise", 1_200_000, 984_000, 11],
  ["Carla Menezes", "Mid-market", 650_000, 712_400, 31],
  ["Diego Fontes", "Mid-market", 650_000, 598_000, 27],
  ["Elisa Moura", "PME", 380_000, 441_900, 58],
  ["Felipe Andrade", "PME", 380_000, 352_300, 49],
];

const etapas = ["Qualificação", "Diagnóstico", "Proposta", "Negociação", "Contrato"];
const empresas = ["Acme Logística", "Nexo Saúde", "Vértice Engenharia", "Lumen Varejo", "Orbe Seguros", "Pátria Agro", "Rota Transportes", "Delta Têxtil", "Fator Educação", "Prisma Energia", "Aurora Foods", "Trilha Turismo"];

export const workbook: Workbook = {
  title: "Fechamento comercial · Q3 2026",
  author: "Diretoria Comercial",
  sheets: [
    {
      name: "Por produto",
      title: "Skills tem o maior volume e a melhor margem do portfólio",
      description: "Fonte: CRM e ERP, 01/07 a 30/09/2026. Valores sem impostos.",
      totals: true,
      columns: [
        { key: "produto", header: "Produto", width: 22 },
        { key: "categoria", header: "Categoria", width: 13 },
        { key: "qtd", header: "Vendas", format: "integer", total: "sum" },
        { key: "preco", header: "Ticket médio", format: "currency", total: "average" },
        { key: "receita", header: "Receita", format: "currency", formula: "{qtd} * {preco}", total: "sum" },
        { key: "custoUnit", header: "Custo unitário", format: "currency" },
        { key: "custo", header: "Custo total", format: "currency", formula: "{qtd} * {custoUnit}", total: "sum" },
        { key: "margem", header: "Margem", format: "percent", formula: "({receita} - {custo}) / {receita}", total: { formula: "({receita} - {custo}) / {receita}" }, note: "Margem bruta: (receita − custo) ÷ receita." },
      ],
      rows: produtos.map(([produto, categoria, qtd, preco, custoUnit]) => ({ produto, categoria, qtd, preco, custoUnit })),
    },
    {
      name: "Por vendedor",
      title: "3 de 6 executivos bateram a meta",
      description: "Atingimento = realizado ÷ meta do trimestre.",
      totals: true,
      columns: [
        { key: "nome", header: "Executivo", width: 18 },
        { key: "time", header: "Time", width: 12 },
        { key: "meta", header: "Meta", format: "currency", total: "sum" },
        { key: "realizado", header: "Realizado", format: "currency", total: "sum" },
        { key: "ating", header: "Atingimento", format: "percent", formula: "{realizado} / {meta}", total: { formula: "{realizado} / {meta}" } },
        { key: "negocios", header: "Negócios", format: "integer", total: "sum" },
        { key: "ticket", header: "Ticket médio", format: "currency", formula: "{realizado} / {negocios}", total: { formula: "{realizado} / {negocios}" } },
      ],
      rows: vendedores.map(([nome, time, meta, realizado, negocios]) => ({ nome, time, meta, realizado, negocios })),
    },
    {
      name: "Pipeline Q4",
      title: "R$ 1,3 mi ponderado para o Q4",
      description: "Valor ponderado = valor × probabilidade da etapa.",
      totals: "Total do pipeline",
      columns: [
        { key: "empresa", header: "Empresa", width: 20 },
        { key: "etapa", header: "Etapa", width: 13 },
        { key: "valor", header: "Valor", format: "currency", total: "sum" },
        { key: "prob", header: "Probabilidade", format: "percent", digits: 0 },
        { key: "ponderado", header: "Ponderado", format: "currency", formula: "{valor} * {prob}", total: "sum" },
        { key: "fechamento", header: "Previsão", format: "date" },
      ],
      rows: empresas.map((empresa, i) => ({
        empresa,
        etapa: etapas[i % etapas.length],
        valor: [180_000, 96_000, 420_000, 64_000, 250_000, 138_000, 72_000, 310_000, 45_000, 520_000, 88_000, 160_000][i],
        prob: [0.1, 0.25, 0.5, 0.75, 0.9][i % etapas.length],
        fechamento: `2026-${String(10 + (i % 3)).padStart(2, "0")}-${String(5 + ((i * 7) % 24)).padStart(2, "0")}`,
      })),
    },
  ],
};

const receita = produtos.map(([p, c, q, preco, custo]) => [p, c, q, q * preco, (q * preco - q * custo) / (q * preco)] as const);
const total = receita.reduce((a, r) => a + r[3], 0);
const custoTotal = produtos.reduce((a, [, , q, , c]) => a + q * c, 0);

export const document: OfficeDocument = {
  kicker: "Relatório trimestral · Q3 2026",
  title: "Vendas cresceram 18\u00A0% com o mesmo time",
  subtitle: "O que funcionou, o que travou e as três apostas para o Q4.",
  author: "Diretoria Comercial",
  date: "2026-10-03",
  toc: true,
  footer: "Uso interno",
  blocks: [
    { type: "heading", text: "Resumo" },
    {
      type: "paragraph",
      text: [
        { text: "O trimestre fechou com " },
        { text: "R$ 4,4 mi de receita nova", bold: true },
        { text: ", 18\u00A0% acima do Q2, sem aumento de headcount. A virada veio de contas médias (50 a 200 funcionários) e da indicação, que passou a ser o maior canal. O ciclo de venda, porém, ficou mais longo nas contas grandes." },
      ],
    },
    {
      type: "stats",
      items: [
        { label: "Receita nova", value: "R$ 4,4 mi", delta: "+18 % vs. Q2", good: true },
        { label: "Win rate", value: "27 %", delta: "+4 p.p.", good: true },
        { label: "Ciclo médio", value: "41 dias", delta: "+6 dias", good: false },
      ],
    },
    { type: "callout", tone: "info", title: "Como ler este relatório", text: "Valores sem impostos. Receita reconhecida na assinatura do contrato. Comparações sempre contra o Q2 2026, salvo indicação." },
    { type: "heading", text: "Resultados por produto" },
    { type: "paragraph", text: "Skills lidera em volume e em margem. Mentoria e Conselho têm o maior ticket, mas a menor margem do portfólio; Finanças para CEOs teve a menor procura entre as imersões." },
    {
      type: "table",
      caption: "Fonte: CRM e ERP, 01/07 a 30/09/2026. Planilha completa no anexo “Fechamento comercial · Q3 2026”.",
      totalRow: true,
      columns: [
        { header: "Produto", width: 2.2 },
        { header: "Categoria", width: 1.4 },
        { header: "Vendas", format: "integer" },
        { header: "Receita", format: "currency", width: 1.6 },
        { header: "Margem", format: "percent" },
      ],
      rows: [...receita.map((r) => [...r]), ["Total", "", receita.reduce((a, r) => a + r[2], 0), total, (total - custoTotal) / total]],
    },
    { type: "heading", text: "O que funcionou", level: 2 },
    {
      type: "list",
      items: [
        [{ text: "Indicação estruturada: ", bold: true }, { text: "programa de embaixadores gerou 31 % dos negócios." }],
        [{ text: "Caso de ROI na proposta: ", bold: true }, { text: "propostas com ROI fecharam 2× mais rápido." }],
        [{ text: "Squad mid-market: ", bold: true }, { text: "Carla e Diego somaram R$ 1,3 mi com ticket 40 % maior." }],
      ],
    },
    { type: "quote", text: "Fechamos em três semanas porque a proposta já vinha com o nosso caso de ROI.", author: "Mariana Couto", role: "Head de Vendas, Acme Logística" },
    { type: "heading", text: "O que travou" },
    { type: "paragraph", text: "O ciclo médio subiu 6 dias, concentrado em contas acima de R$ 100 mil. Três causas explicam quase todo o atraso:" },
    { type: "list", ordered: true, items: ["Jurídico do cliente entra tarde: +9 dias em média.", "Proposta sem caso de ROI volta para revisão duas vezes.", "Só um executivo com experiência em enterprise."] },
    { type: "callout", tone: "amber", title: "Risco para o Q4", text: "Se o ciclo enterprise seguir em 58 dias, R$ 640 mil do pipeline escorregam para janeiro." },
    { type: "heading", text: "Pipeline do Q4", level: 2 },
    { type: "paragraph", text: "Pipeline aberto por empresa, do maior para o menor valor ponderado. A tabela continua na página seguinte quando não cabe." },
    {
      type: "table",
      caption: "Valor ponderado = valor × probabilidade da etapa. Previsão informada pelo executivo.",
      totalRow: true,
      columns: [
        { header: "Empresa", width: 2 },
        { header: "Etapa", width: 1.3 },
        { header: "Valor", format: "currency", width: 1.4 },
        { header: "Prob.", format: "percent", digits: 0, width: 0.8 },
        { header: "Ponderado", format: "currency", width: 1.4 },
        { header: "Previsão", format: "date", width: 1.1 },
      ],
      rows: (() => {
        const rows = Array.from({ length: 36 }, (_, i) => {
          const valor = [180_000, 96_000, 420_000, 64_000, 250_000, 138_000, 72_000, 310_000, 45_000, 520_000, 88_000, 160_000][i % 12] * (1 + (i % 5) / 10);
          const prob = [0.1, 0.25, 0.5, 0.75, 0.9][i % 5];
          return [`${empresas[i % 12]}${i >= 12 ? ` · ${["unidade Sul", "unidade Norte"][Math.floor(i / 12) - 1]}` : ""}`, etapas[i % 5], valor, prob, valor * prob, `2026-${String(10 + (i % 3)).padStart(2, "0")}-${String(3 + ((i * 7) % 25)).padStart(2, "0")}`];
        }).sort((a, b) => (b[4] as number) - (a[4] as number));
        const v = rows.reduce((a, r) => a + (r[2] as number), 0);
        const p = rows.reduce((a, r) => a + (r[4] as number), 0);
        return [...rows, ["Total", "", v, p / v, p, null]];
      })(),
    },
    { type: "heading", text: "Plano para o Q4" },
    {
      type: "table",
      columns: [{ header: "Aposta", width: 2.4 }, { header: "Dono", width: 1.2 }, { header: "Prazo", format: "date" }],
      rows: [
        ["Jurídico no kick-off de toda conta acima de R$ 100 mil", "Ana Ribeiro", "2026-10-15"],
        ["Modelo de ROI obrigatório na proposta", "Carla Menezes", "2026-10-31"],
        ["Contratar 1 executivo enterprise", "Diretoria", "2026-11-30"],
      ],
    },
    { type: "paragraph", text: "Cada aposta tem um indicador semanal no painel comercial. Revisamos o plano na reunião de pipeline de 4 de novembro." },
    { type: "divider" },
    { type: "heading", text: "Aprovação" },
    { type: "paragraph", text: "Relatório revisado e aprovado pela diretoria em 3 de outubro de 2026." },
    { type: "signatures", people: [{ name: "Rafael Lima", role: "Diretor Comercial" }, { name: "Juliana Prado", role: "Diretora Financeira" }] },
  ],
};
