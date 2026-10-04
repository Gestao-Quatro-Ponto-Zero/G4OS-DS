import { OfficeFileView, WorkbookView } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { workbook } from "./_office-data";

export const meta: PageMeta = {
  title: "Planilhas (Excel)",
  group: "Mídia e conteúdo",
  order: 21,
  description: "WorkbookView mostra planilhas escritas em código (Workbook: colunas, fórmulas, total) ou lidas de um .xlsx real: abas, grade com endereços A1, barra de fórmula, soma da seleção e copiar para o Excel. Exportar é opcional e fica no app.",
};

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="WorkbookView" rule="Escrita em código. Clique numa célula e use as setas; Shift seleciona intervalo (soma, média e contagem no rodapé), Ctrl+C copia para colar no Excel. Células com fórmula mostram a fórmula na barra.">
        <Demo
          bare
          code={`const workbook: Workbook = {
  title: "Fechamento comercial · Q3 2026",
  sheets: [{
    name: "Por produto",
    title: "Skills tem o maior volume e a melhor margem",   // conclusão, como título de slide
    description: "Fonte: CRM e ERP, 01/07 a 30/09/2026.",
    totals: true,
    columns: [
      { key: "produto", header: "Produto" },
      { key: "qtd", header: "Vendas", format: "integer", total: "sum" },
      { key: "preco", header: "Ticket médio", format: "currency", total: "average" },
      { key: "receita", header: "Receita", format: "currency", formula: "{qtd} * {preco}", total: "sum" },
      { key: "margem", header: "Margem", format: "percent",
        formula: "({receita} - {custo}) / {receita}",
        total: { formula: "({receita} - {custo}) / {receita}" } },   // razão no total, não média
    ],
    rows: [{ produto: "G4 Scale", qtd: 38, preco: 24900, custo: 357200 }, …],
  }],
};
<WorkbookView workbook={workbook} className="h-[560px]" />`}
        >
          <WorkbookView workbook={workbook} className="h-[560px]" />
        </Demo>
      </DocSection>

      <DocSection title="De um arquivo .xlsx" rule="O mesmo visualizador lê o arquivo real (.xlsx ou .csv): valores, fórmulas com o resultado salvo, formatos, cores de célula, mesclas, linhas e colunas ocultas, painéis congelados e gráficos (botão Gráficos ao lado do título). Até 50 mil linhas: só as visíveis são desenhadas. Mais exemplos em Arquivos do Office.">
        <Demo
          bare
          code={`// Arquivo enviado pela pessoa, anexo ou URL: OfficeFileView detecta o tipo
<OfficeFileView source={file} className="h-[520px]" />

// Ou leia e use o WorkbookView direto
const file = await readOfficeFile(blob);          // { kind: "xlsx", workbook }
if (file.kind === "xlsx") <WorkbookView workbook={file.workbook} />`}
        >
          <OfficeFileView source="samples/contas-a-receber.xlsx" className="h-[520px]" />
        </Demo>
      </DocSection>

      <DocSection title="Exportar para .xlsx (opcional)" rule="O DS mostra; gerar o arquivo é decisão do app. A receita pronta usa exceljs e o mesmo layoutSheet da tela, então o arquivo sai igual ao que se vê: fórmulas vivas, total com SUBTOTAL, filtro, cabeçalho fixo e impressão em A4.">
        <CodeBlock
          code={`// 1. pnpm add exceljs   2. copie node_modules/@g4ai/ds/templates/office-export.ts para o app
import { exportXlsx } from "@/lib/office-export";

<WorkbookView
  workbook={workbook}
  actions={<Button variant="ghost" size="sm" onClick={() => op.run(() => exportXlsx(workbook), "Planilha baixada")}><Download /> Baixar .xlsx</Button>}
/>`}
        />
        <p className="m-0 text-[13.5px] text-ink-soft">Guia completo: <code>docs/guias/office.md</code>.</p>
        <PropsTable
          rows={[
            ["WorkbookView.workbook", "Workbook | FileWorkbook", "—", "Escrito em código ou lido de .xlsx (readOfficeFile)."],
            ["WorkbookView.actions", "ReactNode", "—", "Ações na barra (ex.: Baixar .xlsx do app)."],
            ["WorkbookView.loading", "boolean", "false", "Esqueleto da grade enquanto carrega."],
            ["WorkbookSheet.title / description", "string", "—", "Título (conclusão) e fonte acima da tabela."],
            ["WorkbookSheet.totals", "boolean | string", "—", "Linha de total; string troca o rótulo."],
            ["WorkbookSheet.freezeColumns", "number", "1", "Colunas fixas à esquerda."],
            ["WorkbookColumn.format", '"text" | "integer" | "number" | "currency" | "percent" | "date"', '"text"', "Percentual recebe fração (0,27 = 27 %)."],
            ["WorkbookColumn.formula", "string", "—", "Aritmética com {chave}: + − * / e parênteses. Pode usar colunas de fórmula à esquerda."],
            ["WorkbookColumn.total", '"sum" | "average" | "count" | "min" | "max" | { formula }', "—", "Agregação ou fórmula sobre os totais."],
            ["WorkbookColumn.note", "string", "—", "Definição da métrica (triângulo dourado no cabeçalho)."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras de planilha">
        <Rules
          items={[
            { do: "Título da aba é a conclusão (“3 de 6 executivos bateram a meta”) e a linha de baixo diz a fonte.", dont: "Aba sem título e sem fonte: ninguém sabe de onde veio o número." },
            { do: "Valor calculado é fórmula (receita = qtd × preço): quem abrir confere e reaproveita.", dont: "Colar o resultado como número fixo." },
            { do: "Uma tabela por aba, com cabeçalho na primeira linha da tabela.", dont: "Várias tabelas soltas na mesma aba, células mescladas no meio dos dados." },
            { do: "Percentual como fração com formato %, data como data.", dont: "“27%” ou “30/09” como texto: não soma nem ordena." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
