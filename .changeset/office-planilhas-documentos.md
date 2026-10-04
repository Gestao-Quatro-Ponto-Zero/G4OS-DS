---
"@g4ai/ds": minor
---

Planilhas e documentos com exportação real para Office. `WorkbookView` (abas, grade A1, barra de fórmula, soma da seleção, copiar para o Excel) e `exportXlsx`/`workbookToBlob` geram .xlsx com fórmulas vivas, totais por SUBTOTAL, filtro, cabeçalho fixo e impressão configurada. `DocumentView` (páginas A4 medidas, capa, sumário com página, tabelas que continuam com cabeçalho repetido, imprimir/PDF) e `exportDocx`/`documentToBlob` geram .docx com estilos de título, sumário, cabeçalho e "Página X de Y". Modelo de dados único (`Workbook`, `OfficeDocument`) para tela e arquivo. Novas dependências `exceljs` e `docx`, carregadas só ao exportar.
