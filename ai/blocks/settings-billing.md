# Plano e cobrança

- Arquivo: `src/blocks/settings-billing.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-billing` (`?theme=dark` para o escuro)

Plano atual com renovação, uso contra limites, troca de plano mensal/anual, forma de pagamento e histórico de faturas.

## Conceito

**Objetivo:** Mostrar o plano, o uso contra os limites e as faturas, e permitir trocar de plano.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- Uso contra limites com aviso perto do teto
- Planos lado a lado com o atual marcado; mensal/anual
- Histórico de faturas com PDF

**Quando usar e o que adaptar**

- Contrato de serviço, consumo de créditos

**Evite**

- Esconder o limite até ele estourar

## Componentes usados

`Badge`, `Button`, `ChoiceCards`, `Column`, `ConfirmDialog`, `DataTable`, `Drawer`, `Meter`, `OperationButton`, `OperationFeedback`, `RadioGroup`, `SegmentedControl`, `TextField`, `TextareaField`, `formatCurrency`, `notify`, `useOperation`
