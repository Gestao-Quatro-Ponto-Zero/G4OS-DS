import { useState } from "react";
import { FileCard, FileDropzone, OfficeFileView } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Arquivos do Office",
  group: "Mídia e conteúdo",
  order: 23,
  description: "OfficeFileView abre .xlsx, .csv, .docx e .pptx no navegador, sem dependências e sem enviar o arquivo a nenhum serviço, e escolhe o visualizador do DS: WorkbookView, DocumentView ou SlideDeck. Cuida de carregando, erro e sem arquivo.",
};

const samples = [
  { name: "vendas-2026.xlsx", src: "samples/vendas-2026.xlsx", meta: "20 mil linhas, cores, mesclas, gráficos" },
  { name: "contas-a-receber.xlsx", src: "samples/contas-a-receber.xlsx", meta: "Fórmulas e painel congelado" },
  { name: "exportacao-crm.csv", src: "samples/exportacao-crm.csv", meta: "CSV do Excel em português (;)" },
  { name: "contrato-servicos.docx", src: "samples/contrato-servicos.docx", meta: "Cláusulas em níveis, tabela mesclada" },
  { name: "proposta-comercial.docx", src: "samples/proposta-comercial.docx", meta: "Listas, imagem e tabela" },
  { name: "deck-marca.pptx", src: "samples/deck-marca.pptx", meta: "Modelo da marca, gráficos, formas" },
  { name: "revisao-trimestral.pptx", src: "samples/revisao-trimestral.pptx", meta: "Modelo padrão do PowerPoint" },
];

export default function Page() {
  const [file, setFile] = useState<File | string>(samples[5].src);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="OfficeFileView" rule="Escolha um exemplo ou solte um arquivo seu: ele é lido aqui no navegador. Formatos antigos (.xls, .doc, .ppt) recebem uma mensagem pedindo para salvar no formato novo.">
        <div className="flex flex-col gap-3">
          <div role="group" aria-label="Arquivos de exemplo" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {samples.map((s) => (
              <FileCard key={s.src} name={s.name} meta={s.meta} selected={file === s.src} onOpen={() => setFile(s.src)} />
            ))}
          </div>
          <FileDropzone label="Abrir arquivo seu" hint=".xlsx, .csv, .docx ou .pptx, até 20 MB" accept=".xlsx,.xlsm,.csv,.tsv,.txt,.docx,.pptx" multiple={false} maxSize={20 * 1024 * 1024} onFiles={(files) => files[0] && setFile(files[0])} />
          <Demo bare code={`const [file, setFile] = useState<File | null>(null);
<FileDropzone label="Arquivo" accept=".xlsx,.docx,.pptx" multiple={false} onFiles={([f]) => setFile(f)} />
<OfficeFileView source={file} className="h-[600px]" />`}>
            <OfficeFileView source={file} className="h-[600px]" />
          </Demo>
        </div>
      </DocSection>

      <DocSection title="Ler sem visualizador" rule="readOfficeFile devolve o dado (Workbook, OfficeDocument ou Presentation) para usar em outra tela: importar planilha, mostrar a prévia de um anexo, extrair texto.">
        <CodeBlock
          code={`import { readOfficeFile, useOfficeFile, presentationSlides } from "@g4ai/ds";

const file = await readOfficeFile(blob, { name: "contas.xlsx" });
if (file.kind === "xlsx") file.workbook.sheets[0].layout.rows;   // grade com valores e fórmulas
if (file.kind === "docx") file.document.blocks;                  // títulos, parágrafos, listas, tabelas, imagens
if (file.kind === "pptx") presentationSlides(file.presentation); // DeckSlide[] para o SlideDeck

// Hook com os estados (idle, loading, error, ready) e retry
const state = useOfficeFile(url);`}
        />
        <PropsTable
          rows={[
            ["OfficeFileView.source", "File | Blob | ArrayBuffer | string (URL) | null", "—", "Sem arquivo mostra `empty`."],
            ["OfficeFileView.name", "string", "—", "Título quando o arquivo não tem um."],
            ["OfficeFileView.actions", "ReactNode", "—", "Ações na barra da planilha ou do documento."],
            ["OfficeFileView.empty", "ReactNode", '"Nenhum arquivo para mostrar."', "Conteúdo sem arquivo."],
          ]}
        />
      </DocSection>

      <DocSection title="O que é lido">
        <Rules
          items={[
            { do: "Planilha (.xlsx, .csv): valores, fórmulas com o resultado salvo, R$/%/data/hora, cores de fundo e de texto, negrito, itálico, alinhamento, quebra de texto, mesclas, linhas e colunas ocultas, cabeçalho por painel, tabela ou filtro, gráficos (barras, linhas, áreas, pizza, rosca, combinado, dispersão) e folhas de gráfico. Até 50 mil linhas; só as visíveis são desenhadas.", dont: "Formatação condicional, imagens na planilha, validação de dados, macros, .xlsb." },
            { do: "Documento (.docx): título, títulos 1–3, listas em níveis com a numeração do Word (1., 1.1., a)), alinhamento, quebras de linha, negrito, itálico, sublinhado, cor, realce, links, tabelas com mescla e sombreamento, imagens, cabeçalho e rodapé; o sumário do Word vira o sumário do DS.", dont: "Colunas, caixas de texto, notas de rodapé, comentários." },
            { do: "Apresentação (.pptx): elementos e fundo do modelo (logo, faixas, degradê, imagem), posição herdada do layout, formas comuns, linhas e setas, imagens recortadas e redondas, tabelas com o estilo do PowerPoint, gráficos nativos, fontes do tema (se instaladas), espaçamento, notas.", dont: "SmartArt, animações, vídeo, efeitos 3D e sombras." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
