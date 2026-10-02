# Governança de agentes

- Arquivo: `src/blocks/ai-agent-governance.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agent-governance` (`?theme=dark` para o escuro)

Configurações da frota (?secao=): créditos do mês e orçamento por área e por agente com alerta, limites de uso, política de aprovação humana, modelos permitidos, dados e LGPD (retenção, mascaramento, região) e chaves de API.

## Conceito

**Objetivo:** Quem responde pela IA na empresa define quanto cada agente pode gastar, o que exige uma pessoa, quais modelos valem e onde os dados ficam.

**Padrões aplicados**

- Anatomia D · Configurações: título fixo + subnavegação colada (SettingsLayout); seção na URL (?secao=)
- Créditos do mês com GoalMeter e 'Ver uso'; orçamento por área com Meter e por agente editável em Drawer
- Política de aprovação por tipo de ação: Sempre · Acima de um valor · Nunca
- Mudança arriscada (modelo fora do Brasil, revogar chave) pede ConfirmDialog
- Chave nova aparece uma única vez, com copiar

**Quando usar e o que adaptar**

- Governança de automações, limites de API de um SaaS, políticas de compras

**Evite**

- Orçamento sem alerta antes de estourar
- Liberar modelo que envia dados para fora do Brasil sem avisar o impacto de LGPD
- Mostrar a chave inteira depois de criada

## Componentes usados

`Badge`, `Button`, `Callout`, `Column`, `ConfirmDialog`, `CopyButton`, `CurrencyField`, `DataTable`, `Drawer`, `Meter`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `SegmentedControl`, `Select`, `SettingsLayout`, `SettingsNavItem`, `SettingsSection`, `Slider`, `Switch`, `TextField`, `formatCurrency`, `formatNumber`, `formatPercent`, `notify`, `useOperation`
