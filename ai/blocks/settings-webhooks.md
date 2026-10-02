# Webhooks

- Arquivo: `src/blocks/settings-webhooks.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-webhooks` (`?theme=dark` para o escuro)

Endpoints com eventos, status e taxa de sucesso; criar e editar em Drawer, pausar, excluir com confirmação, entregas recentes com reenvio e os cinco estados (?estado=carregando|vazio|erro).

## Conceito

**Objetivo:** Ligar o workspace a outros sistemas por eventos e descobrir rápido quando uma entrega falha.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- Status por ponto + texto; endpoint falhando pinta a linha
- Criar/editar em Drawer com useOperation + OperationButton
- Entregas recentes com reenvio; excluir com ConfirmDialog
- Cinco estados: carregando, vazio, vazio por busca (Limpar), erro, com dados

**Quando usar e o que adaptar**

- Integrações de ERP, notificações de pagamento no financeiro, eventos de candidatura no ATS

**Evite**

- Mostrar o segredo inteiro na lista
- Excluir endpoint sem confirmação
- Falha de entrega só em log técnico

## Componentes usados

`ActionMenu`, `Button`, `CheckboxGroup`, `Column`, `ConfirmDialog`, `CopyButton`, `DataTable`, `Drawer`, `Empty`, `ErrorState`, `HealthDot`, `OperationButton`, `OperationFeedback`, `Skeleton`, `TableToolbar`, `TextField`, `formatNumber`, `formatPercent`, `formatRelative`, `normalize`, `notify`, `useOperation`
