# Planilhas, documentos e apresentações

O DS **mostra** arquivos do Office na linguagem dele; **gerar** o arquivo é opcional e fica no app.

| Preciso de | Use |
| --- | --- |
| Mostrar uma planilha montada em código | `WorkbookView` com `Workbook` (colunas, fórmulas `{qtd} * {preco}`, total) |
| Mostrar um relatório, proposta ou ata montado em código | `DocumentView` com `OfficeDocument` (blocos: título, parágrafo, lista, tabela, números, destaque, citação, imagem, assinaturas) |
| Mostrar uma apresentação em código | `SlideDeck` com `SlideTitle`, `SlideBullets`, `SlideStat`… |
| Mostrar um .xlsx, .csv, .docx ou .pptx real (anexo, upload, URL) | `OfficeFileView source={file}`: detecta o tipo, cuida de carregando, erro e sem arquivo |
| Ler o arquivo sem mostrar (importar, extrair texto) | `readOfficeFile(blob)` → `{ kind: "xlsx" \| "csv", workbook }` · `{ kind: "docx", document }` · `{ kind: "pptx", presentation }` |
| Mostrar um gráfico de planilha ou slide | `OfficeChartView chart={…}`: desenha com `BarChart`, `LineChart`, `AreaChart`, `DonutChart`, `ComboChart` ou `ScatterChart` do DS |
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

A leitura roda no navegador, sem dependência e sem enviar o arquivo a nenhum serviço. A moldura (barra, abas, rodapé, estados, gráficos) é 100 % DS; **cores e fontes que vêm do arquivo aparecem como estão** (o vermelho de "atrasado", o slide da marca do cliente), porque são dado de quem fez o arquivo, não estilo do app. O texto sobre um fundo do arquivo é escolhido para ficar legível nos dois temas, e o slide fixa o tema do DS pelo próprio fundo (gráfico e tabela do DS ficam legíveis em cima dele).

O que é coberto foi escolhido pelo que mais aparece em arquivos de empresa (Pareto):

| Arquivo | Entra | Fica de fora |
| --- | --- | --- |
| .xlsx | valores; fórmulas com o resultado salvo; R$, %, data, hora e número (com ou sem centavos); negativo em vermelho; cor de fundo e de texto, negrito, itálico, sublinhado, alinhamento e quebra de texto; mesclas (inclusive cabeçalho em dois níveis); linhas e colunas ocultas; título e fonte acima da tabela; cabeçalho pelo painel congelado, pela tabela do Excel ou pelo filtro; gráficos (barras, colunas, empilhado, 100 %, linhas, áreas, pizza, rosca, combinado, dispersão), inclusive folhas só de gráfico; até 50 mil linhas e 200 colunas por aba (só as linhas visíveis são desenhadas) | formatação condicional, imagens na planilha, validação de dados, comentários, macros; abas ocultas; .xlsb |
| .csv / .tsv | separador `;`, `,`, tabulação ou `\|`; vírgula decimal; R$, %, datas dd/mm/aaaa; arquivo salvo em UTF-8 ou Windows-1252 (o CSV do Excel em português); código com zero à esquerda continua texto | — |
| .docx | título e subtítulo; títulos 1–3 (sumário e navegação); listas em vários níveis com a numeração do Word (1., 1.1., a), i.) continuando entre parágrafos; alinhamento; quebra de linha; negrito, itálico, sublinhado, riscado, cor, realce e links; tabelas com cabeçalho repetido, células mescladas e sombreadas; imagens; quebras de página; cabeçalho e rodapé (texto); o sumário do Word vira o sumário do DS no mesmo lugar | colunas, caixas de texto, notas de rodapé, comentários e controle de alterações (vale o texto final) |
| .pptx | elementos do modelo/mestre (logo, faixas, rodapé da marca); fundo com cor, degradê ou imagem; posição herdada do layout; formas comuns (retângulo, arredondado, elipse, triângulo, losango, setas, chevron, pentágono, hexágono, estrela…), com a área de texto de cada forma; linhas, conectores e setas; imagens recortadas, redondas e com transparência; tabelas com o estilo do PowerPoint (inclusive o padrão, que o Office não grava no arquivo); gráficos nativos; fonte do tema (se instalada no computador, senão a do DS), entrelinha e espaçamento; notas do apresentador | SmartArt, animações, transições, vídeo e áudio, sombras e efeitos 3D |

Formatos binários antigos (.xls, .doc, .ppt, .xlsb) recebem uma mensagem pedindo para salvar no formato novo. Fórmulas sem resultado salvo (arquivo gerado por script que não calcula) aparecem vazias na grade e com a fórmula no rodapé. Uma planilha de 20 mil linhas leva cerca de 2 s para abrir (o próprio navegador gasta ~0,8 s lendo o XML); o `OfficeFileView` mostra o carregamento.

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
