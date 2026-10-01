# nav-tree

Arquivo: `src/components/nav-tree.tsx` · importe de `@g4ai/ds`.

Navegação com subitens: tipos NavItem/NavGroup/NavSubItem/NavParentItem da Sidebar, WorkspaceMenu, menu da pessoa, SectionNav (docs/ajuda), flyout do trilho recolhido e helpers navMatches/navActiveDeep.

## navActiveDeep (function)

O item ou um descendente está ativo.

```ts
navActiveDeep(item, currentPath): boolean
```

## NavEntry (type)

Entrada de um grupo da Sidebar: item com destino (com ou sem subitens) ou item-pai sem destino.

```ts
type NavEntry = NavItem | NavParentItem
```

## NavFlyout

Item com subitens no trilho recolhido: o ícone abre um menu à direita (hover, clique, Enter/Espaço/↓ ou →) com o nome do item e os subitens.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  | Conteúdo do gatilho (ícone, marcador, ponto). |
| `currentPath` * | `string` |  |  |
| `item` * | `{ href?: string; label: string; match?: string; items?: NavSubItem[]; }` |  |  |
| `onNavigate` | `(() => void) \| undefined` |  |  |
| `triggerClassName` | `string \| undefined` |  | Classes do gatilho (o botão do ícone). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## NavGroup (type)

```ts
type NavGroup = { label: string; items: NavEntry[]; collapsible?: boolean; defaultOpen?: boolean; action?: NavGroupAction; limit?: number; }
```

## NavGroupAction (type)

```ts
type NavGroupAction = { label: string; icon?: ReactNode; onSelect?: () => void; href?: string }
```

## navHasActiveChild (function)

Algum descendente (subitem, sub-subitem) está ativo?

```ts
navHasActiveChild(item, currentPath): boolean
```

## navHref (function)

Destino de um item: o próprio href ou o do primeiro subitem.

```ts
navHref(item): string
```

## NavIcon (type)

```ts
type NavIcon = ComponentType<{ className?: string; strokeWidth?: number | string }>
```

## NavItem (type)

```ts
type NavItem = { href: string; label: string; icon: NavIcon; match?: string; badge?: number; items?: NavSubItem[]; defaultOpen?: boolean; actions?: MenuEntry[]; }
```

## navMatches (function)

O caminho atual corresponde a este destino (exato ou prefixo de segmento)?

```ts
navMatches(target, currentPath): boolean
```

## NavParentItem (type)

Item-pai sem página própria ("Cadastros"): a linha inteira só abre e fecha os subitens.

```ts
type NavParentItem = Omit<NavItem, "href" | "items"> & { href?: undefined; items: NavSubItem[] }
```

## NavRailItem

Item do trilho recolhido da Sidebar: link com tooltip, ou flyout se tiver subitens.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `currentPath` * | `string` |  |  |
| `item` * | `NavEntry` |  |  |
| `onNavigate` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## NavSection (type)

```ts
type NavSection = { label: string; href?: string; items: NavSubItem[]; }
```

## NavSubItem (type)

Subitem de um item da navegação.

```ts
type NavSubItem = { href: string; label: string; match?: string; badge?: number; items?: NavSubItem[]; }
```

## NavTreeGroup

Peça interna da Sidebar (grupo com recolher, + e “Mais”).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `currentPath` * | `string` |  |  |
| `group` * | `NavGroup` |  |  |
| `open` * | `Record<string, boolean>` |  |  |
| `setOpen` * | `(id: string, value: boolean) => void` |  |  |
| `onNavigate` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## NavTreeItem

Peça interna da Sidebar (item aberto com subitens).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `currentPath` * | `string` |  |  |
| `idPrefix` * | `string` |  |  |
| `item` * | `NavEntry` |  |  |
| `open` * | `Record<string, boolean>` |  |  |
| `setOpen` * | `(id: string, value: boolean) => void` |  |  |
| `onNavigate` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SectionNav

Navegação de seções para conteúdo longo (documentação, central de ajuda, configurações com muitas páginas): só texto, títulos de seção, subitens na linha-guia, filtro opcional fixo no topo e o item ativo sempre visível.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `currentPath` * | `string` |  |  |
| `sections` * | `NavSection[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Seções"` |  |
| `onNavigate` | `(() => void) \| undefined` |  | Chamado ao clicar num item (feche a gaveta no celular). |
| `search` | `boolean \| undefined` | `false` | Campo de filtro (use com 20+ itens). |
| `searchPlaceholder` | `string \| undefined` | `"Filtrar seções…"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ Documentação, central de ajuda e configurações com 20+ páginas: só texto, seções, `search` a partir de ~20 itens, `onNavigate={close}` na gaveta do celular.

**Evite**

- ✗ Ícone em cada item ou usar a Sidebar com ícones para 30 páginas de documentação.

Exemplo (showcase `#/p/nav-sidebar-submenus`):

```tsx
const sections: NavSection[] = [
  { label: "Primeiros passos", items: [{ href: "/docs/instalacao", label: "Instalação" }] },
  { label: "Construindo o app", items: [
    { href: "/docs/dados", label: "Buscar dados", items: [{ href: "/docs/dados/cache", label: "Cache" }] },
  ] },
];

<Sidebar product="Docs" currentPath={pathname} nav={<SectionNav sections={sections} currentPath={pathname} search onNavigate={close} />} />
// ou numa coluna da página:
<SectionNav sections={sections} currentPath={pathname} className="h-[calc(100dvh-64px)] sticky top-0" />
```

## SidebarUser (type)

```ts
type SidebarUser = { name: string; initials?: string; role?: string; email?: string; avatar?: string; href?: string; menu?: MenuEntry[]; }
```

## SidebarUserMenu

Rodapé com a pessoa logada; com `menu`, abre um menu (à direita no desktop, para cima no celular).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `user` * | `SidebarUser` |  |  |
| `collapsed` | `boolean \| undefined` | `false` |  |
| `mobile` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## sumBadges (function)

Soma dos contadores dos subitens (todos os níveis).

```ts
sumBadges(items?): number
```

## useNavOpenState (hook)

Estado aberto/fechado da árvore (por id), persistido com `storageKey`.

```ts
useNavOpenState(storageKey?): readonly [Record<string, boolean>, (id: string, open: boolean) => void]
```

## Workspace (type)

```ts
type Workspace = { id: string; name: string; plan?: string; logo?: ReactNode; }
```

## WorkspaceMenu

Seletor de workspace/empresa no topo da sidebar (`<Sidebar header={…}>`): logo, nome e plano; o menu lista os workspaces com atalhos ⌘1…⌘9 e "Adicionar workspace".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onValueChange` * | `(id: string) => void` |  |  |
| `value` * | `string` |  |  |
| `workspaces` * | `Workspace[]` |  |  |
| `addLabel` | `string \| undefined` | `"Adicionar workspace"` |  |
| `className` | `string \| undefined` |  |  |
| `collapsed` | `boolean \| undefined` | `false` | Trilho recolhido: só o logo. |
| `label` | `string \| undefined` | `"Trocar de workspace"` |  |
| `onAdd` | `(() => void) \| undefined` |  |  |
| `shortcuts` | `boolean \| undefined` | `true` | ⌘1…⌘9 (Ctrl no Windows/Linux) trocam de workspace. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ `<Sidebar header={<WorkspaceMenu workspaces={ws} value={id} onValueChange={trocar} onAdd={criar} collapsed={collapsed} />} …/>`: só quando a pessoa tem mais de um workspace.

**Evite**

- ✗ Confundir com `WorkspaceSwitcher` (rodapé da coluna de sessões de IA).

Exemplo (showcase `#/p/nav-sidebar-submenus`):

```tsx
<Sidebar
  header={<WorkspaceMenu workspaces={workspaces} value={ws} onValueChange={setWs} onAdd={criarWorkspace} collapsed={collapsed} />}
  user={{ name: "Ana Lopes", email: "ana@acme.com.br", menu: [
    { label: "Conta", icon: <User />, href: "/conta" },
    { label: "Faturamento", icon: <CreditCard />, href: "/conta/faturamento" },
    { type: "separator" },
    { label: "Sair", icon: <LogOut />, onSelect: sair },
  ] }}
  …
/>
```
