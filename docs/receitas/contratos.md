# Receita: gestão de contratos (CLM)

Ciclo de vida do contrato: solicitação, minuta a partir de modelo, aprovação por alçada, assinatura eletrônica, vigência com obrigações e prazos, renovação por aditivo e encerramento. Usado por Jurídico, Compras e áreas que contratam.

## Entidades

| Entidade | Identidade | Campos que decidem | Relações |
| --- | --- | --- | --- |
| **Contrato** | número + objeto | situação (rascunho → em aprovação → em assinatura → vigente; vencido, encerrado), tipo, valor, vigência, renovação automática, aviso prévio, responsável | contraparte, modelo, versões, assinaturas, obrigações, anexos |
| **Contraparte** | razão social + CNPJ (`EntityMark`) | sede (hora local), contratos ativos, valor sob contrato, due diligence (certidões, compliance) | contratos |
| **Modelo** | nome + versão | última revisão, quem pode usar sem o Jurídico, limite de valor | contratos, cláusulas |
| **Cláusula** | título + texto padrão | alternativas pré-aprovadas por risco e alçada | modelos, contratos |
| **Aprovação** | contrato + aprovador | posição na cadeia, decisão, comentário | contrato |
| **Obrigação** | descrição + prazo | tipo (pagamento, entrega, reajuste, aviso prévio, garantia), situação, responsável | contrato |

Nomes na interface: "Contrato", "Contraparte" (não "fornecedor/cliente" quando a lista mistura os dois), "Aditivo" para qualquer mudança em contrato vigente, "Aviso prévio" para o prazo de não renovação.

## Mapa de navegação

```
Sidebar
├─ Contratos
│  ├─ Painel                 vencimentos, renovações, "Precisa de você"
│  ├─ Contratos              DataGrid com visões salvas → Contrato (página de registro)
│  ├─ Aprovações             mestre-detalhe (?id=)
│  └─ Obrigações e prazos    lista por urgência | calendário do mês
└─ Cadastros
   ├─ Contrapartes           lista → contraparte em drawer
   └─ Modelos e cláusulas    modelos em lista | cláusulas em mestre-detalhe
   Nova solicitação          fluxo focado (sem navegação do app), por ⌘K ou botão
```

Contador na sidebar só para o que pede ação: aprovações esperando você, obrigações atrasadas, contrapartes com pendência. Casca de referência: `src/blocks/shells/clm-shell.tsx` (`AppShell` + `Sidebar` + `SearchPalette` com contratos `#`, contrapartes `@`, modelos e ações `>`).

## Telas e blocos

| Tela | Comece por | Componentes-chave |
| --- | --- | --- |
| Painel | bloco `clm-dashboard` | `KpiGrid`/`KpiCard` (valor sob contrato, vencendo, obrigações atrasadas com `goodWhen="down"`), `BarChart` de vencimentos por mês com `ChartCardTotals` Valor \| Quantidade, `ListPanel` "Precisa de você", `SegmentedControl` do horizonte (30/60/90 dias) |
| Contratos | bloco `clm-contracts` | `SavedViews` (Vigentes, Vencendo em 90 dias, Renovação automática, Aguardando assinatura, Meus), `DataGrid` com total no rodapé, `FilterBar` + `TableSearch`, ações em massa (atribuir responsável, lembrar) |
| Contrato | bloco `clm-contract` | `PageHeading` com trilha, `StagePath` (rascunho → vigente), `SplitLayout` + `PropertyList`, `Tabs`, cláusulas-chave com risco em palavra, `RevisionTimeline` + `Timeline` das versões, assinaturas em ordem, renovação em `Drawer`, encerrar em `ConfirmDialog`, `NextStep` |
| Aprovações | bloco `clm-approvals` | mestre-detalhe com `?id=`, padrão × proposto lado a lado, `Stepper` da cadeia, `TextareaField` de comentário (obrigatório para recusar) |
| Obrigações | bloco `clm-obligations` | `PageToolbar`, lista agrupada por urgência ou `MonthCalendar`, `DateBadge`, `Checkbox` "cumprida" com desfazer, `ProjectProgressCard` das renovações em andamento, nova obrigação em `Drawer` |
| Contrapartes | bloco `clm-counterparties` | `DataGrid`, due diligence em palavra, `LocationTag` da sede, detalhe e cadastro em `Drawer`, `MaskedField` de CNPJ |
| Modelos e cláusulas | bloco `clm-templates` | lista de modelos com `Drawer` (`?modelo=`), cláusulas em mestre-detalhe (`?clausula=`), alternativas com risco e alçada |
| Nova solicitação | bloco `clm-request` | `FormWizard` em 5 etapas (modelo → contraparte → dados comerciais → anexos → aprovadores), `ChoiceCards` do modelo, `Combobox` de contraparte com a due diligence abaixo, `Stepper`, resumo ao lado |

## Regras específicas

- **O prazo que importa é o aviso prévio**, não a data de fim. Mostre "Avisar até" ao lado da vigência e trate renovação automática como decisão com prazo ("Precisa de você").
- **Vigência em palavra** ("Vence em 12 dias"); só ≤ 30 dias e vencidos pintam.
- **Situação muda por fluxo** (aprovação, assinatura), nunca editada à mão na linha. Não há `InlineSelect` de status em contrato.
- **Contrato vigente não se edita**: mudança vira aditivo, com nova versão e nova assinatura.
- **Aprovador vê o que mudou**, não a minuta inteira: cláusula padrão × proposta, risco e "alternativa já aprovada" quando existe na biblioteca. Recusar exige comentário dizendo o que precisa mudar.
- **Enviar para assinatura só com a aprovação completa**; o botão bloqueado leva `disabledReason`.
- **Encerrar mostra o custo**: multa e aviso prévio dentro do `ConfirmDialog`.
- **Due diligence com nome**: "Certidão FGTS vencida", nunca só "risco alto". Assinar com certidão vencida exige registro de exceção.
- **Solicitação não pede o que o modelo já define** (foro, cláusulas padrão); a cadeia de aprovação é calculada pelo valor e pelo tratamento de dados (DPO).
- Valores com `formatCurrency`, datas com `formatDate`; CNPJ com máscara; sede da contraparte com `LocationTag` quando há fusos diferentes.

## Blocos de referência

`clm-dashboard`, `clm-contracts`, `clm-contract`, `clm-approvals`, `clm-obligations`, `clm-counterparties`, `clm-templates`, `clm-request`. Casca: `shells/clm-shell.tsx`. Categoria **Contratos** no showcase. Padrões relacionados: [anatomia de página](../padroes/anatomia-de-pagina.md) (Mestre-detalhe, Fluxo focado) e [formulários](../padroes/formularios.md).
