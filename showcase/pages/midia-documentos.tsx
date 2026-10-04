import { DocumentView } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { document } from "./_office-data";

export const meta: PageMeta = {
  title: "Documentos (Word)",
  group: "Mídia e conteúdo",
  order: 22,
  description: "Relatórios, propostas e atas como dado, na linguagem do DS: o DocumentView pagina em A4 com capa, sumário com número de página e tabelas que continuam na página seguinte; exportDocx gera o .docx real com estilos de título, sumário, cabeçalho e “Página X de Y”.",
};

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="DocumentView" rule="Role as páginas ou navegue pelo sumário lateral. A tabela de pipeline não cabe numa página: continua na seguinte com o cabeçalho repetido. Imprimir gera PDF pelo navegador; Baixar .docx gera o arquivo do Word.">
        <Demo
          bare
          code={`const doc: OfficeDocument = {
  kicker: "Relatório trimestral · Q3 2026",
  title: "Vendas cresceram 18 % com o mesmo time",
  subtitle: "O que funcionou, o que travou e as três apostas para o Q4.",
  author: "Diretoria Comercial",
  toc: true,
  footer: "Uso interno",
  blocks: [
    { type: "heading", text: "Resumo" },
    { type: "paragraph", text: [{ text: "O trimestre fechou com " }, { text: "R$ 4,4 mi", bold: true }, { text: "…" }] },
    { type: "stats", items: [{ label: "Receita nova", value: "R$ 4,4 mi", delta: "+18 % vs. Q2", good: true }, …] },
    { type: "table", columns: [{ header: "Produto" }, { header: "Receita", format: "currency" }], rows: [["G4 Scale", 946200], …], totalRow: true },
    { type: "callout", tone: "amber", title: "Risco para o Q4", text: "…" },
    { type: "signatures", people: [{ name: "Rafael Lima", role: "Diretor Comercial" }] },
  ],
};
<DocumentView document={doc} className="h-[720px]" />`}
        >
          <DocumentView document={document} className="h-[720px]" />
        </Demo>
      </DocSection>

      <DocSection title="Blocos" rule="Dez blocos cobrem relatório, proposta, ata, política e contrato simples. Cada um tem a mesma aparência na tela, na impressão e no Word.">
        <PropsTable
          rows={[
            ["heading", "{ text, level?: 1 | 2 | 3 }", "1", "Nível 1 e 2 entram no sumário e no painel de navegação do Word."],
            ["paragraph", "{ text: string | DocRun[] }", "—", "DocRun: { text, bold?, italic?, href? }."],
            ["list", "{ items, ordered? }", "—", "Marcador dourado; numerada recomeça a cada lista."],
            ["table", "{ columns, rows, caption?, totalRow? }", "—", "Colunas com format (currency, percent…) e width relativa. Quebra entre páginas repetindo o cabeçalho."],
            ["stats", "{ items: { label, value, delta?, good? }[] }", "—", "2 a 4 números do resumo."],
            ["callout", "{ title?, text, tone? }", '"neutral"', "info, ok, amber, rose: o título diz o que é (cor nunca sozinha)."],
            ["quote", "{ text, author?, role? }", "—", "Fala de cliente ou pesquisa."],
            ["signatures", "{ people: { name, role? }[] }", "—", "Linhas de assinatura lado a lado."],
            ["divider · pageBreak", "{}", "—", "Divisória e quebra de página."],
          ]}
        />
      </DocSection>

      <DocSection title="O que vai no .docx" rule="Um documento editável de verdade, não uma imagem da tela.">
        <Rules
          items={[
            { do: "Estilos Título 1/2/3 do Word com a fonte e as cores da marca: o painel de navegação e o sumário funcionam." },
            { do: "Sumário com links e os números de página calculados pela tela; no Word, “Atualizar sumário” recalcula." },
            { do: "Capa sem cabeçalho; nas demais, título no cabeçalho e “Página X de Y” no rodapé." },
            { do: "Tabelas com cabeçalho repetido em cada página, linha que não se parte e números alinhados à direita." },
            { do: "A4 com margem de 2 cm, igual à tela e à impressão." },
          ]}
        />
        <CodeBlock
          code={`import { exportDocx, documentToBlob, type OfficeDocument } from "@g4ai/ds";

await exportDocx(doc);                                   // baixa "vendas-cresceram-18-com-o-mesmo-time.docx"
await exportDocx(doc, { fileName: "relatorio-q3" });
const blob = await documentToBlob(doc, { theme: { brand: "#0b5cff", font: "Inter" } });`}
        />
        <PropsTable
          rows={[
            ["DocumentView.document", "OfficeDocument", "—", "{ title, kicker?, subtitle?, author?, date?, cover?, toc?, header?, footer?, blocks }."],
            ["OfficeDocument.cover", "boolean", "true", "Capa em página própria."],
            ["OfficeDocument.toc", "boolean", "false", "Sumário depois da capa."],
            ["OfficeDocument.header / footer", "string", "título / —", "Texto do cabeçalho e do rodapé (à esquerda do número da página)."],
            ["DocumentView.showOutline", "boolean", "true", "Sumário lateral a partir de 768 px."],
            ["DocumentView.loading", "boolean", "false", "Esqueleto da página enquanto carrega."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras de documento">
        <Rules
          items={[
            { do: "Título é a conclusão; o resumo vem primeiro, com os números que importam.", dont: "Começar pela metodologia e deixar o resultado para a página 6." },
            { do: "Tabela com fonte na legenda e total destacado.", dont: "Print de planilha colado como imagem." },
            { do: "Destaque (callout) só para o que pede atenção ou explica como ler.", dont: "Três destaques coloridos por página." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
