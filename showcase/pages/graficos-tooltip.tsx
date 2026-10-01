import { Globe, Store } from "lucide-react";
import { BarChart, ChartContainer, ChartTooltipContent, LineChart, formatCurrency, type ChartConfig } from "@g4os/ds";
import { DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { ChartDemo, ChartGrid } from "./_chart-kit";
import * as d from "./_chart-data";

export const meta: PageMeta = {
  title: "Tooltip",
  group: "Gráficos",
  order: 8,
  description: "O tooltip é onde mora o valor exato. Todos os gráficos cartesianos aceitam `tooltip={{ … }}`; para os seus, use ChartTooltipContent.",
};

const brl = (n: number) => formatCurrency(n, { compact: true });
const brlFull = (n: number) => formatCurrency(n, { cents: false });
const sales = [{ key: "online", label: "Online" }, { key: "loja", label: "Loja física" }];
const config: ChartConfig = { online: { label: "Online", icon: Globe }, loja: { label: "Loja física", icon: Store } };

// defaultIndex deixa o tooltip aberto nesta página (passe o mouse para mover).
export default function Page() {
  return (
    <DocPage title="Tooltip" kicker="Gráficos" description={meta.description}>
      <DocSection title="Variantes" rule="Os exemplos abrem com o tooltip visível (tooltip.defaultIndex). Passe o mouse ou use as setas para mover.">
        <ChartGrid>
          <ChartDemo title="Padrão" description="Quadradinho de cor por série" code={`<BarChart stacked tooltip={{}} … />`}>
            <BarChart label="Vendas por canal" stacked data={d.sales6} index="mes" series={sales} format={brlFull} formatAxis={brl} height={220} legend={false} tooltip={{ defaultIndex: 1 }} />
          </ChartDemo>
          <ChartDemo title="Indicador em linha" description="Barra vertical da cor da série" code={`<BarChart tooltip={{ indicator: "line" }} … />`}>
            <BarChart label="Vendas por canal" stacked data={d.sales6} index="mes" series={sales} format={brlFull} formatAxis={brl} height={220} legend={false} tooltip={{ indicator: "line", defaultIndex: 1 }} />
          </ChartDemo>
          <ChartDemo title="Indicador tracejado" description="Bom para comparação/meta" code={`<LineChart tooltip={{ indicator: "dashed" }} … />`}>
            <LineChart label="Vendas por canal" data={d.sales6} index="mes" series={sales} format={brlFull} formatAxis={brl} height={220} legend={false} tooltip={{ indicator: "dashed", defaultIndex: 2 }} />
          </ChartDemo>
          <ChartDemo title="Sem indicador" description="Só nomes e valores" code={`<BarChart tooltip={{ hideIndicator: true }} … />`}>
            <BarChart label="Vendas por canal" stacked data={d.sales6} index="mes" series={sales} format={brlFull} formatAxis={brl} height={220} legend={false} tooltip={{ hideIndicator: true, defaultIndex: 3 }} />
          </ChartDemo>
          <ChartDemo title="Sem título" description="Quando o X já é óbvio" code={`<BarChart tooltip={{ hideLabel: true }} … />`}>
            <BarChart label="Vendas por canal" stacked data={d.sales6} index="mes" series={sales} format={brlFull} formatAxis={brl} height={220} legend={false} tooltip={{ hideLabel: true, defaultIndex: 4 }} />
          </ChartDemo>
          <ChartDemo title="Título personalizado" description="labelFormatter: mês por extenso" code={`<BarChart tooltip={{ labelFormatter: (mes) => \`\${extenso[mes]} de 2026\` }} … />`}>
            <BarChart
              label="Vendas por canal"
              stacked
              data={d.sales6}
              index="mes"
              series={sales}
              format={brlFull}
              formatAxis={brl}
              height={220}
              legend={false}
              tooltip={{ defaultIndex: 2, labelFormatter: (m) => `${{ jan: "Janeiro", fev: "Fevereiro", mar: "Março", abr: "Abril", mai: "Maio", jun: "Junho" }[m] ?? m} de 2026` }}
            />
          </ChartDemo>
          <ChartDemo title="Formatação de valor" description="valueFormatter com unidade e participação" code={`<BarChart tooltip={{ valueFormatter: (v, key, linha) => \`\${brl(v)} · \${pct(v / total(linha))}\` }} … />`}>
            <BarChart
              label="Vendas por canal"
              stacked
              data={d.sales6}
              index="mes"
              series={sales}
              format={brlFull}
              formatAxis={brl}
              height={220}
              legend={false}
              tooltip={{
                defaultIndex: 1,
                valueFormatter: (v, _k, row) => `${brl(v)} · ${Math.round((v / (Number(row.online) + Number(row.loja))) * 100)} %`,
              }}
            />
          </ChartDemo>
          <ChartDemo title="Com ícones" description="Ícones vêm da ChartConfig" code={`<ChartContainer config={{ online: { label: "Online", icon: Globe }, loja: { label: "Loja física", icon: Store } }}>
  <BarChart stacked … />
</ChartContainer>`}>
            <ChartContainer config={config}>
              <BarChart label="Vendas por canal" stacked data={d.sales6} index="mes" format={brlFull} formatAxis={brl} height={220} legend={false} tooltip={{ defaultIndex: 3 }} />
            </ChartContainer>
          </ChartDemo>
          <ChartDemo title="Com total" description="Soma das séries no rodapé do tooltip" code={`<BarChart tooltip={{ showTotal: true }} … />`}>
            <BarChart label="Vendas por canal" stacked data={d.sales6} index="mes" series={sales} format={brlFull} formatAxis={brl} height={220} legend={false} tooltip={{ showTotal: true, defaultIndex: 1 }} />
          </ChartDemo>
          <ChartDemo title="Avulso" description="ChartTooltipContent no seu próprio gráfico" code={`<ChartTooltipContent
  label="Setembro"
  indicator="line"
  items={[{ label: "Online", value: "R$ 214 mil", color: "var(--ds-chart-1)" }, …]}
  total={{ label: "Total", value: "R$ 354 mil" }}
/>`}>
            <div className="flex justify-center py-8">
              <ChartTooltipContent
                label="Setembro"
                indicator="line"
                items={[
                  { label: "Online", value: "R$ 214 mil", color: "var(--ds-chart-1)" },
                  { label: "Loja física", value: "R$ 140 mil", color: "var(--ds-chart-2)" },
                ]}
                total={{ label: "Total", value: "R$ 354 mil" }}
              />
            </div>
          </ChartDemo>
        </ChartGrid>
      </DocSection>
      <DocSection title="Props (tooltip)">
        <PropsTable
          rows={[
            ["indicator", '"dot" | "line" | "dashed"', '"dot"', "Marcador da série."],
            ["hideLabel · hideIndicator", "boolean", "false", "Esconde título / marcador."],
            ["labelFormatter", "(rótulo, linha) => ReactNode", "—", "Título personalizado."],
            ["valueFormatter", "(valor, chave, linha) => ReactNode", "format", "Valor personalizado."],
            ["showTotal", "boolean | string", "false", "Linha de total (ou rótulo próprio)."],
            ["defaultIndex", "number", "—", "Abre com o tooltip visível nesse ponto."],
            ["tooltip={false}", "—", "—", "Desliga o tooltip (sparklines, miniaturas)."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Tooltip com o mesmo formato do eixo e da tabela (R$, %, datas pt-BR).", dont: "Valor cru (1234567.8) no tooltip." }, { do: "Total no tooltip de empilhados.", dont: "Obrigar a pessoa a somar as partes de cabeça." }]} />
      </DocSection>
    </DocPage>
  );
}
