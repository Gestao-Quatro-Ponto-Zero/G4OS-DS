# Dados e privacidade

- Arquivo: `src/blocks/settings-data.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-data` (`?theme=dark` para o escuro)

Exportação de dados (LGPD) com escolha de conjuntos e formato, histórico com download, retenção de registros e exclusão da organização com confirmação digitada e prazo para desistir.

## Conceito

**Objetivo:** Atender pedidos de portabilidade e exclusão da LGPD sem abrir chamado: o administrador exporta, define retenção e encerra a conta sozinho.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- Pedido assíncrono: o botão informa (useOperation) e o histórico mostra o andamento por ponto + texto
- Zona de perigo no fim, separada; nome digitado libera o botão e ConfirmDialog confirma
- Exclusão com prazo de 30 dias e saída para desistir

**Quando usar e o que adaptar**

- Portal do cliente (exportar meus dados), ERP (backup contábil), ATS (dados de candidatos)

**Evite**

- Excluir a organização com um clique
- Esconder quanto tempo o arquivo fica disponível

## Componentes usados

`Button`, `Callout`, `CheckboxGroup`, `Column`, `ConfirmDialog`, `DataTable`, `Empty`, `HealthDot`, `OperationButton`, `OperationFeedback`, `RadioGroup`, `Select`, `SettingsSection`, `Switch`, `TextField`, `downloadCsv`, `formatBytes`, `formatDate`, `formatRelative`, `notify`, `useOperation`
