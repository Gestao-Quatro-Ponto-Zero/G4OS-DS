import { useMemo, useState } from "react";
import { CalendarRange, CircleDollarSign, Layers, Map as MapIcon, Megaphone, Repeat } from "lucide-react";
import { PivotBuilder, PivotTable, pivot, type PivotBuilderField, type PivotLayout, type PivotRecord } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Tabela dinâmica",
  group: "Coleções",
  order: 45,
  description:
    "PivotBuilder e PivotTable para análise self-service: a pessoa escolhe o que agrupar (Linhas, Colunas), o que calcular (Valores) e o recorte (Filtros), com subtotais, total geral e exportação em CSV. O motor pivot() é puro e testado.",
};

// Dados determinísticos (sem Math.random) para prints estáveis.
const regioes = ["Nordeste", "Sudeste", "Sul"];
const ufs: Record<string, string[]> = { Nordeste: ["BA", "PE"], Sudeste: ["SP", "RJ", "MG"], Sul: ["PR", "RS"] };
const canais = ["Inside sales", "Parceiros", "Self-service"];
const planos = ["Essencial", "Pro", "Enterprise"];
const tris = ["1º tri", "2º tri", "3º tri", "4º tri"];
const wave = (i: number, s: number) => (Math.sin(i * 1.7 + s) + 1) / 2;
const records: PivotRecord[] = Array.from({ length: 160 }, (_, i) => {
  const regiao = regioes[i % 3];
  const list = ufs[regiao];
  const plano = planos[Math.floor(wave(i, 2) * 2.99)];
  const assinaturas = 1 + Math.round(wave(i, 3) * 9);
  return {
    regiao,
    uf: list[Math.floor(i / 3) % list.length],
    canal: canais[Math.floor(wave(i, 1) * 2.99)],
    plano,
    trimestre: tris[i % 4],
    assinaturas,
    receita: Math.round(assinaturas * (plano === "Enterprise" ? 7200 : plano === "Pro" ? 1470 : 567) * (1 + (i % 4) * 0.05)),
  };
});

const fields: PivotBuilderField[] = [
  { id: "regiao", label: "Região", kind: "dimension", icon: <MapIcon />, values: regioes },
  { id: "uf", label: "UF", kind: "dimension" },
  { id: "canal", label: "Canal", kind: "dimension", icon: <Megaphone />, values: canais },
  { id: "plano", label: "Plano", kind: "dimension", icon: <Layers />, values: planos },
  { id: "trimestre", label: "Trimestre", kind: "dimension", icon: <CalendarRange />, values: tris },
  { id: "receita", label: "Receita", kind: "measure", format: "currency", icon: <CircleDollarSign /> },
  { id: "assinaturas", label: "Assinaturas", kind: "measure", format: "number", icon: <Repeat /> },
];

export default function Page() {
  const result = useMemo(
    () => pivot(records, fields, { rows: ["regiao", "uf"], columns: ["trimestre"], values: [{ field: "receita", agg: "sum" }], filters: [] }),
    [],
  );
  const [layout, setLayout] = useState<PivotLayout>({
    rows: ["plano"],
    columns: ["canal"],
    values: [{ field: "assinaturas", agg: "sum" }],
    filters: [{ field: "trimestre" }],
  });

  return (
    <DocPage title={meta.title} kicker="Coleções" description={meta.description}>
      <DocSection
        title="Construtor"
        rule="Arraste um campo para Filtros, Colunas, Linhas ou Valores (a tabela mostra a prévia antes de soltar) ou use o menu do campo: tudo funciona sem arrastar, pelo teclado. Medida só vai para Valores; dimensão fica em Linhas OU Colunas."
      >
        <Demo
          bare
          code={`const fields: PivotBuilderField[] = [
  { id: "regiao", label: "Região", kind: "dimension", icon: <Map />, values: ["Nordeste", "Sudeste", "Sul"] },
  { id: "canal", label: "Canal", kind: "dimension" },
  { id: "receita", label: "Receita", kind: "measure", format: "currency" },
];
const [layout, setLayout] = useState<PivotLayout>({
  rows: ["regiao"], columns: ["canal"], values: [{ field: "receita", agg: "sum" }], filters: [],
});
<PivotBuilder title="Vendas 2025" records={vendas} fields={fields}
  layout={layout} onLayoutChange={setLayout} fileName="vendas-2025" heat />`}
        >
          <PivotBuilder
            title="Vendas 2025"
            description="160 vendas de exemplo"
            records={records}
            fields={fields}
            layout={layout}
            onLayoutChange={setLayout}
            fileName="vendas-exemplo"
            heat
            maxHeight={420}
          />
        </Demo>
      </DocSection>

      <DocSection
        title="Só a tabela"
        rule="Quando o recorte é fixo mas a pessoa precisa de subtotais e do detalhe, calcule com `pivot()` e desenhe com `PivotTable`. Grupos recolhem pelo chevron (← e → também); subtotais ficam na faixa `soft` e o total geral, em negrito, no rodapé fixo."
      >
        <Demo
          bare
          code={`const result = pivot(records, fields, {
  rows: ["regiao", "uf"], columns: ["trimestre"],
  values: [{ field: "receita", agg: "sum" }], filters: [],
});
<PivotTable result={result} label="Receita por região e trimestre" heat />`}
        >
          <PivotTable result={result} label="Receita por região e trimestre" heat maxHeight={380} />
        </Demo>
      </DocSection>

      <DocSection
        title="Motor"
        rule="`pivot(records, fields, layout)` é puro (sem React) e recalcula cada agregação a partir dos registros do grupo: a média do subtotal é a dos registros, nunca a média das médias. `distinct` conta valores únicos."
      >
        <PropsTable
          rows={[
            ["pivot(records, fields, layout)", "PivotResult", "—", "Árvore de linhas com subtotais, colunas, value[rowKey][colKey][i], totais (chave PIVOT_TOTAL) e grandTotal."],
            ["pivotToRows(result)", "{ header, rows }", "—", "Tabela achatada (subtotais e total geral) para CSV ou cópia."],
            ["formatPivotValue(n, spec)", "string", "—", "Formata pelo campo e pela agregação com lib/format; null vira “—”."],
            ["pivotMove(layout, fields, from, to)", "PivotLayout", "—", "Move um campo entre áreas respeitando as regras (o que o construtor usa)."],
            ["pivotSwap(layout)", "PivotLayout", "—", "Troca Linhas e Colunas."],
            ["PivotField.values", "string[]", "—", "Ordem das categorias (trimestres, etapas). O resto vem em ordem alfabética."],
            ["PivotField.aggs", "PivotAgg[]", "por tipo", "Agregações oferecidas: sum, avg, count, min, max, distinct. A primeira é a padrão."],
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["records", "PivotRecord[]", "—", "Registros crus (um por venda, pedido, candidatura)."],
            ["fields", "PivotBuilderField[]", "—", "Dimensões e medidas, com icon lucide opcional no chip."],
            ["layout / defaultLayout", "PivotLayout", "vazio", "Controlado ou não. onLayoutChange recebe cada mudança."],
            ["heat", "boolean", "false", "Sombreia as células de detalhe pela intensidade (uma escala por valor), com legenda."],
            ["fileName", "string", "\"tabela-dinamica\"", "Nome do arquivo de “Exportar CSV” (pt-BR: “;” e vírgula decimal)."],
            ["toolbar", "ReactNode", "—", "Controles extras no topo (visões salvas)."],
            ["maxHeight", "number | string", "520", "Altura da tabela: rola dentro do card, nunca a página."],
            ["compact", "boolean", "false", "Moeda abreviada (R$ 1,2 mi) para tabelas largas."],
            ["PivotTable.result", "PivotResult", "—", "Saída de pivot()."],
            ["PivotTable.label", "string", "—", "Nome acessível da tabela (obrigatório)."],
            ["PivotTable.defaultCollapsed", "string[]", "—", "Grupos que começam recolhidos."],
          ]}
        />
      </DocSection>

      <DocSection title="Quando usar">
        <Rules
          items={[
            {
              do: "Análise self-service: a pessoa monta a pergunta (receita por região × trimestre, desconto médio por canal) e exporta o recorte.",
              dont: "Navegar, abrir ou editar registros: isso é DataGrid, com busca, seleção e edição inline.",
            },
            {
              do: "Pergunta fixa e recorrente vira gráfico no painel (ChartCard): a resposta aparece sem montar nada.",
              dont: "Deixar o pivô como a única forma de ver um número que todo mundo procura toda semana.",
            },
            { do: "No máximo duas dimensões em Colunas; o resto em Linhas, com subtotais recolhíveis.", dont: "Tabela de 40 colunas que rola de lado sem fim." },
            { do: "Ordem natural das categorias com values (trimestres, etapas do funil, faixas).", dont: "Trimestres em ordem alfabética ou etapas fora do fluxo." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
