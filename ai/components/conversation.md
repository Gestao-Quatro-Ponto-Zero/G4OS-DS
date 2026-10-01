# conversation

Arquivo: `src/components/conversation.tsx` · importe de `@g4ai/ds`.

Conversa (equivalentes a Bubble, Marker e Message Scroller do shadcn/ui).

## Bubble

Uma fala em balão. Use `align="end"` para quem está usando o app e `start` para as outras pessoas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `align` | `"start" \| "end" \| undefined` | `"start"` |  |
| `clamp` | `number \| undefined` |  | Limita a N linhas com "Ver mais". |
| `className` | `string \| undefined` |  |  |
| `onRetry` | `(() => void) \| undefined` |  |  |
| `position` | `BubblePosition \| undefined` | `"single"` | Definido pelo BubbleGroup; ajusta os cantos de falas seguidas. |
| `status` | `BubbleStatus \| undefined` |  | Estado de envio (só faz sentido em `align="end"`). |
| `time` | `ReactNode` |  | Hora curta exibida embaixo ("09:41"). |
| `tooltip` | `ReactNode` |  | Dica ao passar o mouse ou focar o balão (hora completa, "Editada"). |
| `variant` | `BubbleVariant \| undefined` | `"secondary"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<Bubble clamp={3}>{textoLongo}</Bubble>
```

## BubbleContent

O balão em si. Use quando precisar de controle: `render` troca o elemento (um link ou botão que abre a mensagem) mantendo o visual.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `render` | `ReactElement<{ className?: string; children?: ReactNode; }, string \| JSXElementConstructor<any>> \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<Bubble>
  <BubbleContent render={<a href="#/p/ia-conversa" />}>Abrir proposta-acme-v3.pdf</BubbleContent>
</Bubble>
```

## BubbleGroup

Falas seguidas da mesma pessoa: espaço menor entre balões, cantos encaixados, avatar e nome uma vez só.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `align` | `"start" \| "end" \| undefined` | `"start"` |  |
| `author` | `ReactNode` |  | Nome exibido acima do primeiro balão (grupo com várias pessoas). |
| `avatar` | `ReactNode` |  | Avatar ao lado do último balão. |
| `className` | `string \| undefined` |  |  |
| `variant` | `BubbleVariant \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<BubbleGroup author="Ana Lopes" avatar={<Avatar name="Ana Lopes" size="sm" />}>
  <Bubble>Bom dia.</Bubble>
  <Bubble time="09:02">Conseguiu ver a proposta?</Bubble>
</BubbleGroup>
<BubbleGroup align="end" variant="default">
  <Bubble>Vi sim.</Bubble>
  <Bubble time="09:04" status="read">Preciso da aprovação do Bruno.</Bubble>
</BubbleGroup>
```

## BubbleReaction

Uma reação: emoji + contagem.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `emoji` * | `string` |  |  |
| `label` * | `string` |  |  |
| `active` | `boolean \| undefined` |  |  |
| `count` | `number \| undefined` |  |  |
| `onToggle` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<Bubble>
  Fechamos a Acme!
  <BubbleReactions>
    <BubbleReaction emoji="👍" count={3} active onToggle={…} label="Gostei" />
  </BubbleReactions>
</Bubble>
```

## BubbleReactions

Linha de reações sobreposta à borda do balão.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `align` | `"start" \| "end" \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `side` | `"top" \| "bottom" \| undefined` | `"bottom"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<Bubble>
  Fechamos a Acme!
  <BubbleReactions>
    <BubbleReaction emoji="👍" count={3} active onToggle={…} label="Gostei" />
  </BubbleReactions>
</Bubble>
```

## BubbleStatus (type)

```ts
type BubbleStatus = "sending" | "sent" | "read" | "error"
```

## BubbleVariant (type)

```ts
type BubbleVariant = "default" | "secondary" | "muted" | "tinted" | "outline" | "ghost" | "destructive"
```

## Marker

Nota inline numa conversa: "Ana entrou na conversa", "Contexto trocado", "Pensando…" (`shimmer`), separador rotulado ("Hoje", "Novas mensagens") ou linha com borda.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `align` | `"start" \| "center" \| undefined` | `"center"` |  |
| `className` | `string \| undefined` |  |  |
| `render` | `ReactElement<{ className?: string; children?: ReactNode; }, string \| JSXElementConstructor<any>> \| undefined` |  |  |
| `shimmer` | `boolean \| undefined` | `false` | Brilho correndo no texto: algo está acontecendo agora ("Pensando…"). |
| `tone` | `MarkerTone \| undefined` | `"neutral"` |  |
| `variant` | `"default" \| "border" \| "separator" \| undefined` | `"default"` | `default` linha discreta · `border` linha com borda e fundo · `separator` texto entre traços. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<Marker variant="separator">Hoje</Marker>
<Marker tone="ok"><MarkerIcon><Check /></MarkerIcon><MarkerContent>Tarefa concluída</MarkerContent></Marker>
<Marker shimmer>Pensando…</Marker>
<Marker variant="border">Ana adicionou Bruno à conversa</Marker>
<Marker render={<a href="#…" />}>Ver 3 mensagens fixadas</Marker>
```

## MarkerContent

Texto do Marker.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<Marker variant="separator">Hoje</Marker>
<Marker tone="ok"><MarkerIcon><Check /></MarkerIcon><MarkerContent>Tarefa concluída</MarkerContent></Marker>
<Marker shimmer>Pensando…</Marker>
<Marker variant="border">Ana adicionou Bruno à conversa</Marker>
<Marker render={<a href="#…" />}>Ver 3 mensagens fixadas</Marker>
```

## MarkerIcon

Ícone decorativo do Marker (escondido do leitor de tela).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<Marker variant="separator">Hoje</Marker>
<Marker tone="ok"><MarkerIcon><Check /></MarkerIcon><MarkerContent>Tarefa concluída</MarkerContent></Marker>
<Marker shimmer>Pensando…</Marker>
<Marker variant="border">Ana adicionou Bruno à conversa</Marker>
<Marker render={<a href="#…" />}>Ver 3 mensagens fixadas</Marker>
```

## MarkerTone (type)

```ts
type MarkerTone = "neutral" | "ok" | "warn" | "bad" | "info"
```

## MessageScroller

Moldura da conversa: posiciona o botão "Ir para o fim" sobre a rolagem.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<MessageScrollerProvider scrollPreviousItemPeek={24}>
  <MessageScroller label="Conversa com o assistente">
    <MessageScrollerViewport>
      <MessageScrollerContent>
        {msgs.map((m) => (
          <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.role === "user"}>…</MessageScrollerItem>
        ))}
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>
```

## MessageScrollerButton

Botão flutuante "Ir para o fim": aparece quando a pessoa sobe para ler e mostra quantas mensagens chegaram enquanto isso.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `direction` | `"start" \| "end" \| undefined` | `"end"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<MessageScrollerProvider scrollPreviousItemPeek={24}>
  <MessageScroller label="Conversa com o assistente">
    <MessageScrollerViewport>
      <MessageScrollerContent>
        {msgs.map((m) => (
          <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.role === "user"}>…</MessageScrollerItem>
        ))}
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>
```

## MessageScrollerContent

Lista das mensagens. Acompanha o fim, ancora turnos novos e compensa a rolagem quando itens entram no topo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<MessageScrollerProvider scrollPreviousItemPeek={24}>
  <MessageScroller label="Conversa com o assistente">
    <MessageScrollerViewport>
      <MessageScrollerContent>
        {msgs.map((m) => (
          <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.role === "user"}>…</MessageScrollerItem>
        ))}
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>
```

## MessageScrollerItem

Uma linha da conversa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `messageId` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `scrollAnchor` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<MessageScrollerProvider scrollPreviousItemPeek={24}>
  <MessageScroller label="Conversa com o assistente">
    <MessageScrollerViewport>
      <MessageScrollerContent>
        {msgs.map((m) => (
          <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.role === "user"}>…</MessageScrollerItem>
        ))}
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>
```

## MessageScrollerProvider

Estado compartilhado da rolagem de uma conversa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `anchorNewTurns` | `boolean \| undefined` | `true` | Turno novo marcado com `scrollAnchor` sobe para o topo e a resposta cresce embaixo dele. |
| `autoScroll` | `boolean \| undefined` | `true` | Acompanha o fim enquanto a pessoa está nele (resposta em streaming). |
| `defaultScrollPosition` | `"start" \| "end" \| "last-anchor" \| undefined` | `"end"` | Onde abre: no fim (padrão), no começo ou no último turno marcado. |
| `scrollPreviousItemPeek` | `number \| undefined` | `0` | Ao ancorar um turno no topo, deixa N px do item anterior à vista (contexto). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<MessageScrollerProvider anchorNewTurns={false}>…</MessageScrollerProvider>
```

## MessageScrollerViewport

Área que rola. `preserveScrollOnPrepend` mantém a mensagem que a pessoa está lendo no lugar quando mensagens antigas entram no topo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `onReachStart` | `(() => void) \| undefined` |  | Chegou ao topo: carregue o histórico anterior. |
| `preserveScrollOnPrepend` | `boolean \| undefined` | `true` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<MessageScrollerViewport onReachStart={carregarAnteriores}>…</MessageScrollerViewport>
```

## useMessageScroller (hook)

Ações de rolagem: `scrollToMessage(id)`, `scrollToEnd()`, `scrollToStart()` e o estado (`atEnd`, `unread`).

```ts
useMessageScroller(): { scrollToMessage: (id: string, opts?: { align?: ScrollAlign; behavior?: ScrollBehavior; }) => void; scroll…
```

Exemplo (showcase `#/p/ia-conversa`):

```tsx
const { currentAnchorId } = useMessageScrollerVisibility();
const { scrollToMessage, scrollToEnd } = useMessageScroller();
const { start, end } = useMessageScrollerScrollable();
```

## useMessageScrollerScrollable (hook)

Se ainda dá para rolar para o começo (`start`) ou para o fim (`end`).

```ts
useMessageScrollerScrollable(): { start: boolean; end: boolean; }
```

Exemplo (showcase `#/p/ia-conversa`):

```tsx
const { currentAnchorId } = useMessageScrollerVisibility();
const { scrollToMessage, scrollToEnd } = useMessageScroller();
const { start, end } = useMessageScrollerScrollable();
```

## useMessageScrollerVisibility (hook)

O que está à vista: ids visíveis e o turno atual (último `scrollAnchor` que passou do topo).

```ts
useMessageScrollerVisibility(): { currentAnchorId: string | null; visibleMessageIds: string[]; }
```

Exemplo (showcase `#/p/ia-conversa`):

```tsx
const { currentAnchorId } = useMessageScrollerVisibility();
const { scrollToMessage, scrollToEnd } = useMessageScroller();
const { start, end } = useMessageScrollerScrollable();
```
