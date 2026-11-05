# Palcos: a camada expressiva

Telas de trabalho são quietas: borda de 1 px, nada se move sozinho, cor só com palavra. Uma página pública precisa de outra coisa: mostrar o produto **trabalhando**, em cena, e convidar a pessoa a tocar. A camada expressiva dá isso sem sair dos tokens: o mesmo tema escuro, a mesma marca do cliente, o mesmo movimento reduzido.

Origem: a página inicial dos Galts (g4-durable, `features/login/browser`), promovida ao DS.

## Onde usar

| Pode | Não pode |
| --- | --- |
| Página pública (anatomia I): landing, produto, evento, carreiras | Lista, tabela, formulário, painel de dados, registro |
| Boas-vindas e primeiro acesso de um app | Atrás de números que a pessoa precisa ler e comparar |
| Onboarding e estado vazio de destaque (uma vez, não em toda lista) | Modal, drawer, menu, toast |
| Login com painel de marca (anatomia H) | Mais de um palco animado na mesma dobra |

## Peças

| Peça | O que é | Regra principal |
| --- | --- | --- |
| `Stage` | Superfície com céu, dois morros e grão, feita de `color-mix` sobre tokens. Tons: `dawn`, `sea`, `dusk`, `brand` | Um palco por dobra. Dentro dele, peças reais do produto |
| `StageSky` | A luz do palco de ponta a ponta, sem borda, sumindo na página | Só no hero. Com cabeçalho fixo transparente: `-mt-16 pt-16` |
| `Glass` | Peça do produto sobre o palco, fosca (`backdrop-filter`) | Peça que se move: `solid` (o blur recalcula a cada quadro) |
| `Kicker` | Sobretítulo mono em caixa alta: `01 / Na prática` | Ritmo de leitura; não é navegação |
| `Chapter` | Seção de uma ideia: sobretítulo, título, parágrafo e a cena ao lado | Alterne o lado com `flip`; título com uma frase |
| `CtaButton` | Pílula com a seta num círculo que anda e gira no hover | Uma por dobra (hero e chamada final) |
| `Button shape="pill"` | Botão em pílula | Ação secundária ao lado da `CtaButton`: `variant="quiet"` |
| `SiteHeader` | Cabeçalho de site que vira pílula de vidro ao rolar | A linha mantém 64 px nos dois estados: nada abaixo se move |
| `FloatingFigure` | Figura que flutua, com a sombra no chão respirando | `delay` desencontra vizinhas; `paused` fora de cena |
| `SpeechBubble` | Balão de fala com a ponta no falante | O balão anterior sai (`leaving`) enquanto o novo chega |

Utilitários CSS (`src/styles/stage.css`): `ds-rise` (entrada em cascata com `data-delay` 1–4), `ds-float`, `ds-float-shadow`, `ds-pulse` (o anel que pede o toque), `ds-glass`, `ds-stage`, `ds-sky`. Tokens: `--ease-travel`, `--duration-scene` (520 ms), `--radius-stage` (32 px, escala com a marca).

## Movimento com contrato

Hooks em `@g4ai/ds` (`src/lib/motion.ts`):

| Hook | Para quê |
| --- | --- |
| `useBeat(count, ms, { still, paused })` | O compasso de uma cena. Só corre com a aba visível; com movimento reduzido fica em `still` |
| `useInView()` | A cena começa quando a pessoa chega nela, não ao carregar a página |
| `everyVisible(fn, ms)` · `useVisibleInterval(fn, ms)` | `setInterval` que para em aba oculta e retoma um passo vencido ao voltar |
| `whenIdle(fn)` | Dados abaixo da dobra e prévias depois da primeira tela |
| `useGlide(ref)` | Itens de uma lista ancorada no pé deslizam ao novo lugar (só `translate`) |
| `useEasedWidth(ref, key)` | Uma pílula cujas palavras mudam muda de largura suavemente |
| `useOutgoing(valor)` | O valor anterior enquanto sai: o balão antigo sai enquanto o novo chega |
| `useScrolled(threshold)` | Se a área de rolagem passou do limite (o `SiteHeader` vira pílula) |
| `useReducedMotion()` · `prefersReducedMotion()` | A preferência do sistema, como estado ou leitura única |

Regras:

1. **Movimento reduzido mostra o fim da cena.** Não congele no meio: `useBeat(..., { still })` segura o passo que conta a história inteira. O `base.css` zera durações; a cena escolhe o que mostrar.
2. **O tempo só corre quando a pessoa vê.** Nada de `setInterval` cru: `useBeat`/`everyVisible`. Cena fora da tela não começa (`useInView`); figura atrás de um véu para (`paused`).
3. **Só o compositor anima.** `translate`, `scale`, `opacity`. Nunca `top`, `left`, `width` ou `height` num laço; `useEasedWidth` é a exceção medida (uma animação por troca de texto).
4. **Uma leitura de layout por mudança.** `useGlide` lê a posição do primeiro item uma vez por render, antes da pintura. Nunca leia e escreva layout alternadamente num laço.
5. **Vidro não se move.** `backdrop-filter` dentro de algo que anima recalcula a cada quadro. Use `Glass solid`.
6. **Um ponto de atenção por tela.** `ds-pulse` marca a única ação que espera o toque numa demonstração. Nunca em telas de trabalho.
7. **Nada some de repente.** Um balão sai enquanto o próximo chega; uma história termina com um fade antes da próxima.
8. **A página não pula.** Peças de cena reservam a altura final (o cabeçalho tem a mesma altura nos dois estados; a demonstração reserva a área do texto que ainda vai chegar).

## Desempenho

- O grão é um SVG inline de 220 px repetido: nenhuma requisição, nenhum custo por quadro.
- Gradientes de palco são estáticos: pintam uma vez. Só as peças se movem.
- Dados de seções abaixo da dobra esperam `whenIdle`; enquanto isso, peças do mesmo tamanho seguram o lugar.
- Cenas pesadas (demonstrações com estado) entram por import dinâmico no app.
- Confira 390 e 1440 px, claro e escuro, e com movimento reduzido ligado no sistema.

## Acessibilidade

- Toda cena tem equivalente em texto: a fala nova usa `aria-live="polite"` (`SpeechBubble live`), o balão que sai é `aria-hidden`.
- Figura que responde ao toque é um `button` com nome ("Conhecer o Agente de vendas"), não um `span` clicável.
- Peça interativa (aprovar, enviar) é um `Button` do DS, com foco visível. `ds-pulse` não substitui o foco.

## Exemplo

Bloco `marketing-stage` (Blocos › Marketing › Landing com palcos).

```tsx
const { scrolled, onScroll } = useScrolled();

<div className="h-dvh overflow-y-auto bg-page text-ink" onScroll={onScroll}>
  <SiteHeader floating={scrolled} brand={<Marca />} links={secoes} actions={<Button size="sm" shape="pill">Entrar</Button>} />
  <StageSky className="-mt-16 pt-16">…hero…</StageSky>
  <Chapter id="na-pratica" index="01" kicker="Na prática" title="Peça. Acompanhe. Aprove." description="…" wide>
    <Stage tone="sea" className="px-4 py-8"><Demonstracao /></Stage>
  </Chapter>
</div>
```
