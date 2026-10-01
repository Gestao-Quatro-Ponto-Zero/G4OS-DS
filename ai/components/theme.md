# theme

Arquivo: `src/components/theme.tsx` · importe de `@g4os/ds`.

ThemeToggle (claro/escuro/sistema).

## ThemeToggle

Alternador Claro · Escuro · Sistema.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `compact` | `boolean \| undefined` | `false` |  |
| `mode` | `ThemeMode \| undefined` |  |  |
| `onChange` | `((mode: ThemeMode) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

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
