# disclosure

Arquivo: `src/components/disclosure.tsx` · importe de `@g4ai/ds`.

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
| `actions` | `ReactNode` |  | Ações à direita do gatilho (fora do botão). |
| `className` | `string \| undefined` |  |  |
| `defaultOpen` | `boolean \| undefined` | `false` |  |
| `description` | `ReactNode` |  | Linha de apoio sob o rótulo (row/card). |
| `disabled` | `boolean \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `meta` | `ReactNode` |  | Texto à direita do rótulo: "3 regras", "Opcional". |
| `onOpenChange` | `((open: boolean) => void) \| undefined` |  |  |
| `open` | `boolean \| undefined` |  |  |
| `variant` | `"card" \| "inline" \| "row" \| undefined` | `"inline"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/nav-revelacao`):

```tsx
<Collapsible label="Opções avançadas">…</Collapsible>
```

## CollapsibleContent

Conteúdo componível com altura animada (respeita "reduzir movimento").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/_shadcn-extras`):

```tsx
<CollapsibleRoot>\n  <CollapsibleTrigger><Folder /> propostas</CollapsibleTrigger>\n  <CollapsibleContent>…</CollapsibleContent>\n</CollapsibleRoot>
```

## CollapsibleRoot

Raiz componível (controlada com `open`/`onOpenChange`).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `defaultOpen` | `boolean \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `onOpenChange` | `((open: boolean) => void) \| undefined` |  |  |
| `open` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/_shadcn-extras`):

```tsx
<CollapsibleRoot>\n  <CollapsibleTrigger><Folder /> propostas</CollapsibleTrigger>\n  <CollapsibleContent>…</CollapsibleContent>\n</CollapsibleRoot>
```

## CollapsibleTrigger

Gatilho componível. Sem `className`, vem com o visual de linha (chevron gira ao abrir via `group-data-panel-open:`).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `chevron` | `boolean \| undefined` | `true` |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/_shadcn-extras`):

```tsx
<CollapsibleRoot>\n  <CollapsibleTrigger><Folder /> propostas</CollapsibleTrigger>\n  <CollapsibleContent>…</CollapsibleContent>\n</CollapsibleRoot>
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
