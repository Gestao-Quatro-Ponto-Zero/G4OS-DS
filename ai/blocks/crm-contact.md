# Página do contato

- Arquivo: `src/blocks/crm-contact.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-contact` (`?theme=dark` para o escuro)

Pessoa (?id=): papel na decisão, dados de contato, negócios em que participa, histórico e e-mail com modelo.

## Conceito

**Objetivo:** Entender o papel de uma pessoa na decisão e o histórico com ela antes de entrar em contato.

**Padrões aplicados**

- Anatomia C · Registro: propriedades fixas à direita
- Papel na decisão (decisora, influenciadora) em destaque
- Histórico em feed; e-mail com modelo em modal

**Quando usar e o que adaptar**

- Candidato (ATS), contato de fornecedor, usuário de conta SaaS

**Evite**

- Ações de contato escondidas em menu

## Componentes usados

`ActionMenu`, `ActivityFeed`, `ActivityItem`, `Avatar`, `Badge`, `Button`, `EntityMark`, `Modal`, `Page`, `PageHeading`, `PropertyList`, `SplitLayout`, `TextField`, `TextareaField`, `formatCurrency`, `formatDate`, `notify`
