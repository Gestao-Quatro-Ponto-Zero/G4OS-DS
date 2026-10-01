# Etiquetas, status e prioridade

- `TagPill` agrupa por cor (9 matizes, tokens `--ds-tag-{cor}-bg/-fg`, AA nos dois temas). A cor ajuda a escanear; a palavra é quem significa.
- Sem `color`, a cor é derivada do texto (`tagColorFor`): a mesma categoria tem a mesma cor em todas as telas. Para conjuntos fechados, mantenha um mapa fixo (`categoria → cor`).
- `StatusPill` tem cor fixa por estado: não iniciado (vermelho suave), em andamento (amarelo), em revisão (azul), concluído (verde), bloqueado (vermelho), sem status (contorno).
- `PriorityIcon`/`PriorityPill`: barras crescentes (baixa, média, alta) e quadrado com “!” para urgente. Ícone sempre com rótulo ou `aria-label`.
- Muitas etiquetas na mesma linha: `variant="dot"` (contorno neutro + bolinha). Mais de 3 coloridas lado a lado vira ruído.
- Vermelho só quando o estado é problema; nunca para categoria neutra.

Exemplos: showcase › Ações e exibição › Etiquetas, status e prioridade.
