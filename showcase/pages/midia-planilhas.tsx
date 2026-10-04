import { WorkbookView } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { workbook } from "./_office-data";

export const meta: PageMeta = {
  title: "Planilhas (Excel)",
  group: "Mídia e conteúdo",
  order: 21,
  description: "Planilhas como dado, na linguagem do DS: o WorkbookView mostra abas, grade com endereços A1, barra de fórmula e soma da seleção; exportXlsx gera o .xlsx real com fórmulas vivas, totais, filtro, cabeçalho fixo e impressão configurada.",
};

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="WorkbookView" rule="Clique numa célula e use as setas; Shift seleciona intervalo (soma, média e contagem no rodapé), Ctrl+C copia para colar no Excel. Células com fórmula mostram a fórmula na barra. Baixe o .xlsx e compare: é o mesmo arquivo.">
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

      <DocSection title="O que vai no .xlsx" rule="O arquivo sai da mesma descrição da tela. Nada de montar célula a célula.">
        <Rules
          items={[
            { do: "Fórmulas de verdade (=C5*D5) com o resultado já calculado: abre certo no Excel, no Google Planilhas e no Numbers." },
            { do: "Total com SUBTOTAL: respeita o filtro. Razões (margem, atingimento) recalculadas sobre os totais, não pela média das linhas." },
            { do: "Cabeçalho na cor da marca com fio dourado, fixo ao rolar (congelar painéis) e com filtro automático." },
            { do: "Formatos nativos: R$, %, data dd/mm/aaaa e milhar. O número continua número (soma, gráfico e tabela dinâmica funcionam)." },
            { do: "Impressão pronta: A4, cabe na largura, paisagem acima de 6 colunas, cabeçalho repetido e “Página X de Y”." },
            { do: "Notas de coluna viram comentário na célula do cabeçalho (triângulo dourado na tela)." },
          ]}
        />
      </DocSection>

      <DocSection title="Exportar sem visualizador" rule="Para botão “Exportar” de lista, relatório agendado ou anexo de e-mail. As bibliotecas (exceljs) carregam só na hora de exportar.">
        <CodeBlock
          code={`import { exportXlsx, workbookToBlob, type Workbook } from "@g4ai/ds";

// Botão de exportar (com useOperation para o estado "Gerando…")
<OperationButton operation={op} variant="ghost" onClick={() => op.run(() => exportXlsx(workbook), "Planilha baixada")}>
  <Download /> Exportar .xlsx
</OperationButton>

// Blob para anexar ou enviar ao servidor
const blob = await workbookToBlob(workbook);

// Marca do cliente: só o que muda
await exportXlsx(workbook, { theme: { brand: "#0b5cff", font: "Inter" }, fileName: "fechamento-q3" });`}
        />
        <PropsTable
          rows={[
            ["WorkbookView.workbook", "Workbook", "—", "{ title, author?, sheets: WorkbookSheet[] }."],
            ["WorkbookView.loading", "boolean", "false", "Esqueleto da grade enquanto carrega."],
            ["WorkbookView.theme", "Partial<OfficeTheme>", "tokens G4", "Cores e fonte do arquivo exportado."],
            ["WorkbookSheet.title / description", "string", "—", "Título (conclusão) e fonte acima da tabela."],
            ["WorkbookSheet.totals", "boolean | string", "—", "Linha de total; string troca o rótulo."],
            ["WorkbookSheet.freezeColumns", "number", "1", "Colunas fixas à esquerda."],
            ["WorkbookColumn.format", '"text" | "integer" | "number" | "currency" | "percent" | "date"', '"text"', "Percentual recebe fração (0,27 = 27 %)."],
            ["WorkbookColumn.formula", "string", "—", "Aritmética com {chave}: + − * / e parênteses. Pode usar colunas de fórmula à esquerda."],
            ["WorkbookColumn.total", '"sum" | "average" | "count" | "min" | "max" | { formula }', "—", "Agregação ou fórmula sobre os totais."],
            ["WorkbookColumn.note", "string", "—", "Definição da métrica (comentário no Excel)."],
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
