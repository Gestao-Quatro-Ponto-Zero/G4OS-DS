# Feedback e estados

Toda tela e todo componente de dado tem **cinco estados**. Desenhe os cinco antes de dar a tela por pronta.

| Estado | O que mostrar | Componente |
| --- | --- | --- |
| Carregando | esqueleto com a forma final | `Skeleton` |
| Vazio (primeira vez) | o que falta + próxima ação | `Empty` |
| Vazio por filtro | "Nenhum X com esses filtros" + Limpar | `Empty` |
| Erro | o que aconteceu + saída | `Callout tone="bad"` / estado de erro |
| Com dados | o conteúdo | — |

Estados de página inteira em `states.tsx`: `NotFoundState` (404), `ErrorState`, `ForbiddenState` (sem permissão), `OfflineState`, `MaintenanceState`, `SuccessState` (fluxo concluído), `LoadingState`; base genérica `StateView`. Avisos: `Banner` (faixa na página), `InlineMessage` (dentro de card/formulário), `AlertCard`. Exemplo completo no bloco `app-error-pages`.

## Hierarquia de feedback

| Intensidade | Componente | Quando | Some sozinho? |
| --- | --- | --- | --- |
| Botão ocupado | `OperationButton` | durante uma operação | sim, ao terminar |
| Toast | `notify(msg, undo?, tone?)` | confirmação de ação concluída | sim, 6,5 s (pausa em hover/foco) |
| Callout / Banner na página | `Callout`, `Banner` | estado persistente (integração desconectada, dados de teste) | não |
| Faixa global | `ShellBanner` | estado do app inteiro (sem conexão, cota) | não |
| Erro de operação | `OperationFeedback` | recusa ou resultado incerto | não, até resolver |
| Erro de campo | texto abaixo do campo | validação | ao corrigir |
| Confirmação | `ConfirmDialog` | antes de destruir | — |

## Regras

1. **Toast só depois que a ação terminou.** Nunca no clique ou no submit.
2. **Mensagem = particípio + objeto**: "Fatura marcada como paga". Sem "com sucesso".
3. **"Desfazer" sempre que existir operação inversa segura.** Prefira desfazer a confirmar.
4. **Um toast por vez.** O novo substitui o anterior.
5. **Enquanto confirma, quem informa é o botão** ("Salvando…"), não um spinner solto na página.
6. **Erro tem saída.** Recusa → "Tentar de novo". Resposta incerta (timeout depois de enviar) → "Verificar alteração", e não repita a operação automaticamente (`UncertainFailure`).
7. **Não bloqueie a tela** com overlay de carregamento. Carregue por região.
8. **Otimista quando seguro**: mover card, marcar como lido, favoritar. `useOperation` aplica e reverte na falha.
9. Tom do toast: `ok` (padrão), `info` para informação neutra, `warn`/`bad` raramente (erro de operação é bloco, não toast).
10. Avisos de atenção dentro de dashboards: `ListPanel tone="attention"` (moldura âmbar) com os itens que pedem ação.

## Esqueletos

- A forma do esqueleto é a forma do conteúdo: linhas de tabela, cards, KPIs.
- 3–5 repetições bastam. Não preencha a tela inteira.
- Carregamento rápido (< 300 ms) não mostra esqueleto (evita piscar).

## Estados vazios

- Título curto: o que não há. Dica: por que e como resolver. Ação: botão com o verbo.
- Ícone relacionado ao conteúdo (lucide, 20 px), nunca ilustração decorativa grande dentro do app.
- Dentro de moldura (`ListPanel`, card), `framed={false}`.
