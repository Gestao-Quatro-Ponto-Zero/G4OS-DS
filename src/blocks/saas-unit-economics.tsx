import { Download } from "lucide-react";
import { useState } from "react";
import {
  Button,
  ChartCard,
  ConnectedScatter,
  DataTable,
  Dot,
  Empty,
  ErrorState,
  Page,
  PageHeading,
  SegmentedControl,
  Skeleton,
  StatCell,
  StatGrid,
  downloadCsv,
  formatCurrency,
  formatNumber,
  gridToCsv,
  notify,
  type ConnectedScatterSeries,
  type GridColumn,
} from "@g4ai/ds";
import { SaasShell } from "./shells/saas-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "CAC e LTV por canal",
  description: "Dispersão conectada de CAC contra LTV mês a mês por canal de aquisição, com a linha de 3× e a zona saudável, cabeça que percorre o tempo e resumo por canal.",
  category: "SaaS",
  order: 11,
  height: 1320,
  concept: {
    goal: "Ver se cada canal de aquisição continua pagando o próprio custo: onde o LTV/CAC caiu abaixo da meta de 3×, quando e por quê.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo; um cartão-pergunta com o seletor de canal no action",
      "Células de número do mês em foco (mês, CAC, LTV, LTV/CAC com ponto + texto) acima do gráfico",
      "Dispersão conectada: um ponto por mês, setas de direção, cabeça no mês em foco, outros canais esmaecidos",
      "Linha y = 3·x tracejada e zona saudável em verde bem leve, com rótulo",
      "Controle de tempo embaixo (tocar/pausar); setas do teclado no gráfico também movem a cabeça",
      "Anotações nos meses em que algo mudou (campanha, plano anual)",
    ],
    adapt: ["Preço × volume por produto, custo por contratação × tempo até contratar, ticket × churn por plano", "Qualquer par de medidas em que a direção no tempo importa mais que o ponto isolado"],
    avoid: [
      "Mais de três séries visíveis ao mesmo tempo: o caminho vira novelo",
      "Usar com poucos meses (menos de 6): uma linha simples mostra melhor",
      "Pintar o caminho de verde ou vermelho: a zona e o status com palavra já dizem se está saudável",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo: CAC e LTV de 12 meses por canal, jan 2025–jun 2026 */
/* ------------------------------------------------------------------ */

const months = [
  "jan 2025",
  "fev 2025",
  "mar 2025",
  "abr 2025",
  "mai 2025",
  "jun 2025",
  "jul 2025",
  "ago 2025",
  "set 2025",
  "out 2025",
  "nov 2025",
  "dez 2025",
  "jan 2026",
  "fev 2026",
  "mar 2026",
  "abr 2026",
  "mai 2026",
  "jun 2026",
];

type ChannelKey = "pago" | "organico" | "parcerias";
const channelLabel: Record<ChannelKey, string> = { pago: "Mídia paga", organico: "Orgânico", parcerias: "Parcerias" };

// [CAC, LTV] em R$ por mês.
const raw: Record<ChannelKey, [number, number][]> = {
  pago: [
    [780, 2950],
    [820, 2990],
    [870, 2960],
    [930, 3010],
    [990, 2990],
    [1050, 3020],
    [1120, 3000],
    [1210, 2980],
    [1290, 3010],
    [1350, 3040],
    [1390, 3110],
    [1410, 3240],
    [1360, 3420],
    [1290, 3650],
    [1210, 3900],
    [1130, 4150],
    [1040, 4400],
    [960, 4640],
  ],
  organico: [
    [310, 3880],
    [320, 3920],
    [305, 3990],
    [330, 4010],
    [345, 4080],
    [340, 4150],
    [360, 4120],
    [375, 4200],
    [370, 4290],
    [385, 4350],
    [400, 4380],
    [395, 4460],
    [410, 4590],
    [405, 4720],
    [420, 4810],
    [415, 4930],
    [425, 5080],
    [430, 5210],
  ],
  parcerias: [
    [560, 2520],
    [585, 2560],
    [600, 2610],
    [640, 2590],
    [690, 2540],
    [720, 2480],
    [760, 2430],
    [740, 2470],
    [715, 2560],
    [700, 2640],
    [690, 2720],
    [705, 2800],
    [690, 2890],
    [680, 2950],
    [670, 3020],
    [690, 3110],
    [700, 3200],
    [705, 3310],
  ],
};
const notes: Partial<Record<ChannelKey, Record<number, string>>> = {
  pago: { 6: "Correspondência ampla ativada", 12: "Planos anuais" },
  organico: { 12: "Planos anuais" },
  parcerias: { 5: "Comissão de 25 %", 12: "Planos anuais" },
};
const channels: ChannelKey[] = ["pago", "organico", "parcerias"];
const series: ConnectedScatterSeries[] = channels.map((k) => ({
  key: k,
  label: channelLabel[k],
  points: raw[k].map(([x, y], i) => ({ x, y, label: months[i], note: notes[k]?.[i] })),
}));

const TARGET = 3;

/* ------------------------------------------------------------------ */

const here = "#/frame/saas-unit-economics";
const brl = (n: number) => formatCurrency(n, { cents: false });
const signedBrl = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${brl(Math.abs(n))}`;
const ratioText = (r: number) => `${formatNumber(r, 1)}×`;

type Row = { key: ChannelKey; label: string; cac: number; ltv: number; ratio: number; cacFrom: number };
const summary = (i: number): Row[] => channels.map((k) => ({ key: k, label: channelLabel[k], cac: raw[k][i][0], ltv: raw[k][i][1], ratio: raw[k][i][1] / raw[k][i][0], cacFrom: raw[k][0][0] }));

const csvColumns: GridColumn<{ canal: string; mes: string; cac: number; ltv: number }>[] = [
  { key: "canal", header: "Canal", value: (r) => r.canal },
  { key: "mes", header: "Mês", value: (r) => r.mes },
  { key: "cac", header: "CAC (R$)", value: (r) => r.cac },
  { key: "ltv", header: "LTV 12 meses (R$)", value: (r) => r.ltv },
];

/** Status da razão: ponto + texto, nunca só cor. */
function RatioStatus({ ratio }: { ratio: number }) {
  const ok = ratio >= TARGET;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Dot tone={ok ? "ok" : "warn"} />
      {ok ? `Acima da meta de ${TARGET}×` : `Abaixo da meta de ${TARGET}×`}
    </span>
  );
}

/** Carregando com a forma final: células de número + gráfico + tabela. */
function UnitSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando CAC e LTV" className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface px-6 py-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-64 max-w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 bg-surface px-4 py-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[380px] w-full rounded-lg" />
      </div>
      <div className="rounded-xl border border-line bg-surface px-6 py-5">
        <Skeleton className="h-4 w-48" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SaasUnitEconomics() {
  const estado = useFrameParam("estado");
  const [channel, setChannel] = useState<ChannelKey>(estado === "filtro" ? "parcerias" : "pago");
  const [index, setIndex] = useState(months.length - 1);
  // ?estado=filtro: Parcerias sem meses no recorte (programa começou depois).
  const filteredOut = estado === "filtro" && channel === "parcerias";
  const pts = raw[channel];
  const [cac, ltv] = pts[index];
  const [cac0, ltv0] = pts[0];
  const ratio = ltv / cac;
  const rows = summary(months.length - 1).filter((r) => estado !== "filtro" || r.key !== "parcerias");

  const exportCsv = () => {
    const data = channels.flatMap((k) => raw[k].map(([c, l], i) => ({ canal: channelLabel[k], mes: months[i], cac: c, ltv: l })));
    downloadCsv("cac-ltv-por-canal", gridToCsv(data, csvColumns));
    notify(`${formatNumber(data.length)} linhas de CAC e LTV exportadas em CSV`);
  };

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="CAC e LTV por canal"
          description="Quanto custa trazer um cliente e quanto ele devolve em 12 meses, mês a mês. Janeiro de 2025 a junho de 2026."
          actions={
            estado === "vazio" || estado === "carregando" || estado === "erro" ? undefined : (
              <Button variant="ghost" onClick={exportCsv}>
                <Download /> Exportar CSV
              </Button>
            )
          }
        />
        <div className="mt-6 flex flex-col gap-6">
          {estado === "carregando" ? (
            <UnitSkeleton />
          ) : estado === "erro" ? (
            <div className="rounded-xl border border-line bg-surface">
              <ErrorState
                size="md"
                title="Não foi possível carregar CAC e LTV"
                description="O servidor de custos não respondeu. Nada foi perdido; tente de novo em instantes."
                retryLabel="Tentar de novo"
                onRetry={() => setFrameQuery({ estado: undefined })}
                secondaryAction={
                  <Button variant="ghost" href="#/frame/saas-analytics">
                    Ir para Análises
                  </Button>
                }
              />
            </div>
          ) : estado === "vazio" ? (
            <Empty
              title="Ainda não há custos de aquisição"
              hint="Conecte as contas de mídia e o CRM para cruzar o custo de cada canal com a receita dos clientes que ele trouxe."
              action={<Button href="#/frame/saas-integrations">Conectar fontes de custo</Button>}
            />
          ) : (
            <>
              <ChartCard title="O LTV paga o CAC em cada canal?" description={`Custo de aquisição contra o LTV de 12 meses, por mês · meta: LTV de ${TARGET}× o CAC`}>
                <div className="flex flex-col gap-5">
                  {/* No corpo, não no action: três canais não cabem ao lado do título no celular. */}
                  <SegmentedControl label="Canal" value={channel} onChange={setChannel} options={channels.map((k) => ({ value: k, label: channelLabel[k] }))} className="self-start" />
                  {filteredOut ? (
                    <Empty
                      framed={false}
                      title="Nenhum mês de Parcerias no recorte"
                      hint="O canal Parcerias não tem custos lançados entre janeiro de 2025 e junho de 2026 neste filtro."
                      action={
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setChannel("pago");
                            setFrameQuery({ estado: undefined });
                          }}
                        >
                          Limpar filtro
                        </Button>
                      }
                    />
                  ) : (
                    <div className="flex flex-col gap-5">
                      <StatGrid cols={4}>
                        <StatCell label="Mês" value={months[index]} hint={`${index + 1} de ${months.length}`} />
                        <StatCell label="CAC" value={brl(cac)} hint={`${signedBrl(cac - cac0)} desde ${months[0]}`} />
                        <StatCell label="LTV em 12 meses" short="LTV" value={brl(ltv)} hint={`${signedBrl(ltv - ltv0)} desde ${months[0]}`} />
                        <StatCell label="LTV/CAC" value={ratioText(ratio)} tone={ratio < TARGET ? "warn" : undefined} hint={<RatioStatus ratio={ratio} />} />
                      </StatGrid>
                      <ConnectedScatter
                        label={`CAC contra LTV de 12 meses do canal ${channelLabel[channel]}, de ${months[0]} a ${months[months.length - 1]}`}
                        series={series}
                        active={channel}
                        index={index}
                        onIndexChange={setIndex}
                        xLabel="CAC"
                        yLabel="LTV em 12 meses"
                        formatX={brl}
                        formatY={brl}
                        formatAxisY={(n) => formatCurrency(n, { compact: true })}
                        reference={{ ratio: TARGET, label: `LTV = ${TARGET}× CAC`, zone: "above", zoneLabel: `Saudável, acima de ${TARGET}×` }}
                        height={380}
                      />
                    </div>
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Como os canais estão hoje?" description={`${months[months.length - 1]} · toque numa linha para ver o caminho do canal`}>
                <DataTable
                  rows={rows}
                  rowKey={(r) => r.key}
                  onRowClick={(r) => setChannel(r.key)}
                  rowLabel={(r) => `Ver o caminho de ${r.label}`}
                  columns={[
                    { key: "label", header: "Canal", primary: true, cell: (r) => <span className={r.key === channel ? "font-semibold" : undefined}>{r.label}</span> },
                    { key: "cac", header: "CAC", align: "right", nowrap: true, cell: (r) => <span className="tabular-nums">{brl(r.cac)}</span> },
                    { key: "ltv", header: "LTV 12 meses", align: "right", nowrap: true, cell: (r) => <span className="tabular-nums">{brl(r.ltv)}</span> },
                    { key: "ratio", header: "LTV/CAC", align: "right", nowrap: true, cell: (r) => <span className="tabular-nums">{ratioText(r.ratio)}</span> },
                    { key: "status", header: "Situação", mobileHidden: true, cell: (r) => <RatioStatus ratio={r.ratio} /> },
                    { key: "from", header: "CAC desde jan 2025", align: "right", nowrap: true, mobileHidden: true, cell: (r) => <span className="tabular-nums text-ink-soft">{signedBrl(r.cac - r.cacFrom)}</span> },
                  ]}
                />
              </ChartCard>
            </>
          )}
        </div>
      </Page>
    </SaasShell>
  );
}
