# Equipe e permissões

- Arquivo: `src/blocks/settings-team.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-team` (`?theme=dark` para o escuro)

Membros com papel editável na linha, convites pendentes, uso de licenças, modal de convite em massa e remoção com confirmação.

## Conceito

**Objetivo:** Gerenciar quem tem acesso e com qual papel, dentro do limite de licenças.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- Papel editável na linha
- Convites pendentes e uso de licenças visíveis
- Convite em massa em modal; remoção com confirmação

**Quando usar e o que adaptar**

- Equipes de qualquer produto; usuários de cliente no portal

**Evite**

- Remover membro sem confirmação

## Componentes usados

`ActionMenu`, `Avatar`, `Badge`, `Button`, `ChoiceCards`, `Column`, `ConfirmDialog`, `DataTable`, `Empty`, `Meter`, `Modal`, `Select`, `TableToolbar`, `TagInput`, `normalize`, `notify`
