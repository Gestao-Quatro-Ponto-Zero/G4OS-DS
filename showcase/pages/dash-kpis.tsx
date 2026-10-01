import { DollarSign, Users } from "lucide-react";
import { Delta, KpiCard, KpiGrid, formatCurrency } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "KPIs e variação",
  group: "Dashboards",
  order: 10,
  description: "KpiCard, KpiGrid e Delta: o topo de qualquer dashboard. Número grande, comparação explícita e uma variação que sabe se subir é bom ou ruim.",
};

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Dashboards" description={meta.description}>
      <DocSection title="KpiCard" rule="Rótulo, valor, variação e período. Com spark, a mini tendência dos últimos pontos. Com href, o card inteiro leva ao detalhe.">
        <Demo
          bare
          code={`<KpiGrid cols={2}>
  <KpiCard label="Receita recorrente (MRR)" value="R$ 412.380" delta={0.125} period="vs. agosto" spark={[31, 33, 32, 35, 36, 38, 41]} />
  <KpiCard label="Novas contas" value="1.234" delta={-0.2} period="Aquisição abaixo do esperado" />
  <KpiCard label="Churn mensal" value="1,8 %" delta={-0.045} goodWhen="down" period="Menor em 6 meses" />
  <KpiCard label="Clientes ativos" value="45.678" icon={<Users />} hint="3.210 em trial" href="/clientes" />
</KpiGrid>`}
        >
          <KpiGrid cols={2}>
            <KpiCard label="Receita recorrente (MRR)" value="R$ 412.380" delta={0.125} period="vs. agosto" spark={[31, 33, 32, 35, 36, 38, 41]} />
            <KpiCard label="Novas contas" value="1.234" delta={-0.2} period="Aquisição abaixo do esperado" spark={[52, 48, 50, 44, 41, 39, 38]} />
            <KpiCard label="Churn mensal" value="1,8 %" delta={-0.045} goodWhen="down" period="Menor em 6 meses" spark={[2.6, 2.4, 2.3, 2.1, 2, 1.9, 1.8]} />
            <KpiCard label="Clientes ativos" value="45.678" icon={<Users />} hint="3.210 em trial" href="#/p/dash-kpis" />
          </KpiGrid>
        </Demo>
        <Demo
          bare
          title="Tamanho lg + rodapé"
          description="Use lg só no KPI principal da tela (receita fechada, saldo em caixa)."
          code={`<KpiCard size="lg" label="Receita fechada no trimestre" value="R$ 3,6 mi" delta={0.142} period="vs. 2º trimestre"
  footer={<span className="text-[12px] text-muted">Meta R$ 3,3 mi · 109 %</span>} />`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <KpiCard
              size="lg"
              icon={<DollarSign />}
              label="Receita fechada no trimestre"
              value={formatCurrency(3_610_000, { compact: true })}
              delta={0.142}
              period="vs. 2º trimestre"
              footer={<span className="text-[12px] text-muted">Meta R$ 3,3 mi · 109 %</span>}
            />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["label", "string", "—", "O que é medido, sem abreviação obscura."],
            ["value", "ReactNode", "—", "Já formatado (formatCurrency, formatPercent…)."],
            ["delta", "number", "—", "Fração: 0.125 = +12,5 %."],
            ["goodWhen", '"up" | "down" | "neutral"', '"up"', "down para custo, churn, prazo; neutral quando não há juízo."],
            ["period", "string", '"vs. mês anterior"', "Base da comparação. Sempre explícita."],
            ["spark", "number[]", "—", "Mini tendência. Fica vermelha quando a variação é ruim."],
            ["hint · footer · icon · href", "—", "—", "Linha auxiliar, rodapé com borda, ícone do rótulo, link do card."],
            ["size", '"md" | "lg"', '"md"', "lg (30px) só para o número principal da tela."],
          ]}
        />
      </DocSection>

      <DocSection title="Delta" rule="A variação sozinha, para tabelas, rankings e DRE. A cor vem do juízo (bom/ruim), não do sinal.">
        <Demo code={`<Delta value={0.125} />                  // receita subiu: verde
<Delta value={0.083} goodWhen="down" />  // custo subiu: vermelho
<Delta value={-0.034} goodWhen="neutral" />
<Delta value={0.06} variant="text" />`}>
          <Delta value={0.125} />
          <Delta value={-0.2} />
          <Delta value={0.083} goodWhen="down" />
          <Delta value={-0.045} goodWhen="down" />
          <Delta value={-0.034} goodWhen="neutral" />
          <Delta value={0} />
          <Delta value={0.06} variant="text" />
        </Demo>
      </DocSection>

      <DocSection title="KpiGrid" rule="1 coluna no celular, 2 no tablet, cols (2–5) no desktop. 3–5 KPIs por tela; mais que isso, ninguém lê.">
        <PropsTable rows={[["cols", "2 | 3 | 4 | 5", "4", "Colunas a partir de 1024px."]]} />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Todo número com comparação e período: “+12,5 % vs. agosto”.", dont: "Número solto sem base (“1.234”): bom ou ruim?" },
            { do: "goodWhen=\"down\" para custo, churn, prazo médio, inadimplência.", dont: "Pintar de verde toda seta para cima." },
            { do: "Formatar com formatCurrency/formatPercent/formatNumber: mesmo número, mesma forma em toda a tela.", dont: "Misturar “R$ 1.2M”, “1,2 mi” e “1200000” na mesma página." },
            { do: "Levar ao detalhe com href quando o KPI tem uma lista por trás.", dont: "Mais de 5 KPIs no topo." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
