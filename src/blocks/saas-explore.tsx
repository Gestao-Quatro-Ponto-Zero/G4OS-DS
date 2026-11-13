import { Bookmark, Building2, CalendarRange, CircleDollarSign, Layers, MapPin, Map as MapIcon, Megaphone, Percent, Repeat, Users } from "lucide-react";
import { useState } from "react";
import { Menu, Page, PageHeading, PivotBuilder, Skeleton, type PivotBuilderField, type PivotLayout, type PivotRecord } from "@g4ai/ds";
import { ListError, SaasShell } from "./shells/saas-shell";
import { useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Explorar dados",
  description: "Tabela dinâmica self-service: arraste região, canal, plano e trimestre para linhas e colunas, escolha o que somar e exporte o recorte.",
  category: "SaaS",
  order: 2.9,
  height: 1180,
  concept: {
    goal: "Responder perguntas que o painel não previu (receita do Pro no Nordeste por canal, desconto médio por segmento) sem pedir relatório ao time de dados.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo + um card de trabalho que ocupa a página",
      "PivotBuilder: campos como chips, quatro áreas (Filtros, Colunas, Linhas, Valores), arrastar ou menu do campo",
      "Subtotais por grupo recolhível, total geral fixo no rodapé, sombreamento por intensidade",
      "Visões salvas como ponto de partida; Exportar CSV do recorte",
    ],
    adapt: [
      "Financeiro: lançamentos por centro de custo × mês",
      "ATS: candidaturas por vaga × etapa × origem",
      "ERP: pedidos por produto × UF × trimestre",
    ],
    avoid: [
      "Usar o pivô para editar ou abrir registros: isso é DataGrid",
      "Pivô como resposta de uma pergunta fixa e recorrente: vire um gráfico no painel",
      "Mais de duas dimensões em Colunas: a tabela fica larga demais para ler",
    ],
  },
} as const;

const here = "#/frame/saas-explore";

/* ------------------------------------------------------------------ */
/* Dados de exemplo: 600 vendas de 2025 do Pulso (determinísticas)     */
/* ------------------------------------------------------------------ */

const ufs: { uf: string; regiao: string; peso: number }[] = [
  { uf: "SP", regiao: "Sudeste", peso: 30 },
  { uf: "RJ", regiao: "Sudeste", peso: 11 },
  { uf: "MG", regiao: "Sudeste", peso: 10 },
  { uf: "PR", regiao: "Sul", peso: 7 },
  { uf: "RS", regiao: "Sul", peso: 7 },
  { uf: "SC", regiao: "Sul", peso: 6 },
  { uf: "BA", regiao: "Nordeste", peso: 6 },
  { uf: "PE", regiao: "Nordeste", peso: 5 },
  { uf: "CE", regiao: "Nordeste", peso: 4 },
  { uf: "DF", regiao: "Centro-Oeste", peso: 5 },
  { uf: "GO", regiao: "Centro-Oeste", peso: 4 },
  { uf: "AM", regiao: "Norte", peso: 3 },
  { uf: "PA", regiao: "Norte", peso: 2 },
];
const canais = ["Inside sales", "Parceiros", "Self-service"];
const planos = [
  { nome: "Essencial", preco: 189 },
  { nome: "Pro", preco: 490 },
  { nome: "Enterprise", preco: 2400 },
];
const segmentos = ["Varejo", "Serviços", "Indústria", "Saúde", "Educação"];
const trimestres = ["1º tri 2025", "2º tri 2025", "3º tri 2025", "4º tri 2025"];

/** Pseudoaleatório estável (sem Math.random): mesmo índice, mesmo número. */
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const pick = <T,>(list: T[], weights: number[], t: number) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < list.length; i++) {
    acc += weights[i] / total;
    if (t < acc) return list[i];
  }
  return list[list.length - 1];
};

const vendas: PivotRecord[] = Array.from({ length: 600 }, (_, i) => {
  const loc = pick(ufs, ufs.map((u) => u.peso), rnd(i, 1));
  const canal = pick(canais, [4, 3, 5], rnd(i, 2));
  const plano = pick(planos, canal === "Self-service" ? [7, 3, 0.3] : canal === "Parceiros" ? [3, 5, 2] : [2, 5, 3], rnd(i, 3));
  const q = i % 4;
  const assinaturas = 1 + Math.floor(rnd(i, 4) * (plano.nome === "Enterprise" ? 4 : 14));
  const desconto = Math.round((canal === "Parceiros" ? 0.08 + rnd(i, 5) * 0.14 : canal === "Inside sales" ? rnd(i, 5) * 0.18 : rnd(i, 5) * 0.06) * 100) / 100;
  const receita = Math.round(assinaturas * plano.preco * 3 * (1 - desconto) * (1 + q * 0.07) * 100) / 100;
  return {
    regiao: loc.regiao,
    uf: loc.uf,
    canal,
    plano: plano.nome,
    trimestre: trimestres[q],
    segmento: pick(segmentos, [5, 4, 3, 2, 2], rnd(i, 6)),
    receita,
    assinaturas,
    desconto,
    clientes: Math.max(1, Math.round(assinaturas / (plano.nome === "Enterprise" ? 1 : 4))),
  };
});

const fields: PivotBuilderField[] = [
  { id: "regiao", label: "Região", kind: "dimension", icon: <MapIcon />, values: ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"] },
  { id: "uf", label: "UF", kind: "dimension", icon: <MapPin /> },
  { id: "canal", label: "Canal", kind: "dimension", icon: <Megaphone />, values: canais },
  { id: "plano", label: "Plano", kind: "dimension", icon: <Layers />, values: planos.map((p) => p.nome) },
  { id: "trimestre", label: "Trimestre", kind: "dimension", icon: <CalendarRange />, values: trimestres },
  { id: "segmento", label: "Segmento", kind: "dimension", icon: <Building2 />, values: segmentos },
  { id: "receita", label: "Receita", kind: "measure", format: "currency", icon: <CircleDollarSign /> },
  { id: "assinaturas", label: "Assinaturas", kind: "measure", format: "number", icon: <Repeat /> },
  { id: "desconto", label: "Desconto", kind: "measure", format: "percent", aggs: ["avg", "min", "max"], icon: <Percent /> },
  { id: "clientes", label: "Clientes", kind: "measure", format: "number", icon: <Users /> },
];

/** Visões salvas: pontos de partida comuns do time. */
const views: { id: string; label: string; layout: PivotLayout }[] = [
  {
    id: "receita-regiao",
    label: "Receita por região e trimestre",
    layout: { rows: ["regiao", "uf"], columns: ["trimestre"], values: [{ field: "receita", agg: "sum" }], filters: [{ field: "canal" }] },
  },
  {
    id: "planos-canal",
    label: "Assinaturas por plano e canal",
    layout: { rows: ["plano"], columns: ["canal"], values: [{ field: "assinaturas", agg: "sum" }], filters: [{ field: "trimestre" }] },
  },
  {
    id: "desconto-segmento",
    label: "Desconto médio por segmento",
    layout: { rows: ["segmento", "canal"], columns: [], values: [{ field: "desconto", agg: "avg" }, { field: "receita", agg: "sum" }], filters: [{ field: "regiao" }] },
  },
];

export default function SaasExplore() {
  const estado = useFrameParam("estado");
  const [layout, setLayout] = useState<PivotLayout>(() =>
    estado === "filtro" ? { ...views[0].layout, filters: [{ field: "canal", include: [] }] } : views[0].layout,
  );
  const active = views.find((v) => JSON.stringify(v.layout) === JSON.stringify(layout))?.id ?? "";

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading title="Explorar dados" description="Monte sua própria tabela com as vendas de 2025: agrupe, compare e exporte sem pedir relatório." />
        <div className="mt-6">
          {estado === "carregando" ? (
            <ExploreSkeleton />
          ) : estado === "erro" ? (
            <ListError noun="as vendas" />
          ) : (
            <PivotBuilder
              title="Vendas 2025"
              description={estado === "vazio" ? "Nenhuma venda registrada no período" : "600 vendas de janeiro a dezembro · valores em reais"}
              label="Vendas 2025 em tabela dinâmica"
              records={estado === "vazio" ? [] : vendas}
              fields={fields}
              layout={layout}
              onLayoutChange={setLayout}
              fileName="vendas-2025"
              heat
              maxHeight={560}
              toolbar={
                <Menu
                  trigger={
                    <>
                      <Bookmark /> Visões
                    </>
                  }
                  triggerVariant="ghost"
                  triggerClassName="h-9"
                  label="Visões salvas"
                  align="end"
                  items={[
                    { type: "label", label: "Visões salvas" },
                    { type: "radio", value: active, onValueChange: (id) => setLayout(views.find((v) => v.id === id)!.layout), options: views.map((v) => ({ value: v.id, label: v.label })) },
                  ]}
                />
              }
            />
          )}
        </div>
      </Page>
    </SaasShell>
  );
}

/** Carregando: a forma do construtor (chips, quatro áreas, tabela). */
function ExploreSkeleton() {
  return (
    <div role="status" aria-label="Carregando vendas" className="flex flex-col rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-4">
        {["w-20", "w-14", "w-20", "w-16", "w-24", "w-20", "w-24", "w-28", "w-24", "w-20"].map((w, i) => (
          <Skeleton key={i} className={`h-8 rounded-lg ${w}`} />
        ))}
      </div>
      <div className="grid gap-2.5 p-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-2 px-4 pb-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    </div>
  );
}
