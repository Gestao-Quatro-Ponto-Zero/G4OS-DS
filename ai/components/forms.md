# forms

Arquivo: `src/components/forms.tsx` · importe de `@g4ai/ds`.

Formulário padrão: FieldBlock, FieldGrid, Select, Combobox, Checkbox, Switch, SearchInput, fieldClass.

## areaClass (const)

## Checkbox

Caixa 20px, marcada = primária.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `checked` * | `boolean` |  |  |
| `label` * | `string` |  |  |
| `onCheckedChange` * | `(checked: boolean) => void` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  | Na caixa quando `hideLabel`; no rótulo (linha inteira) quando visível. |
| `description` | `ReactNode` |  | Linha de apoio abaixo do rótulo. |
| `disabled` | `boolean \| undefined` |  |  |
| `hideLabel` | `boolean \| undefined` |  | Só a caixa, com `label` como nome acessível. |
| `id` | `string \| undefined` |  |  |
| `indeterminate` | `boolean \| undefined` |  |  |
| `name` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ `<Checkbox label="Aceito os termos" checked={v} onCheckedChange={setV} />`: o `label` aparece ao lado. Em célula de tabela: `hideLabel` (ou `selectionColumn`).

**Evite**

- ✗ `<Checkbox label={x}>{x}</Checkbox>` (texto repetido; regra `redundant-children`). Lista de checkboxes para escolher vários: use `CheckboxGroup`.

Exemplo (showcase `#/p/form-listas`):

```tsx
<Select label="Origem" error={tried && !origem ? "Escolha a origem." : undefined} … />
<Checkbox label="Executivo de Vendas" checked disabled />
<ToggleGroup multiple label="Dias" disabled value={dias} … />
<Button variant="ghost" disabled disabledReason="Indisponível na demonstração">Salvar cargos</Button>
```

## CheckboxGroup

Vários valores com TODAS as opções visíveis (2–8 itens, até ~12 em grade): cargos que recebem um aviso, canais de notificação, permissões.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Rótulo visível acima do campo e nome acessível. |
| `onValueChange` * | `(value: string[]) => void` |  |  |
| `options` * | `CheckboxGroupOption[]` |  |  |
| `value` * | `string[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `columns` | `1 \| 2 \| 3 \| undefined` | `1` | Colunas a partir de 640px (no celular sempre 1). |
| `disabled` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  | Erro abaixo do campo (substitui a ajuda) e borda rose. |
| `hideLabel` | `boolean \| undefined` |  | Só nome acessível, sem rótulo visível (toolbar, tabela, filtro). |
| `hint` | `ReactNode` |  | Texto de ajuda abaixo do campo. |
| `max` | `number \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  | Acrescenta "(opcional)" ao rótulo. |
| `selectAll` | `string \| boolean \| undefined` |  | Caixa "Selecionar todos" (tri-estado) acima das opções. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ Escolher vários de até ~12 itens, todos visíveis: `<CheckboxGroup label="Cargos que recebem o pedido" options={cargos.map((c) => ({ value: c, label: c }))} value={sel} onValueChange={setSel} columns={2} selectAll />`. Item indisponível: `disabledReason` na opção.

**Evite**

- ✗ `map` de `Checkbox` com estado em `Set` montado à mão.

Exemplo (showcase `#/p/form-listas`):

```tsx
<CheckboxGroup
  label="Cargos que recebem o pedido"
  hint="Gestores informam o forecast de toda a hierarquia."
  columns={2}
  selectAll
  options={[
    { value: "exec", label: "Executivo de Vendas" },
    { value: "coord", label: "Coordenador Comercial", description: "Informa a hierarquia" },
    { value: "cs", label: "Customer Success", disabledReason: "Sem pessoas ativas" },
  ]}
  value={cargos}
  onValueChange={setCargos}
/>
```

## CheckboxGroupOption (type)

```ts
type CheckboxGroupOption = { value: string; label: string; description?: ReactNode; disabled?: boolean; disabledReason?: string; }
```

## Combobox

Lista de entidades (pessoas, clientes, documentos) com busca sem acento.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Rótulo visível acima do campo e nome acessível. |
| `onValueChange` * | `((value: string) => void) \| ((value: string[]) => void)` |  |  |
| `options` * | `ComboboxOption[]` |  |  |
| `value` * | `string \| string[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  | Erro abaixo do campo (substitui a ajuda) e borda rose. |
| `hideLabel` | `boolean \| undefined` |  | Só nome acessível, sem rótulo visível (toolbar, tabela, filtro). |
| `hint` | `ReactNode` |  | Texto de ajuda abaixo do campo. |
| `id` | `string \| undefined` |  |  |
| `multiple` | `boolean \| undefined` |  |  |
| `name` | `string \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  | Acrescenta "(opcional)" ao rótulo. |
| `placeholder` | `string \| undefined` | `"Selecione…"` |  |
| `presentation` | `PopupPresentation \| undefined` | `"auto"` | auto = no celular o popup ocupa a largura toda; popover = sempre ancorado. |
| `required` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-listas`):

```tsx
<Select label="Status" options={…} value={status} onValueChange={setStatus} />
<Combobox label="Vendedor" options={pessoas} value={pessoa} onValueChange={setPessoa} placeholder="Selecione um vendedor" />
<FieldBlock label="Data" hint="Vazio = hoje.">
  <DatePicker label="Data" value={date} onValueChange={setDate} placeholder="Hoje (padrão)" clearable />
</FieldBlock>
<Select size="compact" label="Fase" … />   // toolbar: rótulo só acessível
```

## ComboboxOption (type)

```ts
type ComboboxOption = { value: string; label: string; description?: string; disabled?: boolean; }
```

## ControlLabelProps (type)

Props de rótulo comuns a Select, Combobox, MultiSelect, NativeSelect, DatePicker.

```ts
type ControlLabelProps = { label: string; hideLabel?: boolean; hint?: ReactNode; error?: ReactNode; optional?: boolean; }
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

**Uso certo**

- ✓ Para controles sem rótulo próprio (grupo de botões, controle custom). `Select`, `Combobox`, `MultiSelect` e `DatePicker` dentro dele não repetem o rótulo.

**Evite**

- ✗ Em volta de `TextField`/`NumberField`/`CurrencyField`/`TextareaField` com o mesmo `label` (rótulo duplo; regra `field-double-label`).

Exemplo (showcase `#/p/form-listas`):

```tsx
<Select label="Status" options={…} value={status} onValueChange={setStatus} />
<Combobox label="Vendedor" options={pessoas} value={pessoa} onValueChange={setPessoa} placeholder="Selecione um vendedor" />
<FieldBlock label="Data" hint="Vazio = hoje.">
  <DatePicker label="Data" value={date} onValueChange={setDate} placeholder="Hoje (padrão)" clearable />
</FieldBlock>
<Select size="compact" label="Fase" … />   // toolbar: rótulo só acessível
```

## fieldClass (const)

## FieldGrid

Grade de campos: 1 coluna no celular, 2 a partir de 640px.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## fullWidthPositionerClass (const)

## MultiSelect

Vários valores de uma lista (cargos, equipes, etiquetas) num popup com busca, caixas de seleção, grupos, "Selecionar todos" e "Limpar".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Rótulo visível acima do campo e nome acessível. |
| `onValueChange` * | `(value: string[]) => void` |  |  |
| `options` * | `MultiSelectOption[]` |  |  |
| `value` * | `string[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `display` | `"summary" \| "chips" \| undefined` | `"summary"` | summary = "Ana, Bruno" ou "5 selecionados" no gatilho; chips = chips removíveis abaixo. |
| `error` | `ReactNode` |  | Erro abaixo do campo (substitui a ajuda) e borda rose. |
| `hideLabel` | `boolean \| undefined` |  | Só nome acessível, sem rótulo visível (toolbar, tabela, filtro). |
| `hint` | `ReactNode` |  | Texto de ajuda abaixo do campo. |
| `id` | `string \| undefined` |  |  |
| `max` | `number \| undefined` |  | Limite de escolhas; as demais ficam desabilitadas ao atingir. |
| `name` | `string \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  | Acrescenta "(opcional)" ao rótulo. |
| `placeholder` | `string \| undefined` | `"Selecione…"` |  |
| `presentation` | `PopupPresentation \| undefined` | `"auto"` |  |
| `searchable` | `boolean \| undefined` |  | Busca no topo. Padrão: ligada a partir de 8 opções. |
| `selectAll` | `boolean \| undefined` | `true` | Ações "Selecionar todos" / "Limpar" no rodapé. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ Vários de uma lista longa ou com pouco espaço: `<MultiSelect label="Responsáveis" options={…} value={v} onValueChange={setV} />` (busca automática a partir de 8 opções; gatilho mostra "3 selecionados").

**Evite**

- ✗ `<select multiple>`; vários `Select`.

Exemplo (showcase `#/p/form-listas`):

```tsx
<MultiSelect label="Equipes" options={equipes /* { value, label, group?, disabledReason? } */} value={times} onValueChange={setTimes} />
<MultiSelect label="Pessoas" display="chips" max={5} options={pessoas} value={sel} onValueChange={setSel} />
```

## MultiSelectOption (type)

```ts
type MultiSelectOption = { value: string; label: string; description?: string; group?: string; disabled?: boolean; disabledReason?: string; }
```

## NativeSelect

`<select>` do sistema com a aparência do DS (equivalente ao native-select do shadcn).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Rótulo visível acima do campo e nome acessível. |
| `onValueChange` * | `(value: string) => void` |  |  |
| `options` * | `(NativeSelectOption \| { label: string; options: NativeSelectOption[]; })[]` |  |  |
| `value` * | `string` |  |  |
| `error` | `ReactNode` |  | Erro abaixo do campo (substitui a ajuda) e borda rose. |
| `hideLabel` | `boolean \| undefined` |  | Só nome acessível, sem rótulo visível (toolbar, tabela, filtro). |
| `hint` | `ReactNode` |  | Texto de ajuda abaixo do campo. |
| `optional` | `boolean \| undefined` |  | Acrescenta "(opcional)" ao rótulo. |
| `placeholder` | `string \| undefined` |  | Primeira opção vazia ("Selecione…"); o valor dela é "". |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ Seletor do sistema estilizado quando o nativo é melhor (celular, lista longa sem busca): `<NativeSelect label="Fuso" options={…} value={v} onValueChange={setV} />`.

**Evite**

- ✗ `<select>` cru com classes à mão.

Exemplo (showcase `#/p/form-listas`):

```tsx
<NativeSelect label="Pessoa" placeholder="Todas as pessoas" options={pessoas} value={pessoa} onValueChange={setPessoa} />
<NativeSelect label="Estado" options={[{ label: "Sudeste", options: [{ value: "SP", label: "São Paulo" }, …] }]} … />
```

## NativeSelectOption (type)

```ts
type NativeSelectOption = { value: string; label: string; disabled?: boolean }
```

## PopupPresentation (type)

```ts
type PopupPresentation = "auto" | "popover"
```

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
| `label` * | `string` |  | Rótulo visível acima do campo e nome acessível. |
| `onValueChange` * | `(value: string) => void` |  |  |
| `options` * | `SelectOption[]` |  |  |
| `value` * | `string` |  |  |
| `align` | `"start" \| "end" \| undefined` | `"start"` |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  | Erro abaixo do campo (substitui a ajuda) e borda rose. |
| `hideLabel` | `boolean \| undefined` |  | Só nome acessível, sem rótulo visível (toolbar, tabela, filtro). |
| `hint` | `ReactNode` |  | Texto de ajuda abaixo do campo. |
| `id` | `string \| undefined` |  |  |
| `name` | `string \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  | Acrescenta "(opcional)" ao rótulo. |
| `placeholder` | `string \| undefined` | `"Selecione…"` |  |
| `presentation` | `PopupPresentation \| undefined` | `"auto"` | auto = folha inferior no celular; popover = sempre ancorado ao campo. |
| `required` | `boolean \| undefined` |  |  |
| `size` | `"compact" \| "field" \| undefined` | `"field"` | field = formulário (40px, rótulo visível); compact = linha de tabela / toolbar (32px, rótulo só acessível). |
| `tone` | `"neutral" \| "ok" \| "warn" \| "bad" \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ 1 opção de até ~7: `<Select label="Situação" options={…} value={v} onValueChange={setV} />` (o `label` é visível; em toolbar use `size="compact"`).

**Evite**

- ✗ `<select>` cru; `Select` dentro de célula de tabela (regra `select-per-row`: use selo + `Menu`).

Exemplo (showcase `#/p/form-listas`):

```tsx
<Select presentation="auto" … />      // padrão: folha inferior < 640px
<DatePicker presentation="popover" … /> // sempre ancorado
```

## SelectOption (type)

```ts
type SelectOption = { value: string; label: string; description?: string; disabled?: boolean; icon?: ReactNode; }
```

## sheetBackdropClass (const)

## sheetPositionerClass (const)

## Switch

Liga/desliga uma preferência com efeito imediato.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `checked` * | `boolean` |  |  |
| `label` * | `string` |  |  |
| `onCheckedChange` * | `(checked: boolean) => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `hideLabel` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<ItemGroup label="Integrações">
  <Item>
    <ItemMedia variant="icon"><Plug /></ItemMedia>
    <ItemContent>
      <ItemTitle>Slack</ItemTitle>
      <ItemDescription>Avisos de negócio ganho e tarefas vencendo no canal do time.</ItemDescription>
    </ItemContent>
    <ItemActions><Switch label="Ativar Slack" hideLabel checked={slack} onCheckedChange={setSlack} /></ItemActions>
  </Item>
</ItemGroup>

<Item variant="outline" href="/contratos/123">…</Item>
```

## useControlLabel (hook)

Liga um controle ao rótulo: dentro de FieldBlock usa o contexto; fora, desenha rótulo/ajuda/erro (a menos que `hideLabel`).

```ts
useControlLabel(props): { id: string; describedBy: string | undefined; invalid: boolean; wrap: (control: ReactNode) => string | num…
```

## useFieldContext (hook)

Dentro de um FieldBlock?

```ts
useFieldContext(): FieldContextValue | null
```
