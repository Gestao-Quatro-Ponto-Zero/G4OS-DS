# Nova solicitação de contrato

- Arquivo: `src/blocks/clm-request.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Contratos
- Preview: showcase `#/frame/clm-request` (`?theme=dark` para o escuro)

Assistente em 5 etapas (modelo → contraparte → dados comerciais → anexos → aprovadores) que valida cada etapa, mostra a due diligence da contraparte, calcula a cadeia de aprovação pelo valor e gera o rascunho a partir do modelo.

## Conceito

**Objetivo:** Deixar Suprimentos, TI ou Comercial pedirem um contrato ao Jurídico com tudo o que ele precisa na primeira vez, partindo de um modelo aprovado.

**Padrões aplicados**

- Anatomia H · Fluxo focado: sem navegação do app, só o assistente e um resumo ao lado
- FormWizard: cada etapa valida ao avançar; Voltar nunca valida; anexos são opcionais
- Contraparte por Combobox com a situação da due diligence (certidões) logo abaixo; contraparte nova por CNPJ
- Cadeia de aprovação calculada pelo valor e pelo tratamento de dados (DPO)
- Ao concluir, gera o rascunho e leva ao registro do contrato
- ?objeto= vem preenchido pela busca ⌘K (“Solicitar contrato “…””); ?modelo= e ?contraparte= vêm de Modelos e de Contrapartes

**Quando usar e o que adaptar**

- Requisição de compra, pedido de aditivo, abertura de fornecedor

**Evite**

- Formulário único com 20 campos
- Pedir dados que o modelo já define (foro, cláusulas padrão)

## Componentes usados

`Badge`, `Button`, `Callout`, `Checkbox`, `ChoiceCards`, `Combobox`, `CurrencyField`, `DatePicker`, `EntityMark`, `FileDropzone`, `LocationTag`, `MaskedField`, `NumberField`, `ProductMark`, `PropertyList`, `Select`, `Stepper`, `TextField`, `TextareaField`, `UploadItem`, `formatCurrency`, `formatDate`, `masks`, `plural`
