---
"@g4ai/ds": minor
---

Formulários a partir do uso num app real (Radar de Forecast):

- **Mudança de comportamento:** `Checkbox` mostra o `label` ao lado da caixa por padrão (como o `Switch`). Para só a caixa (seleção de linha de tabela, tarefa com título ao lado), passe `hideLabel`. Novo `description`. Marcado + desabilitado continua lendo como marcado e o texto fica legível.
- **Regra única de rótulo:** `Select`, `Combobox`, `DatePicker` (e os novos `MultiSelect`, `NativeSelect`, `CheckboxGroup`) desenham o `label` visível acima do campo, com `hint`, `error` e `optional`, como o `TextField`. Dentro de `FieldBlock` o rótulo continua sendo do FieldBlock (sem duplicar); `hideLabel` para toolbar, tabela e filtro; `Select size="compact"` esconde por padrão. Se você desenhava um `<p>` de rótulo acima de um Select, remova-o.
- Novos: `MultiSelect` (busca, grupos, "Selecionar todos"/"Limpar", `max`, `disabledReason`, resumo ou chips), `CheckboxGroup` (tudo visível, tri-estado, colunas) e `NativeSelect` (o `<select>` do sistema estilizado, com grupos; a regra `native-select` da auditoria só acusa `<select>` cru).
- `DatePicker`: rodapé "Hoje"/"Limpar", `clearable`, `now`, `hint`/`error`; nome acessível inclui a data escolhida.
- Celular: `Select` e `DatePicker` abrem como folha inferior (< 640px, por cima da barra inferior); `Combobox`/`MultiSelect` com a largura da tela. `presentation="popover"` mantém o comportamento antigo.
- `Button`: desabilitado legível (ghost/quiet com texto muted e borda visível; preenchidos esmaecem) e `disabledReason` (continua focável com `aria-disabled` e explica o motivo em tooltip). `ToggleGroup` e `Switch` ganharam `disabled`.
- `Sidebar`: o `footer` tem respiro próprio; um `Button` ali não vaza mais do trilho.
- `Page width="wide|medium|narrow|reading"`: cabeçalho, barra e corpo no mesmo eixo (antes era comum centralizar só o corpo com `mx-auto max-w-*` e o título ficava desalinhado).
