# agent-builder

Arquivo: `src/components/agent-builder.tsx` · importe de `@g4os/ds`.

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
| `onEnhance` | `(() => void) \| undefined` |  |  |

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

## AgentStatus (type)

```ts
type AgentStatus = "rascunho" | "publicado" | "alterado"
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
