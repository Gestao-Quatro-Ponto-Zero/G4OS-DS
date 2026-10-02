# Perfil

- Arquivo: `src/blocks/settings-profile.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-profile` (`?theme=dark` para o escuro)

Configurações com subnavegação lateral (vira abas roláveis no celular), seções rótulo-à-esquerda, barra de alterações não salvas e zona de perigo.

## Conceito

**Objetivo:** Manter os dados da pessoa e da conta com segurança e sem perder alterações.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- Seções rótulo-à-esquerda
- Barra de alterações não salvas no rodapé
- Zona de perigo separada no fim

**Quando usar e o que adaptar**

- Perfil de empresa, dados fiscais

**Evite**

- Ação destrutiva no meio do formulário

## Componentes usados

`Avatar`, `Button`, `Callout`, `ConfirmDialog`, `MaskedField`, `Modal`, `Select`, `SettingsSection`, `TextField`, `TextareaField`, `masks`, `notify`
