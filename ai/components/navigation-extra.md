# navigation-extra

Arquivo: `src/components/navigation-extra.tsx` · importe de `@g4ai/ds`.

NavigationMenu: navegação de site/portal com painéis de links.

## NavigationMenu

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `NavigationMenuEntry[]` |  |  |
| `label` * | `string` |  | Nome acessível ("Navegação principal"). |
| `className` | `string \| undefined` |  |  |
| `indicator` | `boolean \| undefined` | `false` | Seta apontando do painel para o item aberto. |
| `mobile` | `"none" \| "menu" \| undefined` | `"menu"` | Abaixo de 768px: `menu` troca a barra por um botão "Menu" com todos os links; `none` não muda nada (você cuida). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/_shadcn-extras`):

```tsx
<NavigationMenu label="Navegação do portal" indicator items={[
  { label: "Produto", icon: <BarChart3 />, links: […] },
  { label: "Recursos", icon: <BookOpen />, links: […] },
  { label: "Preços", href: "/precos", icon: <CreditCard /> },
]} />
<a className={navigationMenuTriggerClass} href="/contato">Contato</a>
```

## NavigationMenuEntry (type)

```ts
type NavigationMenuEntry = | { label: string; href: string; active?: boolean; icon?: ReactNode } | { label: string; icon?: ReactNode; links: NavigationMenuLinkItem[]; feature?: ReactNode; active?: boolean; }
```

## NavigationMenuLinkItem (type)

```ts
type NavigationMenuLinkItem = { title: string; href: string; description?: string; icon?: ReactNode; }
```

## navigationMenuTriggerClass (const)

Visual do gatilho do NavigationMenu, para links soltos ao lado dele (equivale a navigationMenuTriggerStyle).
