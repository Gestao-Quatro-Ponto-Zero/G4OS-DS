# layout

Arquivo: `src/components/layout.tsx` · importe de `@g4os/ds`.

Casca: AppShell, ShellBanner, EntityHeader, ReadingColumn, SplitLayout.

## AppShell

Casca do app: sidebar à esquerda (ou topo+drawer no celular), conteúdo que rola sozinho, toaster montado.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `product` * | `string` |  |  |
| `sidebar` * | `(state: { mobileOpen: boolean; close: () => void; }) => ReactNode` |  | Recebe mobileOpen e deve repassar para <Sidebar mobileOpen>. |
| `banner` | `ReactNode` |  | Faixa de alerta global acima do conteúdo (armazenamento, conexão). |
| `currentPath` | `string \| undefined` |  | Rota atual, para marcar a aba ativa. |
| `headerActions` | `ReactNode` |  | Ações à direita no cabeçalho do celular (notificações, avatar). |
| `mobileNav` | `"drawer" \| "tabbar" \| "both" \| undefined` | `"drawer"` |  |
| `tabs` | `NavItem[] \| undefined` |  | Destinos da pílula (3–4). |
| `workspace` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-layout`):

```tsx
<AppShell sidebar={({ mobileOpen }) => <IconRail groups={grupos} currentPath={rota} mobileOpen={mobileOpen} mark={<Logo />} />} …>
  <ResizableSplit storageKey="minha-tela" defaultSize={0.46} min={0.28} max={0.72}
    left={<Conversa />} right={<ArtifactPanel …/>} rightOpen={aberto} />
</AppShell>
```

## BottomNav

Barra de navegação em pílula, flutuando no rodapé (só no celular por padrão).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `currentPath` * | `string` |  |  |
| `items` * | `NavItem[]` |  |  |
| `alwaysVisible` | `boolean \| undefined` | `false` | true = também no desktop (apps que só existem como mobile). |
| `className` | `string \| undefined` |  |  |
| `more` | `{ open: boolean; onToggle: () => void; label?: string; } \| undefined` |  | Mostra "Mais" como último item (abre a gaveta/menu completo). |

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

## EntityHeader

Cabeçalho de uma ENTIDADE com seções (cliente, projeto, conta): trilha, marca + nome + descrição + ações, abas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `name` * | `string` |  |  |
| `actions` | `ReactNode` |  |  |
| `activeTab` | `string \| undefined` |  |  |
| `crumbs` | `Crumb[] \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `mark` | `ReactNode` |  |  |
| `meta` | `ReactNode` |  | Linha de sinais ao lado do título (saúde, pessoas, badge de status). |
| `onTabChange` | `((id: string) => void) \| undefined` |  |  |
| `tabs` | `TabItem[] \| undefined` |  |  |
| `tint` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ReadingColumn

Coluna de leitura (620px) centralizada, para páginas de texto e formulários longos.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SettingsLayout

Página de configurações: subnavegação à esquerda (vira faixa rolável de abas abaixo de 1024px) e conteúdo com título da seção.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `current` * | `string` |  | href do item ativo. |
| `nav` * | `SettingsNavItem[]` |  |  |
| `title` * | `string` |  |  |
| `actions` | `ReactNode` |  | Ações da seção (ao lado do título). |
| `description` | `ReactNode` |  |  |
| `heading` | `string \| null \| undefined` | `"Configurações"` | Título da página inteira. |
| `headingDescription` | `string \| undefined` |  |  |
| `navLabel` | `string \| undefined` | `"Seções de configuração"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/padroes-anatomia-de-pagina`):

```tsx
// A · Lista
<Page>
  <PageHeading title="Clientes" actions={<Button>Novo cliente</Button>} />
  <PageToolbar>            {/* gruda colada ao cabeçalho */}
    <SavedViews … />
    <FilterBar … search={<TableSearch … />} />
  </PageToolbar>
  <DataTable … />
</Page>

// C · Registro: a coluna de propriedades gruda abaixo do cabeçalho no desktop
<SplitLayout main={…} aside={<PropertyList … />} />   // stickyAside={false} para rolar junto

// D · Configurações: título fixo + subnavegação colada
<Page><SettingsLayout nav={…} current={…} title="Plano e cobrança">…</SettingsLayout></Page>
```

## SettingsNavItem (type)

```ts
type SettingsNavItem = { href: string; label: string; icon?: ComponentType<{ className?: string; strokeWidth?: number }>; badge?: ReactNode; }
```

## SettingsSection

Seção de configuração: rótulo e explicação à esquerda, campos à direita (empilha abaixo de 1024px).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `title` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ShellBanner

Faixa de alerta global (topo do main).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `tone` | `"warn" \| "bad" \| undefined` | `"warn"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SplitLayout

Registro: conteúdo principal + coluna de propriedades.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `aside` * | `ReactNode` |  |  |
| `main` * | `ReactNode` |  |  |
| `asideWidth` | `number \| undefined` | `320` |  |
| `stickyAside` | `boolean \| undefined` | `true` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/padroes-anatomia-de-pagina`):

```tsx
// A · Lista
<Page>
  <PageHeading title="Clientes" actions={<Button>Novo cliente</Button>} />
  <PageToolbar>            {/* gruda colada ao cabeçalho */}
    <SavedViews … />
    <FilterBar … search={<TableSearch … />} />
  </PageToolbar>
  <DataTable … />
</Page>

// C · Registro: a coluna de propriedades gruda abaixo do cabeçalho no desktop
<SplitLayout main={…} aside={<PropertyList … />} />   // stickyAside={false} para rolar junto

// D · Configurações: título fixo + subnavegação colada
<Page><SettingsLayout nav={…} current={…} title="Plano e cobrança">…</SettingsLayout></Page>
```
