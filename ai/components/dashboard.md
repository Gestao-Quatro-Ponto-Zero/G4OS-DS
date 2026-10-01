# dashboard

Arquivo: `src/components/dashboard.tsx` · importe de `@g4ai/ds`.

Dashboard: KpiCard, KpiGrid, Delta, ChartCard, GoalMeter, ActivityFeed, Leaderboard, CompareStat.

## ActivityFeed

Feed de atividade recente (quem fez o quê em quê, quando).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `ActivityItem[]` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-atividade`):

```tsx
<ActivityFeed items={[
  { id: "1", actor: { name: "Ana Lopes", initials: "AL" }, action: "moveu para", target: "Negociação", time: "Hoje, 09:14" },
  { id: "2", actor: { name: "Ana Lopes", initials: "AL" }, action: "registrou uma ligação com", target: "Renata Farias",
    time: "Ontem, 16:40 · 22 min", icon: <Phone />, quote: "Jurídico pediu SLA de 99,9 %…" },
]} />
```

## ActivityItem (type)

```ts
type ActivityItem = { id: string; actor: { name: string; initials: string; tint?: string }; action: ReactNode; target?: ReactNode; time: string; quote?: ReactNode; icon?: ReactNode; }
```

## ChartCard

Moldura de gráfico. O título é a pergunta que o gráfico responde ("De onde vêm os leads?"), a descrição dá período e unidade.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `title` * | `string` |  |  |
| `action` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `flush` | `boolean \| undefined` | `false` | Gráfico encostado nas laterais (sem padding horizontal no corpo). |
| `footer` | `ReactNode` |  | Rodapé livre (com linha divisória). |
| `headerAside` | `ReactNode` |  | Substitui o lado direito do cabeçalho por uma área própria, colada às bordas (ex.: totais clicáveis por série, como no "Bar Chart – Interativo"). |
| `insight` | `ReactNode` |  | Rodapé de leitura: a conclusão do gráfico ("Subiu 5,2 % este mês"). |
| `insightDetail` | `ReactNode` |  | Segunda linha do insight (período, base). |
| `insightTrend` | `"up" \| "down" \| "flat" \| undefined` |  | Seta ao lado do insight. |
| `value` | `ReactNode` |  | Número-resumo abaixo do título (total do período). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-linhas`):

```tsx
<ChartCard title="Leads por dia" flush headerAside={<ChartCardTotals value={key} onChange={setKey} items={totais} />}>
  <LineChart label="Leads por dia" data={leads} index="dia" series={[{ key, label }]} curve="linear" height={260} />
</ChartCard>
```

## ChartCardTotals

Totais clicáveis no cabeçalho do ChartCard: cada um troca a série do gráfico (padrão "Bar Chart – Interativo").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `{ key: string; label: string; value: ReactNode; }[]` |  |  |
| `onChange` * | `(key: string) => void` |  |  |
| `value` * | `string` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-linhas`):

```tsx
<ChartCard title="Leads por dia" flush headerAside={<ChartCardTotals value={key} onChange={setKey} items={totais} />}>
  <LineChart label="Leads por dia" data={leads} index="dia" series={[{ key, label }]} curve="linear" height={260} />
</ChartCard>
```

## CompareStat

Dois números lado a lado (este mês × anterior; plano × real).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `current` * | `number` |  |  |
| `label` * | `string` |  |  |
| `previous` * | `number` |  |  |
| `currentLabel` | `string \| undefined` | `"Atual"` |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `goodWhen` | `"up" \| "down" \| undefined` | `"up"` |  |
| `previousLabel` | `string \| undefined` | `"Anterior"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-cards`):

```tsx
<CompareStat label="Novos clientes" current={71} previous={58} currentLabel="3º tri" previousLabel="2º tri" />
<CompareStat label="Custo por contratação" current={3870} previous={3580} goodWhen="down" format={brl} />
```

## Delta

Variação contra um período.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `value` * | `number` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `formatDelta` |  |
| `goodWhen` | `"neutral" \| "up" \| "down" \| undefined` | `"up"` |  |
| `variant` | `"badge" \| "text" \| undefined` | `"badge"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-kpis`):

```tsx
<Delta value={0.125} />                  // receita subiu: verde
<Delta value={0.083} goodWhen="down" />  // custo subiu: vermelho
<Delta value={-0.034} goodWhen="neutral" />
<Delta value={0.06} variant="text" />
```

## GoalMeter

Progresso até uma meta (quota de vendas, orçamento, vagas preenchidas).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `target` * | `number` |  |  |
| `value` * | `number` |  |  |
| `className` | `string \| undefined` |  |  |
| `expected` | `number \| undefined` |  | Quanto já deveria ter sido atingido até hoje (ritmo linear, por ex.). |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-cards`):

```tsx
<GoalMeter label="Time Sudeste" value={3610000} target={3300000} format={money} />
<GoalMeter label="PME" value={1460000} target={1700000} expected={1700000 * 0.8} format={money} />
<GoalMeter label="Vagas preenchidas" value={14} target={20} expected={12} />
```

## KpiCard

Indicador de topo de dashboard: rótulo, número grande, delta com período, e opcionalmente sparkline ou meta.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `value` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `delta` | `number \| undefined` |  | Fração: 0.125 = +12,5 %. |
| `footer` | `ReactNode` |  |  |
| `goodWhen` | `"neutral" \| "up" \| "down" \| undefined` | `"up"` |  |
| `hint` | `ReactNode` |  |  |
| `href` | `string \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `period` | `string \| undefined` | `"vs. mês anterior"` | Base da comparação. Sempre explícita. |
| `size` | `"md" \| "lg" \| undefined` | `"md"` |  |
| `spark` | `number[] \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-kpis`):

```tsx
<KpiCard size="lg" label="Receita fechada no trimestre" value="R$ 3,6 mi" delta={0.142} period="vs. 2º trimestre"
  footer={<span className="text-[12px] text-muted">Meta R$ 3,3 mi · 109 %</span>} />
```

## KpiGrid

Grade de KPIs: 1 coluna no celular, 2 no tablet, `cols` no desktop.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `cols` | `2 \| 3 \| 4 \| 5 \| undefined` | `4` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-como-montar`):

```tsx
<Page>
  <PageHeading title="…" description="período e fonte" actions={<SegmentedControl …/>} />
  <KpiGrid>          {/* 3–5 KPIs com delta e período */}
  <ChartCard>        {/* a pergunta principal, largura total */}
  <div className="grid gap-6 lg:grid-cols-2">   {/* ou 3/5 + 2/5 */}
    <ChartCard/> <ChartCard/>                   {/* perguntas de apoio */}
  </div>
  <DataTable />      {/* o detalhe acionável: quem, qual, quanto */}
</Page>
```

## Leaderboard

Ranking de pessoas/contas (vendedores, recrutadores, clientes).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `rows` * | `LeaderRow[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `goodWhen` | `"up" \| "down" \| undefined` | `"up"` |  |
| `showBar` | `boolean \| undefined` | `true` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-atividade`):

```tsx
<Leaderboard showBar={false} goodWhen="down" format={(n) => `${n} dias\
```

## LeaderRow (type)

```ts
type LeaderRow = { id: string; name: string; initials?: string; tint?: string; value: number; sub?: ReactNode; delta?: number; href?: string }
```
