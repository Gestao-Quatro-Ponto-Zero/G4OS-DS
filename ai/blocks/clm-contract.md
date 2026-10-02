# Contrato

- Arquivo: `src/blocks/clm-contract.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Contratos
- Preview: showcase `#/frame/clm-contract` (`?theme=dark` para o escuro)

Registro do contrato (?id=): caminho até a vigência, cláusulas-chave extraídas com risco, versões da minuta (dial + changelog), assinaturas ICP-Brasil/gov.br por ordem, obrigações com prazo, anexos e atividade. Ações mudam com a situação: enviar para aprovação, lembrar signatários, renovar por aditivo e encerrar.

## Conceito

**Objetivo:** Dar ao Jurídico tudo sobre um contrato numa tela: o que foi combinado, o que foge do padrão, quem falta assinar e o que precisa ser cumprido até quando.

**Padrões aplicados**

- Anatomia C · Registro: trilha, título e ações fixos; propriedades e contraparte fixas à direita (SplitLayout)
- StagePath mostra o caminho rascunho → vigente; vencido/encerrado como desfecho
- Ações por situação: Enviar para aprovação, Enviar para assinatura (com motivo quando bloqueado), Lembrar signatários, Renovar (Drawer), Encerrar (ConfirmDialog)
- Cláusulas-chave extraídas da minuta: fora do padrão com risco em palavra e comparação com o modelo
- Versões: RevisionTimeline para navegar por dia + Timeline com versão e data à esquerda (changelog)
- Assinaturas em ordem, com método (ICP-Brasil, gov.br) e lembrete individual
- ?aba= abre a aba certa; ?acao=renovar abre a renovação vinda da lista

**Quando usar e o que adaptar**

- Apólice (endossos e renovações), pedido de compra com aceite, convênio

**Evite**

- Encerrar sem mostrar a multa e o aviso prévio
- Enviar para assinatura sem a aprovação completa
- Editar o contrato vigente direto: mudança em contrato assinado é aditivo

## Componentes usados

`ActionMenu`, `ActivityFeed`, `ActivityItem`, `AiBadge`, `Avatar`, `Badge`, `Button`, `Callout`, `Checkbox`, `ConfirmDialog`, `CurrencyField`, `DateBadge`, `DatePicker`, `Drawer`, `Empty`, `EntityMark`, `FileDropzone`, `FilesList`, `LocationTag`, `Meter`, `NextStep`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `RevisionTimeline`, `Select`, `SplitLayout`, `StagePath`, `StatCell`, `StatGrid`, `Tabs`, `TextField`, `TextareaField`, `Timeline`, `UploadItem`, `formatCurrency`, `formatDate`, `formatPercent`, `notify`, `plural`, `useOperation`
