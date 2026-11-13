import { FileText, History, Image, Mail, Trash2, Video } from "lucide-react";
import { useState } from "react";
import { CapacityBar, CapacityBreakdown, CapacityLegend, formatNumber, formatStorage, useLinkedHighlight, type CapacitySegment, type CapacitySuggestion } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Capacidade e armazenamento",
  group: "Dashboards",
  order: 47,
  description: "CapacityBar (barra segmentada de uma cota), CapacityLegend (legenda ligada) e CapacityBreakdown (total, varredura, categoria em foco e limpeza guiada). Para composição de um limite: armazenamento, envios do plano, assentos.",
  shadcn: false,
};

const GB = 1e9;

const base: CapacitySegment[] = [
  { id: "gravacoes", label: "Gravações de reunião", value: 236.9 * GB, icon: <Video />, description: "1.126 reuniões; 412 têm mais de 6 meses." },
  { id: "docs", label: "Documentos", value: 182.4 * GB, icon: <FileText />, description: "Textos, planilhas e PDFs das equipes." },
  { id: "midia", label: "Imagens e mídia", value: 121.7 * GB, icon: <Image />, description: "Fotos de campo e peças de marketing." },
  { id: "anexos", label: "Anexos de e-mail", value: 96.3 * GB, icon: <Mail />, description: "Caixas compartilhadas." },
  { id: "versoes", label: "Versões antigas", value: 74.8 * GB, icon: <History />, description: "Histórico de edições." },
  { id: "lixeira", label: "Lixeira", value: 41.2 * GB, icon: <Trash2 />, description: "Excluídos nos últimos 30 dias." },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function LinkedDemo() {
  const hl = useLinkedHighlight<string>();
  return (
    <div className="flex flex-col gap-4 pt-8">
      <CapacityBar label="Armazenamento do workspace" segments={base} total={1e12} highlight={hl} />
      <CapacityLegend segments={base} highlight={hl} />
    </div>
  );
}

function BreakdownDemo() {
  const [segments, setSegments] = useState(base);
  const shrink = (id: string, by: number) => setSegments((xs) => xs.map((s) => (s.id === id ? { ...s, value: Math.max(0, s.value - by) } : s)));
  const lixeira = segments.find((s) => s.id === "lixeira")?.value ?? 0;
  const suggestions: CapacitySuggestion[] = [
    {
      id: "lixeira",
      category: "lixeira",
      text: `A lixeira guarda ${formatStorage(lixeira)} de arquivos que a equipe já excluiu.`,
      actionLabel: "Esvaziar lixeira",
      busyLabel: "Esvaziando…",
      destructive: true,
      confirm: { title: "Esvaziar a lixeira?", description: "Os arquivos somem de vez, para todas as equipes. Não dá para desfazer." },
      onAction: async () => {
        await wait(1200);
        shrink("lixeira", lixeira);
        return { freed: lixeira };
      },
    },
    {
      id: "frio",
      category: "gravacoes",
      text: "Gravações com mais de 6 meses somam 148,2 GB. No arquivo frio continuam pesquisáveis.",
      actionLabel: "Mover para arquivo frio",
      busyLabel: "Movendo…",
      doneMessage: "Gravações antigas movidas para o arquivo frio",
      undo: () => shrink("gravacoes", -148.2 * GB),
      onAction: async () => {
        await wait(1200);
        shrink("gravacoes", 148.2 * GB);
        return { freed: 148.2 * GB };
      },
    },
  ];
  return (
    <CapacityBreakdown
      label="Armazenamento do workspace"
      segments={segments}
      total={1e12}
      suggestions={suggestions}
      simulateScan={{ paths: ["Drive › Comercial › Propostas 2026", "Reuniões › Gravações › Setembro", "E-mail › financeiro@ › Anexos", "Lixeira"] }}
      onRescan={() => setSegments(base)}
    />
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection
        title="CapacityBar"
        rule="Uma cota, uma barra: cada categoria ocupa a sua fração do total e o espaço livre fica em gelo. Até 6 cores (`chartColor`); acima disso, as 5 maiores e `Outros`. Segmentos focáveis pelas setas, com nome, tamanho e % para o leitor de tela."
      >
        <Demo
          title="Ligada à legenda"
          description="Passe o mouse ou foque um segmento ou uma categoria: o resto esmaece. Clique fixa."
          code={`const hl = useLinkedHighlight<string>();
<CapacityBar label="Armazenamento do workspace" segments={segments} total={1e12} highlight={hl} />
<CapacityLegend segments={segments} highlight={hl} />`}
        >
          <div className="w-full max-w-[880px]">
            <LinkedDemo />
          </div>
        </Demo>
        <div className="grid gap-4 md:grid-cols-2">
          <Demo title="Em varredura" code={`<CapacityBar label="Uso" segments={segments} total={1e12} scanned={0.45} />`}>
            <div className="w-full">
              <CapacityBar label="Uso do armazenamento em varredura" segments={base} total={1e12} scanned={0.45} height={40} />
            </div>
          </Demo>
          <Demo title="Sem textura, baixa" code={`<CapacityBar label="Envios do plano" segments={envios} total={50000} texture={false} height={16} format={formatNumber} />`}>
            <div className="w-full">
              <CapacityBar
                label="Envios do plano"
                texture={false}
                height={16}
                total={50000}
                format={(n) => `${formatNumber(n)} envios`}
                segments={[
                  { id: "mkt", label: "Campanhas", value: 21400 },
                  { id: "auto", label: "Automações", value: 12800 },
                  { id: "tx", label: "Transacionais", value: 6100 },
                ]}
              />
            </div>
          </Demo>
        </div>
      </DocSection>

      <DocSection
        title="CapacityBreakdown"
        rule="O cartão completo: total que desce animado quando algo é limpo, linha de status (caminho durante a varredura, explicação da categoria em foco, resultado depois da limpeza), barra, legenda e uma recomendação por vez. Irreversível passa por `ConfirmDialog`; reversível vai direto e o toast oferece Desfazer."
      >
        <Demo
          title="Varredura simulada e limpeza"
          code={`<CapacityBreakdown
  segments={segments}
  total={1e12}
  simulateScan
  onRescan={recarregar}
  suggestions={[
    { id: "lixeira", category: "lixeira", destructive: true,
      text: "A lixeira guarda 41,2 GB de arquivos que a equipe já excluiu.",
      actionLabel: "Esvaziar lixeira",
      onAction: async () => ({ freed: await api.esvaziarLixeira() }) },
  ]}
/>`}
        >
          <div className="w-full max-w-[880px]">
            <BreakdownDemo />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["segments", "{ id; label; value; color?; icon?; description? }[]", "—", "Categorias, na ordem da barra. Até 6 com cor; o excedente vira Outros."],
            ["total", "number", "—", "Tamanho da cota (100 % da barra)."],
            ["label", "string", "—", "Nome acessível da barra (obrigatório em CapacityBar)."],
            ["scanned", "number (0–1)", "—", "CapacityBar: fração varrida; enche até ali com a frente de varredura."],
            ["highlight", "LinkedHighlight<string>", "interno", "Realce compartilhado entre barra e legenda (useLinkedHighlight)."],
            ["clearing", "string | null", "—", "CapacityBar: categoria sendo limpa; esmaece até encolher."],
            ["height · texture · tooltip", "number · boolean · boolean", "48 · true · true", "CapacityBar: altura em px, pontos sutis, etiqueta sobre o segmento em foco."],
            ["format", "(n) => string", "formatStorage", "Formato dos valores. formatStorage usa base 1000 (como o sistema) e espaço inseparável."],
            ["suggestions", "CapacitySuggestion[]", "[]", "CapacityBreakdown: recomendações em ordem; uma por vez. onAction devolve { freed }."],
            ["destructive · confirm", "boolean · { title; description; confirmLabel }", "—", "Sugestão irreversível: confirma em ConfirmDialog (tom danger)."],
            ["undo · doneMessage", "() => void · string", "—", "Sugestão reversível: toast com Desfazer ao terminar."],
            ["scanning · scanProgress · scanPath", "boolean · number · ReactNode", "—", "Varredura controlada pelo app (progresso real e caminho atual)."],
            ["simulateScan", "boolean | { duration; paths }", "—", "Demonstração: anima uma varredura ao montar e em Varrer de novo."],
            ["onRescan", "() => void", "—", "Mostra Varrer de novo."],
          ]}
        />
      </DocSection>

      <DocSection title="Quando usar">
        <Rules
          items={[
            { do: "Composição de uma cota com limite: armazenamento, envios do plano, assentos por papel.", dont: "Série temporal (uso mês a mês): use AreaChart ou BarChart." },
            { do: "Até 6 categorias, nomeadas pelo que a pessoa reconhece (Gravações de reunião, Lixeira).", dont: "Uma cor por pasta ou por arquivo: agrupe em Outros." },
            { do: "Recomendação com o tamanho na frase e verbo + objeto no botão (Esvaziar lixeira).", dont: "Apagar sem dizer quanto e o quê, ou sem ConfirmDialog quando não dá para desfazer." },
            { do: "Varredura com o caminho real e o total subindo; movimento reduzido mostra o fim direto.", dont: "Animação decorativa na entrada de uma tela de trabalho." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
