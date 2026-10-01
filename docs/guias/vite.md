# Usando com Vite (React)

```bash
pnpm add @g4ai/ds @base-ui/react lucide-react
pnpm add -D tailwindcss @tailwindcss/vite
```

## vite.config.ts

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { themeScript } from "@g4ai/ds/lib/theme";

// Injeta o script que aplica o tema salvo antes da primeira pintura (sem piscar).
const dsTheme = {
  name: "ds-theme",
  transformIndexHtml: () => [{ tag: "script", children: themeScript, injectTo: "head-prepend" as const }],
};

export default defineConfig({ plugins: [react(), tailwindcss(), dsTheme] });
```

## index.html

```html
<!doctype html>
<html lang="pt-BR" class="ds-app" data-theme="system">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## src/index.css

```css
@import "tailwindcss";
@import "@g4ai/ds/styles.css";
```

## Links e rotas

Sem roteador, os componentes com `href` renderizam `<a>`. Com React Router, registre o `Link` uma vez em `main.tsx`:

```tsx
import { forwardRef } from "react";
import { Link } from "react-router";
import { setLinkComponent } from "@g4ai/ds";

setLinkComponent(forwardRef<HTMLAnchorElement, { href: string }>(({ href, ...p }, ref) => <Link ref={ref} to={href} {...p} />));
```

A `Sidebar` precisa do caminho atual: passe `currentPath={useLocation().pathname}`.

## Checklist

- [ ] `npx g4os-ds doctor` sem ✗.
- [ ] `data-theme="dark"` no `<html>` deixa tudo escuro → tokens carregados.
- [ ] Figtree nos títulos → fonte carregada.

Resto da configuração (marca, fonte, `ds-app`): [instalação](instalacao.md).
