# lib-office-export

Arquivo: `src/lib/office-export.ts` · importe de `@g4ai/ds`.

Exportação real para Office: .xlsx (exceljs) e .docx (docx), com a identidade do DS.

## documentToBlob (function)

Gera o .docx como Blob: capa, sumário, títulos com estilo (aparecem no painel de navegação do Word), listas, tabelas, números, destaques, citação e assinaturas; cabeçalho e "Página X de Y" em todas as páginas depois da c

```ts
documentToBlob(doc, options?): Promise<Blob>
```

Exemplo (showcase `#/p/midia-documentos`):

```tsx
import { exportDocx, documentToBlob, type OfficeDocument } from "@g4ai/ds";

await exportDocx(doc);                                   // baixa "vendas-cresceram-18-com-o-mesmo-time.docx"
await exportDocx(doc, { fileName: "relatorio-q3" });
const blob = await documentToBlob(doc, { theme: { brand: "#0b5cff", font: "Inter" } });
```

## downloadBlob (function)

Baixa um Blob com o nome dado (no navegador).

```ts
downloadBlob(blob, fileName): void
```

## exportDocx (function)

Gera e baixa o .docx.

```ts
exportDocx(doc, options?): Promise<Blob>
```

Exemplo (showcase `#/p/midia-documentos`):

```tsx
import { exportDocx, documentToBlob, type OfficeDocument } from "@g4ai/ds";

await exportDocx(doc);                                   // baixa "vendas-cresceram-18-com-o-mesmo-time.docx"
await exportDocx(doc, { fileName: "relatorio-q3" });
const blob = await documentToBlob(doc, { theme: { brand: "#0b5cff", font: "Inter" } });
```

## exportXlsx (function)

Gera e baixa o .xlsx.

```ts
exportXlsx(workbook, options?): Promise<Blob>
```

Exemplo (showcase `#/p/midia-planilhas`):

```tsx
import { exportXlsx, workbookToBlob, type Workbook } from "@g4ai/ds";

// Botão de exportar (com useOperation para o estado "Gerando…")
<OperationButton operation={op} variant="ghost" onClick={() => op.run(() => exportXlsx(workbook), "Planilha baixada")}>
  <Download /> Exportar .xlsx
</OperationButton>

// Blob para anexar ou enviar ao servidor
const blob = await workbookToBlob(workbook);

// Marca do cliente: só o que muda
await exportXlsx(workbook, { theme: { brand: "#0b5cff", font: "Inter" }, fileName: "fechamento-q3" });
```

## officeTheme (const)

## OfficeTheme (type)

Cores e fonte dos arquivos.

```ts
type OfficeTheme = { brand: string; onBrand: string; accent: string; accentDeep: string; ink: string; inkSoft: string; muted: string; line: string; lineStrong: string; soft: string; ok: string; rose: string; font: string; }
```

## workbookToBlob (function)

Gera o .xlsx como Blob: abas, cabeçalho fixo, filtro, fórmulas vivas, totais e impressão configurada.

```ts
workbookToBlob(workbook, options?): Promise<Blob>
```

Exemplo (showcase `#/p/midia-planilhas`):

```tsx
import { exportXlsx, workbookToBlob, type Workbook } from "@g4ai/ds";

// Botão de exportar (com useOperation para o estado "Gerando…")
<OperationButton operation={op} variant="ghost" onClick={() => op.run(() => exportXlsx(workbook), "Planilha baixada")}>
  <Download /> Exportar .xlsx
</OperationButton>

// Blob para anexar ou enviar ao servidor
const blob = await workbookToBlob(workbook);

// Marca do cliente: só o que muda
await exportXlsx(workbook, { theme: { brand: "#0b5cff", font: "Inter" }, fileName: "fechamento-q3" });
```
