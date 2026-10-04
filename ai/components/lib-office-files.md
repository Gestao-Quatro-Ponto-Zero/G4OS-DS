# lib-office-files

Arquivo: `src/lib/office-files.ts` · importe de `@g4ai/ds`.

Leitura de arquivos reais do Office no navegador, sem dependências: descompacta o .xlsx/.docx/.pptx (DecompressionStream) e lê o XML (DOMParser).

## OFFICE_SHEET_LIMITS (const)

Limites de exibição de planilha (a grade não é virtualizada).

## OfficeFile (type)

```ts
type OfficeFile = { kind: "xlsx"; workbook: FileWorkbook } | { kind: "docx"; document: OfficeDocument } | { kind: "pptx"; presentation: Presentation }
```

## OfficeFileError (class)

## OfficeFileErrorCode (type)

Erro de leitura com motivo, para a tela escolher título e saída: legacy (.xls/.doc/.ppt), unsupported (não é Office), corrupt, network.

```ts
type OfficeFileErrorCode = "legacy" | "unsupported" | "corrupt" | "network"
```

## OfficeSource (type)

```ts
type OfficeSource = Blob | ArrayBuffer | Uint8Array
```

## readDocx (function)

```ts
readDocx(src, options?): Promise<OfficeDocument>
```

## readOfficeFile (function)

Lê qualquer .xlsx, .docx ou .pptx, detectando o tipo pelo conteúdo.

```ts
readOfficeFile(src, options?): Promise<OfficeFile>
```

Exemplo (showcase `#/p/midia-documentos`):

```tsx
<OfficeFileView source={file} className="h-[720px]" />

// Ou: const file = await readOfficeFile(blob)  →  <DocumentView document={file.document} />
```

## readPptx (function)

```ts
readPptx(src, options?): Promise<Presentation>
```

## readXlsx (function)

```ts
readXlsx(src, options?): Promise<FileWorkbook>
```
