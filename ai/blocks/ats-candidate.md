# Perfil do candidato

- Arquivo: `src/blocks/ats-candidate.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-candidate` (`?theme=dark` para o escuro)

Candidato em uma vaga: etapas clicáveis, avaliações por critério e por entrevistador, radar contra o perfil da vaga, currículo, entrevistas, agendar, reprovar e criar proposta.

## Conceito

**Objetivo:** Decidir sobre um candidato com tudo à mão: em que etapa está, como foi avaliado por critério e o que vem a seguir.

**Padrões aplicados**

- Anatomia C · Registro: trilha + nome + ações fixos; propriedades fixas à direita (SplitLayout)
- StagePath clicável mostra o caminho e o próximo passo
- Avaliações por critério e por entrevistador; radar contra o perfil da vaga
- Reprovar pede confirmação; proposta em modal

**Quando usar e o que adaptar**

- Registro de cliente no CRM (etapas do negócio), fornecedor em homologação no ERP

**Evite**

- Nota única sem critérios (esconde o porquê da decisão)

## Componentes usados

`Avatar`, `Badge`, `Button`, `ConfirmDialog`, `DatePicker`, `Empty`, `FieldBlock`, `Modal`, `Page`, `PageHeading`, `PropertyList`, `RadarChart`, `Select`, `SplitLayout`, `StagePath`, `Tabs`, `Timeline`, `formatCurrency`, `notify`
