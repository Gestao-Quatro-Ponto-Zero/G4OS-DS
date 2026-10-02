# Papéis e permissões

- Arquivo: `src/blocks/settings-roles.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-roles` (`?theme=dark` para o escuro)

Matriz de papéis × permissões por módulo, papéis de sistema bloqueados, criar, duplicar e editar papel em Drawer e pessoas por papel com link para a equipe.

## Conceito

**Objetivo:** Decidir o que cada papel pode fazer, vendo todos os papéis lado a lado, sem abrir um por um.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- Matriz com Checkbox por célula, agrupada por módulo
- Papéis de sistema visíveis mas bloqueados, com o motivo
- Criar e editar papel em Drawer (useOperation + OperationButton); barra de alterações não salvas para a matriz

**Quando usar e o que adaptar**

- Permissões de portal do cliente, perfis de acesso de ERP, alçadas de aprovação no financeiro

**Evite**

- Uma página por papel para comparar permissões
- Deixar editar o papel de administrador e perder o acesso

## Componentes usados

`ActionMenu`, `Badge`, `Button`, `Checkbox`, `CheckboxGroup`, `Column`, `ConfirmDialog`, `DataTable`, `Drawer`, `OperationButton`, `OperationFeedback`, `Select`, `SettingsSection`, `TextField`, `TextareaField`, `Tooltip`, `notify`, `useOperation`
