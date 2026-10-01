# disclosure

Arquivo: `src/components/disclosure.tsx` · importe de `@g4os/ds`.

Revelação progressiva: Accordion, Collapsible, TreeView, DescriptionToggle.

## Accordion

Seções recolhíveis. `multiple` permite várias abertas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `AccordionItem[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `defaultOpen` | `string[] \| undefined` | `[]` |  |
| `multiple` | `boolean \| undefined` | `false` |  |
| `variant` | `"card" \| "plain" \| undefined` | `"card"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/nav-revelacao`):

```tsx
<Accordion variant="plain" multiple items={…} />
```

## AccordionItem (type)

```ts
type AccordionItem = { id: string; title: ReactNode; content: ReactNode; hint?: ReactNode; disabled?: boolean }
```

## Collapsible

Uma seção opcional: "Opções avançadas", "Mostrar detalhes".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `defaultOpen` | `boolean \| undefined` | `false` |  |
| `onOpenChange` | `((open: boolean) => void) \| undefined` |  |  |
| `open` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/nav-revelacao`):

```tsx
<Collapsible label="Opções avançadas">…</Collapsible>
```

## DescriptionToggle

Texto longo recortado em `lines` linhas com "Ver mais"/"Ver menos".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `lines` | `number \| undefined` | `3` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/nav-revelacao`):

```tsx
<DescriptionToggle lines={3}>{descricao}</DescriptionToggle>
```

## TreeNode (type)

```ts
type TreeNode = { id: string; label: string; icon?: ReactNode; meta?: ReactNode; children?: TreeNode[] }
```

## TreeView

Árvore navegável (pastas, centros de custo, plano de contas, estrutura de times).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `nodes` * | `TreeNode[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `defaultExpanded` | `string[] \| undefined` | `[]` |  |
| `onSelect` | `((node: TreeNode) => void) \| undefined` |  |  |
| `selected` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/nav-revelacao`):

```tsx
<TreeView label="Plano de contas" nodes={contas} selected={sel} onSelect={(n) => setSel(n.id)} defaultExpanded={["1", "1.2"]} />
```
