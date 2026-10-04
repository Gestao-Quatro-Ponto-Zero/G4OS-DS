import { useState } from "react";
import { FileDropzone, OfficeFileView } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Arquivos do Office",
  group: "Mídia e conteúdo",
  order: 23,
  description: "OfficeFileView abre .xlsx, .docx e .pptx no navegador, sem dependências e sem enviar o arquivo a nenhum serviço, e escolhe o visualizador do DS: WorkbookView, DocumentView ou SlideDeck. Cuida de carregando, erro e sem arquivo.",
};

const samples = [
  { label: "Planilha", src: "samples/contas-a-receber.xlsx" },
  { label: "Documento", src: "samples/proposta-comercial.docx" },
  { label: "Apresentação", src: "samples/revisao-trimestral.pptx" },
];

export default function Page() {
  const [file, setFile] = useState<File | string>(samples[0].src);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="OfficeFileView" rule="Escolha um exemplo ou solte um arquivo seu: ele é lido aqui no navegador. Formatos antigos (.xls, .doc, .ppt) recebem uma mensagem pedindo para salvar no formato novo.">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Exemplos">
            {samples.map((s) => (
              <button
                key={s.src}
                type="button"
                aria-pressed={file === s.src}
                onClick={() => setFile(s.src)}
                className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-soft hover:bg-soft aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary"
              >
                {s.label}
              </button>
            ))}
          </div>
          <FileDropzone label="Abrir arquivo seu" hint=".xlsx, .docx ou .pptx, até 20 MB" accept=".xlsx,.docx,.pptx" multiple={false} maxSize={20 * 1024 * 1024} onFiles={(files) => files[0] && setFile(files[0])} />
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
            { do: "Planilha: valores, fórmulas com o resultado salvo, R$, %, data, negrito, larguras, mesclas de título, painéis congelados. Até 2.000 linhas e 60 colunas por aba.", dont: "Gráficos, imagens, formatação condicional, validação de dados." },
            { do: "Documento: título, títulos 1–3, parágrafos com negrito/itálico/link, listas, tabelas, imagens, quebras de página.", dont: "Colunas, caixas de texto, cabeçalho e rodapé do Word, comentários, controle de alterações." },
            { do: "Apresentação: posição, cores, fundo, imagens, tabelas e notas, herdando layout e mestre.", dont: "Gráficos nativos, SmartArt, animação, vídeo; a fonte é a do DS." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
