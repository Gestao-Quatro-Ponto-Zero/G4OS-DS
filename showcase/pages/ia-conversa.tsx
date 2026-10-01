import { ArrowRight, Check, Info, Loader2, Paperclip, SmilePlus, Sparkles, UserPlus } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Avatar,
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReaction,
  BubbleReactions,
  Button,
  Marker,
  MarkerContent,
  MarkerIcon,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Popover,
  cn,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
  type BubbleVariant,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Conversa: balões, marcadores e rolagem",
  group: "IA e interação",
  order: 22,
  description:
    "Bubble para falas em balão (chat entre pessoas, atendimento, WhatsApp, comentários), Marker para notas inline e separadores, MessageScroller para a rolagem de conversa: abre no fim, acompanha o fim, ancora o turno novo e mantém a posição ao carregar o histórico.",
  shadcn: ["bubble", "marker", "message-scroller"],
};

type Msg = { id: string; from: "eu" | "ana" | "bruno" | "ia"; text: string; time: string };

const seed: Msg[] = [
  { id: "m1", from: "ana", text: "Bom dia! Conseguiu ver a proposta da Acme?", time: "09:02" },
  { id: "m2", from: "eu", text: "Vi sim. O desconto de 12% passou da alçada, preciso da aprovação do Bruno.", time: "09:04" },
  { id: "m3", from: "bruno", text: "Aprovo até 10%. Acima disso só com contrato de 24 meses.", time: "09:10" },
  { id: "m4", from: "ana", text: "Combinado, vou propor 24 meses então.", time: "09:12" },
  { id: "m5", from: "eu", text: "Perfeito. Atualizo o negócio e mando a nova versão até meio-dia.", time: "09:13" },
];

const older: Msg[] = Array.from({ length: 6 }, (_, i) => ({
  id: `h${i}`,
  from: i % 2 ? "eu" : "ana",
  text: i % 2 ? `Anotado. Item ${i + 1} da pauta da semana passada.` : `Lembrete do dia ${20 + i}/09: revisar a renovação da Acme.`,
  time: `${10 + i}:00`,
}));

const people = {
  ana: { name: "Ana Lopes", initials: "AL", tint: "#184560" },
  bruno: { name: "Bruno Reis", initials: "BR", tint: "#5f7f6f" },
};

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex h-[360px] min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-page", className)}>{children}</div>;
}

/* ---------------- Exemplos de MessageScroller ---------------- */

function NewChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timer.current), []);
  const ask = () => {
    const n = msgs.length;
    const q: Msg = { id: `q${n}`, from: "eu", text: n ? "E o risco de churn dessa conta?" : "Resuma o pipeline desta semana.", time: "agora" };
    const answer = n
      ? "Risco médio. Uso caiu 18% em setembro e o contrato renova em 45 dias. Sugiro uma reunião de revisão de valor com o patrocinador antes da proposta de renovação, com os números de adoção por equipe e um plano de treinamento para os dois times que menos usam."
      : "Você tem 14 negócios abertos (R$ 2,3 mi). Três avançaram para proposta: Acme, Nortec e Vale Verde. Dois estão parados há mais de 10 dias e pedem follow-up. A previsão ponderada do mês é R$ 860 mil, 92% da meta.";
    setMsgs((m) => [...m, q, { id: `a${n}`, from: "ia", text: "", time: "agora" }]);
    let i = 0;
    setStreaming(`a${n}`);
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      i += 6;
      setMsgs((m) => m.map((x) => (x.id === `a${n}` ? { ...x, text: answer.slice(0, i) } : x)));
      if (i >= answer.length) {
        window.clearInterval(timer.current);
        setStreaming(null);
      }
    }, 40);
  };
  return (
    <Frame>
      <MessageScrollerProvider scrollPreviousItemPeek={24}>
        <MessageScroller label="Conversa com o assistente">
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {msgs.length === 0 && (
                <Marker>
                  <MarkerIcon>
                    <Sparkles />
                  </MarkerIcon>
                  <MarkerContent>Pergunte algo para começar. A pergunta sobe para o topo e a resposta cresce embaixo.</MarkerContent>
                </Marker>
              )}
              {msgs.map((m) => (
                <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.from === "eu"}>
                  {m.from === "eu" ? (
                    <Bubble align="end" variant="secondary">
                      {m.text}
                    </Bubble>
                  ) : m.text ? (
                    <Bubble variant="ghost">{m.text}</Bubble>
                  ) : (
                    <Marker align="start" shimmer>
                      Pensando…
                    </Marker>
                  )}
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="flex items-center justify-between gap-2 border-t border-line bg-surface px-3 py-2">
        <span className="text-[12px] text-muted">{streaming ? "Respondendo…" : `${msgs.length} mensagens`}</span>
        <Button size="sm" onClick={ask} disabled={!!streaming || msgs.length >= 4}>
          {msgs.length ? "Perguntar de novo" : "Perguntar"}
        </Button>
      </div>
    </Frame>
  );
}

function GroupChatBody({ msgs }: { msgs: Msg[] }) {
  // Agrupa falas seguidas da mesma pessoa.
  const groups: Msg[][] = [];
  for (const m of msgs) {
    const last = groups[groups.length - 1];
    if (last && last[0].from === m.from) last.push(m);
    else groups.push([m]);
  }
  return (
    <>
      {groups.map((g) => {
        const who = g[0].from;
        const mine = who === "eu";
        const p = who === "ana" || who === "bruno" ? people[who] : undefined;
        return (
          <MessageScrollerItem key={g[0].id} messageId={g[0].id}>
            <BubbleGroup align={mine ? "end" : "start"} variant={mine ? "default" : "secondary"} author={p?.name} avatar={p ? <Avatar {...p} size="sm" /> : undefined}>
              {g.map((m, i) => (
                <Bubble key={m.id} time={i === g.length - 1 ? m.time : undefined} status={mine && i === g.length - 1 ? "read" : undefined}>
                  {m.text}
                </Bubble>
              ))}
            </BubbleGroup>
          </MessageScrollerItem>
        );
      })}
    </>
  );
}

function LiveEdge() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const add = (from: Msg["from"]) =>
    setMsgs((m) => [...m, { id: `n${m.length}`, from, text: from === "eu" ? "Nova versão enviada." : "Recebi, vou revisar agora.", time: "agora" }]);
  return (
    <Frame>
      <MessageScrollerProvider anchorNewTurns={false}>
        <MessageScroller label="Conversa do negócio Acme">
          <MessageScrollerViewport>
            <MessageScrollerContent>
              <Marker variant="separator">Hoje</Marker>
              <GroupChatBody msgs={msgs} />
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface px-3 py-2">
        <Button size="sm" variant="ghost" onClick={() => add("ana")}>
          Chega mensagem da Ana
        </Button>
        <Button size="sm" variant="ghost" onClick={() => add("eu")}>
          Eu envio
        </Button>
        <span className="text-[12px] text-muted">Suba a conversa e receba: o botão conta as novas.</span>
      </div>
    </Frame>
  );
}

function LoadHistory() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const load = () => {
    if (loading || done) return;
    setLoading(true);
    window.setTimeout(() => {
      setMsgs((m) => [...older, ...m]);
      setLoading(false);
      setDone(true);
    }, 700);
  };
  return (
    <Frame>
      <MessageScrollerProvider>
        <MessageScroller label="Histórico com Ana">
          <MessageScrollerViewport onReachStart={load}>
            <MessageScrollerContent>
              {loading ? (
                <Marker>
                  <MarkerIcon>
                    <Loader2 className="motion-safe:animate-spin" />
                  </MarkerIcon>
                  <MarkerContent>Carregando mensagens anteriores…</MarkerContent>
                </Marker>
              ) : done ? (
                <Marker variant="separator">Começo da conversa</Marker>
              ) : (
                <Marker render={<button type="button" onClick={load} />}>Carregar mensagens anteriores</Marker>
              )}
              <GroupChatBody msgs={msgs} />
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </Frame>
  );
}

function OutlineNav({ turns }: { turns: { id: string; label: string }[] }) {
  const { currentAnchorId } = useMessageScrollerVisibility();
  const { scrollToMessage, scrollToEnd, scrollToStart, isAtEnd } = useMessageScroller();
  const can = useMessageScrollerScrollable();
  return (
    <nav aria-label="Sumário da conversa" className="hidden w-48 shrink-0 flex-col gap-0.5 border-r border-line bg-surface p-2 sm:flex">
      <p className="m-0 px-2 pb-1 pt-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">Perguntas</p>
      {turns.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => scrollToMessage(t.id)}
          aria-current={currentAnchorId === t.id ? "true" : undefined}
          className="truncate rounded-md px-2 py-1.5 text-left text-[12.5px] text-ink-soft hover:bg-soft aria-[current=true]:bg-soft aria-[current=true]:font-medium aria-[current=true]:text-ink"
        >
          {t.label}
        </button>
      ))}
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-2 text-[11.5px] text-muted">
        <span>Rolagem: {can.start && can.end ? "no meio" : can.end ? "no começo" : isAtEnd ? "no fim" : "—"}</span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => scrollToStart()}>
            Topo
          </Button>
          <Button size="sm" variant="ghost" onClick={() => scrollToEnd()}>
            Fim
          </Button>
        </div>
      </div>
    </nav>
  );
}

function Transcript() {
  const turns = [
    { q: "Quais contas renovam em outubro?", a: "Seis contas renovam em outubro, somando R$ 1,4 mi de receita recorrente. Acme e Nortec concentram 58% do valor; as outras quatro são contas PME com uso estável." },
    { q: "Quais têm risco?", a: "Acme tem risco médio (uso caiu 18%). Nortec tem risco alto: o patrocinador saiu da empresa em agosto e ninguém assumiu a relação. As PMEs estão saudáveis." },
    { q: "Monte um plano para a Nortec.", a: "1. Mapear o novo responsável com o time de CS esta semana. 2. Reunião de revisão de valor com dados de adoção. 3. Proposta de renovação com treinamento incluso. 4. Revisão com o diretor comercial antes de enviar." },
    { q: "E para a Acme?", a: "Para a Acme, o foco é adoção: um workshop com os dois times que menos usam, metas de uso por equipe e acompanhamento quinzenal até a renovação." },
  ];
  return (
    <Frame className="h-[400px]">
      <MessageScrollerProvider defaultScrollPosition="last-anchor" scrollPreviousItemPeek={16}>
        <div className="flex min-h-0 flex-1">
          <OutlineNav turns={turns.map((t, i) => ({ id: `t${i}`, label: t.q }))} />
          <MessageScroller label="Conversa sobre renovações">
            <MessageScrollerViewport>
              <MessageScrollerContent>
                {turns.flatMap((t, i) => [
                  <MessageScrollerItem key={`t${i}`} messageId={`t${i}`} scrollAnchor>
                    <Bubble align="end">{t.q}</Bubble>
                  </MessageScrollerItem>,
                  <MessageScrollerItem key={`r${i}`} messageId={`r${i}`}>
                    <Bubble variant="ghost">{t.a}</Bubble>
                  </MessageScrollerItem>,
                ])}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </div>
      </MessageScrollerProvider>
    </Frame>
  );
}

/* ---------------- Página ---------------- */

const variants: BubbleVariant[] = ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"];

export default function Page() {
  const [likes, setLikes] = useState({ up: 2, mine: false });
  const [status, setStatus] = useState<"sending" | "error" | "read">("error");
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection
        title="Bubble: variantes"
        rule="`secondary` (gelo) é o padrão para as outras pessoas; `default` (cor de ação) para quem usa o app em chat entre pessoas; `ghost` para a resposta longa do assistente; `destructive` só para mensagem que falhou ou foi removida."
      >
        <Demo code={`<Bubble variant="default" align="end">Proposta enviada.</Bubble>\n<Bubble variant="secondary">Recebi, obrigada.</Bubble>`}>
          <div className="space-y-2.5">
            {variants.map((v, i) => (
              <Bubble key={v} variant={v} align={i % 2 ? "end" : "start"}>
                <code className="font-mono text-[12px]">{v}</code> · {v === "destructive" ? "Mensagem removida pelo administrador." : "O contrato renova em 45 dias."}
              </Bubble>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Alinhamento, grupo e status" rule="Falas seguidas da mesma pessoa viram um BubbleGroup: cantos encaixados, nome e avatar uma vez. Status de envio só na sua última fala.">
        <Demo
          code={`<BubbleGroup author="Ana Lopes" avatar={<Avatar name="Ana Lopes" size="sm" />}>
  <Bubble>Bom dia.</Bubble>
  <Bubble time="09:02">Conseguiu ver a proposta?</Bubble>
</BubbleGroup>
<BubbleGroup align="end" variant="default">
  <Bubble>Vi sim.</Bubble>
  <Bubble time="09:04" status="read">Preciso da aprovação do Bruno.</Bubble>
</BubbleGroup>`}
        >
          <div className="space-y-4">
            <BubbleGroup author="Ana Lopes" avatar={<Avatar {...people.ana} size="sm" />}>
              <Bubble>Bom dia.</Bubble>
              <Bubble>Conseguiu ver a proposta da Acme?</Bubble>
              <Bubble time="09:02">Eles pediram resposta até sexta.</Bubble>
            </BubbleGroup>
            <BubbleGroup align="end" variant="default">
              <Bubble>Vi sim.</Bubble>
              <Bubble time="09:04" status="read">
                O desconto passou da alçada, preciso da aprovação do Bruno.
              </Bubble>
            </BubbleGroup>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-[12px] text-muted">Status:</span>
              {(["sending", "read", "error"] as const).map((s) => (
                <Button key={s} size="sm" variant={status === s ? "primary" : "ghost"} onClick={() => setStatus(s)}>
                  {s === "sending" ? "Enviando" : s === "read" ? "Lida" : "Falhou"}
                </Button>
              ))}
            </div>
            <Bubble align="end" variant={status === "error" ? "outline" : "default"} status={status} time="09:20" onRetry={() => setStatus("sending")}>
              Segue a versão com 24 meses.
            </Bubble>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Links, botões, reações e “Ver mais”" rule="`BubbleContent render` troca o balão por um link ou botão (abrir o anexo, ir para o registro). Reações ficam sobre a borda; `clamp` limita linhas com “Ver mais”.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo
            title="Link e botão"
            code={`<Bubble>
  <BubbleContent render={<a href="#/p/ia-conversa" />}>Abrir proposta-acme-v3.pdf</BubbleContent>
</Bubble>`}
          >
            <div className="space-y-2.5">
              <Bubble>
                {/* eslint-disable-next-line jsx-a11y/anchor-has-content -- o conteúdo entra pelo render */}
                <BubbleContent render={<a href="#/p/ia-conversa" />}>
                  <span className="inline-flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" aria-hidden /> proposta-acme-v3.pdf
                  </span>
                </BubbleContent>
              </Bubble>
              <Bubble align="end" variant="tinted">
                <BubbleContent render={<button type="button" />}>
                  <span className="inline-flex items-center gap-1.5">
                    Ver negócio Acme · R$ 240 mil <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </BubbleContent>
              </Bubble>
            </div>
          </Demo>
          <Demo
            title="Reações"
            code={`<Bubble>
  Fechamos a Acme!
  <BubbleReactions>
    <BubbleReaction emoji="👍" count={3} active onToggle={…} label="Gostei" />
  </BubbleReactions>
</Bubble>`}
          >
            <div className="space-y-5 pb-2">
              <Bubble>
                Fechamos a Acme: R$ 240 mil, 24 meses.
                <BubbleReactions>
                  <BubbleReaction emoji="👍" label="Gostei" count={likes.up} active={likes.mine} onToggle={() => setLikes((l) => ({ up: l.up + (l.mine ? -1 : 1), mine: !l.mine }))} />
                  <BubbleReaction emoji="🎉" label="Comemorar" count={4} />
                </BubbleReactions>
              </Bubble>
              <Bubble align="end" variant="default">
                Parabéns, time.
                <BubbleReactions side="bottom">
                  <BubbleReaction emoji="❤️" label="Amei" count={2} />
                </BubbleReactions>
              </Bubble>
            </div>
          </Demo>
          <Demo title="Ver mais" code={`<Bubble clamp={3}>{textoLongo}</Bubble>`}>
            <Bubble clamp={3}>
              Resumo da reunião: o cliente quer começar pelo time de vendas Sudeste (40 pessoas), com expansão para o Sul no segundo trimestre. Pediram treinamento presencial na primeira semana, integração com o ERP atual e um relatório mensal de adoção por equipe. O jurídico deles revisa o contrato em até 10 dias úteis e a assinatura deve sair até o fim do mês.
            </Bubble>
          </Demo>
          <Demo
            title="Dica e popover"
            code={`<Bubble tooltip="Enviada às 09:41 · editada">Ajustei o valor.</Bubble>
<Popover trigger={<SmilePlus />} triggerLabel="Reagir">…</Popover>`}
          >
            <div className="space-y-3">
              <Bubble align="end" variant="default" tooltip="Enviada qua., 1 de out., 09:41 · editada">
                Ajustei o valor para R$ 236 mil.
              </Bubble>
              <div className="flex items-end gap-1.5">
                <Bubble>Pode confirmar o novo prazo?</Bubble>
                <Popover trigger={<SmilePlus className="h-4 w-4" />} triggerLabel="Reagir à mensagem" triggerClassName="mb-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink" width={220} align="start">
                  <div className="flex justify-between text-[20px]">
                    {["👍", "❤️", "🎉", "👀", "✅"].map((e) => (
                      <button key={e} type="button" aria-label={`Reagir com ${e}`} className="rounded-md p-1 hover:bg-soft">
                        {e}
                      </button>
                    ))}
                  </div>
                </Popover>
              </div>
            </div>
          </Demo>
        </div>
      </DocSection>

      <DocSection title="Marker" rule="Nota curta da conversa, sem ação: entrada de pessoa, troca de contexto, “Pensando…”, separador de dia. Com ação e fechar, use SystemMessage.">
        <Demo
          code={`<Marker variant="separator">Hoje</Marker>
<Marker tone="ok"><MarkerIcon><Check /></MarkerIcon><MarkerContent>Tarefa concluída</MarkerContent></Marker>
<Marker shimmer>Pensando…</Marker>
<Marker variant="border">Ana adicionou Bruno à conversa</Marker>
<Marker render={<a href="#…" />}>Ver 3 mensagens fixadas</Marker>`}
        >
          <div className="space-y-4">
            <Marker variant="separator">Hoje</Marker>
            <Marker>Ana Lopes entrou na conversa</Marker>
            <Marker tone="ok">
              <MarkerIcon>
                <Check />
              </MarkerIcon>
              <MarkerContent>Negócio movido para Proposta</MarkerContent>
            </Marker>
            <Marker tone="warn">
              <MarkerIcon>
                <Info />
              </MarkerIcon>
              <MarkerContent>O cliente está fora do horário comercial</MarkerContent>
            </Marker>
            <Marker shimmer align="start">
              <MarkerIcon>
                <Sparkles />
              </MarkerIcon>
              <MarkerContent>Pensando…</MarkerContent>
            </Marker>
            <Marker variant="border">
              <MarkerIcon>
                <UserPlus />
              </MarkerIcon>
              <MarkerContent>Ana adicionou Bruno Reis à conversa</MarkerContent>
            </Marker>
            <Marker variant="separator" tone="info">
              3 mensagens novas
            </Marker>
            <div className="flex justify-center">
              {/* eslint-disable-next-line jsx-a11y/anchor-has-content -- o conteúdo entra pelo render */}
              <Marker render={<a href="#/p/ia-conversa" />}>Ver 3 mensagens fixadas</Marker>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        title="MessageScroller: turno novo e resposta ao vivo"
        rule="A pergunta (item com `scrollAnchor`) sobe para o topo e a resposta cresce embaixo, deixando um pedaço da fala anterior à vista (`scrollPreviousItemPeek`). Se a pessoa sobe para ler, a rolagem não puxa."
      >
        <Demo
          code={`<MessageScrollerProvider scrollPreviousItemPeek={24}>
  <MessageScroller label="Conversa com o assistente">
    <MessageScrollerViewport>
      <MessageScrollerContent>
        {msgs.map((m) => (
          <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.role === "user"}>…</MessageScrollerItem>
        ))}
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>`}
        >
          <NewChat />
        </Demo>
      </DocSection>

      <DocSection title="Chat em grupo e o fim ao vivo" rule="Sem âncora (`anchorNewTurns={false}`): mensagens novas acompanham o fim enquanto a pessoa está nele; se subiu para ler, o botão conta as novas.">
        <Demo code={`<MessageScrollerProvider anchorNewTurns={false}>…</MessageScrollerProvider>`}>
          <LiveEdge />
        </Demo>
      </DocSection>

      <DocSection title="Carregar histórico" rule="`onReachStart` no viewport pede as mensagens antigas; com `preserveScrollOnPrepend` (padrão) a mensagem que a pessoa lia fica no lugar.">
        <Demo code={`<MessageScrollerViewport onReachStart={carregarAnteriores}>…</MessageScrollerViewport>`}>
          <LoadHistory />
        </Demo>
      </DocSection>

      <DocSection
        title="Conversa salva, sumário e estado da rolagem"
        rule='`defaultScrollPosition="last-anchor"` abre na última pergunta. `useMessageScrollerVisibility` dá o turno atual (sumário), `useMessageScroller` os comandos e `useMessageScrollerScrollable` se dá para rolar.'
      >
        <Demo
          code={`const { currentAnchorId } = useMessageScrollerVisibility();
const { scrollToMessage, scrollToEnd } = useMessageScroller();
const { start, end } = useMessageScrollerScrollable();`}
        >
          <Transcript />
        </Demo>
      </DocSection>

      <DocSection title="API">
        <PropsTable
          rows={[
            ["Bubble.variant", '"default" | "secondary" | "muted" | "tinted" | "outline" | "ghost" | "destructive"', '"secondary"', "Peso visual do balão."],
            ["Bubble.align", '"start" | "end"', '"start"', "Lado. `end` = quem usa o app."],
            ["Bubble.status / time / onRetry", '"sending" | "sent" | "read" | "error"', "—", "Estado de envio; em erro mostra “Tentar de novo”."],
            ["Bubble.clamp / tooltip", "number / ReactNode", "—", "Limita linhas com “Ver mais” / dica no hover e foco."],
            ["BubbleGroup.author / avatar", "ReactNode", "—", "Nome e avatar uma vez por grupo."],
            ["Marker.variant", '"default" | "border" | "separator"', '"default"', "Linha discreta, com borda ou separador rotulado."],
            ["Marker.tone / shimmer / render", "MarkerTone / boolean / ReactElement", '"neutral"', "Cor, brilho de “trabalhando” e elemento raiz (link, botão)."],
            ["MessageScrollerProvider.autoScroll", "boolean", "true", "Acompanha o fim enquanto a pessoa está nele."],
            ["MessageScrollerProvider.anchorNewTurns", "boolean", "true", "Turno novo (`scrollAnchor`) sobe para o topo."],
            ["MessageScrollerProvider.defaultScrollPosition", '"end" | "start" | "last-anchor"', '"end"', "Onde a conversa abre."],
            ["MessageScrollerProvider.scrollPreviousItemPeek", "number", "0", "Px do item anterior à vista ao ancorar."],
            ["MessageScrollerViewport.preserveScrollOnPrepend / onReachStart", "boolean / () => void", "true", "Mantém a posição ao carregar histórico / pede o histórico."],
            ["MessageScrollerItem.messageId / scrollAnchor", "string / boolean", "—", "Id estável e começo de turno."],
            ["MessageScrollerButton.direction", '"end" | "start"', '"end"', "“Ir para o fim” com contagem de novas."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Balão para conversa entre pessoas (chat, atendimento, comentários) e para a pergunta de quem usa o assistente.", dont: "Resposta longa do assistente em balão colorido: use `ghost` ou ChatMessage/AgentMessage." },
            { do: "Uma cor de destaque: `default` só para quem usa o app.", dont: "Cada pessoa com uma cor de balão; a identidade vem do nome e do avatar." },
            { do: "Status de envio só na última fala sua; falha com “Tentar de novo” e o texto preservado.", dont: "Toast de “mensagem enviada”." },
            { do: "Marker para fatos da conversa; SystemMessage quando há ação.", dont: "Marker para erro que bloqueia: isso é OperationFeedback ou SystemMessage tone=\"error\"." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
