---
"@g4ai/ds": minor
---

Planilhas, documentos, apresentações e arquivos do Office. `WorkbookView` (abas, grade A1 no visual do DataGrid, linhas virtuais, cores de célula, mesclas, linhas e colunas ocultas, gráficos, soma da seleção, copiar para o Excel) e `DocumentView` (A4 paginado, capa, sumário com página, listas em níveis, tabelas mescladas que continuam com cabeçalho repetido, imprimir/PDF) mostram conteúdo escrito em código (`Workbook`, `OfficeDocument`) ou lido de arquivo. `readOfficeFile`, `useOfficeFile` e `OfficeFileView` leem .xlsx, .csv, .docx e .pptx no navegador sem dependências; `OfficeSlide` e `presentationSlides` levam o .pptx ao `SlideDeck` com modelo da marca, formas, linhas, imagens recortadas, tabelas e gráficos; `OfficeChartView` desenha gráficos do Office com os gráficos do DS. Exportar .xlsx/.docx é opcional: receita em `templates/office-export.ts` e guia em `docs/guias/office.md`.
