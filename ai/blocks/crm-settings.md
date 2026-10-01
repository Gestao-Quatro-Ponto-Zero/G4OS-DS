# Configurações do CRM

- Arquivo: `src/blocks/crm-settings.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-settings` (`?theme=dark` para o escuro)

Etapas do funil com probabilidade e ordem, motivos de perda, regras de automação e barra de alterações não salvas.

## Conceito

**Objetivo:** Ajustar o funil e as regras do CRM sem quebrar o que o time usa.

**Padrões aplicados**

- Anatomia D · Configurações: título fixo
- Etapas com probabilidade e ordem; motivos de perda; regras de automação
- Barra de alterações não salvas no rodapé

**Quando usar e o que adaptar**

- Etapas de vaga (ATS), situações de pedido (ERP)

**Evite**

- Salvar a cada campo quando a mudança afeta o time inteiro

## Componentes usados

`Button`, `IconButton`, `NumberField`, `Page`, `PageHeading`, `Switch`, `TagInput`, `TextField`, `notify`
