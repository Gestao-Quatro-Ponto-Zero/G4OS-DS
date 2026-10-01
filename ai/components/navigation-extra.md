# navigation-extra

Arquivo: `src/components/navigation-extra.tsx` · importe de `@g4ai/ds`.

NavigationMenu: navegação de site/portal com painéis de links.

## NavigationMenu

Menu de navegação de site público, portal do cliente ou central de ajuda: links diretos e painéis com links descritos (título + descrição + ícone).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `NavigationMenuEntry[]` |  |  |
| `label` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/nav-menus-de-site`):

```tsx
<NavigationMenu
  label="Navegação principal"
  items={[
    { label: "Produto", links: [
      { title: "Pipeline", description: "Negócios por etapa, com previsão.", href: "/produto/pipeline", icon: <Workflow /> },
      { title: "Relatórios", description: "Painéis prontos e exportação.", href: "/produto/relatorios", icon: <BarChart3 /> },
    ] },
    { label: "Recursos", links: [...] },
    { label: "Preços", href: "/precos" },
  ]}
/>
```

## NavigationMenuEntry (type)

```ts
type NavigationMenuEntry = | { label: string; href: string; active?: boolean } | { label: string; links: NavigationMenuLinkItem[]; feature?: ReactNode; active?: boolean; }
```

## NavigationMenuLinkItem (type)

```ts
type NavigationMenuLinkItem = { title: string; href: string; description?: string; icon?: ReactNode; }
```
