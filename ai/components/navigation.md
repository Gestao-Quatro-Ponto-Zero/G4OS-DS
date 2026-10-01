# navigation

Arquivo: `src/components/navigation.tsx` · importe de `@g4os/ds`.

Navegação: Sidebar, PageHeading, StickyHeader, Breadcrumb, ContextBar, Tabs, SegmentedControl, ActionMenu, ProductMark.

## ActionMenu

Menu "⋯" de ações secundárias de linha, card ou cabeçalho.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `actions` * | `MenuAction[]` |  |  |
| `align` | `"start" \| "end" \| undefined` | `"end"` |  |
| `className` | `string \| undefined` |  |  |
| `defaultOpen` | `boolean \| undefined` |  |  |
| `label` | `string \| undefined` | `"Mais ações"` |  |
| `trigger` | `ReactNode` |  |  |
| `variant` | `"primary" \| "ghost" \| undefined` | `"ghost"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-menus`):

```tsx
<ActionMenu actions={[{ label: "Editar", icon: <Pencil /> }, { label: "Excluir", tone: "danger", separator: true }]} />
```

## actionMenuTriggerClass (function)

```ts
actionMenuTriggerClass(variant?, custom?): string
```

## Breadcrumb

Trilha. REGRA: só ancestrais, nunca a página atual (o título é a página atual).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `Crumb[]` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ContextBar

Barra de contexto de uma página de REGISTRO (ciclo, tarefa, reunião, membro).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `Crumb[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `leading` | `ReactNode` |  |  |
| `trailing` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Crumb (type)

```ts
type Crumb = { label: string; href?: string }
```

## MenuAction (type)

```ts
type MenuAction = { label: string; icon?: ReactNode; onSelect?: () => void; href?: string; disabled?: boolean; tone?: "neutral" | "danger"; checked?: boolean; separator?: boolean; }
```

## NavGroup (type)

```ts
type NavGroup = { label: string; items: NavItem[] }
```

## NavItem (type)

```ts
type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; match?: string; badge?: number; }
```

## PageHeading

Título da tela + descrição opcional + ações à direita.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `actions` | `ReactNode` |  |  |
| `compact` | `boolean \| undefined` | `false` |  |
| `crumbs` | `Crumb[] \| undefined` |  |  |
| `description` | `string \| undefined` |  |  |
| `kicker` | `ReactNode` |  | Linha acima do título (ex.: data na home). |
| `sticky` | `boolean \| undefined` | `true` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/filtros-datas`):

```tsx
const [range, setRange] = useState(resolveDateRange("last30"));

<PageHeading
  title="Vendas"
  description={`${describeDateRange(range)} · comparado ao período anterior\
```

## ProductMark

Marca-padrão (grafo de três nós, um dourado).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `size` | `number \| undefined` | `28` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SegmentedControl

Alterna visualização ou recorte (Lista | Cards; Plano | Ciclos | Cronograma).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onChange` * | `(value: T) => void` |  |  |
| `options` * | `{ value: T; label: string; icon?: ReactNode; }[]` |  |  |
| `value` * | `T` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-como-montar`):

```tsx
<Page>
  <PageHeading title="…" description="período e fonte" actions={<SegmentedControl …/>} />
  <KpiGrid>          {/* 3–5 KPIs com delta e período */}
  <ChartCard>        {/* a pergunta principal, largura total */}
  <div className="grid gap-6 lg:grid-cols-2">   {/* ou 3/5 + 2/5 */}
    <ChartCard/> <ChartCard/>                   {/* perguntas de apoio */}
  </div>
  <DataTable />      {/* o detalhe acionável: quem, qual, quanto */}
</Page>
```

## Sidebar

Navegação principal do app: marca + busca + grupos rotulados + rodapé com a pessoa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `currentPath` * | `string` |  |  |
| `groups` * | `NavGroup[]` |  |  |
| `product` * | `string` |  |  |
| `collapsed` | `boolean \| undefined` | `false` |  |
| `footer` | `ReactNode` |  |  |
| `mark` | `ReactNode` |  |  |
| `mobileOpen` | `boolean \| undefined` | `false` |  |
| `onSearch` | `(() => void) \| undefined` |  |  |
| `onToggle` | `(() => void) \| undefined` |  |  |
| `user` | `{ name: string; initials: string; role?: string; href?: string; } \| undefined` |  |  |
| `workspace` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/nav-mobile`):

```tsx
const nav = [
  { href: "/", label: "Início", icon: Home },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, badge: 3 },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/config", label: "Configurações", icon: Settings },
];

<AppShell
  product="Acme CRM"
  mobileNav="both"                  // "drawer" | "tabbar" | "both"
  tabs={nav.slice(0, 4)}            // 3–4 destinos da pílula
  currentPath={pathname}
  headerActions={<NotificationsButton />}
  sidebar={(p) => <Sidebar {...p} product="Acme CRM" groups={[{ label: "Vendas", items: nav }]} currentPath={pathname} />}
>
  {children}
</AppShell>
```

## StickyHeader

Cabeçalho que gruda no topo do ancestral rolável e marca `data-stuck` quando grudou.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `enabled` | `boolean \| undefined` | `true` |  |
| `scroller` | `string \| undefined` |  | Seletor de um irmão que rola no lugar do ancestral (cabeçalho fixo acima de painel rolável). |
| `scrollerKey` | `string \| undefined` |  | Reanexa quando o irmão rolável é recriado (troca de rota). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SyncStatus

Indicador de sincronização no pé da sidebar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `state` * | `"ok" \| "pending" \| "error"` |  |  |
| `collapsed` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## TabItem (type)

```ts
type TabItem = { id: string; label: string; href?: string; count?: number; }
```

## Tabs

Abas de seção de uma entidade: sublinhado de 2px ink na ativa, 12px.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `TabItem[]` |  |  |
| `label` * | `string` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `onChange` | `((id: string) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.
