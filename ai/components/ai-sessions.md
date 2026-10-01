# ai-sessions

Arquivo: `src/components/ai-sessions.tsx` · importe de `@g4os/ds`.

Interface agêntica de sessões (app de trabalho com agente: G4 OS desktop, Codex, T3).

## AgentOption (type)

```ts
type AgentOption = { id: string; name: string; initials: string; tint?: string; description?: string }
```

## AgentPicker

Avatares dos agentes que vão agir; clique escolhe o principal.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `agents` * | `AgentOption[]` |  |  |
| `onChange` * | `(id: string) => void` |  |  |
| `value` * | `string` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## AnswerCard

Resposta do agente num cartão com rodapé de ações.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `actions` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `id` | `string \| undefined` |  |  |
| `streaming` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<UserBubble>Então na prática funcionaram iguais né?</UserBubble>
<StepGroup title="Reunindo contexto" steps={[{ id, label, durationMs, status: "done" }]} />
<AnswerCard actions={<MessageActions text={plain} markdown={md} onBranch={branch} onRetry={retry} onFeedback={rate} />}>
  <p><strong>Para ler essa página, sim.</strong> A conexão <code>notion</code> …</p>
</AnswerCard>
```

## ConnectedTool (type)

```ts
type ConnectedTool = { id: string; name: string; glyph?: ReactNode; tint?: string; status?: "ok" | "error" }
```

## Disclaimer

"G4 OS usa IA e pode cometer erros." Sempre abaixo do campo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<SessionComposer value={v} onChange={setV} onSubmit={send} tools={tools} agents={agents} agent={agent} onAgentChange={setAgent} />
<Disclaimer />
```

## MessageActions

Ações de uma resposta: Copiar, Markdown, (refazer, avaliar) e ramificar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `text` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `markdown` | `string \| undefined` |  |  |
| `onBranch` | `(() => void) \| undefined` |  |  |
| `onFeedback` | `((value: "up" \| "down") => void) \| undefined` |  |  |
| `onRetry` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<UserBubble>Então na prática funcionaram iguais né?</UserBubble>
<StepGroup title="Reunindo contexto" steps={[{ id, label, durationMs, status: "done" }]} />
<AnswerCard actions={<MessageActions text={plain} markdown={md} onBranch={branch} onRetry={retry} onFeedback={rate} />}>
  <p><strong>Para ler essa página, sim.</strong> A conexão <code>notion</code> …</p>
</AnswerCard>
```

## MinimapItem (type)

```ts
type MinimapItem = { id: string; role: "user" | "assistant"; preview: string }
```

## SessionComposer

Campo de sessão no formato do app: anexo (clipe), pasta de contexto, agentes, microfone, enviar, e a linha de ferramentas conectadas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(v: string) => void` |  |  |
| `onSubmit` * | `(v: string) => void` |  |  |
| `tools` * | `ConnectedTool[]` |  |  |
| `value` * | `string` |  |  |
| `agent` | `string \| undefined` |  |  |
| `agents` | `AgentOption[] \| undefined` |  |  |
| `busy` | `boolean \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `commands` | `SlashCommand[] \| undefined` |  |  |
| `onAgentChange` | `((id: string) => void) \| undefined` |  |  |
| `onContext` | `(() => void) \| undefined` |  |  |
| `onManageTools` | `(() => void) \| undefined` |  |  |
| `onStop` | `(() => void) \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Peça ou pergunte qualquer coisa para o ` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<SessionComposer value={v} onChange={setV} onSubmit={send} tools={tools} agents={agents} agent={agent} onAgentChange={setAgent} />
<Disclaimer />
```

## SessionFile (type)

```ts
type SessionFile = { id: string; name: string; size?: number; meta?: string }
```

## SessionGroup

Grupo de sessões por data ("HOJE", "ONTEM").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `string` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SessionHeader

Título da sessão no centro com menu (renomear, mover, arquivar, exportar) e ações à direita: navegador do agente, gravar reunião, buscar, compartilhar, painel de informações.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `menu` * | `MenuEntry[]` |  |  |
| `title` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `infoOpen` | `boolean \| undefined` |  |  |
| `onBack` | `(() => void) \| undefined` |  |  |
| `onBrowser` | `(() => void) \| undefined` |  |  |
| `onInfoToggle` | `(() => void) \| undefined` |  |  |
| `onRecordToggle` | `(() => void) \| undefined` |  |  |
| `onSearch` | `(() => void) \| undefined` |  |  |
| `onShare` | `(() => void) \| undefined` |  |  |
| `recording` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SessionInfoPanel

Painel lateral da sessão: abas Informações | Navegador.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `createdBy` * | `ReactNode` |  |  |
| `mode` * | `SessionMode` |  |  |
| `name` * | `string` |  |  |
| `notes` * | `string` |  |  |
| `onModeChange` * | `(m: SessionMode) => void` |  |  |
| `onNameChange` * | `(v: string) => void` |  |  |
| `onNotesChange` * | `(v: string) => void` |  |  |
| `onTagsChange` * | `(t: string[]) => void` |  |  |
| `tags` * | `string[]` |  |  |
| `browser` | `{ url: string; title: string; content?: ReactNode; } \| undefined` |  | Página aberta pelo agente (aba Navegador). |
| `className` | `string \| undefined` |  |  |
| `files` | `SessionFile[] \| undefined` | `[]` |  |
| `onMinimize` | `(() => void) \| undefined` |  |  |
| `tagSuggestions` | `string[] \| undefined` | `[]` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SessionItem

Linha da lista de sessões: título, tempo, status e etiquetas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onSelect` * | `(id: string) => void` |  |  |
| `session` * | `SessionSummary` |  |  |
| `actions` | `MenuEntry[] \| undefined` |  | Itens do menu ⋯ (favoritar, renomear, arquivar). |
| `active` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<SessionItem session={{ id, title, time: "2m", status: "working", tags: ["Field Guide FC"] }} active onSelect={open} />
<SessionStatusChip status="ready" />   // working · ready · error
```

## SessionMode (type)

```ts
type SessionMode = "executar" | "planejar" | "perguntar"
```

## SessionSidebar

Coluna de sessões completa: título com filtro e busca, "Nova sessão", abas (recentes, favoritas, pastas, arquivadas), filtro por etiqueta, grupos por data e seletor de workspace no rodapé.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onNew` * | `() => void` |  |  |
| `onSelect` * | `(id: string) => void` |  |  |
| `sessions` * | `T[]` |  |  |
| `activeId` | `string \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `footer` | `ReactNode` |  | Rodapé (seletor de workspace). |
| `itemActions` | `((s: T) => MenuEntry[]) \| undefined` |  |  |
| `title` | `string \| undefined` | `"Sessões"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SessionStatus (type)

```ts
type SessionStatus = "idle" | "working" | "ready" | "error"
```

## SessionStatusChip

Chip de status de uma sessão.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `status` * | `SessionStatus` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<SessionItem session={{ id, title, time: "2m", status: "working", tags: ["Field Guide FC"] }} active onSelect={open} />
<SessionStatusChip status="ready" />   // working · ready · error
```

## SessionSummary (type)

```ts
type SessionSummary = { id: string; title: string; time: string; status?: SessionStatus; tags?: string[]; starred?: boolean; archived?: boolean; parentId?: string; day?: string; scheduled?: boolean; }
```

## SessionTab (type)

```ts
type SessionTab = "recentes" | "favoritas" | "pastas" | "arquivadas"
```

## StepGroup

Grupo de atividade recolhível ("Reunindo contexto").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `children` | `ReactNode` |  | Conteúdo extra quando aberto (ToolCallsSection, AgentTrace). |
| `className` | `string \| undefined` |  |  |
| `defaultOpen` | `boolean \| undefined` | `false` |  |
| `running` | `boolean \| undefined` | `false` |  |
| `steps` | `StepItem[] \| undefined` | `[]` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<UserBubble>Então na prática funcionaram iguais né?</UserBubble>
<StepGroup title="Reunindo contexto" steps={[{ id, label, durationMs, status: "done" }]} />
<AnswerCard actions={<MessageActions text={plain} markdown={md} onBranch={branch} onRetry={retry} onFeedback={rate} />}>
  <p><strong>Para ler essa página, sim.</strong> A conexão <code>notion</code> …</p>
</AnswerCard>
```

## StepItem (type)

```ts
type StepItem = { id: string; label: string; detail?: ReactNode; durationMs?: number; status?: "running" | "done" | "error"; icon?: ReactNode }
```

## ThreadMinimap

Trilho de marcas à esquerda da conversa: um traço por mensagem (curto = pessoa, longo = agente).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `MinimapItem[]` |  |  |
| `scrollRef` * | `RefObject<HTMLElement \| null>` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<ThreadMinimap items={[{ id: "msg-1", role: "user", preview: "…" }]} scrollRef={scrollerRef} />
```

## ToolsBar

"6 ferramentas conectadas" + logos sobrepostos + "+N" + gerenciar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `tools` * | `ConnectedTool[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `max` | `number \| undefined` | `5` |  |
| `onManage` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<ToolsBar tools={[{ id: "notion", name: "Notion", tint: "var(--ds-ink)" }, …]} onManage={open} />
```

## UserBubble

Mensagem da pessoa: balão suave alinhado à direita.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `id` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<UserBubble>Então na prática funcionaram iguais né?</UserBubble>
<StepGroup title="Reunindo contexto" steps={[{ id, label, durationMs, status: "done" }]} />
<AnswerCard actions={<MessageActions text={plain} markdown={md} onBranch={branch} onRetry={retry} onFeedback={rate} />}>
  <p><strong>Para ler essa página, sim.</strong> A conexão <code>notion</code> …</p>
</AnswerCard>
```

## VoiceModeButton

Botão redondo flutuante do modo voz (canto inferior direito).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onClick` * | `() => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Conversar por voz"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<VoiceModeButton onClick={() => setVoice(true)} />\n<VoiceOverlay open={voice} transcript={linhas} onClose={(linhas) => salvar(linhas)} />
```

## VoiceOverlay

Sobreposição do modo voz: orbe com forma de onda, estado (ouvindo/falando), transcrição ao vivo, silenciar e encerrar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onClose` * | `(transcript: string[]) => void` |  |  |
| `open` * | `boolean` |  |  |
| `agentName` | `string \| undefined` | `"G4 OS"` |  |
| `transcript` | `string[] \| undefined` | `[]` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<VoiceModeButton onClick={() => setVoice(true)} />\n<VoiceOverlay open={voice} transcript={linhas} onClose={(linhas) => salvar(linhas)} />
```

## WorkspaceSwitcher

Rodapé da coluna: workspace atual com troca.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `MenuEntry[]` |  |  |
| `name` * | `string` |  |  |
| `mark` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.
