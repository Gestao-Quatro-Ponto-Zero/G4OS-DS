# primitives

Arquivo: `src/components/primitives.tsx` · importe de `@g4ai/ds`.

Base visual: Button, IconButton, Badge, Dot, Avatar, EntityMark, Card, Metric, StatGrid, Meter, Empty, Page, Section, Kbd, DsLink/setLinkComponent, tons.

## Avatar

Pessoa. Iniciais brancas sobre a tinta da pessoa (#3f3f46 padrão, #202124 para o responsável); com `src`, a foto (as iniciais ficam de reserva se a imagem falhar).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `badge` | `ReactNode` |  | Selo no canto (ícone 10–12 px): verificado, admin, bot. |
| `className` | `string \| undefined` |  |  |
| `initials` | `string \| undefined` |  | Padrão: calculadas a partir de `name`. |
| `name` | `string \| undefined` |  |  |
| `shape` | `"circle" \| "square" \| undefined` | `"circle"` |  |
| `size` | `AvatarSize \| undefined` | `"md"` |  |
| `src` | `string \| undefined` |  | Foto. Sem ela (ou se falhar), as iniciais. |
| `status` | `AvatarStatus \| undefined` |  | Ponto de presença no canto. |
| `tint` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/base-avatar-e-teclas`):

```tsx
<Avatar name="Ana Lopes" size="xs" /> … <Avatar name="Ana Lopes" size="xl" />
```

## AvatarGroup

Até `max` avatares e um "+N" com os nomes restantes no title.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `people` * | `{ name: string; initials?: string; tint?: string; src?: string; }[]` |  |  |
| `action` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `max` | `number \| undefined` | `4` |  |
| `size` | `AvatarSize \| undefined` | `"sm"` |  |
| `stacked` | `boolean \| undefined` | `false` |  |
| `total` | `number \| undefined` |  | Total real (quando `people` é só uma amostra). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/base-avatar-e-teclas`):

```tsx
<AvatarGroup people={time} max={4} />
<AvatarGroup people={time} max={3} stacked total={18} />
<AvatarGroup people={time} max={3} stacked action={<IconButton label="Convidar pessoa" size="sm"><Plus /></IconButton>} />
```

## AvatarSize (type)

```ts
type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl"
```

## AvatarStatus (type)

```ts
type AvatarStatus = "online" | "away" | "busy" | "offline"
```

## Badge

Rótulo curto de estado.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `tone` | `Tone \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-separador-e-rolagem`):

```tsx
<ScrollArea maxHeight={280} label="Membros do time" className="rounded-xl border border-line bg-surface">
  {pessoas.map((p) => <Row key={p.nome} {...p} />)}
</ScrollArea>

<ScrollArea orientation="horizontal" label="Etapas">
  <div className="flex gap-2 p-1">{etapas.map((e) => <Badge key={e}>{e}</Badge>)}</div>
</ScrollArea>
```

## Button

Um primário por área.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `disabledReason` | `ReactNode` |  | Por que está desabilitado. |
| `href` | `string \| undefined` |  |  |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |
| `variant` | `ButtonVariant \| undefined` | `"primary"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ Bloqueado com motivo: `<Button disabled={demo} disabledReason="Demonstração: nada é gravado">Salvar</Button>` (fica legível, focável e explica).

**Evite**

- ✗ `<span className="opacity-50"><span className="pointer-events-none"><Button disabled>…` (fica invisível; regra `disabled-wrapper`). Title Case ("Criar Nova Vaga").

Exemplo (showcase `#/p/ia-avisos`):

```tsx
<RateLimitNotice retryIn={75} onRetry={reenviar} action={<Button size="sm" variant="ghost">Ver planos</Button>} />
```

## buttonClass (function)

```ts
buttonClass(props?): string
```

## ButtonVariant (type)

```ts
type ButtonVariant = "primary" | "ghost" | "danger" | "quiet" | "split-left" | "split-right"
```

## Card

Superfície branca, borda de 1px, raio 12.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `href` | `string \| undefined` |  |  |
| `onClick` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-carrossel`):

```tsx
<Carousel label="Modelos" perView={3} perViewMobile={1.15} arrows>
  {modelos.map((m) => <Card …/>)}
</Carousel>
```

## CardAction

"Abrir ↗" discreto no pé de um card clicável.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## CriticalFlag

Marcador de prioridade crítica, colado ao título.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` | `string \| undefined` | `"Crítica"` |  |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Dot

Ponto de 6px. Sempre acompanhado de texto ou `label` (vira aria-label).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` | `string \| undefined` |  |  |
| `tone` | `Tone \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## DsLink

## Empty

Estado vazio. Diga o que falta e ofereça a próxima ação.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `action` | `ReactNode` |  |  |
| `description` | `ReactNode` |  | Alias de `hint`, com o nome usado em StateView. |
| `framed` | `boolean \| undefined` | `true` | false dentro de um painel/lista que já tem borda. |
| `hint` | `ReactNode` |  | Uma frase sobre o que falta ou o que fazer. |
| `icon` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ `<Empty title="Nenhuma vaga com esses filtros" hint="Tente outro termo." action={<Button variant="ghost" onClick={limpar}>Limpar filtros</Button>} />`: texto de apoio em `hint`. Dentro de card/tabela: `framed={false}`.

**Evite**

- ✗ `description=` no `Empty` (não existe; é `hint`). Tela inteira de erro/404: use `StateView` (esse sim tem `description`).

Exemplo (showcase `#/p/data-tabela-estado`):

```tsx
<DataTable label="Faturas" rows={rows} columns={columns} rowKey={(r) => r.id}
  loading={isFetching}                       // sem linhas: esqueleto · com linhas: barra + linhas esmaecidas
  error={error && { message: error.message, onRetry: refetch }}
  rowTone={(r) => (r.status === "vencido" ? "bad" : undefined)}
  empty={<Empty framed={false} title="Nenhuma fatura emitida" action={<Button size="sm">Emitir fatura</Button>} />} />

// rodapé com total: qualquer coluna com footer
{ key: "value", header: "Valor", align: "right", cell: …, footer: formatCurrency(total) }

// lista longa numa área fixa: rola por dentro com cabeçalho e rodapé fixos
<DataTable maxHeight={420} … />
```

## EntityMark

Marca de uma entidade (cliente, empresa, produto): quadrado arredondado com a cor da entidade a 6 % de opacidade e as iniciais na cor cheia.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `name` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `initials` | `string \| undefined` |  |  |
| `logo` | `string \| undefined` |  |  |
| `tint` | `string \| undefined` | `"var(--ds-ink)"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-pipelines`):

```tsx
<RecordCard
  title="Grupo Aurora Alimentos"
  subtitle="Licenças anuais · 240 usuários"
  value={formatCurrency(460800, { cents: false })}
  leading={<EntityMark name="Grupo Aurora" tint="#842e20" className="h-7 w-7 text-[11px]" />}
  tags={<><Badge>Indicação</Badge><Badge tone="accent">Prioridade</Badge></>}
  owner={{ name: "Ana Lopes", initials: "AL" }}
  meta="12 dias na etapa"
  onOpen={() => router.push("/negocios/d1")}
  onDragStart={(e) => e.dataTransfer.setData("text/plain", "d1")}
/>
```

## FactLine

Linha de fatos de um registro: "Marco M07 · Período 12–26 set · Responsável Ana".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `facts` * | `{ label: string; value: ReactNode; }[]` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Field

Par rótulo/valor para leitura (não edição).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `string` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## FilterChip

Chip de filtro binário.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `on` * | `boolean` |  |  |
| `onClick` * | `() => void` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## IconButton

Botão quadrado só com ícone.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/_shadcn-extras`):

```tsx
<Collapsible variant="card" label="Automações" description="Regras que rodam sozinhas" meta="3 ativas" actions={<IconButton …/>}>…</Collapsible>
```

## Kbd

Tecla de atalho. `size="sm"` dentro de itens densos; `md` ao lado de texto corrido.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `size` | `"sm" \| "md" \| undefined` | `"sm"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/base-avatar-e-teclas`):

```tsx
<KbdGroup keys={["mod", "K"]} />
<KbdGroup keys={["mod", "shift", "P"]} />
<Kbd>Esc</Kbd>
<Button>Salvar <KbdGroup keys={["mod", "S"]} /></Button>
<Tooltip content="Buscar" shortcut={["mod", "K"]}>…</Tooltip>
```

## KbdGroup

Combinação de teclas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `keys` | `string[] \| undefined` |  |  |
| `label` | `string \| undefined` |  |  |
| `size` | `"sm" \| "md" \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/base-avatar-e-teclas`):

```tsx
<KbdGroup keys={["mod", "K"]} />
<KbdGroup keys={["mod", "shift", "P"]} />
<Kbd>Esc</Kbd>
<Button>Salvar <KbdGroup keys={["mod", "S"]} /></Button>
<Tooltip content="Buscar" shortcut={["mod", "K"]}>…</Tooltip>
```

## keyLabel (function)

Converte nomes de tecla ("mod", "shift", "enter") no símbolo da plataforma.

```ts
keyLabel(key, mac): string
```

## LinkedCard

Card com um destino principal (o título) e ações secundárias clicáveis.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `href` * | `string` |  |  |
| `title` * | `ReactNode` |  |  |
| `aside` | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Meter

Progresso fino (1px ou 4px).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `value` * | `number` |  |  |
| `label` | `string \| undefined` |  |  |
| `thick` | `boolean \| undefined` | `false` |  |
| `tone` | `"ok" \| "warn" \| "bad" \| "accent" \| "ink" \| undefined` | `"ink"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Metric

Indicador. O valor é o protagonista (22px, tabular).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `value` * | `ReactNode` |  |  |
| `bar` | `number \| undefined` |  | 0–100: régua de 20 segmentos abaixo do valor. |
| `hint` | `ReactNode` |  |  |
| `href` | `string \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `tone` | `"neutral" \| "ok" \| "warn" \| "bad" \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Page

Área rolável de uma tela, com margens responsivas e entrada suave.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `density` | `"comfortable" \| "compact" \| undefined` |  |  |
| `width` | `"full" \| "wide" \| "medium" \| "narrow" \| "reading" \| undefined` | `"full"` | Largura máxima do conteúdo (cabeçalho incluso). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ `<Page width="narrow">` para coluna estreita (configurações, automações, formulário longo): cabeçalho, PageToolbar e corpo no mesmo eixo. `wide` 1200 · `medium` 1024 · `narrow` 896 · `reading` 720 px.

**Evite**

- ✗ `<Page><PageHeading/><div className="mx-auto max-w-4xl">…` (título à esquerda, corpo no meio). Regra `page-width-wrapper`.

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

## Section

Seção titulada dentro de uma página de conteúdo (não é card).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `title` * | `string` |  |  |
| `action` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## setLinkComponent (function)

```ts
setLinkComponent(component): void
```

Exemplo (showcase `#/p/guia-instalacao`):

```tsx
// lib/ds.tsx
"use client";
import Link from "next/link";
import { setLinkComponent } from "@g4ai/ds";
setLinkComponent(Link);
export function DsSetup() { return null; }
```

## StatCell

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `value` * | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `tone` | `"ok" \| "warn" \| "bad" \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## StatGrid

Grade de células separadas por 1px de linha (sem gaps brancos).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `cols` | `2 \| 3 \| 4 \| undefined` | `2` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Tone (type)

Os únicos tons semânticos.

```ts
type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "accent"
```

## toneDot (const)

## toneText (const)

## useIsMac (hook)

true no macOS/iOS (para escolher ⌘ ou Ctrl).

```ts
useIsMac(): boolean
```
