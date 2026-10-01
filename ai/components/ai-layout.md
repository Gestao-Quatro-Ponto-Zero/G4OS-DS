# ai-layout

Arquivo: `src/components/ai-layout.tsx` · importe de `@g4ai/ds`.

Layout de app agêntico (docs: IA e interação › Layout de app agêntico).

## AgentAppLayout

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `main` * | `ReactNode` |  | Área principal: ThreadHeader + ThreadView + campo. |
| `className` | `string \| undefined` |  |  |
| `defaultListWidth` | `number \| undefined` | `300` |  |
| `list` | `ReactNode` |  | Lista (SessionSidebar, lista de projetos). |
| `listOpen` | `boolean \| undefined` |  | Controlado. Sem ele, o layout guarda o estado (e persiste com `storageKey`). |
| `maxListWidth` | `number \| undefined` | `420` |  |
| `minListWidth` | `number \| undefined` | `240` |  |
| `mobileNav` | `ReactNode` |  | Celular: navegação inferior (BottomNav) mostrada só na tela da lista. |
| `mobileView` | `AgentMobileView \| undefined` | `"main"` | Celular: qual tela mostrar ("list" = lista; "main" = conversa). |
| `onListOpenChange` | `((open: boolean) => void) \| undefined` |  |  |
| `onPanelOpenChange` | `((open: boolean) => void) \| undefined` |  | Alternar com ⌘. (ou Ctrl+.). |
| `panel` | `ReactNode` |  | Painel à direita (ArtifactPanel, SessionInfoPanel). |
| `panelOpen` | `boolean \| undefined` | `false` |  |
| `panelSize` | `number \| undefined` | `0.58` | Fração da largura do `main` quando o painel está aberto (0–1). |
| `rail` | `ReactNode` |  | Trilho de ícones (IconRail). |
| `storageKey` | `string \| undefined` |  | Persiste largura/abertura da lista e do painel no localStorage. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-layout-agente`):

```tsx
<AgentAppLayout
  storageKey="minhas-sessoes"          // persiste largura da lista, abertura e tamanho do painel
  rail={<IconRail groups={rail} currentPath={rota} mark={<ProductMark />} />}
  list={<SessionSidebar density="clean" sessions={sessoes} activeId={id} onSelect={abrir} onNew={nova} />}
  main={
    <>
      <ThreadHeader title={sessao.titulo} menu={menu} onBack={() => setView("list")} actions={acoes} />
      <ThreadView follow={mensagens.length} resetKey={sessao.id} minimap={mapa}>{mensagens}</ThreadView>
      <AgentComposer … />
    </>
  }
  panel={<ArtifactPanel tabs={abas} active={aba} onActiveChange={setAba} onClose={() => setPainel(false)}>{conteudo}</ArtifactPanel>}
  panelOpen={painel}
  onPanelOpenChange={setPainel}
  mobileView={view}                    // "list" | "main" — o app troca ao abrir/voltar
  mobileNav={<BottomNav items={abasCelular} currentPath={rota} />}
/>
```

## AgentMobileView (type)

```ts
type AgentMobileView = "list" | "main"
```

## CollapsedHistory

Linha "67 mensagens anteriores ›" com fio fino: histórico recolhido no topo de uma conversa longa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onExpand` * | `() => void` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ListToggle

Botão de recolher/mostrar a lista do AgentAppLayout (⌘\).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"lista"` |  |
| `onToggle` | `(() => void) \| undefined` |  |  |
| `open` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-layout-agente`):

```tsx
<ThreadHeader
  leading={
    <>
      <ListToggle />                       {/* dentro do AgentAppLayout: lê e muda o estado sozinho */}
      <SessionQuickSwitcher                {/* só aparece com a lista recolhida (desktop) */}
        sessions={sessoes}                 // { id, title, time?, status?, group? }
        activeId={id}
        onSelect={abrir}
      />
    </>
  }
  title={sessao.titulo}
/>

// Fora do AgentAppLayout (layout próprio): controle você mesmo
<ListToggle open={listaAberta} onToggle={() => setListaAberta((v) => !v)} label="sessões" />
```

## QuickSession (type)

```ts
type QuickSession = { id: string; title: string; time?: string; status?: SessionStatus; group?: string }
```

## SessionQuickSwitcher

Troca rápida de sessão (⌘K-lite) para quando a lista está recolhida: botão que abre um popover com busca, setas e Enter.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onSelect` * | `(id: string) => void` |  |  |
| `sessions` * | `QuickSession[]` |  |  |
| `activeId` | `string \| undefined` |  |  |
| `always` | `boolean \| undefined` | `false` |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Sessões"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-layout-agente`):

```tsx
<ThreadHeader
  leading={
    <>
      <ListToggle />                       {/* dentro do AgentAppLayout: lê e muda o estado sozinho */}
      <SessionQuickSwitcher                {/* só aparece com a lista recolhida (desktop) */}
        sessions={sessoes}                 // { id, title, time?, status?, group? }
        activeId={id}
        onSelect={abrir}
      />
    </>
  }
  title={sessao.titulo}
/>

// Fora do AgentAppLayout (layout próprio): controle você mesmo
<ListToggle open={listaAberta} onToggle={() => setListaAberta((v) => !v)} label="sessões" />
```

## ThreadAction (type)

```ts
type ThreadAction = { id: string; label: string; icon: ReactNode; onClick: () => void; active?: boolean; showLabel?: boolean; hideOnMobile?: boolean; tone?: "neutral" | "danger"; }
```

## ThreadDaySeparator

Separador de dia na conversa ("Hoje", "12 mar").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ThreadHeader

Cabeçalho da conversa: voltar (celular), título com menu (renomear, mover, exportar…) e ações compactas em ícone com tooltip.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `ReactNode` |  |  |
| `actions` | `ThreadAction[] \| undefined` | `[]` |  |
| `backLabel` | `string \| undefined` | `"Voltar"` |  |
| `className` | `string \| undefined` |  |  |
| `leading` | `ReactNode` |  |  |
| `menu` | `MenuEntry[] \| undefined` |  |  |
| `onBack` | `(() => void) \| undefined` |  |  |
| `trailing` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-layout-agente`):

```tsx
<ThreadHeader
  leading={
    <>
      <ListToggle />                       {/* dentro do AgentAppLayout: lê e muda o estado sozinho */}
      <SessionQuickSwitcher                {/* só aparece com a lista recolhida (desktop) */}
        sessions={sessoes}                 // { id, title, time?, status?, group? }
        activeId={id}
        onSelect={abrir}
      />
    </>
  }
  title={sessao.titulo}
/>

// Fora do AgentAppLayout (layout próprio): controle você mesmo
<ListToggle open={listaAberta} onToggle={() => setListaAberta((v) => !v)} label="sessões" />
```

## ThreadView

Área rolável da conversa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `bottomOffset` | `number \| undefined` | `0` | Espaço reservado embaixo (ex.: botão flutuante no celular). |
| `className` | `string \| undefined` |  |  |
| `collapseBefore` | `number \| undefined` | `0` | Recolhe os N primeiros filhos numa linha "N mensagens anteriores ›" (conversas longas: mostra só o final). |
| `collapsedLabel` | `((count: number) => string) \| undefined` | `(n: number) => `${n} ${n === 1 ? "mensag` |  |
| `contentClassName` | `string \| undefined` |  |  |
| `follow` | `unknown` |  | Muda quando o conteúdo cresce (nº de mensagens, caracteres escritos). |
| `maxWidth` | `number \| undefined` | `760` | Largura máxima da coluna de leitura (px). |
| `minimap` | `MinimapItem[] \| undefined` |  |  |
| `resetKey` | `unknown` |  | Muda ao trocar de conversa: rola até o fim sem animação. |
| `scrollRef` | `RefObject<HTMLDivElement \| null> \| undefined` |  |  |

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

## useAgentLayout (hook)

Estado da lista do AgentAppLayout mais próximo (aberta, alternar, celular).

```ts
useAgentLayout(): AgentLayoutState | null
```
