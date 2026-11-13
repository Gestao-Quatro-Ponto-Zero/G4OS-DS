# pivot

Arquivo: `src/components/pivot.tsx` · importe de `@g4ai/ds`.

Tabela dinâmica (pivô) para análise self-service: · PivotTable: desenha o resultado de `pivot()` (src/lib/pivot.ts) com cabeçalho e primeira coluna fixos, grupos recolhíveis, subtotais, total geral e sombreamento opciona

## PivotBuilder

Construtor de tabela dinâmica: escolha o que agrupar (Linhas, Colunas), o que calcular (Valores, com Soma/Média/Contagem/Mín./Máx./Distintos) e o recorte (Filtros).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `fields` * | `PivotBuilderField[]` |  |  |
| `records` * | `PivotRecord[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `compact` | `boolean \| undefined` | `false` |  |
| `defaultLayout` | `PivotLayout \| undefined` |  | Layout inicial quando não controlado. |
| `description` | `ReactNode` |  |  |
| `fileName` | `string \| undefined` | `"tabela-dinamica"` | Nome do arquivo de "Exportar CSV" (sem extensão). |
| `heat` | `boolean \| undefined` | `false` | Sombreamento por intensidade nas células de detalhe. |
| `label` | `string \| undefined` |  | Nome acessível da tabela. |
| `layout` | `PivotLayout \| undefined` |  | Layout controlado (use com `onLayoutChange`). |
| `maxHeight` | `string \| number \| undefined` |  | Altura máxima da tabela. |
| `onLayoutChange` | `((layout: PivotLayout) => void) \| undefined` |  |  |
| `title` | `ReactNode` |  | Título do card ("Vendas por região"). |
| `toolbar` | `ReactNode` |  | Controles extras à esquerda das ações (visões salvas, período). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/colecoes-tabela-dinamica`):

```tsx
const fields: PivotBuilderField[] = [
  { id: "regiao", label: "Região", kind: "dimension", icon: <Map />, values: ["Nordeste", "Sudeste", "Sul"] },
  { id: "canal", label: "Canal", kind: "dimension" },
  { id: "receita", label: "Receita", kind: "measure", format: "currency" },
];
const [layout, setLayout] = useState<PivotLayout>({
  rows: ["regiao"], columns: ["canal"], values: [{ field: "receita", agg: "sum" }], filters: [],
});
<PivotBuilder title="Vendas 2025" records={vendas} fields={fields}
  layout={layout} onLayoutChange={setLayout} fileName="vendas-2025" heat />
```

## PivotBuilderField (type)

Campo do construtor: o do motor + ícone lucide opcional no chip.

```ts
type PivotBuilderField = PivotField & { icon?: ReactNode }
```

## PivotBuilderProps (type)

```ts
type PivotBuilderProps = { records: PivotRecord[]; fields: PivotBuilderField[]; layout?: PivotLayout; defaultLayout?: PivotLayout; onLayoutChange?: (layout: PivotLayout) => void; title?: ReactNode; description?: ReactNode; label?: string; fileName?: string; heat?: boolean; compact?: boolean; maxHeight?: number | string; toolbar?: ReactNode; className?: string; }
```

## PivotTable

Tabela dinâmica: grupos de linha recolhíveis (chevron, ←/→), subtotais em faixa, total geral em negrito, números à direita.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Nome acessível da tabela ("Receita por região e trimestre"). |
| `result` * | `PivotResult` |  | Resultado de `pivot(records, fields, layout)`. |
| `className` | `string \| undefined` |  |  |
| `compact` | `boolean \| undefined` | `false` | Moeda e contagens abreviadas ("R$ 1,2 mi"). |
| `defaultCollapsed` | `string[] \| undefined` |  | Grupos que começam recolhidos (chaves de `PivotRowNode.key`). |
| `empty` | `ReactNode` |  | Conteúdo quando não há valores ou registros (padrão: Empty genérico). |
| `heat` | `boolean \| undefined` | `false` | Sombreia as células de detalhe pela intensidade, uma escala por valor. |
| `maxHeight` | `string \| number \| undefined` | `520` | Altura máxima do contêiner (rola dentro dele, nunca a página). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/colecoes-tabela-dinamica`):

```tsx
const result = pivot(records, fields, {
  rows: ["regiao", "uf"], columns: ["trimestre"],
  values: [{ field: "receita", agg: "sum" }], filters: [],
});
<PivotTable result={result} label="Receita por região e trimestre" heat />
```

## PivotTableProps (type)

```ts
type PivotTableProps = { result: PivotResult; label: string; heat?: boolean; maxHeight?: number | string; compact?: boolean; defaultCollapsed?: string[]; empty?: ReactNode; className?: string; }
```
