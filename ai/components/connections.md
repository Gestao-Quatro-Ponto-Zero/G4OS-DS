# connections

Arquivo: `src/components/connections.tsx` · importe de `@g4ai/ds`.

Conexões e apps: marketplace de integrações, detalhe da conexão, permissões por conta e o "cartão do agente" (o que ele acessa, quem ele aciona, o que entrega).

## AccountRow

Conta conectada (loja, workspace, perfil de anúncios).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `name` * | `string` |  |  |
| `actions` | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |
| `defaultOpen` | `boolean \| undefined` | `false` |  |
| `href` | `string \| undefined` |  |  |
| `mark` | `ReactNode` |  |  |
| `meta` | `ReactNode` |  |  |
| `url` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<ConnectionStatus status="connected" />
<DataSyncTable rows={[{ label: "Produtos sincronizados", value: 15, icon: Package, href: "/produtos?origem=shopify" }]} />
<AccountRow name="Acme Store" url="acme-store.myshopify.com" mark={<AppIcon letter="A" color={cor} variant="soft" />}>
  <ToolPermissionList appName="Shopify" items={perms} onChange={(id, on) => …} />
</AccountRow>
```

## AgentConnection (type)

```ts
type AgentConnection = { id: string; name: string; icon?: IconLike; letter?: string; color?: string; status: "connected" | "available" | "active"; onConnect?: () => void; onClick?: () => void }
```

## AgentConnectionRow

Linha de conexão dentro do cartão do agente.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `c` * | `AgentConnection` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## AgentResult (type)

```ts
type AgentResult = { id: string; name: string; fileName?: string; onClick?: () => void; meta?: ReactNode }
```

## AppGrid

Grade de apps: 1 coluna no celular, 2 no desktop, linhas com respiro.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<HalftoneBand />
<MarketplaceHero prompts={[{ app: slack, text: "Resumir as atualizações das conversas recentes", onClick }]} />
<AppGrid>
  {apps.map((a) => (
    <AppTile key={a.id} app={a} connected={connected[a.id]} href={`/apps/${a.id}\
```

## AppIcon

Ícone de app/integração.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `color` | `string \| undefined` | `"var(--ds-ink)"` |  |
| `icon` | `IconLike \| undefined` |  |  |
| `label` | `string \| undefined` |  | Nome do app para leitor de tela (omita se o nome já aparece ao lado). |
| `letter` | `string \| undefined` |  | Alternativa ao ícone: 1–2 letras. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| undefined` | `"md"` |  |
| `variant` | `"plain" \| "soft" \| "tile" \| undefined` | `"tile"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<ConnectionStatus status="connected" />
<DataSyncTable rows={[{ label: "Produtos sincronizados", value: 15, icon: Package, href: "/produtos?origem=shopify" }]} />
<AccountRow name="Acme Store" url="acme-store.myshopify.com" mark={<AppIcon letter="A" color={cor} variant="soft" />}>
  <ToolPermissionList appName="Shopify" items={perms} onChange={(id, on) => …} />
</AccountRow>
```

## AppInfo (type)

```ts
type AppInfo = { id: string; name: string; description: string; icon?: IconLike; letter?: string; color?: string; category?: string }
```

## AppTile

Linha de app no marketplace: ícone, nome, descrição de uma linha e a ação.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `app` * | `AppInfo` |  |  |
| `badge` | `ReactNode` |  | Selo ao lado do nome ("Novo", "Beta"). |
| `className` | `string \| undefined` |  |  |
| `connected` | `boolean \| undefined` |  |  |
| `href` | `string \| undefined` |  |  |
| `onConnect` | `(() => void) \| undefined` |  |  |
| `onOpen` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<HalftoneBand />
<MarketplaceHero prompts={[{ app: slack, text: "Resumir as atualizações das conversas recentes", onClick }]} />
<AppGrid>
  {apps.map((a) => (
    <AppTile key={a.id} app={a} connected={connected[a.id]} href={`/apps/${a.id}\
```

## ConnectionsCard

Cartão do agente: faixa de cabeçalho (avatar, nome, escopo) sobre um cartão interno com o que ele acessa (conexões), quem ele aciona (subagentes) e o que ele entrega (resultados).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `name` * | `string` |  |  |
| `avatar` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `connections` | `AgentConnection[] \| undefined` | `[]` |  |
| `footer` | `ReactNode` |  |  |
| `results` | `AgentResult[] \| undefined` | `[]` |  |
| `scope` | `ReactNode` |  | "Global", "Time Comercial"… |
| `subagents` | `Subagent[] \| undefined` | `[]` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<ConnectionsCard
  name="Williams" scope="Global" avatar={<AppIcon icon={Sparkles} color="var(--ds-accent)" variant="soft" />}
  connections={[{ id: "meta", name: "Meta Ads", icon: Infinity, color, status: "connected" }, { id: "shop", name: "Shopify", status: "available", onConnect }]}
  subagents={[{ id: "brand", name: "Pesquisa de marca", status: "running" }]}
  results={[{ id: "doc", name: "Relatório semanal", fileName: "relatorio.docx" }]}
/>
```

## ConnectionState (type)

```ts
type ConnectionState = "connected" | "pending" | "error" | "disconnected"
```

## ConnectionStatus

Selo de estado de uma conexão.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `status` * | `ConnectionState` |  |  |
| `label` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<ConnectionStatus status="connected" />
<DataSyncTable rows={[{ label: "Produtos sincronizados", value: 15, icon: Package, href: "/produtos?origem=shopify" }]} />
<AccountRow name="Acme Store" url="acme-store.myshopify.com" mark={<AppIcon letter="A" color={cor} variant="soft" />}>
  <ToolPermissionList appName="Shopify" items={perms} onChange={(id, on) => …} />
</AccountRow>
```

## DataSyncTable

Tabela chave/valor do que está sincronizado.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `rows` * | `{ label: string; value: ReactNode; icon?: IconLike; href?: string; onClick?: () => void; hint?: ReactNode; }[]` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<ConnectionStatus status="connected" />
<DataSyncTable rows={[{ label: "Produtos sincronizados", value: 15, icon: Package, href: "/produtos?origem=shopify" }]} />
<AccountRow name="Acme Store" url="acme-store.myshopify.com" mark={<AppIcon letter="A" color={cor} variant="soft" />}>
  <ToolPermissionList appName="Shopify" items={perms} onChange={(id, on) => …} />
</AccountRow>
```

## HalftoneBand

Faixa decorativa pontilhada (meio-tom) que some para baixo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `height` | `number \| undefined` | `96` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<HalftoneBand />
<MarketplaceHero prompts={[{ app: slack, text: "Resumir as atualizações das conversas recentes", onClick }]} />
<AppGrid>
  {apps.map((a) => (
    <AppTile key={a.id} app={a} connected={connected[a.id]} href={`/apps/${a.id}\
```

## MarketplaceHero

Faixa de abertura do marketplace: degradê suave (tokens accent + info + série 2, funciona no escuro) com 1–3 pílulas de exemplo do que dá para pedir.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `prompts` * | `{ app: Pick<AppInfo, "name" \| "icon" \| "letter" \| "color">; text: string; onClick?: () => void; }[]` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `height` | `number \| undefined` | `172` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<HalftoneBand />
<MarketplaceHero prompts={[{ app: slack, text: "Resumir as atualizações das conversas recentes", onClick }]} />
<AppGrid>
  {apps.map((a) => (
    <AppTile key={a.id} app={a} connected={connected[a.id]} href={`/apps/${a.id}\
```

## PromptPill

Pílula de prompt com o app em destaque: "[Slack] Resumir as atualizações…".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `app` * | `Pick<AppInfo, "name" \| "color" \| "icon" \| "letter">` |  |  |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `onClick` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## QuickActionsField

Campo de "Ações rápidas" que abre a paleta (⌘K).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onOpen` * | `() => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Ações rápidas"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<QuickActionsField onOpen={() => setPalette(true)} />\n<SidebarProgressCard done={2} total={5} href="/primeiros-passos" />\n<TrialBanner daysLeft={14} onUpgrade={() => router.push("/assinatura")} />
```

## ResultRow

Resultado entregue pelo agente (documento, PDF, planilha).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `r` * | `AgentResult` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SidebarProgressCard

Cartão "Primeiros passos" no rodapé da sidebar: anel + contagem.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `done` * | `number` |  |  |
| `total` * | `number` |  |  |
| `href` | `string \| undefined` |  |  |
| `onClick` | `(() => void) \| undefined` |  |  |
| `title` | `string \| undefined` | `"Primeiros passos"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<QuickActionsField onOpen={() => setPalette(true)} />\n<SidebarProgressCard done={2} total={5} href="/primeiros-passos" />\n<TrialBanner daysLeft={14} onUpgrade={() => router.push("/assinatura")} />
```

## Subagent (type)

```ts
type Subagent = { id: string; name: string; icon?: IconLike; letter?: string; color?: string; status: "running" | "idle" | "done" | "error"; onClick?: () => void }
```

## SubagentRow

Subagente com ponto de estado (âmbar pulsando = executando).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `s` * | `Subagent` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ToolPermission (type)

```ts
type ToolPermission = { id: string; title: string; description: string; scope: "read" | "write"; enabled: boolean }
```

## ToolPermissionList

Permissões das ferramentas de UMA conta, separadas em leitura e escrita.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `ToolPermission[]` |  |  |
| `onChange` * | `(id: string, enabled: boolean) => void` |  |  |
| `appName` | `string \| undefined` |  | Nome do app para os textos de ajuda ("altera dados no Shopify"). |
| `title` | `string \| undefined` | `"Permissões das ferramentas"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<ConnectionStatus status="connected" />
<DataSyncTable rows={[{ label: "Produtos sincronizados", value: 15, icon: Package, href: "/produtos?origem=shopify" }]} />
<AccountRow name="Acme Store" url="acme-store.myshopify.com" mark={<AppIcon letter="A" color={cor} variant="soft" />}>
  <ToolPermissionList appName="Shopify" items={perms} onChange={(id, on) => …} />
</AccountRow>
```

## TrialBanner

Linha de teste grátis/plano no rodapé da sidebar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `daysLeft` * | `number` |  |  |
| `onUpgrade` * | `() => void` |  |  |
| `icon` | `ReactNode` |  |  |
| `upgradeLabel` | `string \| undefined` | `"Assinar"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-conexoes`):

```tsx
<QuickActionsField onOpen={() => setPalette(true)} />\n<SidebarProgressCard done={2} total={5} href="/primeiros-passos" />\n<TrialBanner daysLeft={14} onUpgrade={() => router.push("/assinatura")} />
```
