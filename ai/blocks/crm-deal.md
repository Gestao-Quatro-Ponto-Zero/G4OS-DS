# Página do negócio

- Arquivo: `src/blocks/crm-deal.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-deal` (`?theme=dark` para o escuro)

Registro de um negócio (?id=): caminho de etapas, ganho/perda com motivo, nota rápida, feed, tarefas, arquivos, edição em gaveta.

## Conceito

**Objetivo:** Avançar um negócio: ver em que etapa está, registrar o que aconteceu e decidir ganho ou perda.

**Padrões aplicados**

- Anatomia C · Registro: trilha + título + Perdido/Ganho fixos; propriedades fixas à direita
- StagePath clicável; perda pede motivo
- Nota rápida alimenta o feed de atividade
- Edição longa em gaveta (Drawer)
- Duplicar cria a cópia em Qualificação e abre o novo registro; vincular contato com busca

**Quando usar e o que adaptar**

- Proposta (ATS), pedido (ERP), chamado (suporte)

**Evite**

- Ganho/perda sem motivo (perde o dado para o painel)

## Componentes usados

`ActionMenu`, `ActivityFeed`, `ActivityItem`, `Avatar`, `Badge`, `Button`, `Checkbox`, `Combobox`, `ConfirmDialog`, `CurrencyField`, `DatePicker`, `Drawer`, `Empty`, `EntityMark`, `FieldBlock`, `Modal`, `Page`, `PageHeading`, `PropertyList`, `Select`, `SplitLayout`, `StagePath`, `Tabs`, `TextField`, `areaClass`, `formatCurrency`, `formatDate`, `formatPercent`, `notify`
