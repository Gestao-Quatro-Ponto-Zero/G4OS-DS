# Instalação

O pacote `@g4ai/ds` é distribuído como **código-fonte** (TSX + CSS). O Tailwind v4 do seu app compila as classes dos componentes; o bundler do app (Next, Vite) compila o TSX. Não há passo de build do DS.

## Requisitos

- React 19, Tailwind CSS 4.3+, TypeScript 5.
- Peer deps: `@base-ui/react`, `lucide-react`, `react`, `react-dom`, `tailwindcss`. Datas não precisam de dependência extra (Calendar próprio).

## 1. Instalar

```bash
npm i @base-ui/react lucide-react
npm i -D tailwindcss @tailwindcss/postcss       # Next.js
# ou: npm i -D tailwindcss @tailwindcss/vite    # Vite

# o DS (escolha um)
npm i ../G4OS-DS                                # pasta local (monorepo, desenvolvimento)
npm i github:<org>/G4OS-DS                      # repositório git
```

## 2. CSS global

```css
/* app/globals.css (Next) ou src/index.css (Vite) */
@import "tailwindcss";
@import "@g4ai/ds/styles.css";   /* tokens, temas de marca, base e componentes */

/* Opcional: componentes do shadcn/ui ou 21st.dev com a cara do DS */
/* @import "@g4ai/ds/shadcn.css"; */
```

`styles.css` já declara os `@source` dos componentes e blocos (relativos a ele), então o Tailwind do app compila as classes do DS sem configuração. Se o seu gerenciador de pacotes usar links que o Tailwind não segue (alguns setups de pnpm), acrescente no CSS do app: `@source "../node_modules/@g4ai/ds/src";` (relativo ao arquivo CSS).

## 3. Fonte e raiz

```tsx
// Next: app/layout.tsx
import { Figtree } from "next/font/google";
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

import { themeScript } from "@g4ai/ds";

<html lang="pt-BR" className={`ds-app ${figtree.variable}`} data-theme="system" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  </head>
```

A fonte vem do semântico `--ds-font-sans` (padrão `"Figtree"`); com `next/font`, adicione ao CSS: `:root { --ds-font-sans: var(--font-figtree), ui-sans-serif, system-ui, sans-serif; }` ou carregue a Figtree pelo Google Fonts no `<head>` (como no showcase). Marcas podem trocar a fonte ([temas](../fundamentos/temas-e-dark-mode.md)).

- `ds-app` trava a rolagem do documento: só as áreas de trabalho rolam. Em site de conteúdo, não use.
- `lang="pt-BR"` é obrigatório (leitores de tela e hifenização).
- `data-theme` = `light`, `dark` ou `system`; `themeScript` aplica o tema salvo antes da primeira pintura. Troque com `ThemeToggle` / `useTheme()`. Marca de cliente: `data-brand="…"` ([temas](../fundamentos/temas-e-dark-mode.md)).

## 4. Links do framework

Componentes que navegam (`Button href`, `Card href`, `Sidebar`, `Breadcrumb`, `Tabs` com `href`) renderizam `<a>` por padrão. Registre o `Link` do framework **uma vez**, num módulo cliente importado pelo layout:

```tsx
"use client";
import Link from "next/link";
import { setLinkComponent } from "@g4ai/ds";
setLinkComponent(Link);
```

## 5. TypeScript

O pacote publicado no npm já vem compilado (`dist/`, ESM com `"use client"` e tipos): Next.js e Vite funcionam sem configuração extra.

Só se você usar o código-fonte direto (link local `npm i ../G4OS-DS` durante o desenvolvimento do DS, ou `import … from "@g4ai/ds/source"`), adicione no Next:

```ts
const config = { transpilePackages: ["@g4ai/ds"] };
```

## 6. Usar

```tsx
import { AppShell, Sidebar, Page, PageHeading, KpiGrid, KpiCard, ChartCard, AreaChart, formatCurrency } from "@g4ai/ds";
```

Imports por módulo também funcionam: `@g4ai/ds/components/charts`, `@g4ai/ds/lib/format`, `@g4ai/ds/tokens`.

## Conferir

- [ ] `npx g4os-ds doctor` sem itens ✗ (React 19, Tailwind v4, Base UI, CSS, tema, fonte).
- [ ] Um `Button` aparece em tinta escura com cantos de 8 px → CSS carregou.
- [ ] `data-theme="dark"` no `<html>` deixa tudo escuro sem mexer em componente → tokens OK.
- [ ] Classes como `bg-soft`, `text-muted` funcionam no seu código → tokens carregados.
- [ ] `Select` abre por cima de um `Drawer` → portais OK.
- [ ] Figtree nos títulos → fonte OK.

Starter pronto: [`templates/next-app`](../../templates/next-app/README.md). Detalhes de Next: [next.md](next.md).
