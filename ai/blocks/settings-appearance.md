# Aparência e marca

- Arquivo: `src/blocks/settings-appearance.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-appearance` (`?theme=dark` para o escuro)

Modo claro/escuro/sistema, marca do cliente (white-label) e tipografia aplicados ao vivo no app inteiro, com prévia e restauração.

## Conceito

**Objetivo:** Aplicar a marca do cliente (white-label), o modo e a tipografia no app inteiro, ao vivo.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- Prévia ao vivo antes de salvar; restaurar padrão
- Usa os tokens semânticos: só --ds-* mudam

**Quando usar e o que adaptar**

- Qualquer produto vendido para vários clientes

**Evite**

- Trocar cores em componentes em vez de tokens

## Componentes usados

`Badge`, `Button`, `Delta`, `SettingsSection`, `Switch`, `ThemeToggle`, `brandPresets`, `notify`, `typePresets`, `useTheme`
