import { useState } from "react";
import { ChartCard, ChoroplethMap, RankedRegionList, brRegions, brUfs, fitViewBox, formatCompact, formatCurrency, formatDelta, formatPercent, useLinkedHighlight } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Mapa por estado",
  group: "Gráficos",
  order: 25,
  description: "ChoroplethMap pinta as 27 UFs pela intensidade de um número, em degraus, e RankedRegionList mostra o mesmo dado como lista ordenada, ligada ao mapa. Para receita, clientes ou crescimento por estado.",
};

// Receita mensal por UF (R$), dados de exemplo.
const revenue: Record<string, number> = {
  SP: 1_480_000, RJ: 520_000, MG: 430_000, PR: 310_000, RS: 280_000, SC: 240_000, DF: 190_000, GO: 120_000, BA: 110_000,
  PE: 95_000, CE: 80_000, ES: 70_000, MT: 55_000, MS: 45_000, PA: 40_000, AM: 35_000, RN: 22_000, PB: 20_000, MA: 18_000,
  AL: 15_000, PI: 14_000, SE: 12_000, RO: 10_000, TO: 9_000, AC: 3_000, AP: 2_000, RR: 2_000,
};
// Crescimento em 12 meses (fração).
const growth: Record<string, number> = {
  SP: 0.12, RJ: 0.06, MG: 0.18, PR: 0.22, RS: 0.04, SC: 0.31, DF: 0.09, GO: 0.27, BA: 0.15, PE: 0.19, CE: 0.24, ES: -0.03, MT: 0.38, MS: 0.14,
  PA: 0.11, AM: -0.08, RN: 0.05, PB: 0.21, MA: -0.12, AL: 0.02, PI: 0.16, SE: -0.05, RO: 0.07, TO: 0.42, AC: -0.2, AP: 0.5, RR: 0,
};
const brl = (n: number) => formatCurrency(n, { compact: true });
const quantile = { breaks: "quantile" } as const;
const south = brUfs.filter((u) => brRegions.Sul.includes(u.id));
const southBox = fitViewBox(south);

export default function Page() {
  const hl = useLinkedHighlight<string>();
  const [uf, setUf] = useState<string | null>("MG");
  return (
    <DocPage title={meta.title} kicker="Gráficos" description={meta.description}>
      <DocSection title="Mapa e lista ligados" rule="O mapa nunca vai sozinho: Amazonas é enorme e fatura pouco, o DF é um ponto e fatura muito. A lista ordenada ao lado conta a verdade; o mapa mostra onde.">
        <Demo
          bare
          code={`const hl = useLinkedHighlight<string>();

// SP domina: degraus por quantil (mesma quantidade de UFs por faixa)
const escala = { breaks: "quantile" } as const;
<ChoroplethMap label="Receita mensal por estado" values={receitaPorUf} scale={escala} format={brl}
  legendFormat={formatCompact} legendTitle="Receita (R$)" valueLabel="Receita" highlight={hl} />
<RankedRegionList label="Receita por estado, do maior ao menor" values={receitaPorUf} scale={escala} format={brl} highlight={hl} limit={8} />`}
        >
          <ChartCard title="Onde está a receita?" description="Receita mensal por UF · outubro de 2026" value={brl(Object.values(revenue).reduce((s, v) => s + v, 0))}>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <ChoroplethMap label="Receita mensal por estado, outubro de 2026" values={revenue} scale={quantile} format={brl} legendFormat={formatCompact} legendTitle="Receita (R$)" valueLabel="Receita" highlight={hl} />
              <RankedRegionList label="Receita por estado, do maior ao menor" values={revenue} scale={quantile} format={brl} highlight={hl} limit={8} />
            </div>
          </ChartCard>
        </Demo>
      </DocSection>

      <DocSection title="Escala divergente e zoom" rule="Crescimento, variação e saldo têm centro em zero: escala divergente (abaixo × acima), não verde × vermelho. Escolher uma UF aproxima o mapa; o botão volta ao Brasil.">
        <Demo
          bare
          code={`<ChoroplethMap
  label="Crescimento da receita em 12 meses por estado"
  values={crescimentoPorUf}
  scale={{ scheme: "diverging", steps: 6, domain: [-0.3, 0.3] }}
  format={(n) => formatDelta(n, 0)}
  valueLabel="Crescimento"
  selected={uf}
  onSelect={setUf}
  zoomTo={uf}
/>`}
        >
          <ChartCard title="Onde a receita cresce?" description="Variação contra outubro de 2025 · clique num estado para aproximar">
            <div className="mx-auto w-full max-w-[560px]">
              <ChoroplethMap
                label="Crescimento da receita em 12 meses por estado"
                values={growth}
                scale={{ scheme: "diverging", steps: 6, domain: [-0.3, 0.3] }}
                format={(n) => formatDelta(n, 0)}
                valueLabel="Crescimento"
                selected={uf}
                onSelect={setUf}
                zoomTo={uf}
              />
            </div>
          </ChartCard>
        </Demo>
      </DocSection>

      <DocSection title="Recorte, sem dado e outros mapas" rule="Sem dado é hachura com travessão, nunca o tom mais claro da escala (que significa “pouco”). Para um recorte ou outro mapa, passe regions e viewBox.">
        <Demo
          bare
          code={`// Só a região Sul; PR sem dado
const sul = brUfs.filter((u) => brRegions.Sul.includes(u.id));
<ChoroplethMap label="Penetração no Sul" regions={sul} viewBox={fitViewBox(sul)}
  values={{ PR: null, SC: 0.024, RS: 0.014 }} scale={{ tone: "info" }} format={(n) => formatPercent(n, 1)} />`}
        >
          <ChartCard title="Quanto do Sul já é cliente?" description="Empresas-alvo que são clientes · Paraná sem base de empresas">
            <div className="mx-auto w-full max-w-[360px]">
              <ChoroplethMap
                label="Penetração na região Sul"
                regions={south}
                viewBox={southBox}
                values={{ PR: null, SC: 0.024, RS: 0.014 }}
                scale={{ tone: "info", steps: 4 }}
                format={(n) => formatPercent(n, 1)}
                valueLabel="Penetração"
              />
            </div>
          </ChartCard>
        </Demo>
        <PropsTable
          rows={[
            ["label", "string", "—", "Obrigatório. Nome do mapa e legenda da tabela para leitor de tela."],
            ["values", "Record<id, number | null>", "—", "Valor por UF (ou região). Ausente ou null = sem dado (hachura)."],
            ["regions / viewBox", "MapRegion[] / string", "brUfs / brViewBox", "Contornos { id, name, path, centroid?, bbox? }. Outro país ou recorte: passe os seus."],
            ["scale", "{ steps?, domain?, scheme?, tone?, breaks? }", "5 degraus, sequencial, ink, equal", "equal = faixas iguais (quantize); quantile = mesma quantidade de UFs por faixa (um valor domina). diverging centra em zero."],
            ["legendFormat / legendTitle", "(n) => string / ReactNode", "format / valueLabel", "Limites curtos na legenda (formatCompact + “Receita (R$)”)."],
            ["format / valueLabel", "(n) => string / string", "formatNumber / “Valor”", "Valor no tooltip, na legenda, na lista e na tabela."],
            ["selected / onSelect", "string | null", "—", "UF escolhida (clique, Enter); as outras esmaecem. Esc solta."],
            ["highlight", "LinkedHighlight<string>", "—", "useLinkedHighlight compartilhado com RankedRegionList ou uma tabela."],
            ["zoomTo / onZoomOut", "string | null / () => void", "—", "Aproxima a UF (transição curta; movimento reduzido vai direto) e mostra “Voltar ao Brasil”."],
            ["legend / showLabels / height", "boolean / boolean / number", "true / true / proporção", "Legenda em degraus (hover destaca a faixa); siglas nas UFs que cabem."],
            ["RankedRegionList", "label, values, scale?, format?, highlight?, limit?, hint?", "—", "Mesma escala do mapa (quadradinho de cor), barra proporcional e posição."],
            ["choroplethScale", "(values, options) => ChoroplethScale", "—", "A escala usada pelos dois: thresholds, color(v), bin(v)."],
          ]}
        />
      </DocSection>

      <DocSection title="Teclado e acessibilidade">
        <p className="m-0 text-[13.5px] text-ink-soft">
          Tab entra no mapa numa UF só; as setas andam para a UF vizinha naquela direção, Home e End vão à primeira e à última; Enter seleciona, Esc solta. O foco desenha o contorno da UF em tinta e
          abre o tooltip. O DF e outras áreas pequenas ganham um círculo de toque sobre o centro. Cada UF tem nome e valor acessíveis, e uma tabela escondida lista todos os valores.
        </p>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mapa com lista ordenada ao lado, ligadas pelo mesmo realce.", dont: "Mapa sozinho: área grande parece importante, área pequena some." },
            { do: "Poucas regiões (até 5) ou só o ranking importa: BarList.", dont: "Mapa do Brasil para comparar as 5 grandes regiões." },
            { do: "Escala em degraus (4 a 6) com legenda; valor exato no tooltip e na lista.", dont: "Escala contínua sem números, ou cor como única pista." },
            { do: "Crescimento e saldo com escala divergente, centrada em zero.", dont: "Verde × vermelho para acima × abaixo, como se fosse bom × ruim." },
            { do: "Taxa por estado (penetração, por mil habitantes) quando o total só repete a população.", dont: "Pintar totais absolutos e chamar de desempenho." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
