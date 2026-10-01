# Pipelines (fluxos por etapas)

O mesmo padrão serve para negócios (CRM), candidatos (ATS), pedidos e compras (ERP), tickets, aprovações. O que muda é o nome das etapas.

## Peças

| Peça | Componente |
| --- | --- |
| Quadro | `KanbanBoard` (rolagem horizontal própria) |
| Coluna = etapa | `KanbanColumn` (`title`, `count`, `meta` para soma de valor, `onDrop`) |
| Card de registro | `RecordCard` (título, subtítulo, valor, etiquetas, dono, meta, `tone`) ou `KanbanCard` (tarefa simples) |
| Caminho de UM registro | `StagePath` no topo da página do negócio/candidato/pedido |
| Conversão entre etapas | `FunnelChart` no dashboard |
| Lista equivalente | `DataTable` com coluna de etapa |

## Regras

1. **Quadro e lista mostram o mesmo conjunto filtrado**, alternados por `SegmentedControl` (a partir de 8 itens). Filtros ficam.
2. **Etapa muda arrastando ou no registro, nunca por um select dentro do card.**
3. Card mostra só o que decide a próxima ação: título, contexto (empresa/vaga), valor, dono, idade/prazo. Detalhe fica no registro.
4. **Parado há muito tempo** = `tone="warn"` (borda âmbar) + meta "há 21 d". Bloqueado = `tone="bad"`.
5. Cabeçalho da coluna: ponto neutro, nome, contagem e, quando há valor, a soma (`meta={formatCurrency(total, { compact: true })}`).
6. Etapas de desfecho (Ganho/Perdido, Contratado/Reprovado) ficam fora do quadro principal ou recolhidas; no `StagePath` aparecem como `outcome` em `ok`/`bad`.
7. Motivo de perda é obrigatório ao mover para "Perdido"/"Reprovado" (modal curto).
8. Arrastar mostra destino (borda escurece). Teclado: o card abre o registro, onde a etapa muda por menu.
9. Coluna com mais de ~30 cards: mostre os 30 primeiros e "Ver mais 12" ou sugira a lista.
10. No celular, o quadro vira lista agrupada por etapa (colunas de 288 px com rolagem horizontal são aceitáveis só em tablet).

## Cores

Etapas intermediárias **não ganham cor própria**: ponto neutro (`#9aa0a8`) ou a paleta de status de trabalho quando o fluxo é genérico. Cor só no desfecho e em atenção. Um quadro com sete cores diferentes não diz nada.

## Etapas típicas

| App | Etapas |
| --- | --- |
| CRM | Qualificação → Diagnóstico → Proposta → Negociação → (Ganho / Perdido) |
| ATS | Inscritos → Triagem → Entrevista RH → Entrevista técnica → Proposta → (Contratado / Reprovado) |
| ERP pedidos | Recebido → Separação → Faturado → Em transporte → Entregue |
| Compras | Solicitação → Cotação → Aprovação → Pedido → Recebido |
| Suporte | Novo → Em atendimento → Aguardando cliente → Resolvido |
