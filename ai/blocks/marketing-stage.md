# Landing com palcos

- Arquivo: `src/blocks/marketing-stage.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Marketing
- Preview: showcase `#/frame/marketing-stage` (`?theme=dark` para o escuro)

Página pública na camada expressiva: cabeçalho que vira pílula, céu no hero com agentes que conversam, capítulos com o produto real em palcos de tokens, uma demonstração que a pessoa conduz e a chamada final.

## Conceito

**Objetivo:** Mostrar o produto trabalhando, em cena, e levar a pessoa a entrar: cada capítulo é uma ideia com uma peça real para tocar.

**Padrões aplicados**

- Anatomia I · Público: a página rola, o SiteHeader fica e vira pílula de vidro ao rolar (useScrolled)
- StageSky no hero; Chapter com Kicker numerado e um Stage por capítulo, alternando o lado (flip)
- Peças reais do produto em Glass sobre o palco; a aprovação responde ao toque
- Cenas com useBeat (só com a aba visível), começam quando vistas (useInView); movimento reduzido mostra o fim da cena
- Uma CtaButton por dobra; a secundária é Button quiet em pílula

**Quando usar e o que adaptar**

- Página de produto, de módulo, de evento ou de parceiro: troque o elenco e as falas
- Boas-vindas de um app (primeiro acesso): um Stage com o primeiro passo, sem o cabeçalho de site

**Evite**

- Palco atrás de dados de trabalho (lista, tabela, formulário)
- Mais de uma cena se movendo na mesma dobra
- Vidro (backdrop-filter) dentro de algo que anima a cada quadro: use Glass solid
- Ilustração genérica no lugar de uma peça real do produto

## Componentes usados

`Button`, `Chapter`, `CtaButton`, `FloatingFigure`, `Glass`, `Kicker`, `ProductMark`, `SiteHeader`, `SpeechBubble`, `Stage`, `StageSky`, `chapterTitleClass`, `formatCurrency`, `useBeat`, `useGlide`, `useInView`, `useOutgoing`, `useScrolled`
