# capacity

Arquivo: `src/components/capacity.tsx` · importe de `@g4ai/ds`.

Capacidade: quanto de uma cota está ocupado e por quê.

## CapacityBar

Barra de capacidade segmentada: cada categoria ocupa a fração da cota (`total`), o resto é espaço livre em gelo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Nome acessível da barra ("Uso do armazenamento"). |
| `segments` * | `CapacitySegment[]` |  |  |
| `total` * | `number` |  | Tamanho da cota (100 % da barra). |
| `className` | `string \| undefined` |  |  |
| `clearing` | `string \| null \| undefined` |  | Id da categoria sendo limpa agora: o segmento esmaece até encolher. |
| `format` | `((n: number) => string) \| undefined` | `formatStorage` |  |
| `height` | `number \| undefined` | `48` | Altura em px. |
| `highlight` | `LinkedHighlight<string> \| undefined` |  | Realce compartilhado com a legenda (`useLinkedHighlight<string>()`). |
| `othersLabel` | `string \| undefined` | `"Outros"` | Nome do grupo que junta as categorias além da 6ª. |
| `scanned` | `number \| undefined` |  | 0–1: fração já varrida. |
| `texture` | `boolean \| undefined` | `true` | Textura de pontos sutil sobre cada segmento. |
| `tooltip` | `boolean \| undefined` | `true` | Etiqueta com nome, tamanho e % sobre o segmento em foco. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-capacidade`):

```tsx
<CapacityBar label="Uso" segments={segments} total={1e12} scanned={0.45} />
```

## CapacityBreakdown

Cartão de capacidade completo: total usado (desce animado quando algo é limpo), linha de status (caminho em varredura, categoria em foco ou o resultado da limpeza), barra, legenda e uma recomendação por vez com a ação.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `segments` * | `CapacitySegment[]` |  |  |
| `total` * | `number` |  |  |
| `barHeight` | `number \| undefined` | `64` | Altura da barra em px. |
| `className` | `string \| undefined` |  |  |
| `doneLabel` | `string \| undefined` | `"Nada mais vale a pena limpar agora."` | Quando não sobra recomendação. |
| `format` | `((n: number) => string) \| undefined` | `formatStorage` |  |
| `label` | `string \| undefined` | `"Uso do armazenamento"` | Nome acessível da barra. |
| `onRescan` | `(() => void) \| undefined` |  | Mostra "Varrer de novo". |
| `scanning` | `boolean \| undefined` | `false` | Varredura em andamento (controlado). |
| `scanPath` | `ReactNode` |  | Onde a varredura está agora ("Drive › Comercial › Propostas 2026"). |
| `scanProgress` | `number \| undefined` |  | 0–1 durante a varredura (controlado). |
| `simulateScan` | `boolean \| { duration?: number; paths?: string[]; } \| undefined` |  | Demonstração: anima uma varredura ao montar e ao varrer de novo. |
| `suggestions` | `CapacitySuggestion[] \| undefined` | `[]` | Recomendações em ordem; uma aparece por vez e some depois de feita. |
| `usedLabel` | `string \| undefined` |  | Texto depois do total. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-capacidade`):

```tsx
<CapacityBreakdown
  segments={segments}
  total={1e12}
  simulateScan
  onRescan={recarregar}
  suggestions={[
    { id: "lixeira", category: "lixeira", destructive: true,
      text: "A lixeira guarda 41,2 GB de arquivos que a equipe já excluiu.",
      actionLabel: "Esvaziar lixeira",
      onAction: async () => ({ freed: await api.esvaziarLixeira() }) },
  ]}
/>
```

## CapacityLegend

Legenda da barra em grade (3 → 2 → 1 colunas pela largura do contêiner): ícone ou amostra de cor + categoria + tamanho.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `segments` * | `CapacitySegment[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `formatStorage` |  |
| `highlight` | `LinkedHighlight<string> \| undefined` |  |  |
| `othersLabel` | `string \| undefined` | `"Outros"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-capacidade`):

```tsx
const hl = useLinkedHighlight<string>();
<CapacityBar label="Armazenamento do workspace" segments={segments} total={1e12} highlight={hl} />
<CapacityLegend segments={segments} highlight={hl} />
```

## CapacitySegment (type)

Uma categoria da cota (Documentos, Gravações, Lixeira…).

```ts
type CapacitySegment = { id: string; label: string; value: number; color?: string; icon?: ReactNode; description?: ReactNode; }
```

## CapacitySuggestion (type)

Recomendação de limpeza: frase com o tamanho, verbo + objeto no botão.

```ts
type CapacitySuggestion = { id: string; tone?: "info" | "warn"; text: ReactNode; actionLabel: string; busyLabel?: string; category?: string; onAction: () => Promise<{ freed: number }>; destructive?: boolean; confirm?: { title?: string; description?: ReactNode; confirmLabel?: string }; undo?: () => void; doneMessage?: string; }
```

## formatStorage (function)

Bytes em unidade legível, base 1000 como o sistema operacional mostra: 357_800_000_000 → "357,8 GB".

```ts
formatStorage(bytes, digits?): string
```
