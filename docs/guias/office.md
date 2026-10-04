# Planilhas, documentos e apresentações

O DS **mostra** arquivos do Office na linguagem dele; **gerar** o arquivo é opcional e fica no app.

| Preciso de | Use |
| --- | --- |
| Mostrar uma planilha montada em código | `WorkbookView` com `Workbook` (colunas, fórmulas `{qtd} * {preco}`, total) |
| Mostrar um relatório, proposta ou ata montado em código | `DocumentView` com `OfficeDocument` (blocos: título, parágrafo, lista, tabela, números, destaque, citação, imagem, assinaturas) |
| Mostrar uma apresentação em código | `SlideDeck` com `SlideTitle`, `SlideBullets`, `SlideStat`… |
| Mostrar um .xlsx, .docx ou .pptx real (anexo, upload, URL) | `OfficeFileView source={file}`: detecta o tipo, cuida de carregando, erro e sem arquivo |
| Ler o arquivo sem mostrar (importar, extrair texto) | `readOfficeFile(blob)` → `{ kind: "xlsx", workbook }` · `{ kind: "docx", document }` · `{ kind: "pptx", presentation }` |
| Gerar .xlsx ou .docx para baixar | Receita opcional abaixo (`exceljs` e `docx` no app) |

Exemplos no site: Mídia e conteúdo › Planilhas (Excel), Documentos (Word), Slides e Arquivos do Office.

## Ler arquivos reais

```tsx
import { OfficeFileView, readOfficeFile, presentationSlides, SlideDeck, WorkbookView } from "@g4ai/ds";

<OfficeFileView source={file} className="h-[600px]" />          // File, Blob, ArrayBuffer ou URL

const f = await readOfficeFile(blob, { name: "contas.xlsx" });
if (f.kind === "xlsx") <WorkbookView workbook={f.workbook} />;
if (f.kind === "pptx") <SlideDeck title={f.presentation.title} slides={presentationSlides(f.presentation)} />;
```

A leitura roda no navegador, sem dependência e sem enviar o arquivo a nenhum serviço. O objetivo é o conteúdo na linguagem do DS, não uma cópia pixel a pixel do Office:

| Arquivo | Entra | Fica de fora |
| --- | --- | --- |
| .xlsx | valores, fórmulas com o resultado salvo, R$/%/data, negrito, larguras, mescla de título, painéis congelados; até 2.000 linhas e 60 colunas por aba | gráficos, imagens, formatação condicional, validação; abas ocultas |
| .docx | título, títulos 1–3 (sumário), parágrafos com negrito/itálico/link, listas, tabelas, imagens, quebras de página | colunas, caixas de texto, cabeçalho/rodapé do Word, comentários, controle de alterações |
| .pptx | posição e tamanho dos elementos (herdando layout e mestre), cores, fundo, imagens, tabelas, notas do apresentador | gráficos nativos, SmartArt, animações, vídeo; o texto usa a fonte do DS |

Formatos binários antigos (.xls, .doc, .ppt) recebem uma mensagem pedindo para salvar no formato novo. Fórmulas sem resultado salvo (arquivo gerado por script que não calcula) aparecem vazias na grade e com a fórmula na barra.

## Exportar para .xlsx e .docx (opcional)

1. `pnpm add exceljs docx`
2. Copie `node_modules/@g4ai/ds/templates/office-export.ts` para o app (ex.: `src/lib/office-export.ts`).
3. Ponha o botão no `actions` do visualizador:

```tsx
import { exportDocx, exportXlsx } from "@/lib/office-export";

const op = useOperation({ busyLabel: "Gerando…" });
<WorkbookView
  workbook={workbook}
  actions={
    <OperationButton operation={op} variant="ghost" size="sm" onClick={() => op.run(() => exportXlsx(workbook), "Planilha baixada")}>
      <Download /> Baixar .xlsx
    </OperationButton>
  }
/>
```

A receita usa `layoutSheet`, `excelNumberFormat` e `formatCell` do DS, então o arquivo sai igual à tela:

- **.xlsx**: fórmulas vivas (`=C5*D5`) com o resultado calculado, total com `SUBTOTAL` (respeita filtro), razões recalculadas sobre os totais, cabeçalho na cor da marca, painéis congelados, filtro, formatos nativos de R$/%/data, A4 com “Página X de Y”.
- **.docx**: estilos Título 1/2/3 do Word (painel de navegação), sumário com links, capa, cabeçalho e “Página X de Y”, tabelas com cabeçalho repetido, A4 com margem de 2 cm.
- `workbookToBlob` / `documentToBlob` devolvem o `Blob` para anexar ou enviar ao servidor.
- Marca: `exportXlsx(wb, { theme: { brand: "#0b5cff", font: "Inter" } })`. Fonte padrão **Arial**, que existe em todo computador com Office; use Figtree só se quem abre tiver a fonte instalada.
- As bibliotecas carregam com `import()` só ao exportar: não pesam no carregamento do app.

Por que fora do DS: gerar arquivo traz ~1,4 MB de dependências e decisões de produto (nome do arquivo, o que entra, onde salvar) que são do app. O DS garante a aparência e o modelo de dados; a receita garante que o arquivo combine com a tela.
