# office

Arquivo: `src/components/office.tsx` · importe de `@g4ai/ds`.

Planilhas e documentos na linguagem do DS, com exportação real para Office.

## DocumentView

Documento paginado em A4, com a mesma estrutura do .docx exportado: capa, sumário com número de página, cabeçalho e "Página X de Y", tabelas que continuam na página seguinte repetindo o cabeçalho.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `document` * | `OfficeDocument` |  |  |
| `className` | `string \| undefined` |  |  |
| `fileName` | `string \| undefined` |  | Nome do arquivo sem extensão (padrão: título sem acento). |
| `loading` | `boolean \| undefined` |  |  |
| `showOutline` | `boolean \| undefined` | `true` | Sumário lateral (a partir de 768 px). |
| `theme` | `Partial<OfficeTheme> \| undefined` |  | Cores e fonte do arquivo exportado (padrão: tokens G4 do tema claro). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-documentos`):

```tsx
const doc: OfficeDocument = {
  kicker: "Relatório trimestral · Q3 2026",
  title: "Vendas cresceram 18 % com o mesmo time",
  subtitle: "O que funcionou, o que travou e as três apostas para o Q4.",
  author: "Diretoria Comercial",
  toc: true,
  footer: "Uso interno",
  blocks: [
    { type: "heading", text: "Resumo" },
    { type: "paragraph", text: [{ text: "O trimestre fechou com " }, { text: "R$ 4,4 mi", bold: true }, { text: "…" }] },
    { type: "stats", items: [{ label: "Receita nova", value: "R$ 4,4 mi", delta: "+18 % vs. Q2", good: true }, …] },
    { type: "table", columns: [{ header: "Produto" }, { header: "Receita", format: "currency" }], rows: [["G4 Scale", 946200], …], totalRow: true },
    { type: "callout", tone: "amber", title: "Risco para o Q4", text: "…" },
    { type: "signatures", people: [{ name: "Rafael Lima", role: "Diretor Comercial" }] },
  ],
};
<DocumentView document={doc} className="h-[720px]" />
```

## WorkbookView

Planilha na tela, com o mesmo layout do .xlsx exportado: título, fonte, cabeçalho na cor da marca, fórmulas vivas e linha de total.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `workbook` * | `Workbook` |  |  |
| `className` | `string \| undefined` |  |  |
| `fileName` | `string \| undefined` |  | Nome do arquivo sem extensão (padrão: título sem acento). |
| `initialSheet` | `number \| undefined` | `0` |  |
| `loading` | `boolean \| undefined` |  | Carregando: mostra o esqueleto da grade. |
| `theme` | `Partial<OfficeTheme> \| undefined` |  | Cores e fonte do arquivo exportado (padrão: tokens G4 do tema claro). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-planilhas`):

```tsx
const workbook: Workbook = {
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
<WorkbookView workbook={workbook} className="h-[560px]" />
```
