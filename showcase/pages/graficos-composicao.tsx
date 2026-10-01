import { BarList, DonutChart, ProgressRing, ProportionBar, Treemap, formatCurrency } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import * as d from "./_chart-data";

export const meta: PageMeta = { title: "Composição e ranking", group: "Gráficos", order: 22, description: "DonutChart, ProportionBar, Treemap, BarList e ProgressRing." };
const brl = (n: number) => formatCurrency(n, { compact: true });

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Gráficos" description={meta.description}>
      <DocSection title="DonutChart" rule="2–6 partes. O centro mostra o total ou a fatia sob o cursor; a legenda traz valor e %.">
        <Demo code={`<DonutChart label="Mix de receita" items={[{ label: "Assinaturas", value: 612000 }, …]} format={(n) => formatCurrency(n, { compact: true })} />`}>
          <DonutChart items={d.mix} label="Mix de receita" format={brl} />
        </Demo>
        <PropsTable
          rows={[
            ["items", "{ label, value, color? }[]", "—", "Partes. Mais de 6 → BarList."],
            ["label", "string", "—", "Resumo acessível."],
            ["centerLabel", "string", '"Total"', "Texto acima do total."],
            ["size · thickness", "number", "168 · 18", "Diâmetro e espessura."],
            ["legend", "boolean", "true", "Lista lateral com valor e %."],
          ]}
        />
      </DocSection>
      <DocSection title="ProportionBar" rule="Uma linha de 100 %. Ótima no topo de listas (status de faturas, etapas).">
        <Demo className="block" code={`<ProportionBar items={[{ label: "Pagas", value: 188, color: "var(--ds-ok)" }, …]} />`}>
          <ProportionBar
            items={[
              { label: "Pagas", value: 188, color: "var(--ds-ok)" },
              { label: "A vencer", value: 84, color: "var(--ds-ink)" },
              { label: "Vencidas", value: 31, color: "var(--ds-rose)" },
              { label: "Em disputa", value: 9, color: "var(--ds-amber)" },
            ]}
          />
        </Demo>
      </DocSection>
      <DocSection title="Treemap" rule="Muitas partes ou hierarquia. Tons de ink por padrão (sóbrio); colorful para categorias que já têm cor.">
        <Demo bare code={`<Treemap items={estoquePorCategoria} format={(n) => formatCurrency(n, { compact: true })} />`}>
          <div className="rounded-xl border border-line bg-surface p-5">
            <Treemap items={d.stock} format={brl} height={240} />
          </div>
        </Demo>
        <Demo bare title="colorful">
          <div className="rounded-xl border border-line bg-surface p-5">
            <Treemap items={d.mix} format={brl} height={200} colorful />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="BarList" rule="Ranking horizontal. Ordena sozinho, mostra participação com showShare, aceita href por item.">
        <Demo className="block" code={`<BarList items={[{ label: "Google orgânico", value: 2140, href: "/leads?origem=google" }, …]} showShare />`}>
          <BarList items={d.sources} showShare />
        </Demo>
      </DocSection>
      <DocSection title="ProgressRing" rule="Progresso compacto em linha de tabela ou card pequeno.">
        <Demo code={`<ProgressRing value={74} label="Meta atingida" tone="ok" />`}>
          <ProgressRing value={32} label="Onboarding" />
          <ProgressRing value={74} label="Recebido" tone="ok" />
          <ProgressRing value={91} label="Capacidade" tone="warn" size={56} />
          <ProgressRing value={100} label="Concluído" tone="accent" size={72} thickness={6} />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Ordene do maior para o menor; “Outros” sempre por último.", dont: "Donut com 12 fatias finas ilegíveis." }, { do: "Mostre o total em algum lugar (centro do donut, título).", dont: "Percentual sem a base (“40 % de quê?”)." }]} />
      </DocSection>
    </DocPage>
  );
}
