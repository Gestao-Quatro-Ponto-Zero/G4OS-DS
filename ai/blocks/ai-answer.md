# Resposta com fontes

- Arquivo: `src/blocks/ai-answer.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-answer` (`?theme=dark` para o escuro)

Uma resposta da IA lida como artigo: pensa, mostra as fontes em cartões e escreve a resposta formatada em que cada citação acende a frase que sustenta. Copiar, refazer com opções, avaliar, compartilhar, alternar versões e perguntar algo relacionado ali mesmo. Cinco estados (?estado=).

## Conceito

**Objetivo:** Responder uma pergunta de trabalho com uma resposta que dá para conferir: toda afirmação aponta para a fonte e a pessoa vê de onde veio cada frase.

**Padrões aplicados**

- reading
- Pensou por N s recolhido (ReasoningBlock); fontes resumidas (SourceStack) que abrem os cartões (SourceCards)

**Quando usar e o que adaptar**

- Busca na base de conhecimento, pesquisa de mercado, resposta de suporte com artigos, parecer jurídico com cláusulas

**Evite**

- Afirmação sem fonte quando há fonte; fonte listada que nenhuma frase cita
- Responder de memória quando a busca não achou nada: diga que não achou e ofereça o próximo passo
- Renderizar HTML vindo do modelo (use a marcação simples do CitedText)

## Componentes usados

`AiSource`, `Button`, `CitedText`, `Empty`, `ErrorState`, `MessageActions`, `Page`, `PageHeading`, `ReasoningBlock`, `RegenerateOption`, `RelatedQuestions`, `Skeleton`, `SourceCards`, `SourceStack`, `citedPlainText`, `notify`, `useLinkedHighlight`, `useReducedMotion`, `useVisibleInterval`
