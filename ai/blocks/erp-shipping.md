# Expedição

- Arquivo: `src/blocks/erp-shipping.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-shipping` (`?theme=dark` para o escuro)

Pedidos faturados do separar à entrega em quadro: transportadora, rastreio e prazo no cartão, atraso em destaque, CD de origem e destino com hora local, rastreio em linha do tempo na gaveta e despacho com transportadora e código.

## Conceito

**Objetivo:** Fazer o pedido faturado sair do CD e chegar no prazo, vendo onde cada carga está.

**Padrões aplicados**

- Anatomia E · Quadro: A separar → Separados → Em trânsito → Entregues; arrastar muda a etapa
- Detalhe em Drawer com LocationTag (CD de origem e destino com fuso) e Timeline do rastreio
- Despachar pede transportadora e código de rastreio; atraso em palavra no cartão
- Alternador Quadro/Lista (≥ 8 cargas) e cinco estados (?estado=)

**Quando usar e o que adaptar**

- Ordens de serviço em campo, coletas, devoluções de cliente

**Evite**

- Despachar sem o código de rastreio
- Esconder o fuso do destino (Manaus é 1 h a menos)

## Componentes usados

`Badge`, `Button`, `Column`, `DataTable`, `Drawer`, `Empty`, `EntityMark`, `KanbanBoard`, `KanbanColumn`, `LocationTag`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `RecordCard`, `SegmentedControl`, `Select`, `Skeleton`, `StatCell`, `StatGrid`, `TextField`, `Timeline`, `chartColor`, `formatCurrency`, `formatNumber`, `notify`, `useOperation`
