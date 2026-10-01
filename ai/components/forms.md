# forms

Arquivo: `src/components/forms.tsx` · importe de `@g4os/ds`.

Formulário padrão: FieldBlock, FieldGrid, Select, Combobox, Checkbox, Switch, SearchInput, fieldClass.

## areaClass (const)

## Checkbox

Caixa 20px, marcada = ink.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `checked` * | `boolean` |  |  |
| `label` * | `string` |  |  |
| `onCheckedChange` * | `(checked: boolean) => void` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `indeterminate` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Combobox

Lista de entidades (pessoas, clientes, documentos) com busca sem acento.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onValueChange` * | `((value: string) => void) \| ((value: string[]) => void)` |  |  |
| `options` * | `ComboboxOption[]` |  |  |
| `value` * | `string \| string[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `id` | `string \| undefined` |  |  |
| `multiple` | `boolean \| undefined` |  |  |
| `name` | `string \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Selecione…"` |  |
| `required` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ComboboxOption (type)

```ts
type ComboboxOption = { value: string; label: string; description?: string; disabled?: boolean; }
```

## FieldBlock

Rótulo + controle + ajuda/erro.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `optional` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## fieldClass (const)

## FieldGrid

Grade de campos: 1 coluna no celular, 2 a partir de 640px.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SearchInput

Campo de busca com lupa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Buscar…"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/grade-visao-geral`):

```tsx
<DataGrid
  label="Contas"
  rows={contas}
  columns={colunas}              // { key, header, value, cell?, width, pinned, align, footer, editable… }
  rowKey={(c) => c.id}
  rowLabel={(c) => c.empresa}
  height={520}                   // rola por dentro; cabeçalho e rodapé fixos
  storageKey="contas"            // lembra larguras e colunas visíveis
  query={busca}                  // destaca o termo nas células
  toolbar={<SearchInput value={busca} onChange={setBusca} />}
  selectable
  bulkActions={(sel, { clear }) => <button onClick={() => arquivar(sel)}>Arquivar</button>}
  rowActions={(c) => [
    { label: "Ligar", icon: <Phone />, inline: true, onSelect: ligar },
    { label: "E-mail", icon: <Mail />, inline: true, onSelect: escrever },
    { label: "Arquivar", icon: <Trash2 />, tone: "danger", separator: true, onSelect: arquivar },
  ]}
  onRowOpen={(c) => router.push(`/contas/${c.id}`)}
  exportFileName="contas"
  showDensity
/>
```

## Select

Lista curta e fixa (status, prioridade, tipo).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onValueChange` * | `(value: string) => void` |  |  |
| `options` * | `SelectOption[]` |  |  |
| `value` * | `string` |  |  |
| `align` | `"start" \| "end" \| undefined` | `"start"` |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `id` | `string \| undefined` |  |  |
| `name` | `string \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Selecione…"` |  |
| `required` | `boolean \| undefined` |  |  |
| `size` | `"compact" \| "field" \| undefined` | `"field"` | field = formulário (40px); compact = linha de tabela / toolbar (32px). |
| `tone` | `"neutral" \| "ok" \| "warn" \| "bad" \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-area`):

```tsx
const [range, setRange] = useState("90");
const data = leads.slice(-Number(range));

<ChartCard
  title="Leads por origem"
  description="Últimos 3 meses"
  action={<Select size="compact" label="Período" value={range} onValueChange={setRange} options={periods} />}
>
  <AreaChart
    label="Leads por dia, orgânico e pago"
    data={data}
    index="dia"
    series={[{ key: "organico", label: "Orgânico" }, { key: "pago", label: "Pago" }]}
    stacked
    legend="interactive"        // clicar na legenda liga/desliga a série
    legendPosition="bottom"
    height={300}
  />
</ChartCard>
```

## SelectOption (type)

```ts
type SelectOption = { value: string; label: string; description?: string; disabled?: boolean; icon?: ReactNode; }
```

## Switch

Liga/desliga uma preferência com efeito imediato.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `checked` * | `boolean` |  |  |
| `label` * | `string` |  |  |
| `onCheckedChange` * | `(checked: boolean) => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `hideLabel` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.
