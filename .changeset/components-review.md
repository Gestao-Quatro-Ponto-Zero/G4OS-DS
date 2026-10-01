---
"@g4ai/ds": patch
---

Revisão geral de componentes, guiada por uma varredura automática (`npm run qa:sweep`) de todas as páginas e blocos em 1440/390 px, claro e escuro.

**Corrigido na causa (componente/token, não na tela)**
- Contraste AA: `muted` (#63666e), `accent-deep` (#7d5e33) e `amber` (#b54500) agora passam em branco, `soft`, seleção e fundos `-soft`. Texto nunca mais com opacidade (`text-muted/80` etc. removidos dos componentes).
- Heatmap, Treemap e barras divergentes escolhem a cor do rótulo pelo fundo real (`useReadableFills` + `data-fill`) e as rampas pulam a faixa sem contraste.
- `Avatar`, avatar de agente e seletor de agentes: `tintFill` escurece tints claros até AA. `AppIcon variant="soft"` com texto legível.
- Rótulos que somem no celular passam a `max-sm:sr-only` (botões continuam com nome). `aria-label` em `span`/`div` ganhou `role` (Rating, AnimatedNumber, KeyCombo, BoxPlot, AvatarGroup "+N"). `Meter`/`ProgressRing` com nome padrão. `ItemGroup` com `listitem`. Abas de artefatos: tablist válido, Delete fecha a aba.
- `.linked-card` com primário `<button>`: o card inteiro volta a ser clicável (o `::after` do link esticado era anulado).
- Folha inferior (Select/DatePicker no celular): só a lista rola; nada cortado no rodapé.
- Área de toque mínima: classe `ds-hit` (28 px) em checkbox, remover etiqueta, ícones de 16–20 px e pontos do carrossel.
- `StagePath`, blocos de código e tabelas largas da documentação roláveis pelo teclado.
- Campos de `inputs.tsx` (TextField, NumberField, CurrencyField…) ganharam `hideLabel` e respeitam `FieldBlock` (sem rótulo duplicado).
- Calendário: dias fora do mês e números de semana legíveis.

**Novos componentes**
- `SaveBar`: alterações não salvas (⌘S, aviso ao sair, `saveDisabledReason`, erro com a barra aberta).
- `FormWizard`: formulário em etapas com validação (síncrona ou assíncrona) por etapa.
- `Tour` + `useTour`: tour guiado ancorado a elementos reais.
- `NotificationCenter`: sino com caixa de notificações.
- `Announcement`: pílula de novidade.
- `AudioPlayer`: gravação de ligação/entrevista e mensagem de voz, navegável por teclado.
- Utilitários: `useReadableFills`, `surfaceTone`, `effectiveBackground`, `tintFill`.

**Ferramenta**
- `npm run qa:sweep` (scripts/qa/sweep.mjs): overflow, elemento cortado, axe-core, console, popup fora da tela, alvo de toque e foco, com relatório agrupado por causa.
