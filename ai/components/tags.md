# tags

Arquivo: `src/components/tags.tsx` · importe de `@g4ai/ds`.

Etiquetas coloridas (categoria, tipo, status) no estilo "banco de dados": fundo suave + texto AA, 9 matizes em tokens (--ds-tag-*-bg/-fg), claros e escuros.

## Priority (type)

```ts
type Priority = "urgente" | "alta" | "media" | "baixa" | "sem"
```

## PriorityIcon

Ícone de prioridade em barras (3 barras crescentes; urgente = quadrado com !).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `priority` * | `Priority` |  |  |
| `className` | `string \| undefined` |  |  |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/tags-e-prioridade`):

```tsx
<PriorityIcon priority="alta" />\n<PriorityPill priority="media" />
```

## priorityLabel (const)

## PriorityPill

Prioridade com ícone + rótulo (chip neutro).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `priority` * | `Priority` |  |  |
| `className` | `string \| undefined` |  |  |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/tags-e-prioridade`):

```tsx
<PriorityIcon priority="alta" />\n<PriorityPill priority="media" />
```

## StatusPill

Status de tarefa com cor fixa por estado (presets).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `status` * | `TaskStatus` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` |  |  |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |
| `variant` | `"dot" \| "soft" \| undefined` | `"soft"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/tags-e-prioridade`):

```tsx
<StatusPill status="em-andamento" />\n<StatusPill status="concluido" label="Entregue" />
```

## TagColor (type)

```ts
type TagColor = "gray" | "brown" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "red"
```

## tagColorFor (function)

Cor estável para um texto (mesma categoria = mesma cor em qualquer tela).

```ts
tagColorFor(label): TagColor
```

## tagColors (const)

## TagPill

Etiqueta. `variant="soft"` (padrão) = fundo colorido; `"dot"` = contorno neutro com bolinha colorida (melhor em listas densas e ao lado de outras etiquetas).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `color` | `TagColor \| undefined` |  | Padrão: derivada do texto (tagColorFor). |
| `icon` | `ReactNode` |  |  |
| `onRemove` | `(() => void) \| undefined` |  |  |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |
| `variant` | `"dot" \| "soft" \| undefined` | `"soft"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/tags-e-prioridade`):

```tsx
<TagPill variant="dot" color="purple">Funcionalidade</TagPill>\n<TagPill size="sm" color="green">Pago</TagPill>
```

## TaskStatus (type)

```ts
type TaskStatus = "nao-iniciado" | "em-andamento" | "em-revisao" | "concluido" | "bloqueado" | "sem-status"
```

## taskStatusLabel (const)
