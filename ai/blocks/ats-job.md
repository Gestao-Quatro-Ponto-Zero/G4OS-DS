# Vaga

- Arquivo: `src/blocks/ats-job.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-job` (`?theme=dark` para o escuro)

Detalhe da vaga: resumo, funil, melhores candidatos, modelo de avaliação (critérios com peso e nota esperada) e canais de divulgação. Com ?id=nova vira o formulário de abertura.

## Conceito

**Objetivo:** Ver a saúde de uma vaga (funil, melhores candidatos) e definir como ela será avaliada.

**Padrões aplicados**

- Anatomia C · Registro com abas; propriedades fixas à direita
- Modelo de avaliação: critérios com peso e nota esperada
- ?id=nova transforma o registro no formulário de abertura

**Quando usar e o que adaptar**

- Campanha (marketing), produto (ERP), plano (SaaS): registro com abas + configuração

**Evite**

- Formulário de criação diferente da página de detalhe

## Componentes usados

`Avatar`, `Badge`, `Button`, `Callout`, `ChoiceCards`, `CurrencyField`, `FunnelChart`, `IconButton`, `ListPanel`, `ListRow`, `NumberField`, `Page`, `PageHeading`, `PropertyList`, `Rating`, `Select`, `SplitLayout`, `Tabs`, `TextField`, `TextareaField`, `formatCurrency`, `notify`
