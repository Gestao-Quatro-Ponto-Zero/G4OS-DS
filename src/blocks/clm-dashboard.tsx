import { AlarmClock, CalendarClock, FilePlus2, PenLine, RefreshCw, Stamp } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  BarChart,
  BarList,
  Button,
  ChartCard,
  ChartCardTotals,
  EntityMark,
  KpiCard,
  KpiGrid,
  ListPanel,
  ListRow,
  MiniBarChart,
  Page,
  PageHeading,
  SegmentedControl,
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  plural,
} from "@g4ai/ds";
import {
  approvals,
  annualValue,
  awaitingMe,
  contractById,
  contractTypes,
  contracts,
  counterpartyById,
  daysFromToday,
  daysToEnd,
  endingWithin,
  isActive,
  isLate,
  me,
  noticeDeadline,
  obligations,
  personById,
  renewalToDecide,
  signersFor,
  today,
  type ContractType,
} from "./data/contracts";
import { go } from "./shells/frame-route";
import { ClmShell } from "./shells/clm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Painel de contratos",
  description: "Valor sob contrato, janela de vencimentos (30/60/90 dias), renovações automáticas a decidir antes do aviso prévio, assinaturas paradas, obrigações atrasadas e a fila “Precisa de você”.",
  category: "Contratos",
  order: 1,
  height: 1400,
  concept: {
    goal: "Mostrar ao Jurídico e a Suprimentos o que vence, o que renova sozinho e o que está parado esperando alguém, antes que o prazo de aviso prévio passe.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com horizonte à direita; KPIs, um gráfico por pergunta e filas de ação",
      "KPI com base explícita; obrigações atrasadas com goodWhen=\"down\"",
      "Vencimentos por mês com alternância Valor/Quantidade (ChartCardTotals) e renovação automática separada da por aditivo",
      "“Precisa de você” antes dos detalhes: aprovações, assinaturas paradas e prazos de aviso prévio",
      "Cada linha abre o registro certo (contrato, fila de aprovação, obrigações)",
    ],
    adapt: [
      "Gestão de apólices (vencimento e renovação), licenças de software, imóveis locados",
      "Troque as janelas 30/60/90 pela política da empresa (ex.: 45/90/180 em locação)",
    ],
    avoid: [
      "Mostrar só a data de fim: o que importa é o último dia para avisar que não renova",
      "Somar contratos encerrados no valor sob contrato",
    ],
  },
} as const;

/* Assinaturas concluídas por mês (histórico do provedor de assinatura eletrônica). */
const signedByMonth = [
  { label: "Abr", value: 14 },
  { label: "Mai", value: 19 },
  { label: "Jun", value: 16 },
  { label: "Jul", value: 22 },
  { label: "Ago", value: 18 },
  { label: "Set", value: 25 },
];

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
const monthLabel = (d: Date) => d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "").replace(" de ", "/");

export default function ClmDashboard() {
  const [horizon, setHorizon] = useState<"6" | "12">("12");
  const [metric, setMetric] = useState("valor");
  const active = contracts.filter(isActive);
  const underContract = active.reduce((s, c) => s + c.value, 0);
  const annual = active.reduce((s, c) => s + annualValue(c), 0);
  const in30 = active.filter((c) => endingWithin(c, 30));
  const in60 = active.filter((c) => endingWithin(c, 60) && !endingWithin(c, 30));
  const in90 = active.filter((c) => endingWithin(c, 90) && !endingWithin(c, 60));
  const toDecide = active.filter(renewalToDecide).sort((a, b) => noticeDeadline(a).localeCompare(noticeDeadline(b)));
  const signing = contracts.filter((c) => c.status === "assinatura");
  const late = obligations.filter(isLate).sort((a, b) => a.due.localeCompare(b.due));
  const mine = approvals.filter(awaitingMe);

  // Vencimentos por mês: valor anual e quantidade, separando renovação automática.
  const months = Array.from({ length: Number(horizon) }, (_, i) => new Date(today.getFullYear(), today.getMonth() + i, 1));
  const byMonth = months.map((m) => {
    const list = active.filter((c) => monthKey(new Date(`${c.end}T00:00:00`)) === monthKey(m));
    const auto = list.filter((c) => c.renewal === "automatica");
    const manual = list.filter((c) => c.renewal !== "automatica");
    return metric === "valor"
      ? { mes: monthLabel(m), automatica: auto.reduce((s, c) => s + annualValue(c), 0), aditivo: manual.reduce((s, c) => s + annualValue(c), 0) }
      : { mes: monthLabel(m), automatica: auto.length, aditivo: manual.length };
  });
  const horizonList = active.filter((c) => daysToEnd(c) >= 0 && daysToEnd(c) <= Number(horizon) * 30.5);
  const byType = (Object.keys(contractTypes) as ContractType[])
    .map((t) => ({ label: contractTypes[t].label, value: active.filter((c) => c.type === t).reduce((s, c) => s + annualValue(c), 0), href: `?c_f=${encodeURIComponent(`tipo~is~${t}`)}#/frame/clm-contracts` }))
    .filter((x) => x.value > 0);

  // "Precisa de você": aprovações, assinaturas paradas há 3+ dias, avisos prévios em 30 dias.
  const stalled = signing
    .map((c) => ({ c, s: signersFor(c).find((x) => x.status === "pendente") }))
    .filter((x) => x.s && x.s.sentAt && daysFromToday(x.s.sentAt) <= -3);
  const noticeSoon = active.filter((c) => c.renewal !== "nenhuma" && daysFromToday(noticeDeadline(c)) >= 0 && daysFromToday(noticeDeadline(c)) <= 30 && c.owner === me.id);
  const needsMe = mine.length + stalled.length + noticeSoon.length;

  return (
    <ClmShell section="painel">
      <Page>
        <PageHeading
          kicker={`${formatDate(today)} · bom dia, ${me.name.split(" ")[0]}`}
          title="Contratos"
          description={`${formatNumber(active.length)} contratos vigentes da Vereda Alimentos. Prazos de aviso prévio contam a partir da data de fim.`}
          actions={
            <>
              <SegmentedControl label="Horizonte" value={horizon} onChange={setHorizon} options={[{ value: "6", label: "6 meses" }, { value: "12", label: "12 meses" }]} />
              <Button onClick={() => go("clm-request")}>
                <FilePlus2 /> Nova solicitação
              </Button>
            </>
          }
        />
        <div className="space-y-6">
          <KpiGrid cols={5}>
            <KpiCard label="Valor sob contrato" value={formatCurrency(underContract, { compact: true })} delta={0.064} period="vs. fim do trimestre anterior" hint={`${formatCurrency(annual, { compact: true })} por ano`} href="#/frame/clm-contracts?visao=vigentes" />
            <KpiCard label="Vencem em 90 dias" value={in30.length + in60.length + in90.length} hint={`${in30.length} em 30 · ${in60.length} em 60 · ${in90.length} em 90 dias`} href="#/frame/clm-contracts?visao=vencendo" />
            <KpiCard label="Renovações a decidir" value={toDecide.length} hint={`${toDecide.filter((c) => daysFromToday(noticeDeadline(c)) < 0).length} já passaram do aviso prévio`} href="#/frame/clm-contracts?visao=renovacao" />
            <KpiCard label="Aguardando assinatura" value={signing.length} hint={stalled.length ? `${plural(stalled.length, "parado", "parados")} há mais de 3 dias` : "Nenhum parado"} href="#/frame/clm-contracts?visao=assinatura" />
            <KpiCard label="Prazos atrasados" value={late.length} delta={-0.25} goodWhen="down" period="vs. mês anterior" href="#/frame/clm-obligations?filtro=atrasadas" />
          </KpiGrid>

          <ListPanel title="Precisa de você" icon={<AlarmClock />} count={needsMe} tone="attention" action={<a href="#/frame/clm-approvals">Aprovações</a>}>
            <ul className="list-none divide-y divide-line p-0">
              {mine.map((a) => {
                const c = contractById(a.contractId);
                const d = daysFromToday(a.due);
                return (
                  <li key={a.id}>
                    <ListRow
                      onClick={() => go("clm-approvals", a.id)}
                      leading={<Stamp className="h-4 w-4 text-muted" />}
                      kicker={`Aprovar · ${c.number} · ${plural(c.deviations.length, "cláusula fora do padrão", "cláusulas fora do padrão")}`}
                      title={c.title}
                      meta={<Badge tone={d <= 1 ? "warn" : "neutral"}>{d <= 0 ? "Vence hoje" : d === 1 ? "Até amanhã" : `Até ${formatDate(a.due, { short: true })}`}</Badge>}
                    />
                  </li>
                );
              })}
              {stalled.map(({ c, s }) => (
                <li key={c.id}>
                  <ListRow
                    onClick={() => go("clm-contract", { id: c.id, aba: "assinaturas" })}
                    leading={<PenLine className="h-4 w-4 text-muted" />}
                    kicker={`Assinatura parada · ${c.number}`}
                    title={`${s!.name} não assina há ${-daysFromToday(s!.sentAt!)} dias`}
                    meta={<Badge tone="warn">Parada</Badge>}
                  />
                </li>
              ))}
              {noticeSoon.map((c) => (
                <li key={c.id}>
                  <ListRow
                    onClick={() => go("clm-contract", c.id)}
                    leading={<CalendarClock className="h-4 w-4 text-muted" />}
                    kicker={`Aviso prévio · ${c.number}`}
                    title={`Decidir se renova: ${c.title}`}
                    meta={<span className="text-[12px] tabular-nums text-muted">até {formatDate(noticeDeadline(c), { short: true })}</span>}
                  />
                </li>
              ))}
            </ul>
          </ListPanel>

          <ChartCard
            title="Quanto da carteira vence em cada mês?"
            description={`Contratos vigentes por mês de término · ${metric === "valor" ? "valor anual" : "quantidade"}`}
            headerAside={
              <ChartCardTotals
                value={metric}
                onChange={setMetric}
                items={[
                  { key: "valor", label: "Valor anual", value: formatCurrency(horizonList.reduce((s, c) => s + annualValue(c), 0), { compact: true }) },
                  { key: "quantidade", label: "Contratos", value: formatNumber(horizonList.length) },
                ]}
              />
            }
            insight={`${formatCurrency([...in30, ...in60, ...in90].reduce((s, c) => s + annualValue(c), 0), { compact: true })} por ano vencem nos próximos 90 dias`}
            insightDetail={`${plural(toDecide.length, "renovação automática", "renovações automáticas")} no período · decida antes do aviso prévio`}
          >
            <BarChart
              label={`Contratos vigentes por mês de término nos próximos ${horizon} meses`}
              data={byMonth}
              index="mes"
              series={[
                { key: "automatica", label: "Renova sozinho" },
                { key: "aditivo", label: "Precisa de aditivo" },
              ]}
              stacked
              format={(n) => (metric === "valor" ? formatCurrency(n, { cents: false }) : plural(n, "contrato"))}
              formatAxis={(n) => (metric === "valor" ? formatCompact(n) : formatNumber(n))}
              height={240}
            />
          </ChartCard>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <ListPanel title="Renovações automáticas a decidir" icon={<RefreshCw />} count={toDecide.length} action={<a href="#/frame/clm-contracts?visao=renovacao">Ver todas</a>}>
              <ul className="list-none divide-y divide-line p-0">
                {toDecide.slice(0, 6).map((c) => {
                  const k = counterpartyById(c.counterpartyId);
                  const left = daysFromToday(noticeDeadline(c));
                  return (
                    <li key={c.id}>
                      <ListRow
                        onClick={() => go("clm-contract", c.id)}
                        leading={<EntityMark name={k.short} tint={k.tint} className="h-8 w-8 text-[11px]" />}
                        kicker={`${k.short} · ${formatCurrency(annualValue(c), { compact: true })}/ano · vence ${formatDate(c.end, { short: true })}`}
                        title={c.title}
                        meta={<Badge tone={left < 0 ? "bad" : left <= 15 ? "warn" : "neutral"}>{left < 0 ? "Aviso perdido" : left === 0 ? "Avisar hoje" : `Avisar até ${formatDate(noticeDeadline(c), { short: true })}`}</Badge>}
                      />
                    </li>
                  );
                })}
              </ul>
            </ListPanel>
            <ListPanel title="Obrigações atrasadas" icon={<CalendarClock />} count={late.length} tone="attention" action={<a href="#/frame/clm-obligations?filtro=atrasadas">Obrigações</a>}>
              <ul className="list-none divide-y divide-line p-0">
                {late.map((o) => {
                  const c = contractById(o.contractId);
                  return (
                    <li key={o.id}>
                      <ListRow
                        onClick={() => go("clm-contract", { id: c.id, aba: "obrigacoes" })}
                        kicker={`${c.number} · ${o.party === "Vereda" ? "nossa" : counterpartyById(c.counterpartyId).short} · ${personById(o.owner).name.split(" ")[0]}`}
                        title={o.title}
                        meta={<Badge tone="bad">{-daysFromToday(o.due)} {-daysFromToday(o.due) === 1 ? "dia" : "dias"}</Badge>}
                      />
                    </li>
                  );
                })}
              </ul>
            </ListPanel>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <ChartCard title="Onde está o valor da carteira?" description="Valor anual dos contratos vigentes, por tipo">
              <BarList items={byType} format={(n) => formatCurrency(n, { compact: true })} showShare />
            </ChartCard>
            <MiniBarChart label="Contratos assinados por mês" caption="Assinatura eletrônica · últimos 6 meses" data={signedByMonth} format={(n) => plural(n, "contrato")} />
          </div>
        </div>
      </Page>
    </ClmShell>
  );
}
