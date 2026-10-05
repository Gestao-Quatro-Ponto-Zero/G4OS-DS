# ai-workspace

Arquivo: `src/components/ai-workspace.tsx` · importe de `@g4ai/ds`.

Workspace de agente (docs: showcase › IA e interação › Workspace de agente).

## AgentComposer

Campo de tarefa do agente: texto com autoaltura, "/" abre comandos, "+" anexa (arquivo, dados do app, link), microfone grava com forma de onda e cronômetro, seletor de agente/modelo e chips de contexto.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(v: string) => void` |  |  |
| `onSubmit` * | `(v: string) => void` |  |  |
| `value` * | `string` |  |  |
| `agentChip` | `ReactNode` |  | Chip do agente/modelo (use Menu ou ComposerChip). |
| `attachIcon` | `ReactNode` |  | Ícone do botão de anexar (padrão: +). |
| `attachOptions` | `MenuEntry[] \| undefined` |  | Itens do menu "+". Padrão: arquivo, dados do CRM, link. |
| `busy` | `boolean \| undefined` | `false` |  |
| `className` | `string \| undefined` |  |  |
| `commands` | `SlashCommand[] \| undefined` | `[]` |  |
| `contextChips` | `ReactNode` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `footer` | `ReactNode` |  | Linha extra no rodapé do campo (ex.: ToolsBar com ferramentas conectadas). |
| `hint` | `ReactNode` |  | Dica discreta à direita da 1ª linha, só com o campo vazio e largo (≥ 640px). |
| `leading` | `ReactNode` |  | Botões logo após o anexar (ex.: pasta de contexto). |
| `onStop` | `(() => void) \| undefined` |  |  |
| `onTranscribe` | `((ms: number) => string \| Promise<string>) \| undefined` |  | Chamado ao terminar a gravação com a duração (ms). |
| `placeholder` | `string \| undefined` | `"Peça uma análise ou dê uma tarefa ao ag` |  |
| `trailing` | `ReactNode` |  | Antes do microfone, à direita (ex.: avatares de agentes/modelos). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-composer`):

```tsx
<AgentComposer
  value={v} onChange={setV} busy={busy} onStop={parar}
  onSubmit={(texto) => enviar(texto)}
  commands={[{ id: "rel", label: "relatorio", description: "Gera um relatório" }, …]}
  agentChip={<ComposerChip icon={<Sparkles />} onClick={…}>Analista de receita</ComposerChip>}
  contextChips={<ComposerChip icon={<Database />} onRemove={…}>Negócios · setembro</ComposerChip>}
  onTranscribe={async (ms) => transcrever(audio)}
/>
```

## AgentMessage

Resposta do agente no workspace: status (RunSummary) no topo, texto, artefatos, sugestões de continuação e ações (copiar, refazer, avaliar).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `artifacts` | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `copyText` | `string \| undefined` |  |  |
| `onFeedback` | `((v: "up" \| "down") => void) \| undefined` |  |  |
| `onRetry` | `(() => void) \| undefined` |  |  |
| `onSuggestion` | `((s: string) => void) \| undefined` |  |  |
| `status` | `ReactNode` |  |  |
| `streaming` | `boolean \| undefined` | `false` |  |
| `suggestions` | `string[] \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## AgentPlan

Plano do agente antes/durante a execução: o que vai fazer, em que ordem, onde está.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `steps` * | `PlanStep[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `collapsible` | `boolean \| undefined` | `false` | Cabeçalho clicável que recolhe o plano; ícone mostra o status geral. |
| `defaultOpen` | `boolean \| undefined` | `true` |  |
| `title` | `ReactNode` | `"Plano"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-raciocinio-e-aprovacao`):

```tsx
<AgentPlan steps={[{ id: "1", label: "Levantar faturas", status: "done" }, { id: "2", label: "Enviar lembretes", status: "active" }]} />
```

## ApprovalRequest

O agente pede permissão antes de uma ação com efeito externo (enviar e-mail, alterar registros, cobrar).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `actions` | `ReactNode` |  | Substitui os botões padrão (aprovar, sempre, editar, recusar) enquanto pende. |
| `children` | `ReactNode` |  | Conteúdo extra entre o preview e o rodapé (detalhes, campos, avisos). |
| `className` | `string \| undefined` |  |  |
| `compact` | `boolean \| undefined` | `false` | Estado decidido (qualquer um menos "pending") vira uma linha: ícone, estado, título e impacto. |
| `description` | `ReactNode` |  |  |
| `eyebrow` | `ReactNode` |  | Sobrelinha do pedido pendente ("Comando no terminal"). |
| `icon` | `ReactNode` |  | Ícone do pedido pendente. |
| `impact` | `ReactNode` |  | "42 clientes", "R$ 18.400 em faturas". |
| `labels` | `Partial<ApprovalRequestLabels> \| undefined` |  | Textos dos botões, da sobrelinha, dos estados e do nome acessível. |
| `onApprove` | `(() => void) \| undefined` |  |  |
| `onApproveAlways` | `(() => void) \| undefined` |  |  |
| `onEdit` | `(() => void) \| undefined` |  |  |
| `onReject` | `(() => void) \| undefined` |  |  |
| `preview` | `ReactNode` |  |  |
| `risk` | `"medium" \| "low" \| "high" \| undefined` | `"medium"` | Risco da ação. Define o tom quando `tone` não vem: low = info, medium = warn, high = bad. |
| `state` | `ApprovalState \| undefined` | `"pending"` |  |
| `tone` | `ApprovalTone \| undefined` |  | Aparência do pedido pendente (borda e ícone). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-raciocinio-e-aprovacao`):

```tsx
<ApprovalRequest compact state="approved" title="Enviar lembrete para 42 clientes" impact="42 clientes" />
```

## approvalRequestLabels (const)

Textos padrão (pt-BR) do ApprovalRequest; base para traduzir só o que muda.

## ApprovalRequestLabels (type)

Textos do ApprovalRequest.

```ts
type ApprovalRequestLabels = { eyebrow: string; approve: string; approveAlways: string; edit: string; reject: string; approved: string; approvedAlways: string; rejected: string; expired: string; superseded: string; ariaLabel: (title: string) => string; }
```

## ApprovalState (type)

```ts
type ApprovalState = "pending" | "approved" | "always" | "rejected" | "expired" | "superseded"
```

## ApprovalTone (type)

Aparência do pedido pendente.

```ts
type ApprovalTone = "neutral" | "info" | "warn" | "bad"
```

## ArtifactCard

Cartão do que o agente produziu, dentro da resposta.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `kind` * | `ArtifactKind` |  |  |
| `title` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `meta` | `ReactNode` |  |  |
| `onOpen` | `(() => void) \| undefined` |  |  |
| `selected` | `boolean \| undefined` | `false` |  |
| `status` | `"error" \| "ready" \| "generating" \| undefined` | `"ready"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-workspace`):

```tsx
<ArtifactCard kind="report" title="Relatório" meta="3 seções" selected onOpen={…} />\n<ArtifactCard kind="sheet" title="Páginas com preço" meta="9 linhas" onOpen={…} />\n<ArtifactCard kind="deck" title="Apresentação" status="generating" />
```

## ArtifactIcon

Ícone do tipo de artefato, em moldura.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `kind` * | `ArtifactKind` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## artifactIcons (const)

## ArtifactKind (type)

```ts
type ArtifactKind = "report" | "sheet" | "doc" | "chart" | "code" | "email" | "deck" | "context" | "output" | "details" | "files"
```

## ArtifactPanel

Painel de artefatos com abas (Relatório · Contexto · Saída · planilhas…).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `active` * | `string` |  |  |
| `children` * | `ReactNode` |  |  |
| `onActiveChange` * | `(id: string) => void` |  |  |
| `tabs` * | `ArtifactTab[]` |  |  |
| `addOptions` | `{ label: string; kind: ArtifactKind; onSelect: () => void; }[] \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `expanded` | `boolean \| undefined` | `false` |  |
| `onClose` | `(() => void) \| undefined` |  |  |
| `onCloseTab` | `((id: string) => void) \| undefined` |  |  |
| `onCopy` | `(() => void) \| undefined` |  |  |
| `onExpandedChange` | `((expanded: boolean) => void) \| undefined` |  |  |
| `onExport` | `(() => void) \| undefined` |  |  |
| `onShare` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-artefatos`):

```tsx
<ArtifactPanel tabs={tabs} active={active} onActiveChange={setActive}
  onCloseTab={(id) => setTabs((t) => t.filter((x) => x.id !== id))}
  addOptions={[{ label: "Planilha", kind: "sheet", onSelect: … }]}
  onCopy={…} onExport={…} onShare={…} onClose={…}>
  {views[active]}
</ArtifactPanel>
```

## ArtifactTab (type)

```ts
type ArtifactTab = { id: string; kind: ArtifactKind; title: string; closable?: boolean }
```

## ContextItem (type)

```ts
type ContextItem = { id: string; kind: "doc" | "table" | "web" | "tool" | "record"; title: string; detail?: ReactNode; relevance?: number; pinned?: boolean; citations?: number; }
```

## ContextView

O que o agente usou para responder, agrupado por tipo, com peso relativo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `ContextItem[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `onAdd` | `(() => void) \| undefined` |  |  |
| `onPinChange` | `((id: string, pinned: boolean) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## IconRail

Navegação compacta só com ícones (56px), rótulo no tooltip.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `currentPath` * | `string` |  |  |
| `groups` * | `RailItem[][]` |  |  |
| `footer` | `ReactNode` |  |  |
| `label` | `string \| undefined` | `"Menu principal"` |  |
| `mark` | `ReactNode` |  |  |
| `mobileOpen` | `boolean \| undefined` | `false` |  |
| `onExpand` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/nav-sidebar-submenus`):

```tsx
<IconRail groups={[[{ href: "/", label: "Início", icon: Home }, { href: "/relatorios", label: "Relatórios", icon: BarChart3, items: [{ href: "/relatorios/receita", label: "Receita" }] }]]} currentPath={pathname} />
```

## InsightCard

Achado do agente: rótulo (kicker), manchete e, embaixo, a evidência (lista ranqueada, barra de métrica) com um marcador de tom.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `kicker` * | `string` |  |  |
| `title` * | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `listLabel` | `string \| undefined` |  |  |
| `tone` | `"neutral" \| "ok" \| "warn" \| "bad" \| undefined` | `"bad"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-workspace`):

```tsx
<InsightCard kicker="Objeções" title="Preço pouco claro virou a objeção nº 1" listLabel="Principais objeções" tone="bad">
  <RankedList items={[{ label: "Preço pouco claro", badge: "Novo" }, { label: "Preço alto", value: "9 menções" }]} />
</InsightCard>
<InsightCard kicker="Conversão" title="Só PMEs caíram" listLabel="Por segmento">
  <MetricBar index={1} label="PME" value={0.61} delta={-0.049} />
</InsightCard>
<KpiPair items={[{ label: "Conversão PME", value: "9,2 %" }, { label: "Negócios afetados", value: "121" }]}>…gráfico…</KpiPair>
```

## KpiPair

Dois números lado a lado num mesmo card (e um gráfico embaixo em `children`).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `{ label: string; value: ReactNode; hint?: ReactNode; }[]` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-workspace`):

```tsx
<InsightCard kicker="Objeções" title="Preço pouco claro virou a objeção nº 1" listLabel="Principais objeções" tone="bad">
  <RankedList items={[{ label: "Preço pouco claro", badge: "Novo" }, { label: "Preço alto", value: "9 menções" }]} />
</InsightCard>
<InsightCard kicker="Conversão" title="Só PMEs caíram" listLabel="Por segmento">
  <MetricBar index={1} label="PME" value={0.61} delta={-0.049} />
</InsightCard>
<KpiPair items={[{ label: "Conversão PME", value: "9,2 %" }, { label: "Negócios afetados", value: "121" }]}>…gráfico…</KpiPair>
```

## MetricBar

Métrica em barra dividida: parte boa (ok) e parte perdida (rose), com % e variação.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `ReactNode` |  |  |
| `value` * | `number` |  |  |
| `className` | `string \| undefined` |  |  |
| `delta` | `number \| undefined` |  | Variação em pontos percentuais (fração): −0.035 = −3,5 pp. |
| `goodWhen` | `"up" \| "down" \| undefined` | `"up"` |  |
| `index` | `number \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-workspace`):

```tsx
<InsightCard kicker="Objeções" title="Preço pouco claro virou a objeção nº 1" listLabel="Principais objeções" tone="bad">
  <RankedList items={[{ label: "Preço pouco claro", badge: "Novo" }, { label: "Preço alto", value: "9 menções" }]} />
</InsightCard>
<InsightCard kicker="Conversão" title="Só PMEs caíram" listLabel="Por segmento">
  <MetricBar index={1} label="PME" value={0.61} delta={-0.049} />
</InsightCard>
<KpiPair items={[{ label: "Conversão PME", value: "9,2 %" }, { label: "Negócios afetados", value: "121" }]}>…gráfico…</KpiPair>
```

## PlanStep (type)

```ts
type PlanStep = { id: string; label: ReactNode; status: "pending" | "active" | "done" | "error" | "skipped"; detail?: ReactNode; content?: ReactNode; defaultOpen?: boolean; durationMs?: number; icon?: ReactNode; }
```

## RailItem (type)

```ts
type RailItem = { href: string; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number | string }>; dot?: boolean; badge?: number; match?: string; items?: NavSubItem[]; }
```

## RankedList

Lista numerada com selo ("Novo") ou variação à direita.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `{ label: ReactNode; badge?: string; badgeTone?: "ok" \| "warn" \| "bad" \| "neutral"; value?: ReactNode; }[]` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-workspace`):

```tsx
<InsightCard kicker="Objeções" title="Preço pouco claro virou a objeção nº 1" listLabel="Principais objeções" tone="bad">
  <RankedList items={[{ label: "Preço pouco claro", badge: "Novo" }, { label: "Preço alto", value: "9 menções" }]} />
</InsightCard>
<InsightCard kicker="Conversão" title="Só PMEs caíram" listLabel="Por segmento">
  <MetricBar index={1} label="PME" value={0.61} delta={-0.049} />
</InsightCard>
<KpiPair items={[{ label: "Conversão PME", value: "9,2 %" }, { label: "Negócios afetados", value: "121" }]}>…gráfico…</KpiPair>
```

## ReasoningBlock

Raciocínio do agente, recolhido por padrão ("Pensou por 8 s ›").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `lines` * | `ReactNode[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `defaultOpen` | `boolean \| undefined` | `false` |  |
| `durationMs` | `number \| undefined` |  |  |
| `streaming` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-raciocinio-e-aprovacao`):

```tsx
<ReasoningBlock durationMs={8200} lines={["Filtrar faturas…", "Separar quem sempre atrasou…"]} />\n<ReasoningBlock streaming lines={["Buscando os 9 maiores valores…"]} />
```

## ReportSection

Seção de relatório: título + corpo com largura de leitura.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `title` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ResizableSplit

Dois painéis lado a lado com divisor arrastável (mouse, toque ou teclado: ←/→ 2 %, Shift 10 %, Home/End nos limites, duplo clique volta ao padrão).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `left` * | `ReactNode` |  |  |
| `right` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `defaultSize` | `number \| undefined` | `0.46` |  |
| `label` | `string \| undefined` | `"Redimensionar painéis"` |  |
| `max` | `number \| undefined` | `0.72` |  |
| `min` | `number \| undefined` | `0.28` |  |
| `mobileLayout` | `"overlay" \| "stack" \| undefined` | `"overlay"` | Abaixo de 768 px: "overlay" (padrão) abre o painel direito em tela cheia — o conteúdo dele precisa ter um botão de fechar que zere `rightOpen`; "stack" empilha os dois painéis dentro do próprio contêiner. |
| `rightOpen` | `boolean \| undefined` | `true` |  |
| `storageKey` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-layout`):

```tsx
<AppShell sidebar={({ mobileOpen }) => <IconRail groups={grupos} currentPath={rota} mobileOpen={mobileOpen} mark={<Logo />} />} …>
  <ResizableSplit storageKey="minha-tela" defaultSize={0.46} min={0.28} max={0.72}
    left={<Conversa />} right={<ArtifactPanel …/>} rightOpen={aberto} />
</AppShell>
```

## RunStatus (type)

```ts
type RunStatus = "running" | "done" | "error" | "stopped"
```

## RunSummary

Linha de status de uma execução ("Concluído em 40 s ›").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `status` * | `RunStatus` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `cost` | `string \| undefined` |  | Já formatado ("R$ 0,21"). |
| `defaultOpen` | `boolean \| undefined` | `false` |  |
| `durationMs` | `number \| undefined` |  |  |
| `startedAt` | `number \| undefined` |  |  |
| `steps` | `number \| undefined` |  |  |
| `tokens` | `number \| undefined` |  |  |
| `tools` | `number \| undefined` |  |  |
| `variant` | `"inline" \| "divider" \| undefined` | `"inline"` | "inline" (padrão): "✓ Concluído em 40 s · 9 passos ›" com o trace num cartão. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-workspace`):

```tsx
<RunSummary status="done" durationMs={40200} steps={9} tools={5} tokens={48210} cost="R$ 0,62">
  <AgentTrace steps={steps} replay={false} />
</RunSummary>
<RunSummary status="running" startedAt={Date.now()} />
<RunSummary status="error" durationMs={8100} />
```

## SheetArtifact

Planilha compacta gerada pelo agente: letras de coluna, números de linha, cabeçalho fixo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `columns` * | `SheetColumn[]` |  |  |
| `rows` * | `Record<string, unknown>[]` |  |  |
| `caption` | `ReactNode` |  |  |
| `changed` | `string[] \| undefined` | `[]` |  |
| `className` | `string \| undefined` |  |  |
| `maxHeight` | `number \| undefined` | `480` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SheetColumn (type)

```ts
type SheetColumn = { key: string; label: string; align?: "left" | "right"; format?: (v: unknown) => ReactNode; width?: number }
```

## SlashCommand (type)

```ts
type SlashCommand = { id: string; label: string; description?: string; icon?: ReactNode }
```

## Waveform

Forma de onda animada (gravação, modo voz).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `active` * | `boolean` |  |  |
| `barClassName` | `string \| undefined` | `"bg-rose/80"` |  |
| `bars` | `number \| undefined` | `28` |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.
