# office

Arquivo: `src/components/office.tsx` · importe de `@g4ai/ds`.

Planilhas, documentos e apresentações na linguagem do DS, escritos em código ou lidos de arquivos reais do Office.

## DocumentView

Documento paginado em A4, com a mesma estrutura do .docx exportado: capa, sumário com número de página, cabeçalho e "Página X de Y", tabelas que continuam na página seguinte repetindo o cabeçalho.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `document` * | `OfficeDocument` |  | Escrito em código ou lido de um .docx (readOfficeFile). |
| `actions` | `ReactNode` |  | Ações na barra do visualizador (ex.: botão "Baixar .docx" do app). |
| `className` | `string \| undefined` |  |  |
| `loading` | `boolean \| undefined` |  |  |
| `showOutline` | `boolean \| undefined` | `true` | Sumário lateral (a partir de 768 px). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-documentos`):

```tsx
<OfficeFileView source={file} className="h-[720px]" />

// Ou: const file = await readOfficeFile(blob)  →  <DocumentView document={file.document} />
```

## OfficeChartView

Gráfico do Office (de .xlsx ou .pptx) desenhado com os gráficos do DS: barras, linhas, áreas, rosca, combinado e dispersão.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `chart` * | `OfficeChart` |  |  |
| `className` | `string \| undefined` |  |  |
| `height` | `number \| undefined` | `260` |  |
| `showTitle` | `boolean \| undefined` | `true` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## OfficeFileState (type)

```ts
type OfficeFileState = | { status: "idle" } | { status: "loading" } | { status: "error"; error: string; code: OfficeFileErrorCode } | { status: "ready"; file: OfficeFile }
```

## OfficeFileView

Mostra um arquivo do Office com o visualizador certo: .xlsx no WorkbookView, .docx no DocumentView, .pptx no SlideDeck.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `source` * | `string \| OfficeSource \| null \| undefined` |  | File/Blob/ArrayBuffer ou URL do arquivo. |
| `actions` | `ReactNode` |  | Ações na barra (planilha e documento). |
| `className` | `string \| undefined` |  |  |
| `empty` | `ReactNode` |  | Conteúdo quando não há arquivo (padrão: aviso curto). |
| `name` | `string \| undefined` |  | Nome do arquivo (título quando o arquivo não tem um). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-documentos`):

```tsx
<OfficeFileView source={file} className="h-[720px]" />

// Ou: const file = await readOfficeFile(blob)  →  <DocumentView document={file.document} />
```

## OfficeSlide

Um slide de .pptx no canvas de 1280×720 do DS.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `slide` * | `PresentationSlide` |  |  |
| `aspect` | `number \| undefined` | `16 / 9` |  |
| `width` | `number \| undefined` | `960` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## presentationSlides (function)

Converte uma apresentação lida de .pptx nos slides do SlideDeck (com as notas do apresentador).

```ts
presentationSlides(presentation): DeckSlide[]
```

Exemplo (showcase `#/p/midia-slides`):

```tsx
<OfficeFileView source={file} className="h-[640px]" />

// Ou: const file = await readOfficeFile(blob)
//     <SlideDeck title={file.presentation.title} slides={presentationSlides(file.presentation)} />
```

## useOfficeFile (hook)

Lê um .xlsx, .docx ou .pptx (File, Blob, ArrayBuffer ou URL) e devolve o estado: idle (sem arquivo), loading, error (mensagem pronta) ou ready.

```ts
useOfficeFile(source, name?): { retry: () => void; status: "idle"; } | { retry: () => void; status: "loading"; } | { retry: () => void; s…
```

Exemplo (showcase `#/p/midia-office`):

```tsx
import { readOfficeFile, useOfficeFile, presentationSlides } from "@g4ai/ds";

const file = await readOfficeFile(blob, { name: "contas.xlsx" });
if (file.kind === "xlsx") file.workbook.sheets[0].layout.rows;   // grade com valores e fórmulas
if (file.kind === "docx") file.document.blocks;                  // títulos, parágrafos, listas, tabelas, imagens
if (file.kind === "pptx") presentationSlides(file.presentation); // DeckSlide[] para o SlideDeck

// Hook com os estados (idle, loading, error, ready) e retry
const state = useOfficeFile(url);
```

## WorkbookView

Planilha na linguagem do DS (mesmo visual do DataGrid): abas no topo, título e fonte acima da tabela, cabeçalho e total fixos, colunas fixas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `workbook` * | `FileWorkbook \| Workbook` |  |  |
| `actions` | `ReactNode` |  | Ações na barra do visualizador (ex.: botão "Baixar .xlsx" do app). |
| `className` | `string \| undefined` |  |  |
| `initialSheet` | `number \| undefined` | `0` |  |
| `loading` | `boolean \| undefined` |  | Carregando: mostra o esqueleto da tabela. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-planilhas`):

```tsx
// Arquivo enviado pela pessoa, anexo ou URL: OfficeFileView detecta o tipo
<OfficeFileView source={file} className="h-[520px]" />

// Ou leia e use o WorkbookView direto
const file = await readOfficeFile(blob);          // { kind: "xlsx", workbook }
if (file.kind === "xlsx") <WorkbookView workbook={file.workbook} />
```
