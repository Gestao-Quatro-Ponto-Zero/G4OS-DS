# Página de preços

- Arquivo: `src/blocks/marketing-pricing.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Marketing
- Preview: showcase `#/frame/marketing-pricing` (`?theme=dark` para o escuro)

Planos com ciclo mensal/anual e calculadora por usuários, tabela comparativa por grupo de recurso (fixa ao rolar), FAQ em acordeão e CTA que leva ao cadastro com o plano escolhido.

## Conceito

**Objetivo:** Ajudar a escolher o plano certo e ir para o cadastro com ele selecionado.

**Padrões aplicados**

- Anatomia I · Público: cabeçalho do site fixo
- Ciclo mensal/anual e calculadora por usuários
- Comparativo com cabeçalho fixo ao rolar; FAQ em acordeão
- CTA leva ao cadastro com ?plan=

**Quando usar e o que adaptar**

- Planos de suporte, pacotes de serviço

**Evite**

- Esconder o preço ('fale com vendas') em todos os planos

## Componentes usados

`Accordion`, `Badge`, `Button`, `NumberField`, `SegmentedControl`, `formatCurrency`
