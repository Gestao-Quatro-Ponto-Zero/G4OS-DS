import { BellRing, CheckCircle2, Link2, MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ActionMenu,
  Avatar,
  Badge,
  Button,
  Callout,
  Checkbox,
  ConfirmDialog,
  Empty,
  LocationTag,
  Meter,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  ProgressRing,
  PropertyList,
  ReadingDocument,
  SplitLayout,
  TextareaField,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelative,
  notify,
  plural,
  useOperation,
} from "@g4ai/ds";
import { announcementById, areaLabel, channelLabel, cityById, commentsByAnnouncement, firstName, me, now, personById, readRate, weekdayShort, type Comment } from "./data/comms";
import { frameHref, go, useFrameParam } from "./shells/frame-route";
import { CommsShell, ReactionRow, toggleReaction } from "./shells/comms-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Mural · comunicado",
  description: "Comunicado oficial (?id=) em tipografia de leitura: autor e público, confirmação de leitura obrigatória, reações, comentários com respostas e, para quem publica, o alcance por área com lembrete a quem não leu.",
  category: "Comunicação",
  order: 2,
  height: 1300,
  concept: {
    goal: "Ler um comunicado oficial com calma, confirmar que entendeu quando é obrigatório e, para quem publicou, saber quem ainda não leu.",
    patterns: [
      "Anatomia C · Registro de leitura: trilha + título + Confirmar leitura fixos; coluna de propriedades e alcance à direita",
      "ReadingDocument: serifa de leitura e medida curta para texto longo",
      "Confirmação obrigatória com aceite explícito (caixa + botão), com operação assíncrona e erro em bloco",
      "Alcance por área só para quem publica: lidos/total, mediana até a leitura e lembrete a quem não leu",
      "Comentários com respostas oficiais; reações não substituem a confirmação",
    ],
    adapt: [
      "Política interna com aceite (compliance, LGPD), termo de ciência, atualização de contrato com o franqueado",
    ],
    avoid: [
      "Contar abertura como confirmação de leitura obrigatória",
      "Mostrar alcance por área para todo o público (é dado de gestão)",
    ],
  },
} as const;

function CommentItem({ c, onReply }: { c: Comment; onReply?: () => void }) {
  const p = personById(c.authorId);
  const official = p.id === "beatriz" || p.id === me.id;
  return (
    <div className="flex gap-3">
      <Avatar initials={p.initials} tint={p.tint} name={p.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="m-0 flex flex-wrap items-center gap-x-2 text-[13px]">
          <span className="font-medium">{p.name}</span>
          <span className="text-[12px] text-muted">
            {p.role} · {formatRelative(c.at, now)}
          </span>
          {official && <Badge tone="info">Resposta oficial</Badge>}
        </p>
        <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-ink-soft">{c.text}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[12px] text-muted">
          <span className="tabular-nums">{plural(c.likes, "curtida")}</span>
          {onReply && (
            <button type="button" onClick={onReply} className="hover:text-ink">
              Responder
            </button>
          )}
        </div>
        {c.replies?.length ? (
          <div className="mt-3 space-y-3 border-l border-line pl-4">
            {c.replies.map((r) => (
              <CommentItem key={r.id} c={r} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CommsAnnouncement() {
  const id = useFrameParam("id", "a1");
  const base = announcementById(id);
  const [a, setA] = useState(base);
  const [agree, setAgree] = useState(false);
  const [comments, setComments] = useState<Comment[]>(commentsByAnnouncement[base.id] ?? []);
  const [draft, setDraft] = useState("");
  const [archive, setArchive] = useState(false);
  const [reminded, setReminded] = useState(false);
  const ack = useOperation({ busyLabel: "Confirmando…", fallback: "Não foi possível registrar a confirmação." });
  const remind = useOperation({ busyLabel: "Enviando…" });

  // Outro ?id= na mesma tela (busca ⌘K): recarrega o comunicado.
  useEffect(() => {
    setA({ ...base, readByMe: true });
    setComments(commentsByAnnouncement[base.id] ?? []);
    setAgree(false);
    setReminded(false);
  }, [base]);

  const author = personById(a.authorId);
  const pending = a.mandatory && !a.ackByMe;
  const late = a.mandatory ? a.mandatory.due < now.toISOString().slice(0, 10) : false;
  const notRead = a.audienceSize - a.reads;
  const canSeeReach = me.area === "pessoas" || a.authorId === me.id;

  const confirm = () =>
    void ack.run(
      () => new Promise((r) => setTimeout(r, 700)),
      { message: "Leitura confirmada" },
      { apply: () => setA((x) => ({ ...x, ackByMe: true, acks: (x.acks ?? 0) + 1 })), revert: () => setA((x) => ({ ...x, ackByMe: false, acks: (x.acks ?? 1) - 1 })) },
    );

  const sendComment = () => {
    if (!draft.trim()) return;
    setComments((c) => [...c, { id: `n${Date.now()}`, authorId: me.id, at: now.toISOString(), text: draft.trim(), likes: 0 }]);
    setDraft("");
    notify("Comentário publicado");
  };

  return (
    <CommsShell section="inicio">
      <Page>
        <PageHeading
          crumbs={[{ label: "Início", href: frameHref("comms-home") }]}
          title={a.title}
          description={`${a.category} · publicado por ${author.name} em ${formatDate(a.publishedAt)} · para ${a.audience.label}`}
          actions={
            <>
              {pending ? (
                <Button variant="ghost" onClick={() => document.getElementById("confirmar")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                  <CheckCircle2 /> Ir para a confirmação
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard?.writeText(location.href);
                    notify("Link do comunicado copiado", undefined, "info");
                  }}
                >
                  <Link2 /> Copiar link
                </Button>
              )}
              <ActionMenu
                actions={[
                  { label: "Editar comunicado", onSelect: () => go("comms-compose", { id: a.id }) },
                  { label: "Ver alcance completo", onSelect: () => go("comms-analytics") },
                  { label: "Compartilhar em #geral", onSelect: () => go("comms-channels", { canal: "geral" }) },
                  { label: "Arquivar comunicado", tone: "danger", separator: true, onSelect: () => setArchive(true) },
                ]}
              />
            </>
          }
        />

        <SplitLayout
          asideWidth={340}
          main={
            <div className="space-y-6">
              {a.mandatory && (
                <Callout tone={a.ackByMe ? "ok" : late ? "bad" : "warn"} title={a.ackByMe ? "Leitura confirmada" : `Leitura obrigatória até ${weekdayShort(a.mandatory.due)}`}>
                  {a.ackByMe
                    ? "Sua confirmação fica registrada com data e hora. Você pode reler quando quiser."
                    : "Leia até o fim e confirme no final da página. A confirmação fica registrada para o RH."}
                </Callout>
              )}

              <article className="rounded-xl border border-line bg-surface px-5 py-8 sm:px-10">
                <ReadingDocument kicker={`${a.category} · ${formatDate(a.publishedAt)}`} title={a.title} toc={a.body.filter((b) => b.h).length > 2}>
                  {a.body.map((b, i) => (
                    <section key={i}>
                      {b.h && <h2>{b.h}</h2>}
                      {b.p.map((t) => (
                        <p key={t}>{t}</p>
                      ))}
                      {b.list && (
                        <ul>
                          {b.list.map((l) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}
                </ReadingDocument>

                {a.mandatory && (
                  <div id="confirmar" className="mx-auto mt-10 max-w-[680px] rounded-xl border border-line bg-soft p-4">
                    {a.ackByMe ? (
                      <p role="status" className="m-0 flex items-center gap-2 text-[13.5px] text-ok">
                        <CheckCircle2 className="h-4 w-4" aria-hidden /> Você confirmou a leitura deste comunicado.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <Checkbox label="Li e entendi o comunicado" description="Sua confirmação fica registrada com data e hora para o RH." checked={agree} onCheckedChange={setAgree} />
                        <OperationFeedback operation={ack} />
                        <OperationButton operation={ack} onClick={confirm} disabled={!agree} disabledReason={!agree ? "Marque que leu e entendeu o comunicado." : undefined}>
                          <CheckCircle2 /> Confirmar leitura
                        </OperationButton>
                      </div>
                    )}
                  </div>
                )}

                <div className="mx-auto mt-8 flex max-w-[680px] flex-wrap items-center gap-3 border-t border-line pt-4">
                  <ReactionRow reactions={a.reactions} onToggle={(e) => setA((x) => ({ ...x, reactions: toggleReaction(x.reactions, e) }))} />
                  <span className="ml-auto text-[12px] tabular-nums text-muted">
                    {formatNumber(a.reads)} de {formatNumber(a.audienceSize)} pessoas leram
                  </span>
                </div>
              </article>

              <section aria-labelledby="comentarios" className="rounded-xl border border-line bg-surface p-4 sm:p-5">
                <h2 id="comentarios" className="m-0 flex items-center gap-2 text-[14px] font-semibold">
                  <MessageCircle className="h-4 w-4 text-muted" aria-hidden /> Comentários
                  <span className="text-[12.5px] font-normal text-muted">· {formatNumber(a.comments - (commentsByAnnouncement[a.id]?.length ?? 0) + comments.length)}</span>
                </h2>
                <div className="mt-4 space-y-5">
                  {comments.length ? (
                    comments.map((c) => <CommentItem key={c.id} c={c} onReply={() => setDraft(`@${firstName(personById(c.authorId))} `)} />)
                  ) : (
                    <Empty framed={false} title="Nenhum comentário ainda" hint="Dúvidas sobre o comunicado? Pergunte aqui: a resposta oficial fica visível para todo o público." />
                  )}
                </div>
                <form
                  className="mt-5 flex flex-col gap-2 border-t border-line pt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendComment();
                  }}
                >
                  <TextareaField label="Seu comentário" hideLabel value={draft} onChange={setDraft} placeholder="Escreva uma dúvida ou comentário. Todo o público do comunicado vê." minRows={2} />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={!draft.trim()}>
                      <Send /> Comentar
                    </Button>
                  </div>
                </form>
              </section>
            </div>
          }
          aside={
            <>
              <section className="rounded-xl border border-line bg-surface p-4">
                <a href={frameHref("comms-people", { pessoa: author.id })} className="-m-1 flex items-center gap-3 rounded-lg p-1 hover:bg-soft">
                  <Avatar initials={author.initials} tint={author.tint} name={author.name} status={author.status} />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[13.5px] font-medium">{author.name}</span>
                    <span className="block truncate text-[12px] text-muted">{author.role}</span>
                  </span>
                </a>
                <LocationTag className="mt-3" place={cityById(author.city).place} timeZone={cityById(author.city).timeZone} />
              </section>

              <section className="rounded-xl border border-line bg-surface p-4">
                <h2 className="m-0 mb-3 text-[13px] font-medium">Detalhes</h2>
                <PropertyList
                  items={[
                    { label: "Público", value: a.audience.label, hint: `${formatNumber(a.audienceSize)} pessoas` },
                    { label: "Canais", value: a.channels.map((c) => channelLabel[c]).join(", ") },
                    { label: "Publicado", value: formatDate(a.publishedAt) },
                    { label: "Leitura obrigatória", value: a.mandatory ? `Sim, até ${formatDate(a.mandatory.due)}` : "Não" },
                    { label: "Categoria", value: a.category },
                  ]}
                />
              </section>

              {canSeeReach && (
                <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="alcance">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 id="alcance" className="m-0 text-[13px] font-medium">
                        Alcance
                      </h2>
                      <p className="m-0 mt-0.5 text-[12px] text-muted">Visível para quem publica e para a Comunicação</p>
                    </div>
                    <ProgressRing value={Math.round(readRate(a) * 100)} label="Leram" tone={readRate(a) >= 0.75 ? "ok" : "warn"} />
                  </div>
                  <dl className="m-0 mt-3 grid grid-cols-2 gap-3 text-[12px]">
                    <div>
                      <dt className="text-muted">Leram</dt>
                      <dd className="m-0 text-[15px] font-semibold tabular-nums">{formatNumber(a.reads)}</dd>
                    </div>
                    {a.mandatory ? (
                      <div>
                        <dt className="text-muted">Confirmaram</dt>
                        <dd className="m-0 text-[15px] font-semibold tabular-nums">{formatPercent((a.acks ?? 0) / a.audienceSize, 0)}</dd>
                      </div>
                    ) : (
                      <div>
                        <dt className="text-muted">Não leram</dt>
                        <dd className="m-0 text-[15px] font-semibold tabular-nums">{formatNumber(notRead)}</dd>
                      </div>
                    )}
                    <div className="col-span-2">
                      <dt className="text-muted">Tempo até a leitura (mediana)</dt>
                      <dd className="m-0 text-[13.5px] tabular-nums">{formatNumber(a.medianHours, 1)} h</dd>
                    </div>
                  </dl>
                  <ul className="m-0 mt-4 list-none space-y-2.5 p-0">
                    {a.readsByArea
                      .slice()
                      .sort((x, y) => x.read / x.total - y.read / y.total)
                      .map((r) => (
                        <li key={r.area}>
                          <div className="mb-1 flex items-baseline justify-between gap-2 text-[12px]">
                            <span>{areaLabel(r.area)}</span>
                            <span className="tabular-nums text-muted">
                              {formatNumber(r.read)}/{formatNumber(r.total)} · {formatPercent(r.read / r.total, 0)}
                            </span>
                          </div>
                          <Meter value={(r.read / r.total) * 100} tone={r.read / r.total < 0.5 ? "warn" : "ink"} />
                        </li>
                      ))}
                  </ul>
                  <div className="mt-4 space-y-2">
                    <OperationFeedback operation={remind} />
                    {reminded ? (
                      <p role="status" className="m-0 text-[12.5px] text-muted">
                        Lembrete enviado. O próximo pode sair em 24 h.
                      </p>
                    ) : (
                      <OperationButton
                        operation={remind}
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          void remind.run(() => new Promise((r) => setTimeout(r, 600)).then(() => setReminded(true)), `Lembrete enviado para ${formatNumber(notRead)} pessoas no WhatsApp e no app`)
                        }
                      >
                        <BellRing /> Lembrar quem não leu
                      </OperationButton>
                    )}
                  </div>
                </section>
              )}
            </>
          }
        />
      </Page>

      <ConfirmDialog
        open={archive}
        onClose={() => setArchive(false)}
        title="Arquivar este comunicado?"
        description="Ele sai do feed e da busca para todo o público. Confirmações e comentários continuam guardados no relatório de alcance."
        confirmLabel="Arquivar comunicado"
        onConfirm={() => {
          setArchive(false);
          notify("Comunicado arquivado");
          go("comms-home");
        }}
      />
    </CommsShell>
  );
}
