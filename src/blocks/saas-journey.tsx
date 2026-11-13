import { X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  ChartCard,
  Empty,
  ErrorState,
  Page,
  PageHeading,
  SankeyChart,
  SegmentedControl,
  Skeleton,
  formatNumber,
  formatPercent,
  useMediaQuery,
  type SankeyLink,
  type SankeyNode,
} from "@g4ai/ds";
import { SaasShell } from "./shells/saas-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Jornada até o plano pago",
  description: "Sankey da visita ao plano pago com as perdas de cada etapa, troca de canal que transforma os fluxos, nó selecionável que traça o caminho e painel com conversão, maiores perdas e divisão do plano.",
  category: "SaaS",
  order: 13,
  height: 1060,
  concept: {
    goal: "Ver onde as pessoas saem do caminho até o plano pago e comparar os canais de aquisição.",
    patterns: [
      "Anatomia B · Painel: cabeçalho com canal, gráfico principal e painel lateral (empilha no celular)",
      "Sankey com rótulos acima do nó (valor · % das visitas) e etapas embaixo",
      "Selecionar um nó traça o que chega e o que sai dele; o painel mostra a conversão",
      "No celular o gráfico rola dentro do próprio contêiner",
    ],
    adapt: ["Funil de recrutamento com desistências, jornada de compra no e-commerce, triagem de chamados"],
    avoid: ["Mais de 5 etapas ou 20 nós", "Perda sem nome (\"Outros\")", "Sankey quando só importa a conversão total (use FunnelChart)"],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo (troque pela sua consulta)                         */
/* ------------------------------------------------------------------ */

const here = "#/frame/saas-journey";
type Channel = "todos" | "organico" | "midia" | "indicacao";
type Counts = { visitas: number; conta: number; config: number; semana: number; pago: number };

/** Pessoas que chegaram a cada etapa em setembro de 2026, por canal. */
const byChannel: Record<Exclude<Channel, "todos">, Counts> = {
  organico: { visitas: 8_420, conta: 2_610, config: 1_980, semana: 1_290, pago: 520 },
  midia: { visitas: 6_310, conta: 1_720, config: 1_190, semana: 690, pago: 250 },
  indicacao: { visitas: 2_235, conta: 945, config: 782, semana: 545, pago: 250 },
};
const channelName: Record<Channel, string> = { todos: "Todos", organico: "Orgânico", midia: "Mídia paga", indicacao: "Indicação" };

const loss = "var(--ds-chart-6)";
const nodes: SankeyNode[] = [
  { id: "visita", label: "Visita", column: 0 },
  { id: "conta", label: "Conta criada", column: 1 },
  { id: "saiu", label: "Saiu", column: 1, color: loss },
  { id: "config", label: "Configurou", column: 2 },
  { id: "abandonou", label: "Abandonou", column: 2, color: loss },
  { id: "semana", label: "Ativo na 1ª semana", column: 3 },
  { id: "parou", label: "Parou", column: 3, color: loss },
  { id: "pago", label: "Plano pago", column: 4, color: "var(--ds-ok)" },
  { id: "gratuito", label: "Gratuito", column: 4, color: loss },
];
const stageLabels = ["Visita", "Conta", "Configuração", "Primeira semana", "Plano"];

function countsOf(channel: Channel): Counts {
  if (channel !== "todos") return byChannel[channel];
  const all = Object.values(byChannel);
  const sum = (k: keyof Counts) => all.reduce((s, c) => s + c[k], 0);
  return { visitas: sum("visitas"), conta: sum("conta"), config: sum("config"), semana: sum("semana"), pago: sum("pago") };
}

function linksOf(c: Counts): SankeyLink[] {
  return [
    { source: "visita", target: "conta", value: c.conta },
    { source: "visita", target: "saiu", value: c.visitas - c.conta },
    { source: "conta", target: "config", value: c.config },
    { source: "conta", target: "abandonou", value: c.conta - c.config },
    { source: "config", target: "semana", value: c.semana },
    { source: "config", target: "parou", value: c.config - c.semana },
    { source: "semana", target: "pago", value: c.pago },
    { source: "semana", target: "gratuito", value: c.semana - c.pago },
    { source: "parou", target: "gratuito", value: c.config - c.semana },
  ];
}

const lossName: Record<string, string> = { saiu: "Saiu depois da visita", abandonou: "Abandonou o cadastro", parou: "Parou na configuração" };

/* ------------------------------------------------------------------ */
/* Painel lateral                                                      */
/* ------------------------------------------------------------------ */

function BarRow({ label, value, share, tone = "ink" }: { label: string; value: number; share: number; tone?: "ink" | "ok" | "muted" }) {
  return (
    <li className="flex flex-col gap-1.5 py-2">
      <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
        <span className="min-w-0 truncate text-ink">{label}</span>
        <span className="flex shrink-0 gap-3 tabular-nums">
          <span className="text-ink">{formatNumber(value)}</span>
          <span className="w-12 text-right text-muted">{formatPercent(share, 1)}</span>
        </span>
      </div>
      <span aria-hidden className="h-[3px] rounded-full bg-soft">
        <span className={tone === "ok" ? "block h-full rounded-full bg-ok" : tone === "muted" ? "block h-full rounded-full bg-muted/60" : "block h-full rounded-full bg-ink/80"} style={{ width: `${Math.min(1, share) * 100}%` }} />
      </span>
    </li>
  );
}

function JourneyPanel({ channel, selected, counts, links }: { channel: Channel; selected: string | null; counts: Counts; links: SankeyLink[] }) {
  const value = (id: string) => Math.max(links.filter((l) => l.source === id).reduce((s, l) => s + l.value, 0), links.filter((l) => l.target === id).reduce((s, l) => s + l.value, 0));
  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;
  const node = selected ? nodes.find((n) => n.id === selected) : null;
  const v = node ? value(node.id) : counts.pago;
  const incoming = node ? links.filter((l) => l.target === node.id) : [];
  const outgoing = node ? links.filter((l) => l.source === node.id) : [];
  const losses = ["saiu", "abandonou", "parou"].map((id) => ({ id, value: value(id) })).sort((a, b) => b.value - a.value);
  const free = counts.config - counts.pago;
  return (
    <aside aria-label="Detalhe da jornada" className="flex min-w-0 flex-col gap-5">
      <section className="flex flex-col gap-1">
        <p className="m-0 text-[12px] text-muted">{node ? `${channelName[channel]} · etapa selecionada` : channelName[channel]}</p>
        <h4 className="m-0 text-[13.5px] font-medium">{node ? node.label : "Planos pagos"}</h4>
        <p className="m-0 text-[24px] font-semibold tabular-nums tracking-tight">{formatNumber(v)}</p>
        <p className="m-0 text-[12.5px] text-muted">
          {formatPercent(v / counts.visitas, 1)} das visitas {node ? "passaram por aqui" : "viraram plano pago"}
        </p>
        {!node && <p className="m-0 mt-1 text-[12px] text-muted">Selecione uma etapa no gráfico para ver de onde as pessoas vieram e para onde foram.</p>}
      </section>
      {node && (incoming.length > 0 || outgoing.length > 0) && (
        <section className="flex flex-col gap-3">
          {incoming.length > 0 && (
            <div className="flex flex-col">
              <h5 className="m-0 text-[12px] font-normal text-muted">Chegaram de</h5>
              <ul className="m-0 flex list-none flex-col p-0">
                {incoming.map((l) => (
                  <BarRow key={l.source} label={label(l.source)} value={l.value} share={l.value / (v || 1)} />
                ))}
              </ul>
            </div>
          )}
          {outgoing.length > 0 && (
            <div className="flex flex-col">
              <h5 className="m-0 text-[12px] font-normal text-muted">Seguiram para</h5>
              <ul className="m-0 flex list-none flex-col p-0">
                {outgoing.map((l) => (
                  <BarRow key={l.target} label={label(l.target)} value={l.value} share={l.value / (v || 1)} tone={l.target === "pago" ? "ok" : nodes.find((n) => n.id === l.target)?.color ? "muted" : "ink"} />
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
      <section className="flex flex-col border-t border-line pt-4">
        {/* Mesma base do gráfico (% das visitas): "Saiu" lê 69 % aqui e no nó. */}
        <h5 className="m-0 text-[12px] font-normal text-muted">Maiores perdas · % das visitas</h5>
        <ul className="m-0 flex list-none flex-col p-0">
          {losses.map((l) => (
            <BarRow key={l.id} label={lossName[l.id]} value={l.value} share={l.value / (counts.visitas || 1)} tone="muted" />
          ))}
        </ul>
      </section>
      <section className="flex flex-col border-t border-line pt-4">
        <h5 className="m-0 text-[12px] font-normal text-muted">Plano depois da configuração · % de quem configurou</h5>
        <ul className="m-0 flex list-none flex-col p-0">
          <BarRow label="Pago" value={counts.pago} share={counts.pago / (counts.config || 1)} tone="ok" />
          <BarRow label="Gratuito" value={free} share={free / (counts.config || 1)} tone="muted" />
        </ul>
      </section>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Estados                                                             */
/* ------------------------------------------------------------------ */

function JourneySkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando jornada" className="grid gap-6 rounded-xl border border-line bg-surface px-6 py-5 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Skeleton className="h-4 w-56 max-w-full" />
        <Skeleton className="h-3 w-72 max-w-full" />
        <div className="flex h-[420px] items-start justify-between gap-4">
          {[100, 34, 26, 18, 10].map((h, i) => (
            <div key={i} className="w-2" style={{ height: `${h}%` }}>
              <Skeleton className="h-full w-full rounded-sm" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-40" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function SaasJourney() {
  const estado = useFrameParam("estado");
  const [channel, setChannel] = useState<Channel>("todos");
  const [selected, setSelected] = useState<string | null>(null);
  const clear = () => setFrameQuery({ estado: undefined });
  const filtered = estado === "filtro";
  // Ao lado do painel (lg), o gráfico acompanha a altura dele; empilhado, fica mais baixo.
  const sideBySide = useMediaQuery("(min-width: 1024px)", true);
  const counts = useMemo(() => countsOf(channel), [channel]);
  const links = useMemo(() => linksOf(counts), [counts]);
  const sentence = `${channelName[channel]}: ${formatNumber(counts.visitas)} visitas e ${formatNumber(counts.pago)} planos pagos em setembro`;

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="Jornada até o plano pago"
          description={estado === "vazio" ? "Da primeira visita ao plano pago, com as perdas de cada etapa." : "Da primeira visita ao plano pago · pessoas que visitaram em setembro de 2026, acompanhadas até 30 dias"}
          actions={
            estado === "vazio" || estado === "carregando" ? undefined : (
              <SegmentedControl
                label="Canal"
                value={channel}
                onChange={setChannel}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "organico", label: "Orgânico" },
                  { value: "midia", label: "Mídia paga" },
                  { value: "indicacao", label: "Indicação" },
                ]}
              />
            )
          }
        />
        <div className="mt-6 flex flex-col gap-6">
          {estado === "carregando" ? (
            <JourneySkeleton />
          ) : estado === "erro" ? (
            <div className="rounded-xl border border-line bg-surface">
              <ErrorState
                size="md"
                title="Não foi possível carregar a jornada"
                description="O serviço de eventos não respondeu. Nada foi perdido; tente de novo em instantes."
                retryLabel="Tentar de novo"
                onRetry={clear}
                secondaryAction={
                  <Button variant="ghost" href="#/frame/saas-analytics">
                    Ver análise de aquisição
                  </Button>
                }
              />
            </div>
          ) : estado === "vazio" ? (
            <Empty
              title="Ainda não há jornadas para mostrar"
              hint="A jornada aparece quando o rastreamento registrar as primeiras visitas e cadastros."
              action={<Button href="#/frame/saas-integrations">Conectar o rastreamento</Button>}
            />
          ) : filtered ? (
            <ChartCard title="Onde as pessoas saem do caminho?" description="Filtro ativo">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
                  Filtro:
                  <span className="inline-flex items-center gap-1 rounded-md border border-line bg-soft px-2 py-0.5 text-ink">
                    Dispositivo: Tablet
                    <button type="button" aria-label="Remover filtro Dispositivo: Tablet" onClick={clear} className="ds-hit inline-flex rounded text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40">
                      <X className="size-3.5" />
                    </button>
                  </span>
                </div>
                <Empty
                  framed={false}
                  title="Nenhuma jornada neste recorte"
                  hint="Ninguém visitou pelo tablet no período."
                  action={
                    <Button variant="ghost" onClick={clear}>
                      Limpar filtro
                    </Button>
                  }
                />
              </div>
            </ChartCard>
          ) : (
            <ChartCard title="Onde as pessoas saem do caminho?" description={<span aria-live="polite">{sentence}</span>}>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-2 lg:col-span-2">
                  <p className="m-0 text-[12px] text-muted sm:hidden">Deslize o gráfico para ver todas as etapas.</p>
                  <SankeyChart
                    nodes={nodes}
                    links={links}
                    nodeLabels="above"
                    columnLabels={stageLabels}
                    selected={selected}
                    onSelect={setSelected}
                    minWidth={620}
                    height={sideBySide ? 460 : 380}
                    label={`Jornada até o plano pago. ${sentence}`}
                  />
                </div>
                <div className="min-w-0 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <JourneyPanel channel={channel} selected={selected} counts={counts} links={links} />
                </div>
              </div>
            </ChartCard>
          )}
        </div>
      </Page>
    </SaasShell>
  );
}
