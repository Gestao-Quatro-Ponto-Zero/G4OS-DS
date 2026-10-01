# ai-sessions

Arquivo: `src/components/ai-sessions.tsx` · importe de `@g4ai/ds`.

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

Resposta do agente. Conteúdo rico (negrito, código, links).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `actions` | `ReactNode` |  |  |
| `actionsVisible` | `"always" \| "hover" \| undefined` |  | (flow) "hover" (padrão): ações só no hover/foco. |
| `artifacts` | `ReactNode` |  | (flow) Cartões de artefato produzidos nesta resposta. |
| `className` | `string \| undefined` |  |  |
| `id` | `string \| undefined` |  |  |
| `run` | `ReactNode` |  | (flow) Linha de status da execução: RunSummary. |
| `streaming` | `boolean \| undefined` | `false` |  |
| `suggestions` | `ReactNode` |  | (flow) Continuações sugeridas (chips). |
| `variant` | `"card" \| "flow" \| undefined` | `"card"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-layout-agente`):

```tsx
<ThreadView resetKey={sessao.id} collapseBefore={mensagens.length > 8 ? mensagens.length - 5 : 0}>
  {mensagens}
</ThreadView>

<AnswerCard
  variant="flow"
  run={<RunSummary variant="divider" status="done" durationMs={214000}>{/* StepGroup com os passos */}</RunSummary>}
  actions={<MessageActions size="xs" text={texto} onShare={compartilhar} />}
>
  …
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
| `compact` | `boolean \| undefined` | `false` | Só ícones, alinhados à esquerda (respostas em fluxo). |
| `markdown` | `string \| undefined` |  |  |
| `onBranch` | `(() => void) \| undefined` |  |  |
| `onFeedback` | `((value: "up" \| "down") => void) \| undefined` |  |  |
| `onRetry` | `(() => void) \| undefined` |  |  |
| `onShare` | `(() => void) \| undefined` |  | Compartilhar a resposta (link ou exportar). |
| `size` | `"md" \| "xs" \| undefined` | `"md"` | "xs": ícones mínimos (estilo Codex), implica `compact`. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-layout-agente`):

```tsx
<ThreadView resetKey={sessao.id} collapseBefore={mensagens.length > 8 ? mensagens.length - 5 : 0}>
  {mensagens}
</ThreadView>

<AnswerCard
  variant="flow"
  run={<RunSummary variant="divider" status="done" durationMs={214000}>{/* StepGroup com os passos */}</RunSummary>}
  actions={<MessageActions size="xs" text={texto} onShare={compartilhar} />}
>
  …
</AnswerCard>
```

## MinimapItem (type)

```ts
type MinimapItem = { id: string; role: "user" | "assistant"; preview: string }
```

## ModelEffort (type)

```ts
type ModelEffort = "leve" | "padrao" | "profundo"
```

## ModelOption (type)

```ts
type ModelOption = { id: string; name: string; group?: string; description?: string; icon?: ReactNode }
```

## ModelPicker

Chip de modelo + esforço ("⚡ Sol · Leve ⌄").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `models` * | `ModelOption[]` |  |  |
| `onChange` * | `(id: string) => void` |  |  |
| `value` * | `string` |  |  |
| `agent` | `string \| undefined` |  |  |
| `agents` | `AgentOption[] \| undefined` |  | Agentes disponíveis: o chip mostra o agente e o menu ganha a seção "Agente". |
| `className` | `string \| undefined` |  |  |
| `effort` | `ModelEffort \| undefined` |  |  |
| `onAgentChange` | `((id: string) => void) \| undefined` |  |  |
| `onEffortChange` | `((e: ModelEffort) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<PermissionModeChip value={permissao} onChange={setPermissao} />   // "ler" | "aprovar" | "total"
<ModelPicker models={modelos} value={modelo} onChange={setModelo} effort={esforco} onEffortChange={setEsforco} />
// Chip único do campo: agente + modelo + esforço
<ModelPicker agents={agentes} agent={agente} onAgentChange={setAgente} models={modelos} value={modelo} onChange={setModelo} effort={esforco} onEffortChange={setEsforco} />
```

## PermissionMode (type)

```ts
type PermissionMode = "ler" | "aprovar" | "total"
```

## PermissionModeChip

Chip de permissão do agente, sempre visível no campo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(mode: PermissionMode) => void` |  |  |
| `value` * | `PermissionMode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<PermissionModeChip value={permissao} onChange={setPermissao} />   // "ler" | "aprovar" | "total"
<ModelPicker models={modelos} value={modelo} onChange={setModelo} effort={esforco} onEffortChange={setEsforco} />
// Chip único do campo: agente + modelo + esforço
<ModelPicker agents={agentes} agent={agente} onAgentChange={setAgente} models={modelos} value={modelo} onChange={setModelo} effort={esforco} onEffortChange={setEsforco} />
```

## ProjectGroup

Pasta de projeto na lista de sessões: ícone + nome + contagem, recolhível, sessões aninhadas, "Mostrar mais" depois de `limit` e menu ⋯ do projeto.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `count` * | `number` |  |  |
| `project` * | `SessionProject` |  |  |
| `actions` | `MenuEntry[] \| undefined` |  |  |
| `active` | `boolean \| undefined` |  |  |
| `defaultOpen` | `boolean \| undefined` | `true` |  |
| `density` | `"rich" \| "clean" \| undefined` | `"rich"` |  |
| `limit` | `number \| undefined` | `5` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

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

## SessionDetails

Conteúdo de detalhes da sessão (modo, criador, nome, etiquetas, notas) e arquivos, sem moldura.

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
| `className` | `string \| undefined` |  |  |
| `defaultSection` | `"detalhes" \| "arquivos" \| undefined` | `"detalhes"` |  |
| `files` | `SessionFile[] \| undefined` | `[]` |  |
| `show` | `"both" \| "detalhes" \| "arquivos" \| undefined` | `"both"` | "both" (padrão) com sub-abas; "detalhes" ou "arquivos" mostra só uma seção, sem sub-abas. |
| `tagSuggestions` | `string[] \| undefined` | `[]` |  |
| `title` | `ReactNode` | `"Informações da sessão"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

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
| `density` | `"rich" \| "clean" \| undefined` | `"rich"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SessionHeader

Título da sessão no centro com menu (renomear, mover, arquivar, exportar) e ações à direita: navegador do agente, gravar reunião, buscar, compartilhar, painel de informações.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `menu` * | `MenuEntry[]` |  |  |
| `title` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `infoOpen` | `boolean \| undefined` |  |  |
| `leading` | `ReactNode` |  | Antes do título (desktop): ListToggle, SessionQuickSwitcher. |
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
| `density` | `"rich" \| "clean" \| undefined` | `"rich"` | "rich" (padrão): chips de status e etiquetas. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<SessionItem session={{ id, title, time: "2m", status: "working", tags: ["Field Guide FC"] }} active onSelect={open} />
<SessionStatusChip status="ready" />   // working · ready · error
```

## SessionListMode (type)

```ts
type SessionListMode = "recent" | "projects"
```

## SessionMode (type)

```ts
type SessionMode = "executar" | "planejar" | "perguntar"
```

## SessionProject (type)

Projeto que agrupa sessões (repositório, cliente, iniciativa).

```ts
type SessionProject = { id: string; name: string; icon?: ReactNode }
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
| `defaultListMode` | `SessionListMode \| undefined` | `"recent"` |  |
| `density` | `"rich" \| "clean" \| undefined` | `"rich"` | "rich" (padrão): botão "Nova sessão", abas com ícone, etiquetas e chips. |
| `footer` | `ReactNode` |  | Rodapé (seletor de workspace). |
| `headerExtra` | `ReactNode` |  | Controle extra no cabeçalho, antes do filtro (ex.: ListToggle). |
| `itemActions` | `((s: T) => MenuEntry[]) \| undefined` |  |  |
| `listMode` | `SessionListMode \| undefined` |  |  |
| `onListModeChange` | `((mode: SessionListMode) => void) \| undefined` |  |  |
| `projectActions` | `((p: SessionProject) => MenuEntry[]) \| undefined` |  | Menu ⋯ de cada projeto (nova sessão no projeto, renomear, arquivar). |
| `projectLimit` | `number \| undefined` | `5` | Sessões por projeto antes de "Mostrar mais". |
| `projects` | `SessionProject[] \| undefined` |  | Com projetos, um ícone no cabeçalho (e o menu de filtro) alterna o agrupamento por data ou por projeto. |
| `title` | `string \| undefined` | `"Sessões"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<SessionSidebar sessions={sessoes} activeId={ativa} onSelect={abrir} onNew={nova} />
```

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

## SessionStatusGlyph

Status de sessão em versão mínima (lista "clean"): ponto pulsante dourado = trabalhando, ponto verde = resposta pronta, alerta rose = falhou, relógio = rotina agendada.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `scheduled` | `boolean \| undefined` |  |  |
| `status` | `SessionStatus \| undefined` | `"idle"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<SessionStatusGlyph status="working" />  <SessionStatusGlyph status="ready" />  <SessionStatusGlyph status="error" />  <SessionStatusGlyph scheduled />
```

## SessionSummary (type)

```ts
type SessionSummary = { id: string; title: string; time: string; status?: SessionStatus; tags?: string[]; starred?: boolean; archived?: boolean; parentId?: string; day?: string; scheduled?: boolean; projectId?: string; }
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
| `variant` | `"line" \| "group" \| undefined` | `"group"` | "group" (padrão): botão com ícone ⇕. |

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

## ToolsButton

Versão compacta do ToolsBar para o rodapé de um campo limpo: botão "6 ferramentas" (ponto rose se alguma falhou) que abre a lista com status e "Gerenciar".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `tools` * | `ConnectedTool[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `onManage` | `(() => void) \| undefined` |  |  |
| `onReconnect` | `((tool: ConnectedTool) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-sessoes`):

```tsx
<ToolsButton tools={ferramentas} onManage={abrir} onReconnect={(t) => reconectar(t)} />
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
