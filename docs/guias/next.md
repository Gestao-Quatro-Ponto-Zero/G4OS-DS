# Usando com Next.js (App Router)

```bash
pnpm add @g4ai/ds @base-ui/react lucide-react
pnpm add -D tailwindcss @tailwindcss/postcss
```

`postcss.config.mjs`: `export default { plugins: { "@tailwindcss/postcss": {} } };`. Passos comuns (CSS, fonte, tema): [instalação](instalacao.md).

## Estrutura recomendada

```
app/
  globals.css            @import "tailwindcss" + @import "@g4ai/ds/styles.css"
  layout.tsx             <html className="ds-app"> + fonte + <DsSetup/>
  (auth)/entrar/page.tsx tela cheia, sem sidebar
  (app)/layout.tsx       AppShell + Sidebar (client component)
  (app)/page.tsx         dashboard
  (app)/negocios/page.tsx
  (app)/negocios/[id]/page.tsx
lib/ds.tsx               "use client"; setLinkComponent(Link)
```

O starter em [`templates/next-app`](../../templates/next-app) segue exatamente isso.

## Server × client

- Os componentes do DS com estado ou efeitos começam com `"use client"`. Você pode importá-los direto de Server Components; o limite cliente fica no componente.
- `Sidebar` precisa do caminho atual: envolva num client component que usa `usePathname()` e passa `currentPath`.
- `setLinkComponent` precisa rodar no cliente antes do primeiro render que usa links: um componente `"use client"` renderizado no `layout.tsx` raiz que chama `setLinkComponent(Link)` no corpo do módulo.
- Gráficos medem o contêiner no cliente; no servidor renderizam só a moldura (altura reservada), sem salto de layout.

## Dados

- Formate no componente com `lib/format` (é puro, funciona no servidor).
- Estado de lista (filtros, página, ordenação, registro aberto em drawer) na URL com `useSearchParams`. Preferência visual (densidade, lista/cards) com `useCollectionDisplay`.
- `useOperation` recebe qualquer Promise: Server Action, `fetch`, SDK.

```tsx
const op = useOperation({ busyLabel: "Salvando…" });
<OperationButton operation={op} onClick={() => op.run(() => saveDeal(form), { message: "Negócio salvo" })}>
  Salvar negócio
</OperationButton>
<OperationFeedback operation={op} />
```

## Carregamento

- `loading.tsx` com `Skeleton` na forma da tela (não spinner).
- Não envolva a tela cliente inteira em `<Suspense>` no `page.tsx` de servidor quando a navegação é pelo menu: o fallback atrasa a revelação. Prefira fronteiras por região.

## Checklist

- [ ] `@import "tailwindcss"; @import "@g4ai/ds/styles.css";` no CSS global (os `@source` do DS já vêm dentro).
- [ ] `<html lang="pt-BR" className="ds-app" data-theme="system" suppressHydrationWarning>` + `themeScript` no `<head>`.
- [ ] `setLinkComponent(Link)` registrado num módulo cliente.
- [ ] Figtree carregada (`next/font/google` + `--ds-font-sans`).
- [ ] `npx g4os-ds doctor` sem ✗.

Não precisa de `transpilePackages`: o pacote publicado já vem compilado. (Exceção: link local do código-fonte ao desenvolver o próprio DS.)
