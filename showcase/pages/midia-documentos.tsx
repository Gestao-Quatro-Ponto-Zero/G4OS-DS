import { DocumentView, OfficeFileView } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { document } from "./_office-data";

export const meta: PageMeta = {
  title: "Documentos (Word)",
  group: "Mídia e conteúdo",
  order: 22,
  description: "DocumentView pagina em A4 relatórios, propostas e atas escritos em código (OfficeDocument) ou lidos de um .docx real: capa, sumário com número de página, tabelas que continuam na página seguinte, imprimir/PDF. Exportar é opcional e fica no app.",
};

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="DocumentView" rule="Role as páginas ou navegue pelo sumário lateral. A tabela de pipeline não cabe numa página: continua na seguinte com o cabeçalho repetido. Imprimir gera PDF pelo navegador.">
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

      <DocSection title="Blocos" rule="Onze blocos cobrem relatório, proposta, ata, política e contrato simples. Os mesmos blocos saem da leitura de um .docx.">
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
            ["image", "{ src, alt?, width?, ratio?, caption? }", "—", "Imagem com proporção conhecida (a paginação mede sem esperar carregar)."],
            ["divider · pageBreak", "{}", "—", "Divisória e quebra de página."],
          ]}
        />
      </DocSection>

      <DocSection title="De um arquivo .docx" rule="O mesmo visualizador lê o documento real: títulos (viram sumário), listas em níveis com a numeração do Word, alinhamento, ênfases, cor e realce, tabelas mescladas e sombreadas, imagens, cabeçalho e rodapé. A diagramação é a do DS; colunas, caixas de texto e notas de rodapé ficam de fora. Contrato com cláusulas em níveis em Arquivos do Office.">
        <Demo
          bare
          code={`<OfficeFileView source={file} className="h-[720px]" />

// Ou: const file = await readOfficeFile(blob)  →  <DocumentView document={file.document} />`}
        >
          <OfficeFileView source="samples/proposta-comercial.docx" className="h-[720px]" />
        </Demo>
      </DocSection>

      <DocSection title="Exportar para .docx (opcional)" rule="O DS mostra; gerar o arquivo é decisão do app. A receita pronta usa a biblioteca docx e gera estilos de título do Word, sumário, capa, cabeçalho e “Página X de Y”, com as cores dos tokens.">
        <CodeBlock
          code={`// 1. pnpm add docx   2. copie node_modules/@g4ai/ds/templates/office-export.ts para o app
import { exportDocx } from "@/lib/office-export";

<DocumentView
  document={doc}
  actions={<Button variant="ghost" size="sm" onClick={() => op.run(() => exportDocx(doc), "Documento baixado")}><Download /> Baixar .docx</Button>}
/>`}
        />
        <p className="m-0 text-[13.5px] text-ink-soft">Guia completo: <code>docs/guias/office.md</code>.</p>
        <PropsTable
          rows={[
            ["DocumentView.document", "OfficeDocument", "—", "{ title, kicker?, subtitle?, author?, date?, cover?, toc?, header?, footer?, blocks }."],
            ["DocumentView.actions", "ReactNode", "—", "Ações na barra (ex.: Baixar .docx do app)."],
            ["OfficeDocument.cover", "boolean", "true", "Capa em página própria (falso no que vem de .docx)."],
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
