---
"@g4ai/ds": minor
---

Planilhas, documentos e arquivos do Office. `WorkbookView` (abas, grade A1, barra de fórmula, soma da seleção, copiar para o Excel) e `DocumentView` (A4 paginado, capa, sumário com página, tabelas que continuam, imprimir/PDF) mostram conteúdo escrito em código (`Workbook` com fórmulas e total, `OfficeDocument` com blocos) ou lido de arquivo. `readOfficeFile`, `useOfficeFile` e `OfficeFileView` leem .xlsx, .docx e .pptx no navegador sem dependências; `OfficeSlide` e `presentationSlides` levam o .pptx ao `SlideDeck`. Exportar .xlsx/.docx é opcional: receita em `templates/office-export.ts` e guia em `docs/guias/office.md`.
