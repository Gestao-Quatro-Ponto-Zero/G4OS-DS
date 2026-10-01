import { CalendarDays, Download, TriangleAlert } from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Avatar,
  Button,
  ChartCard,
  DataTable,
  DonutChart,
  DumbbellChart,
  FunnelChart,
  KpiCard,
  KpiGrid,
  ListPanel,
  ListRow,
  Page,
  PageHeading,
  SegmentedControl,
  formatCurrency,
  formatNumber,
  formatPercent,
  notify,
  type Column,
} from "@g4ai/ds";
import { candidateById, hiresByMonth, hiringFunnel, interviews, iso, jobById, jobs, offers, openDays, sourceQuality, timeByArea } from "./data/ats";
import { go } from "./shells/frame-route";
import { TalentosShell } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Painel de recrutamento",
  description: "Contratações contra a meta, tempo até contratar por área contra o SLA, funil, aceite de propostas, qualidade por origem e o que pede ação hoje (entrevistas e vagas fora do SLA).",
  category: "ATS",
  order: 1,
  height: 1400,
  concept: {
    goal: "Mostrar ao time de recrutamento se as contratações estão no ritmo e o que pede ação hoje.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com período, KPIs no topo",
      "Um gráfico por pergunta: meta, tempo × SLA, funil, aceite, origem",
      "Fila 'o que pede ação hoje' antes dos detalhes",
    ],
    adapt: [
      "Painel de vendas, operações ou atendimento: troque as perguntas e as filas",
    ],
    avoid: [
      "Gráficos sem período ou sem meta de referência",
    ],
  },
} as const;

type Source = (typeof sourceQuality)[number];

export default function AtsDashboard() {
  const [range, setRange] = useState<"ano" | "tri">("ano");
  const months = range === "ano" ? hiresByMonth : hiresByMonth.slice(-3);
  const hires = months.reduce((s, m) => s + m.contratacoes, 0);
  const scale = range === "ano" ? 1 : 0.36;
  const late = jobs.filter((j) => j.status === "aberta" && openDays(j) > j.sla * 0.8).sort((a, b) => openDays(b) / b.sla - openDays(a) / a.sla);
  const today = interviews.filter((i) => i.date === iso(0) && i.state === "agendada");
  const offerMix = [
    { label: "Aceitas", value: Math.round(58 * scale) + offers.filter((o) => o.status === "aceita").length, color: "var(--ds-ok)" },
    { label: "Recusadas", value: Math.round(9 * scale) + offers.filter((o) => o.status === "recusada").length, color: "var(--ds-rose)" },
    { label: "Aguardando", value: offers.filter((o) => o.status === "enviada" || o.status === "aprovacao").length, color: "var(--ds-chart-6)" },
  ];
  const columns: Column<Source>[] = [
    { key: "source", header: "Origem", primary: true, cell: (s) => s.source },
    { key: "applicants", header: "Candidaturas", align: "right", nowrap: true, cell: (s) => formatNumber(Math.round(s.applicants * scale)) },
    { key: "hires", header: "Contratações", align: "right", nowrap: true, cell: (s) => <span className="font-medium">{Math.round(s.hires * scale)}</span> },
    { key: "rate", header: "Conversão", align: "right", nowrap: true, cell: (s) => formatPercent(s.hires / s.applicants) },
    { key: "retention", header: "Retenção 12 meses", align: "right", nowrap: true, mobileHidden: true, cell: (s) => <span className={s.retention < 0.75 ? "font-medium text-amber" : ""}>{formatPercent(s.retention, 0)}</span> },
    { key: "cost", header: "Custo por contratação", align: "right", nowrap: true, cell: (s) => formatCurrency(s.cost, { cents: false }) },
  ];

  return (
    <TalentosShell section="painel">
      <Page>
        <PageHeading
          title="Recrutamento"
          description={range === "ano" ? "Eficiência e qualidade das contratações de 2026." : "3º trimestre de 2026 (jul–set)."}
          actions={
            <>
              <SegmentedControl label="Período" value={range} onChange={setRange} options={[{ value: "ano", label: "2026" }, { value: "tri", label: "3º tri" }]} />
              <Button variant="ghost" onClick={() => notify("Relatório em PDF sendo gerado. Você recebe por e-mail em instantes.", undefined, "info")}>
                <Download /> Relatório
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          <KpiGrid>
            <KpiCard label="Contratações" value={formatNumber(hires)} delta={range === "ano" ? 0.31 : 0.18} period={range === "ano" ? "vs. mesmo período de 2025" : "vs. 2º trimestre"} spark={months.map((m) => m.contratacoes)} />
            <KpiCard label="Tempo médio até contratar" value={range === "ano" ? "34 dias" : "31 dias"} delta={-0.12} goodWhen="down" period="da abertura ao aceite" />
            <KpiCard label="Aceite de propostas" value={formatPercent(offerMix[0].value / (offerMix[0].value + offerMix[1].value), 0)} delta={0.04} period="propostas respondidas" href="#/frame/ats-offers" />
            <KpiCard label="Custo por contratação" value={formatCurrency(3_870, { cents: false })} delta={0.08} goodWhen="down" period="anúncios, hunting e bônus" />
          </KpiGrid>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <ListPanel title="Vagas perto ou fora do SLA" tone={late.some((j) => openDays(j) > j.sla) ? "attention" : "neutral"} icon={<TriangleAlert />} count={late.length} action={<a href="#/frame/ats-jobs">Todas as vagas</a>}>
              <ul className="list-none divide-y divide-line p-0">
                {late.slice(0, 4).map((j) => (
                  <li key={j.id}>
                    <ListRow onClick={() => go("ats-job", j.id)} kicker={j.area} title={j.title} meta={<span className={openDays(j) > j.sla ? "font-medium text-rose" : "text-amber"}>{openDays(j)}/{j.sla} dias</span>} />
                  </li>
                ))}
              </ul>
            </ListPanel>
            <ListPanel title="Entrevistas de hoje" icon={<CalendarDays />} count={today.length} action={<a href="#/frame/ats-interviews">Agenda</a>}>
              <ul className="list-none divide-y divide-line p-0">
                {today.map((i) => {
                  const c = candidateById(i.candidateId);
                  return (
                    <li key={i.id}>
                      <ListRow onClick={() => go("ats-candidate", c.id)} leading={<Avatar initials={c.initials} tint={c.tint} name={c.name} size="sm" />} kicker={`${i.time} · ${i.kind}`} title={c.name} meta={jobById(i.jobId).short} />
                    </li>
                  );
                })}
              </ul>
            </ListPanel>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard className="lg:col-span-2" title="Estamos contratando no ritmo planejado?" description="Contratações por mês · meta de 12">
              <AreaChart label="Contratações por mês com meta de 12" data={months} index="mes" series={[{ key: "contratacoes", label: "Contratações" }]} reference={{ value: 12, label: "Meta 12/mês" }} height={240} />
            </ChartCard>
            <ChartCard title="As propostas são aceitas?" description={`${offerMix.reduce((s, o) => s + o.value, 0)} propostas no período`}>
              <DonutChart items={offerMix} label="Situação das propostas" centerLabel="Propostas" />
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Quais áreas demoram mais para contratar?" description="SLA da área → tempo real, em dias. Verde = dentro do SLA.">
              <DumbbellChart rows={timeByArea.map((t) => ({ label: t.area, a: t.sla, b: t.dias }))} aLabel="SLA" bLabel="Tempo real" format={(n) => `${n} d`} goodWhen="down" />
            </ChartCard>
            <ChartCard title="Onde o funil de contratação afunila?" description="Candidaturas por etapa alcançada">
              <FunnelChart stages={hiringFunnel.map((f) => ({ ...f, value: Math.round(f.value * scale) }))} label="Funil de contratação" />
            </ChartCard>
          </div>

          <section>
            <div className="mb-3">
              <h2 className="m-0 text-[14px] font-medium">Qual origem traz as melhores contratações?</h2>
              <p className="m-0 mt-0.5 text-[12px] text-muted">Volume, conversão, retenção após 12 meses e custo · retenção abaixo de 75 % em destaque</p>
            </div>
            <DataTable rows={sourceQuality} columns={columns} rowKey={(s) => s.source} />
          </section>
        </div>
      </Page>
    </TalentosShell>
  );
}
