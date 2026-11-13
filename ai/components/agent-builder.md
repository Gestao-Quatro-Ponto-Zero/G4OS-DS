# agent-builder

Arquivo: `src/components/agent-builder.tsx` · importe de `@g4ai/ds`.

Construtor de agente: a "ficha" do agente ao lado da conversa com ele.

## AddPropertyMenu

Botão "+ Adicionar" com menu (aceita submenus).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `MenuEntry[]` |  |  |
| `label` | `string \| undefined` | `"Adicionar"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<PublishBar status={status} onTest={testar} onPublish={publicar} onShare={compartilhar} />
<AgentHeader icon={<Sparkles />} title={nome} onTitleChange={setNome} description={desc} onDescriptionChange={setDesc} />
<BuilderSection title="Gatilhos" action={<AddPropertyMenu items={opcoes} />}>
  <TriggerList triggers={gatilhos} rowMenu={(t) => [...]} />
</BuilderSection>
<BuilderSection title="Propriedades">
  <PropertyRow label="Ferramentas"><ChipPicker chips={ferramentas} onRemove={remover} addItems={menu} /></PropertyRow>
</BuilderSection>
<BuilderSection title="Instruções"><AgentInstructions value={html} onChange={setHtml} onEnhance={melhorar} /></BuilderSection>
```

## AgentHeader

Cabeçalho do agente: ícone grande, nome, descrição (ambos editáveis inline se receber os handlers).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `string \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `onDescriptionChange` | `((v: string) => void) \| undefined` |  |  |
| `onTitleChange` | `((v: string) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<PublishBar status={status} onTest={testar} onPublish={publicar} onShare={compartilhar} />
<AgentHeader icon={<Sparkles />} title={nome} onTitleChange={setNome} description={desc} onDescriptionChange={setDesc} />
<BuilderSection title="Gatilhos" action={<AddPropertyMenu items={opcoes} />}>
  <TriggerList triggers={gatilhos} rowMenu={(t) => [...]} />
</BuilderSection>
<BuilderSection title="Propriedades">
  <PropertyRow label="Ferramentas"><ChipPicker chips={ferramentas} onRemove={remover} addItems={menu} /></PropertyRow>
</BuilderSection>
<BuilderSection title="Instruções"><AgentInstructions value={html} onChange={setHtml} onEnhance={melhorar} /></BuilderSection>
```

## AgentInstructions

Instruções do agente: editor de texto rico com "Melhorar" (IA) no toolbar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(html: string) => void` |  |  |
| `value` * | `string` |  |  |
| `enhancing` | `boolean \| undefined` | `false` |  |
| `maxLength` | `number \| undefined` |  | Limite de caracteres do texto (sem marcações). |
| `onEnhance` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<AgentInstructions value={html} onChange={setHtml} maxLength={2000} />
```

## AgentStatus (type)

```ts
type AgentStatus = "rascunho" | "publicado" | "alterado"
```

## AppAccessItem (type)

App que o agente pede para acessar: escopo em linguagem simples e estado da conexão.

```ts
type AppAccessItem = { id: string; name: string; color?: string; icon?: ReactNode; scope: string; connected: boolean; granted: boolean; required?: boolean; error?: string; }
```

## AppAccessList

Conceder acesso app a app: marca, nome, escopo em linguagem simples e, por app, "Conectar" (se a conta ainda não está ligada) ou um `Switch` de acesso.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `apps` * | `AppAccessItem[]` |  |  |
| `onGrantChange` * | `(id: string, granted: boolean) => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Acesso aos apps"` |  |
| `onConnect` | `((id: string) => Promise<unknown> \| void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<AppAccessList
  apps={[{ id: "caixa", name: "Caixa de entrada", scope: "Ler conversas e criar rascunhos", connected: true, granted: true, required: true }, …]}
  onGrantChange={(id, granted) => …}
  onConnect={(id) => api.connect(id)} // Promise: mostra “Conectando…”
/>
```

## BuilderSection

Seção do construtor: título, selo opcional, descrição, ação à direita, conteúdo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `title` * | `string` |  |  |
| `action` | `ReactNode` |  |  |
| `badge` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<PublishBar status={status} onTest={testar} onPublish={publicar} onShare={compartilhar} />
<AgentHeader icon={<Sparkles />} title={nome} onTitleChange={setNome} description={desc} onDescriptionChange={setDesc} />
<BuilderSection title="Gatilhos" action={<AddPropertyMenu items={opcoes} />}>
  <TriggerList triggers={gatilhos} rowMenu={(t) => [...]} />
</BuilderSection>
<BuilderSection title="Propriedades">
  <PropertyRow label="Ferramentas"><ChipPicker chips={ferramentas} onRemove={remover} addItems={menu} /></PropertyRow>
</BuilderSection>
<BuilderSection title="Instruções"><AgentInstructions value={html} onChange={setHtml} onEnhance={melhorar} /></BuilderSection>
```

## ChipItem (type)

```ts
type ChipItem = { id: string; label: string; icon?: ReactNode }
```

## ChipPicker

Chips removíveis + "+" com menu para adicionar (ferramentas, saídas, skills).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `chips` * | `ChipItem[]` |  |  |
| `addItems` | `MenuEntry[] \| undefined` |  |  |
| `addLabel` | `string \| undefined` | `"Adicionar"` |  |
| `empty` | `string \| undefined` |  |  |
| `onRemove` | `((id: string) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<PublishBar status={status} onTest={testar} onPublish={publicar} onShare={compartilhar} />
<AgentHeader icon={<Sparkles />} title={nome} onTitleChange={setNome} description={desc} onDescriptionChange={setDesc} />
<BuilderSection title="Gatilhos" action={<AddPropertyMenu items={opcoes} />}>
  <TriggerList triggers={gatilhos} rowMenu={(t) => [...]} />
</BuilderSection>
<BuilderSection title="Propriedades">
  <PropertyRow label="Ferramentas"><ChipPicker chips={ferramentas} onRemove={remover} addItems={menu} /></PropertyRow>
</BuilderSection>
<BuilderSection title="Instruções"><AgentInstructions value={html} onChange={setHtml} onEnhance={melhorar} /></BuilderSection>
```

## KnowledgeFile (type)

Arquivo de conhecimento do agente.

```ts
type KnowledgeFile = { id: string; name: string; size: number; status?: "pronto" | "enviando" | "erro"; progress?: number; error?: string; meta?: ReactNode; }
```

## KnowledgeFiles

Arquivos que o agente consulta: tipo, tamanho, progresso de envio, cancelar, erro com "Tentar de novo" e remover.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onUpload` * | `KnowledgeUpload` |  |  |
| `accept` | `string \| undefined` | `".pdf,.docx,.md,.txt,.csv,.xlsx"` | Tipos aceitos (atributo `accept` do input). |
| `addLabel` | `string \| undefined` | `"Adicionar arquivo"` |  |
| `className` | `string \| undefined` |  |  |
| `defaultFiles` | `KnowledgeFile[] \| undefined` | `[]` |  |
| `hint` | `ReactNode` |  | Texto da área de adicionar. |
| `label` | `string \| undefined` | `"Arquivos de conhecimento"` |  |
| `maxSize` | `number \| undefined` | `20 * 1024 * 1024` | Tamanho máximo em bytes; maior que isso vira erro sem enviar. |
| `onChange` | `((files: KnowledgeFile[]) => void) \| undefined` |  | Arquivos prontos depois de cada envio ou remoção. |
| `onRemove` | `((file: KnowledgeFile) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<KnowledgeFiles
  defaultFiles={[{ id: "1", name: "Política de reembolso 2026.pdf", size: 253_952 }]}
  onUpload={(file, report, signal) => api.upload(file, { onProgress: report, signal })}
  onChange={(prontos) => marcarAlterado()}
/>
```

## KnowledgeUpload (type)

Envio de um arquivo: chame `report(0–100)` durante o envio, resolva no fim, rejeite com `Error(mensagem)` se falhar e pare quando `signal` abortar (o usuário cancelou).

```ts
type KnowledgeUpload = (file: File, report: (progress: number) => void, signal: AbortSignal) => Promise<void>
```

## PropertyRow

Linha de propriedade: rótulo à esquerda (fixo) e valor/chips à direita; empilha no celular.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `string` |  |  |
| `hint` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<PublishBar status={status} onTest={testar} onPublish={publicar} onShare={compartilhar} />
<AgentHeader icon={<Sparkles />} title={nome} onTitleChange={setNome} description={desc} onDescriptionChange={setDesc} />
<BuilderSection title="Gatilhos" action={<AddPropertyMenu items={opcoes} />}>
  <TriggerList triggers={gatilhos} rowMenu={(t) => [...]} />
</BuilderSection>
<BuilderSection title="Propriedades">
  <PropertyRow label="Ferramentas"><ChipPicker chips={ferramentas} onRemove={remover} addItems={menu} /></PropertyRow>
</BuilderSection>
<BuilderSection title="Instruções"><AgentInstructions value={html} onChange={setHtml} onEnhance={melhorar} /></BuilderSection>
```

## PublishBar

Ações do construtor: status + Compartilhar · Testar · Publicar · ⋯.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `status` * | `AgentStatus` |  |  |
| `className` | `string \| undefined` |  |  |
| `menu` | `MenuEntry[] \| undefined` |  |  |
| `onPublish` | `(() => void) \| undefined` |  |  |
| `onShare` | `(() => void) \| undefined` |  |  |
| `onTest` | `(() => void) \| undefined` |  |  |
| `testing` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<PublishBar status={status} onTest={testar} onPublish={publicar} onShare={compartilhar} />
<AgentHeader icon={<Sparkles />} title={nome} onTitleChange={setNome} description={desc} onDescriptionChange={setDesc} />
<BuilderSection title="Gatilhos" action={<AddPropertyMenu items={opcoes} />}>
  <TriggerList triggers={gatilhos} rowMenu={(t) => [...]} />
</BuilderSection>
<BuilderSection title="Propriedades">
  <PropertyRow label="Ferramentas"><ChipPicker chips={ferramentas} onRemove={remover} addItems={menu} /></PropertyRow>
</BuilderSection>
<BuilderSection title="Instruções"><AgentInstructions value={html} onChange={setHtml} onEnhance={melhorar} /></BuilderSection>
```

## ToolGlyph

Ícone de app/ferramenta: quadradinho com a inicial na cor da marca do app.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `name` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `color` | `string \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `size` | `number \| undefined` | `18` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ToolToggleItem (type)

Ferramenta do agente: marca do app, nome, o que o agente faz com ela e se está ligada.

```ts
type ToolToggleItem = { id: string; name: string; description: string; color?: string; icon?: ReactNode; on: boolean; disabled?: boolean; }
```

## ToolToggleList

Ferramentas do agente em grade (2 colunas; 1 em contêiner estreito): marca do app, nome, o que o agente faz com ela e um `Switch` por ferramenta, com o contador "5 de 6 ligadas".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onToggle` * | `(id: string, on: boolean) => void` |  |  |
| `tools` * | `ToolToggleItem[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Ferramentas"` | Nome acessível da lista. |
| `showCount` | `boolean \| undefined` | `true` | Mostra "5 de 6 ligadas" acima da grade. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<ToolToggleList
  tools={[{ id: "caixa", name: "Caixa de entrada", description: "Lê conversas e cria rascunhos", color: "var(--ds-tag-red-fg)", on: true }, …]}
  onToggle={(id, on) => setTools((t) => t.map((x) => (x.id === id ? { ...x, on } : x)))}
/>
```

## TriggerItem (type)

```ts
type TriggerItem = { id: string; icon?: ReactNode; label: ReactNode }
```

## TriggerList

Lista de gatilhos (quando o agente roda).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `triggers` * | `TriggerItem[]` |  |  |
| `empty` | `ReactNode` | `"Nenhum gatilho: o agente só roda quando` |  |
| `rowMenu` | `((t: TriggerItem) => MenuEntry[]) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-construtor-de-agentes`):

```tsx
<PublishBar status={status} onTest={testar} onPublish={publicar} onShare={compartilhar} />
<AgentHeader icon={<Sparkles />} title={nome} onTitleChange={setNome} description={desc} onDescriptionChange={setDesc} />
<BuilderSection title="Gatilhos" action={<AddPropertyMenu items={opcoes} />}>
  <TriggerList triggers={gatilhos} rowMenu={(t) => [...]} />
</BuilderSection>
<BuilderSection title="Propriedades">
  <PropertyRow label="Ferramentas"><ChipPicker chips={ferramentas} onRemove={remover} addItems={menu} /></PropertyRow>
</BuilderSection>
<BuilderSection title="Instruções"><AgentInstructions value={html} onChange={setHtml} onEnhance={melhorar} /></BuilderSection>
```

## TriggerRow

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `icon` | `ReactNode` |  |  |
| `menu` | `MenuEntry[] \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.
