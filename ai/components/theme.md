# theme

Arquivo: `src/components/theme.tsx` · importe de `@g4ai/ds`.

ThemeToggle (claro/escuro/sistema).

## ThemeToggle

Alternador Claro · Escuro · Sistema.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `compact` | `boolean \| undefined` | `false` |  |
| `mode` | `ThemeMode \| undefined` |  |  |
| `onChange` | `((mode: ThemeMode) => void) \| undefined` |  |  |
| `variant` | `"segmented" \| "menu" \| undefined` | `"segmented"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-pagina-e-listas`):

```tsx
<ThemeToggle variant="menu" />
```
