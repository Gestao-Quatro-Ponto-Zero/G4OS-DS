# Propostas

- Arquivo: `src/blocks/ats-offers.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-offers` (`?theme=dark` para o escuro)

Propostas de contratação em lista + detalhe: cadeia de aprovação, alerta de salário fora da faixa, envio, prazo de resposta e desfecho. Ações mudam com a situação.

## Conceito

**Objetivo:** Conduzir propostas de contratação pela aprovação até o aceite, com o risco de salário visível.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: lista de propostas + detalhe com cadeia de aprovação
- Alerta quando o salário sai da faixa
- Ações mudam com a situação (aprovar, enviar, registrar resposta)

**Quando usar e o que adaptar**

- Descontos comerciais, compras acima da alçada, reembolsos

**Evite**

- Botões de todas as ações sempre visíveis, independentemente da situação

## Componentes usados

`Avatar`, `Badge`, `Button`, `Callout`, `ConfirmDialog`, `CurrencyField`, `Page`, `PageHeading`, `PropertyList`, `Stepper`, `Tabs`, `formatCurrency`, `notify`
