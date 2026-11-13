import { Globe, Link2, Play, SearchX, Square } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
  Button,
  CitedText,
  Empty,
  ErrorState,
  MessageActions,
  Page,
  PageHeading,
  ReasoningBlock,
  RelatedQuestions,
  Skeleton,
  SourceCards,
  SourceStack,
  citedPlainText,
  notify,
  useLinkedHighlight,
  useReducedMotion,
  useVisibleInterval,
  type AiSource,
  type RegenerateOption,
} from "@g4ai/ds";
import { AssistantShell, assistantRoutes } from "./shells/assistant-shell";
import { goTo, setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Resposta com fontes",
  description:
    "Uma resposta da IA lida como artigo: pensa, mostra as fontes em cartões e escreve a resposta formatada em que cada citação acende a frase que sustenta. Copiar, refazer com opções, avaliar, compartilhar, alternar versões e perguntar algo relacionado ali mesmo. Cinco estados (?estado=).",
  category: "IA",
  order: 4,
  height: 960,
  concept: {
    goal: "Responder uma pergunta de trabalho com uma resposta que dá para conferir: toda afirmação aponta para a fonte e a pessoa vê de onde veio cada frase.",
    patterns: [
      'Anatomia H · Fluxo focado em coluna de leitura (Page width="reading"): pergunta como título, Compartilhar no cabeçalho',
      "Pensou por N s recolhido (ReasoningBlock); fontes resumidas (SourceStack) que abrem os cartões (SourceCards)",
      "CitedText: citação [n] acende a frase que sustenta e o cartão da fonte; cartão aceso acende as frases que o citam",
      "Streaming na primeira carga com Parar; movimento reduzido mostra a resposta inteira",
      "MessageActions com versões (‹ 2 de 3 ›) e refazer com opções (Mais curta, Mais detalhada, Mais simples)",
      "Pergunte algo relacionado: campo com rótulo + três sugestões",
    ],
    adapt: [
      "Busca na base de conhecimento, pesquisa de mercado, resposta de suporte com artigos, parecer jurídico com cláusulas",
      "Troque as fontes pela sua busca (RAG) e devolva as citações como [n] no texto",
    ],
    avoid: [
      "Afirmação sem fonte quando há fonte; fonte listada que nenhuma frase cita",
      "Responder de memória quando a busca não achou nada: diga que não achou e ofereça o próximo passo",
      "Renderizar HTML vindo do modelo (use a marcação simples do CitedText)",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo (troque pela sua busca e pelo seu modelo)          */
/* ------------------------------------------------------------------ */

const question = "Como implantar passkeys sem bloquear ninguém?";

const sources: AiSource[] = [
  { id: "s1", kind: "doc", title: "Guia de autenticação sem senha", domain: "Wiki de Segurança", tint: "var(--color-chart-1)" },
  { id: "s2", kind: "web", title: "Preenchimento automático de passkeys no login", domain: "identidade.dev", href: "#", tint: "var(--color-chart-2)" },
  { id: "s3", kind: "data", title: "Chamados de acesso e senha · set. e out.", domain: "Painel de suporte", tint: "var(--color-chart-3)" },
  { id: "s4", kind: "doc", title: "Política de recuperação de conta v3", domain: "Wiki de Segurança", tint: "var(--color-chart-1)" },
  { id: "s5", kind: "web", title: "Inscrição progressiva em métodos fortes de login", domain: "segurancadigital.org", href: "#", tint: "var(--color-chart-4)" },
  { id: "s6", kind: "web", title: "Gerenciar passkeys nas configurações da conta", domain: "boaspraticas.app", href: "#", tint: "var(--color-chart-5)" },
  { id: "s7", kind: "web", title: "Passkeys sincronizadas e presas ao aparelho", domain: "identidade.dev", href: "#", tint: "var(--color-chart-2)" },
  { id: "s8", kind: "doc", title: "Piloto de passkeys com o time comercial", domain: "Projetos G4", tint: "var(--color-chart-6)" },
];

const reasoning = [
  "Procurei “passkeys” na Wiki de Segurança e em páginas públicas sobre login sem senha.",
  "Cruzei com os chamados de acesso de setembro e outubro para ver onde as pessoas travam hoje.",
  "Separei o que é etapa de implantação do que é detalhe técnico, e deixei o código só para o login.",
];

const answer = `Adicione passkeys **ao lado** do login atual, sem substituí-lo. Ofereça a criação logo depois que a pessoa provou quem é, que é como a inscrição progressiva funciona na maioria das plataformas de identidade [5]. Deixe o navegador sugerir a passkey no preenchimento automático, para ninguém precisar aprender um botão novo [2]. Só torne a senha opcional quando a conta tiver uma segunda forma confiável de entrar [4].

## Implante em quatro etapas

1. **Ofereça, não obrigue.** Peça a passkey depois de um login ou de uma troca de senha bem-sucedidos, com a sessão recente, e mantenha a senha e o segundo fator funcionando [1].
2. **Entre pelo preenchimento automático.** Peça a credencial com \`mediation: "conditional"\` para que as passkeys salvas apareçam nas sugestões do campo de e-mail [2]. Quem não tem uma continua vendo a senha.
3. **Torne as passkeys gerenciáveis.** Liste cada uma nas configurações da conta, com onde foi criada e quando foi usada pela última vez, e deixe a pessoa cadastrar uma reserva ou remover um aparelho perdido [6].
4. **Aposente a senha por último.** Ofereça remover a senha só quando a conta tiver uma passkey sincronizada ou duas credenciais cadastradas [4]. Mantenha a recuperação por e-mail verificado ou pelo suporte [3].

## Sincronizada ou presa ao aparelho

| Tipo | Onde fica | Se perder o aparelho | Indicada para |
| --- | --- | --- | --- |
| Sincronizada | Gerenciador de senhas do sistema | Recupera pela conta do sistema | A maioria das pessoas [7] |
| Presa ao aparelho | Chave física ou chip do aparelho | Precisa de uma reserva cadastrada | Administradores e financeiro [7] |

## Login com preenchimento automático

\`\`\`ts
const disponivel = await PublicKeyCredential.isConditionalMediationAvailable?.();
if (disponivel) {
  const credencial = await navigator.credentials.get({
    publicKey: await buscarDesafio(),
    mediation: "conditional",
  });
  await entrarCom(credencial);
}
\`\`\`

No piloto com o time comercial, dois terços das pessoas criaram uma passkey na primeira semana e os chamados de senha caíram pela metade [8][3]. Comece por um time pequeno, acompanhe os chamados de acesso por semana e só então amplie.`;

const shorter = `Ofereça passkeys como opção logo depois do login, sem tirar a senha [5]. Use o preenchimento automático do navegador para entrar [2], deixe a pessoa gerenciar as passkeys nas configurações [6] e só remova a senha quando houver uma forma reserva de entrar [4].`;

const simpler = `Pense na passkey como uma chave guardada no celular ou no computador: em vez de digitar a senha, a pessoa confirma com o dedo ou o rosto [1].

1. **Primeiro, só ofereça.** Depois que a pessoa entrar, pergunte se ela quer criar a chave. Quem não quiser segue com a senha [5].
2. **Deixe aparecer sozinha.** O navegador sugere a chave no campo de e-mail, sem botão novo [2].
3. **Guarde uma saída.** Antes de tirar a senha, confira se a pessoa tem outra forma de entrar, como uma segunda chave ou o e-mail [4].`;

const longer = `${answer}

## O que acompanhar

- **Adoção:** quantas pessoas criaram uma passkey por semana, por time [8].
- **Chamados de acesso:** pedidos de troca de senha e de desbloqueio; devem cair semana a semana [3].
- **Bloqueios:** contas que ficaram sem forma de entrar. A meta é zero, e cada caso vira revisão da política de recuperação [4].`;

const variants: Record<RegenerateOption, string> = { retry: answer, shorter, longer, simpler };

const related = [
  "E quem perdeu o único aparelho com a passkey?",
  "Quanto tempo leva um piloto com 50 pessoas?",
  "Como explicar passkeys para quem não é técnico?",
];

const followUps: Record<string, string> = {
  [related[0]]: `Ela entra pelo caminho de recuperação da política: e-mail verificado com código de uso único ou, sem acesso ao e-mail, atendimento do suporte com verificação de identidade [4]. Depois de entrar, o sistema pede uma passkey nova e sugere cadastrar uma reserva. Em setembro e outubro, esse caminho resolveu 9 de cada 10 chamados de acesso sem troca de senha [3].`,
  [related[1]]: `O piloto do time comercial levou quatro semanas: uma de preparação (comunicação e suporte avisados), duas com a oferta ligada e uma de medição [8]. Para 50 pessoas, reserve o mesmo prazo e um ponto focal no suporte nos primeiros dias [3].`,
  [related[2]]: `Diga que é “entrar com o rosto ou o dedo, como você já desbloqueia o celular”, e que a senha continua valendo até a pessoa decidir tirá-la [1]. Evite termos como chave pública ou criptografia na tela de oferta [5].`,
};
const noSourceAnswer = "Não encontrei fontes que respondam a isso na Wiki de Segurança nem nas páginas que consultei. Prefiro não responder sem fonte: posso pesquisar na web ou você pode reformular a pergunta.";

/* ------------------------------------------------------------------ */

type Phase = "thinking" | "streaming" | "stopped" | "done";
const TICK = 40;


export default function AiAnswer() {
  const estado = useFrameParam("estado");
  const reduced = useReducedMotion();
  const highlight = useLinkedHighlight<number>();
  const cardsId = useId();
  const [versions, setVersions] = useState<string[]>([shorter, answer]);
  const [index, setIndex] = useState(1);
  const [phase, setPhase] = useState<Phase>("thinking");
  const [ticks, setTicks] = useState(0);
  const [shown, setShown] = useState(0);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [asked, setAsked] = useState<{ q: string; text: string }[]>([]);
  const text = versions[index];

  // Movimento reduzido: a resposta aparece inteira, sem fase de "pensando".
  useEffect(() => {
    if (reduced) setPhase("done");
  }, [reduced]);

  // Um relógio só (pausa com a aba escondida): ~1,2 s pensando, depois o texto chega em pedaços.
  useVisibleInterval(
    () => {
      if (phase === "thinking") {
        if (ticks >= 30) setPhase("streaming");
        else setTicks((t) => t + 1);
      } else {
        setShown((n) => {
          const next = n + 9;
          if (next >= text.length) setPhase("done");
          return Math.min(next, text.length);
        });
      }
    },
    estado == null && (phase === "thinking" || phase === "streaming") ? TICK : null,
  );

  const restart = () => {
    setShown(0);
    setTicks(0);
    setPhase(reduced ? "done" : "thinking");
    setFrameQuery({ estado: undefined });
  };
  const regenerate = (opt: RegenerateOption) => {
    setVersions((v) => [...v, variants[opt]]);
    setIndex(versions.length);
    setShown(0);
    setTicks(0);
    setPhase(reduced ? "done" : "thinking");
  };
  const share = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
    } catch {
      /* sem permissão: o aviso segue */
    }
    notify("Link da resposta copiado");
  };

  const thinking = estado === "carregando" || (estado == null && phase === "thinking");
  const visible = phase === "done" ? text : text.slice(0, shown);

  const body = (() => {
    if (estado === "erro")
      return (
        <ErrorState
          title="Não consegui terminar a resposta"
          description="A busca nas fontes demorou demais e parou. Sua pergunta foi mantida; tente de novo."
          retryLabel="Tentar de novo"
          onRetry={restart}
        />
      );
    if (estado === "vazio")
      return (
        <Empty
          icon={<SearchX strokeWidth={1.5} aria-hidden />}
          title="Nenhuma fonte encontrada"
          description="Não achei documentos nem páginas que sustentem uma resposta, e sem fonte eu não respondo de memória. Amplie a busca para a web ou reformule a pergunta."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={restart}>
                <Globe /> Pesquisar na web
              </Button>
              <Button size="sm" variant="ghost" onClick={() => goTo(assistantRoutes.chat)}>
                Reformular pergunta
              </Button>
            </div>
          }
        />
      );
    if (thinking)
      return (
        <div role="status" aria-label="Buscando fontes" className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className={i ? "-ml-3 h-5 w-5 rounded-[5px] ring-2 ring-page" : "h-5 w-5 rounded-[5px]"} />
            ))}
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-[94%]" />
            <Skeleton className="h-3.5 w-[71%]" />
          </div>
        </div>
      );
    return (
      <>
        <div className="flex flex-col gap-3">
          <SourceStack sources={sources} expanded={sourcesOpen} onToggle={() => setSourcesOpen((o) => !o)} controls={cardsId} className="-ml-1.5 self-start" />
          {sourcesOpen && <SourceCards id={cardsId} sources={sources} highlight={highlight} />}
        </div>
        <CitedText text={visible} sources={sources} highlight={highlight} streaming={phase === "streaming"} />
        {phase === "streaming" ? (
          <Button size="sm" variant="ghost" className="self-start" onClick={() => setPhase("stopped")}>
            <Square /> Parar
          </Button>
        ) : phase === "stopped" ? (
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted">
            Você parou a resposta aqui.
            <Button size="sm" variant="ghost" onClick={() => setPhase("streaming")}>
              <Play /> Continuar
            </Button>
          </div>
        ) : (
          <div className="border-b border-line pb-4">
            <MessageActions
              text={citedPlainText(text)}
              markdown={text}
              onFeedback={() => notify("Avaliação enviada")}
              onShare={share}
              onRegenerate={regenerate}
              versions={{ index, count: versions.length, onIndexChange: setIndex }}
              className="-ml-2"
            />
          </div>
        )}
        {phase === "done" && (
          <>
            {asked.map((a, i) => (
              <section key={i} aria-label={a.q} className="flex flex-col gap-3 border-b border-line pb-6">
                <h2 className="m-0 text-[18px] font-semibold tracking-tight text-ink">{a.q}</h2>
                <CitedText text={a.text} sources={sources} highlight={highlight} />
              </section>
            ))}
            <RelatedQuestions
              items={related.filter((r) => !asked.some((a) => a.q === r))}
              onAsk={(q) => setAsked((list) => [...list, { q, text: followUps[q] ?? noSourceAnswer }])}
            />
          </>
        )}
      </>
    );
  })();

  return (
    <AssistantShell current={assistantRoutes.answer} collapsed>
      <Page width="reading">
        <PageHeading
          title={question}
          actions={
            <Button size="sm" variant="ghost" onClick={share}>
              <Link2 /> Compartilhar
            </Button>
          }
        />
        <article aria-label="Resposta" className="flex flex-col gap-6 pb-12">
          <ReasoningBlock key={thinking ? "pensando" : "pronto"} lines={reasoning} durationMs={9000} streaming={thinking} />
          {body}
        </article>
      </Page>
    </AssistantShell>
  );
}
