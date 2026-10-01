# ai

Arquivo: `src/components/ai.tsx` · importe de `@g4os/ds`.

Padrões de IA: AskAI, mensagens de chat, SystemMessage, AgentTrace, ToolCallsSection, citações, sugestões.

## AgentTrace

Linha do tempo em cascata de uma execução de agente: cada passo (pensar, ferramenta, busca, subagente) com barra proporcional ao tempo, tokens e status.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `steps` * | `TraceStep[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Execução do agente"` |  |
| `onSelect` | `((step: TraceStep) => void) \| undefined` |  |  |
| `replay` | `boolean \| undefined` | `true` |  |
| `selectedId` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-workspace`):

```tsx
<RunSummary status="done" durationMs={40200} steps={9} tools={5} tokens={48210} cost="R$ 0,62">
  <AgentTrace steps={steps} replay={false} />
</RunSummary>
<RunSummary status="running" startedAt={Date.now()} />
<RunSummary status="error" durationMs={8100} />
```

## AiBadge

Marca "gerado por IA".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"IA"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-assistente`):

```tsx
<AiBadge /> <ThinkingIndicator startedAt={Date.now()} /> <AskAILauncher onClick={abrir} />
```

## AiMark

Marca do assistente (avatar redondo com brilho).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `size` | `number \| undefined` | `28` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## AiSource (type)

```ts
type AiSource = { id: string; title: string; href?: string; kind?: "web" | "doc" | "record" | "data"; domain?: string; snippet?: ReactNode }
```

## AskAILauncher

Botão flutuante que abre o assistente (canto inferior direito).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onClick` * | `() => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Perguntar à IA"` |  |
| `open` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-assistente`):

```tsx
<AiBadge /> <ThinkingIndicator startedAt={Date.now()} /> <AskAILauncher onClick={abrir} />
```

## AskAIPanel

Painel do assistente: cabeçalho com contexto, conversa (ou sugestões no estado vazio) e composer.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `composer` * | `ReactNode` |  |  |
| `children` | `ReactNode` |  | Mensagens (ChatMessage…). |
| `className` | `string \| undefined` |  |  |
| `context` | `ReactNode` |  | Chip de contexto: sobre o que a IA está olhando ("Negócio: Grupo Aurora"). |
| `empty` | `ReactNode` |  | Estado vazio (saudação + PromptSuggestions). |
| `footer` | `ReactNode` |  |  |
| `onClose` | `(() => void) \| undefined` |  |  |
| `title` | `string \| undefined` | `"Assistente"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-assistente`):

```tsx
<AskAIPanel
  title="Assistente de vendas"
  context="Negócio: Grupo Aurora · Licenças anuais"
  onClose={fechar}
  empty={<PromptSuggestions items={sugestoes} onSelect={(s) => enviar(s.label)} />}
  composer={<ChatComposer value={v} onChange={setV} onSubmit={enviar} busy={respondendo} onStop={parar} />}
>
  {mensagens.map((m) => <ChatMessage key={m.id} {...m} />)}
</AskAIPanel>
```

## ChatComposer

Campo de pergunta. Enter envia, Shift+Enter quebra linha.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string) => void` |  |  |
| `onSubmit` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `attachments` | `ComposerAttachment[] \| undefined` |  |  |
| `autoFocus` | `boolean \| undefined` |  |  |
| `busy` | `boolean \| undefined` | `false` |  |
| `chips` | `ReactNode` |  | Chips à esquerda do rodapé: modelo, fontes, contexto. |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `hint` | `ReactNode` | `"Enter envia · Shift+Enter quebra linha"` |  |
| `onAttach` | `(() => void) \| undefined` |  |  |
| `onRemoveAttachment` | `((id: string) => void) \| undefined` |  |  |
| `onStop` | `(() => void) \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Pergunte qualquer coisa…"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-assistente`):

```tsx
<ChatComposer
  value={v} onChange={setV} onSubmit={enviar}
  busy={respondendo} onStop={parar}
  onAttach={anexar} attachments={anexos} onRemoveAttachment={remover}
  chips={<><ComposerChip icon={<Sparkles />} onClick={trocarModelo}>G4 Pro</ComposerChip><ComposerChip icon={<Database />}>CRM + Arquivos</ComposerChip></>}
/>
```

## ChatMessage

Uma fala. Usuário: balão gelo à direita.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `role` * | `ChatRole` |  |  |
| `author` | `{ name: string; initials?: string; } \| undefined` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `content` | `ReactNode` |  |  |
| `copyText` | `string \| undefined` |  | Texto copiado pelo botão Copiar (padrão: content se for string). |
| `onFeedback` | `((value: "up" \| "down") => void) \| undefined` |  |  |
| `onRetry` | `(() => void) \| undefined` |  |  |
| `streaming` | `boolean \| undefined` | `false` |  |
| `time` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-assistente`):

```tsx
<ChatMessage role="assistant" streaming={!pronto} content={texto} onRetry={refazer} onFeedback={avaliar}>\n  <ToolCallsSection calls={chamadas} />\n  <SourceList sources={fontes} compact />\n</ChatMessage>
```

## ChatRole (type)

```ts
type ChatRole = "user" | "assistant"
```

## ChatThread

Coluna de mensagens com rolagem própria que acompanha o fim enquanto o usuário está no fim (não “puxa” se ele subiu para ler).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `follow` | `unknown` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## CitationChip

Número de citação dentro do texto: “… 18 % [2]”.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `index` * | `number` |  |  |
| `onClick` | `(() => void) \| undefined` |  |  |
| `source` | `AiSource \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-avisos`):

```tsx
<p>… proposta de R$ 460,8 mil <CitationChip index={1} source={fontes[0]} /></p>\n<SourceList sources={fontes} />
```

## ComposerAttachment (type)

```ts
type ComposerAttachment = { id: string; name: string; size?: string }
```

## ComposerChip

Chip do rodapé do composer (modelo, fonte, contexto).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `active` | `boolean \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `onClick` | `(() => void) \| undefined` |  |  |
| `onRemove` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-assistente`):

```tsx
<ChatComposer
  value={v} onChange={setV} onSubmit={enviar}
  busy={respondendo} onStop={parar}
  onAttach={anexar} attachments={anexos} onRemoveAttachment={remover}
  chips={<><ComposerChip icon={<Sparkles />} onClick={trocarModelo}>G4 Pro</ComposerChip><ComposerChip icon={<Database />}>CRM + Arquivos</ComposerChip></>}
/>
```

## formatCountdown (function)

75 → "01:15"

```ts
formatCountdown(s): string
```

## formatDuration (function)

Duração legível: 820 ms, 3,4 s, 1 min 12 s.

```ts
formatDuration(ms): string
```

## JsonView

JSON legível com realce mínimo (chave, string, número).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `value` * | `unknown` |  |  |
| `className` | `string \| undefined` |  |  |
| `maxHeight` | `number \| undefined` | `240` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-agente`):

```tsx
<JsonView value={{ id: "NEG-2291", valor: 460800, ativo: true }} />
```

## PromptSuggestion (type)

```ts
type PromptSuggestion = { id: string; label: string; description?: string; icon?: ReactNode; prompt?: string }
```

## PromptSuggestions

Sugestões de pergunta para o estado vazio do assistente.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `PromptSuggestion[]` |  |  |
| `onSelect` * | `(item: PromptSuggestion) => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `columns` | `1 \| 2 \| undefined` | `2` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-assistente`):

```tsx
<AskAIPanel
  title="Assistente de vendas"
  context="Negócio: Grupo Aurora · Licenças anuais"
  onClose={fechar}
  empty={<PromptSuggestions items={sugestoes} onSelect={(s) => enviar(s.label)} />}
  composer={<ChatComposer value={v} onChange={setV} onSubmit={enviar} busy={respondendo} onStop={parar} />}
>
  {mensagens.map((m) => <ChatMessage key={m.id} {...m} />)}
</AskAIPanel>
```

## RateLimitNotice

Aviso inline de limite atingido (dentro do chat ou acima do composer).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `retryIn` * | `number` |  |  |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `onRetry` | `(() => void) \| undefined` |  |  |
| `title` | `string \| undefined` | `"Limite de uso atingido"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-avisos`):

```tsx
<RateLimitNotice retryIn={75} onRetry={reenviar} action={<Button size="sm" variant="ghost">Ver planos</Button>} />
```

## SourceList

Lista de fontes abaixo de uma resposta.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `sources` * | `AiSource[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `compact` | `boolean \| undefined` | `false` |  |
| `title` | `string \| undefined` | `"Fontes"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-avisos`):

```tsx
<p>… proposta de R$ 460,8 mil <CitationChip index={1} source={fontes[0]} /></p>\n<SourceList sources={fontes} />
```

## SystemMessage

Aviso do sistema dentro de uma conversa ou painel de IA (contexto trocado, ferramenta indisponível, resposta interrompida).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `onDismiss` | `(() => void) \| undefined` |  |  |
| `title` | `ReactNode` |  |  |
| `tone` | `"warn" \| "info" \| "error" \| "success" \| undefined` | `"info"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-avisos`):

```tsx
<SystemMessage tone="warn" title="ERP fora do ar" action={<Button size="sm" variant="ghost">Tentar de novo</Button>}>
  Respondi sem os dados de faturas.
</SystemMessage>
```

## ThinkingIndicator

"Pensando…" com três pontos.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Pensando"` |  |
| `startedAt` | `number \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-assistente`):

```tsx
<AiBadge /> <ThinkingIndicator startedAt={Date.now()} /> <AskAILauncher onClick={abrir} />
```

## TokenUsageMeter

Consumo de tokens/créditos no período, com aviso a partir de 80 %.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `limit` * | `number` |  |  |
| `used` * | `number` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Créditos de IA"` |  |
| `resetsIn` | `string \| undefined` |  |  |
| `unit` | `string \| undefined` | `"créditos"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ToolCall (type)

```ts
type ToolCall = { id: string; name: string; label?: string; icon?: ReactNode; status: ToolCallStatus; durationMs?: number; input?: unknown; output?: unknown; error?: string; }
```

## ToolCallCard

Uma chamada de ferramenta: nome, status, duração; entrada e saída ao expandir.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `call` * | `ToolCall` |  |  |
| `defaultOpen` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-agente`):

```tsx
<ToolCallCard call={{ id, name: "crm.buscar_negocio", label: "Buscou o negócio", status: "success", durationMs: 412, input, output }} defaultOpen />
```

## ToolCallsSection

Seção recolhível "Usou N ferramentas" com ícones empilhados.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `calls` * | `ToolCall[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `defaultOpen` | `boolean \| undefined` |  |  |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-agente`):

```tsx
<ToolCallsSection calls={chamadas} />
```

## ToolCallStatus (type)

```ts
type ToolCallStatus = "running" | "success" | "error" | "queued"
```

## TraceKind (type)

```ts
type TraceKind = "agent" | "thinking" | "tool" | "search" | "output" | "error"
```

## TraceStep (type)

```ts
type TraceStep = { id: string; kind: TraceKind; title: string; detail?: ReactNode; startMs: number; durationMs: number; tokens?: number; status?: "queued" | "running" | "done" | "error" | "skipped"; children?: TraceStep[]; }
```

## useStreamingText (hook)

Simula streaming de texto (demos e protótipos).

```ts
useStreamingText(text, props?): { text: string; done: boolean; }
```
