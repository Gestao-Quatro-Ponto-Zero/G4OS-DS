# Apresentação (QBR)

- Arquivo: `src/blocks/app-presentation.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-presentation` (`?theme=dark` para o escuro)

Revisão trimestral de negócio montada com os layouts de slide do DS: capa, números, tendência, riscos, cliente e plano. Miniaturas, teclado, tela cheia e notas.

## Conceito

**Objetivo:** Apresentar uma revisão de negócio (QBR) direto do app, com slides montados nos layouts do DS.

**Padrões aplicados**

- Anatomia G · App de altura total: palco 16:9, miniaturas, notas
- Teclado (← →, F para tela cheia) e progresso
- Layouts de slide do DS: capa, números, tendência, citação

**Quando usar e o que adaptar**

- Relatório mensal ao cliente, board meeting, onboarding de time

**Evite**

- Slides com cores e fontes fora dos tokens

## Componentes usados

`Button`, `DeckSlide`, `PageHeading`, `SlideBullets`, `SlideDeck`, `SlideQuote`, `SlideSplit`, `SlideStat`, `SlideTitle`, `notify`
