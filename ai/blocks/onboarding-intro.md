# Boas-vindas ilustradas

- Arquivo: `src/blocks/onboarding-intro.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Onboarding
- Preview: showcase `#/frame/onboarding-intro` (`?theme=dark` para o escuro)

Primeira execução em 4 etapas num cartão compacto: a ilustração em traço muda de cena (pasta → arquivos → equipe → selo) a cada etapa, com Voltar/Avançar, Pular e ←/→.

## Conceito

**Objetivo:** Apresentar a ideia do produto em quatro frases antes do primeiro uso, sem pedir nenhum dado: quem acabou de entrar entende o que vem e pode pular.

**Padrões aplicados**

- Anatomia H · Fluxo focado: só o cartão, centrado sobre bg-page, como diálogo (camada expressiva permitida no onboarding, regra 22a)
- IntroCard: ilustração em traço (MorphIllustration + onboardingScenes) no topo em gelo, 'Etapa 1 de 4', título, texto
- Pontos de etapa + Voltar/Avançar; a última vira 'Começar'; 'Pular' sempre à vista até a última
- ←/→ trocam de etapa; o texto da etapa é anunciado (aria-live); movimento reduzido troca a cena direto
- Sem os cinco estados: o conteúdo é fixo e local (nada carrega, nada fica vazio, nada falha); o que pede dado vem depois, no assistente

**Quando usar e o que adaptar**

- Novidade grande de uma versão (3 etapas), boas-vindas de um módulo novo, primeira vez num portal do cliente
- Troque as cenas por `frame` em cada etapa (caminhos SVG em traço, viewBox 200 × 140)

**Evite**

- Mais de 4 etapas ou etapas que pedem dados (use o Assistente de configuração)
- Abrir sozinho a cada visita: mostre uma vez e deixe 'Rever introdução' na ajuda
- Ilustração atrás de lista, tabela ou formulário

## Componentes usados

`IntroCard`, `IntroStep`, `ProductMark`, `onboardingScenes`
