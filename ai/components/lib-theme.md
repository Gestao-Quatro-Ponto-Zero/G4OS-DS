# lib-theme

Arquivo: `src/lib/theme.ts` · importe de `@g4os/ds`.

Tema e marca: useTheme, applyTheme, themeScript, brandPresets.

## applyTheme (function)

Aplica tema/marca no documento (ou em outro elemento raiz).

```ts
applyTheme(mode, brand?, root?, type?): void
```

## BRAND_KEY (const)

## brandPresets (const)

Presets de themes.css.

## resolvedTheme (function)

Tema efetivo agora ("system" resolvido pelo SO).

```ts
resolvedTheme(mode): "light" | "dark"
```

## THEME_KEY (const)

## ThemeMode (type)

```ts
type ThemeMode = "light" | "dark" | "system"
```

## themeScript (const)

Script inline para o <head>: aplica o tema salvo antes da primeira pintura.

## TYPE_KEY (const)

## typePresets (const)

Presets de tipografia (eixo independente da cor): <html data-type="…">.

## useTheme (hook)

Estado de tema + marca com persistência.

```ts
useTheme(initial?, options?): { mode: ThemeMode; setMode: (m: ThemeMode) => void; brand: string; setBrand: (b: string) => void; type: str…
```

Exemplo (showcase `#/p/fund-temas`):

```tsx
// app/layout.tsx (Next.js)
import { themeScript } from "@g4os/ds";

<html lang="pt-BR" className="ds-app" data-theme="system" suppressHydrationWarning>
  <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
  …

// em qualquer lugar (sidebar, menu do usuário)
import { ThemeToggle, useTheme } from "@g4os/ds";
<ThemeToggle />                      // Claro · Escuro · Sistema
const { mode, setMode, brand, setBrand, resolved } = useTheme();

// variante do Tailwind para casos pontuais
<img className="dark:invert" … />
```
