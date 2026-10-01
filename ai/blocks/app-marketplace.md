# Marketplace de apps

- Arquivo: `src/blocks/app-marketplace.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-marketplace` (`?theme=dark` para o escuro)

Conecte as ferramentas do time: busca, categorias, faixa de exemplos de pedido e grade de apps com conectar/conectado.

## Conceito

**Objetivo:** Descobrir e conectar as ferramentas que o time já usa, entendendo o que cada uma permite pedir à IA.

**Padrões aplicados**

- Catálogo: título central, busca e categorias em abas
- Faixa com exemplos de pedido por app (mostra o valor antes de conectar)
- Grade de apps com '+' ou ✓; conectar no lugar com desfazer
- Estado vazio quando a busca não acha

**Quando usar e o que adaptar**

- Loja de integrações, módulos de ERP, templates de relatório

**Evite**

- Conectar sem mostrar permissões no detalhe

## Componentes usados

`AppGrid`, `AppTile`, `Button`, `Empty`, `HalftoneBand`, `MarketplaceHero`, `Page`, `normalize`, `notify`
