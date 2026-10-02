# Ordem de serviço

- Arquivo: `src/blocks/srv-work-order.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Serviços
- Preview: showcase `#/frame/srv-work-order` (`?theme=dark` para o escuro)

Registro da OS (?id=): etapas, checklist de execução, apontamento de horas por técnico, materiais, fotos e anexos, assinatura do cliente, local do atendimento com hora local, histórico e ações por estado (Agendar, Iniciar, Concluir, Faturar → NFS-e).

## Conceito

**Objetivo:** Levar um atendimento do chamado à nota fiscal com prova do que foi feito: checklist, horas, materiais, fotos e assinatura.

**Padrões aplicados**

- Anatomia C · Registro: trilha, título, ação do estado à direita; propriedades fixas na coluna
- Uma ação primária por estado: Agendar → Iniciar → Concluir → Faturar; Concluir exige checklist e assinatura (disabledReason diz o que falta)
- Abas: Execução (checklist + assinatura), Horas e materiais, Fotos e anexos, Histórico (Timeline)
- LocationTag mostra o local e a hora local do atendimento; SLA em palavra
- Valor a faturar separa mão de obra coberta pelo contrato de materiais
- Orçamento aprovado abre aqui como OS nova (?id=orc-<orçamento>)

**Quando usar e o que adaptar**

- Chamado de assistência técnica, visita de vistoria, entrega com comprovante

**Evite**

- Concluir sem assinatura (o cliente contesta a cobrança)
- Todas as ações visíveis em todos os estados

## Componentes usados

`ActionMenu`, `Attachment`, `AttachmentContent`, `AttachmentDescription`, `AttachmentGroup`, `AttachmentMedia`, `AttachmentTitle`, `Avatar`, `Badge`, `Button`, `Callout`, `Checkbox`, `Combobox`, `ConfirmDialog`, `EntityMark`, `FileDropzone`, `IconButton`, `LocationTag`, `Meter`, `Modal`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `Select`, `SplitLayout`, `StagePath`, `Table`, `Tabs`, `TextField`, `Timeline`, `TimelineItem`, `formatCurrency`, `formatDate`, `formatNumber`, `notify`, `useOperation`
