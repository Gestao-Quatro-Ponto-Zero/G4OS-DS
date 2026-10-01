# Conexões, apps e permissões

Como o produto mostra integrações (Slack, Gmail, Shopify, CRM…) e o que um agente de IA pode fazer com elas. Componentes em `src/components/connections.tsx`; telas em `app-marketplace`, `app-connection` e `ai-agent-connections`.

## Telas

| Tela | O que tem | Componentes |
| --- | --- | --- |
| Marketplace | Título, busca, faixa de exemplos de pedido, categorias, grade de apps | `HalftoneBand`, `MarketplaceHero`, `PromptPill`, `AppGrid`, `AppTile` |
| Detalhe da conexão | Estado, exemplo de pedido, dados sincronizados, contas, permissões por conta, desconectar | `AppIcon`, `ConnectionStatus`, `DataSyncTable`, `AccountRow`, `ToolPermissionList`, `ConfirmDialog` |
| Agente | Gatilhos, instruções, entregas e o cartão do agente | `ConnectionsCard` (`AgentConnectionRow`, `SubagentRow`, `ResultRow`) |

## Regras

1. **Antes de conectar**, mostre o que o app permite — leitura e escrita, em frases.
2. **Leitura e escrita separadas.** Escrita leva o selo “altera dados” e pede aprovação na primeira vez de cada tipo de ação.
3. **Permissão é por conta**, não por app (a loja principal pode escrever; o outlet só ler).
4. **Tudo reversível:** conectar, revogar e desconectar têm desfazer no toast; desconectar pede confirmação (`ConfirmDialog tone="danger"`).
5. **Estado sempre com palavra** (`ConnectionStatus`): Conectado, Aguardando autorização, Erro na conexão, Desconectado.
6. **Números sincronizados são links** para a lista filtrada daquela origem.
7. **Logos:** o DS não distribui marcas de terceiros. Use os logos oficiais no app; nos exemplos, glifos genéricos sobre a cor da marca. Marcas pretas (GitHub, Notion, X) usam `var(--ds-ink)` para aparecer no escuro.

## Cartão do agente

Responde três perguntas: o que ele **acessa** (conexões: ✓ liberado, linha tingida = em uso, “Conectar” = disponível), quem ele **aciona** (subagentes: âmbar pulsando = executando, verde = concluído, cinza = parado, rosa = falhou) e o que ele **entrega** (resultados com tipo de arquivo e data).
