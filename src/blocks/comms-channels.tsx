import { ArrowLeft, Download, Hash, Info, Lock, Megaphone, MessageSquarePlus, MessagesSquare, Pin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActionRequiredBanner,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Combobox,
  DateSeparator,
  Empty,
  FileCard,
  IconButton,
  Marker,
  Modal,
  SearchInput,
  Skeleton,
  TeamComposer,
  TeamMessage,
  TypingIndicator,
  cn,
  formatNumber,
  normalize,
  notify,
  plural,
} from "@g4ai/ds";
import { announcementById, chatChannels, chatReplies, cityById, firstName, me, people, personById, threadReplies, type ChatChannel, type ChatMsg } from "./data/comms";
import { saveSample } from "./shells/download";
import { frameHref, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { CommsShell, LoadError, ReactionRow, toggleReaction, useListState } from "./shells/comms-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Mural · conversas",
  description: "Canais e mensagens diretas do time: lista com não lidas e menções, conversa com separador de data, menções destacadas, reações, fios de resposta, arquivos, comunicado compartilhado, pedido com envio de arquivo e composer.",
  category: "Comunicação",
  order: 4,
  height: 900,
  concept: {
    goal: "Conversar com o time no mesmo lugar dos comunicados, sem confundir conversa com aviso oficial.",
    patterns: [
      "Anatomia G · App de altura total: lista de canais, conversa e fio/detalhes; só a conversa rola",
      "Canal e DM pela URL (?canal=); fio pela URL (?fio=); no celular cada um abre em tela cheia com voltar",
      "Menção a você destacada; contador na lista só para menções (não para total de mensagens)",
      "Comunicado oficial aparece como cartão que leva ao Mural, não como texto solto",
      "Pedido com prazo vira faixa de ação obrigatória com envio de arquivo",
    ],
    adapt: [
      "Chat de atendimento interno (TI, RH), sala de projeto, canal com fornecedores",
    ],
    avoid: [
      "Publicar comunicado oficial só num canal (não tem confirmação de leitura)",
      "Badge com total de mensagens não lidas em todo canal",
    ],
  },
} as const;

const hhmm = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
type Replies = Record<string, { authorId: string; time: string; text: string }[]>;

/** Texto com @menções destacadas. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(@[A-ZÀ-Ú][\wÀ-ú]+)/g);
  return (
    <p>
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <mark key={i} className={cn("rounded px-0.5", p.slice(1) === firstName(me) ? "bg-info-soft font-medium text-info" : "bg-soft text-ink")}>
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </p>
  );
}

function dmFor(id: string): ChatChannel | null {
  const p = people.find((x) => `dm-${x.id}` === id);
  if (!p) return null;
  return { id, kind: "dm", name: p.name, withId: p.id, members: 2, memberIds: [me.id, p.id], unread: 0, mentions: 0, messages: [] };
}

function ChannelIcon({ c }: { c: ChatChannel }) {
  if (c.kind === "dm") {
    const p = personById(c.withId!);
    return <Avatar initials={p.initials} tint={p.tint} name={p.name} size="xs" status={p.status} />;
  }
  return c.privado ? <Lock className="h-3.5 w-3.5 text-muted" aria-hidden /> : <Hash className="h-3.5 w-3.5 text-muted" aria-hidden />;
}

export default function CommsChannels() {
  const estado = useListState();
  const param = useFrameParam("canal");
  const fio = useFrameParam("fio");
  const [list, setList] = useState<ChatChannel[]>(chatChannels);
  const [replies, setReplies] = useState<Replies>(threadReplies);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [threadDraft, setThreadDraft] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const [info, setInfo] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<{ name: string; size: string; author: string; time: string; day?: string } | null>(null);
  const [newDm, setNewDm] = useState(false);
  const [dmPerson, setDmPerson] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // DM aberta a partir do diretório de pessoas (?canal=dm-<pessoa>) que ainda não existe.
  useEffect(() => {
    if (param && !list.some((c) => c.id === param)) {
      const dm = dmFor(param);
      if (dm) setList((l) => [...l, dm]);
    }
  }, [param, list]);

  const activeId = param ?? "geral";
  const active = list.find((c) => c.id === activeId) ?? list[0];
  // Abrir o canal marca como lido (a separação "Novas mensagens" continua até sair).
  const [seenUnread, setSeenUnread] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!active || active.unread === 0) return;
    setSeenUnread((s) => ({ ...s, [active.id]: active.unread }));
    setList((l) => l.map((c) => (c.id === active.id ? { ...c, unread: 0, mentions: 0 } : c)));
  }, [active]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [active?.id, active?.messages.length, typing]);

  const filtered = useMemo(() => list.filter((c) => !q || normalize(c.name).includes(normalize(q))), [list, q]);
  const open = (id: string) => {
    setInfo(false);
    setFrameQuery({ canal: id, fio: undefined });
  };
  const patchActive = (fn: (c: ChatChannel) => ChatChannel) => setList((l) => l.map((c) => (c.id === active.id ? fn(c) : c)));
  const push = (m: Omit<ChatMsg, "id" | "time">, channelId = active.id) =>
    setList((l) => l.map((c) => (c.id === channelId ? { ...c, messages: [...c.messages, { id: `n${Date.now()}${Math.random()}`, time: hhmm(), ...m }] } : c)));

  const someoneAnswers = (channelId: string, text?: string) => {
    const ch = list.find((c) => c.id === channelId);
    const who = ch?.kind === "dm" ? personById(ch.withId!) : personById(ch?.memberIds.find((id) => id !== me.id) ?? "gabriel");
    timers.current.push(window.setTimeout(() => setTyping(firstName(who)), 700));
    timers.current.push(
      window.setTimeout(() => {
        setTyping(null);
        push({ authorId: who.id, text: text ?? chatReplies[Math.floor(Math.random() * chatReplies.length)] }, channelId);
      }, 2400),
    );
  };

  const send = (text: string) => {
    push({ authorId: me.id, text });
    setDraft("");
    if (active.kind === "dm") someoneAnswers(active.id);
  };

  const threadMsg = fio ? active?.messages.find((m) => m.id === fio) : undefined;
  const sendThread = (text: string) => {
    if (!threadMsg) return;
    setReplies((r) => ({ ...r, [threadMsg.id]: [...(r[threadMsg.id] ?? []), { authorId: me.id, time: hhmm(), text }] }));
    patchActive((c) => ({ ...c, messages: c.messages.map((m) => (m.id === threadMsg.id ? { ...m, thread: { count: (m.thread?.count ?? 0) + 1, peopleIds: m.thread?.peopleIds ?? [], last: "agora" } } : m)) }));
    setThreadDraft("");
  };

  const channels = filtered.filter((c) => c.kind === "canal");
  const dms = filtered.filter((c) => c.kind === "dm");
  const files = active?.messages.filter((m) => m.file) ?? [];
  const pinned = active?.messages.filter((m) => m.announcementId) ?? [];
  const firstUnreadIdx = active ? active.messages.length - (seenUnread[active.id] ?? 0) : -1;
  const askingFile = active?.id === "dm-beatriz";

  const listItem = (c: ChatChannel) => {
    const isActive = c.id === active?.id;
    return (
      <li key={c.id}>
        <button
          type="button"
          onClick={() => open(c.id)}
          aria-current={isActive ? "page" : undefined}
          className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors", isActive ? "bg-soft font-medium text-ink" : "text-ink-soft hover:bg-soft/60", c.unread > 0 && "font-semibold text-ink")}
        >
          <span className="flex w-5 shrink-0 justify-center">
            <ChannelIcon c={c} />
          </span>
          <span className="min-w-0 flex-1 truncate">{c.name}</span>
          {c.mentions > 0 && (
            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10.5px] font-semibold tabular-nums text-on-primary" aria-label={plural(c.mentions, "menção", "menções")}>
              {c.mentions}
            </span>
          )}
        </button>
      </li>
    );
  };

  const panel = (title: string, onClose: () => void, children: ReactNode) => (
    <aside className="fixed inset-0 z-40 flex flex-col bg-surface xl:static xl:z-auto xl:w-[340px] xl:shrink-0 xl:border-l xl:border-line" aria-label={title}>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
        <h2 className="m-0 min-w-0 flex-1 truncate text-[13.5px] font-semibold">{title}</h2>
        <IconButton label="Fechar" onClick={onClose}>
          <X />
        </IconButton>
      </header>
      {children}
    </aside>
  );

  return (
    <CommsShell section="conversas">
      <div className="flex min-h-0 flex-1 overflow-hidden bg-page">
        {/* Lista de canais e DMs */}
        <aside className={cn("w-full shrink-0 flex-col border-r border-line bg-rail/60 lg:flex lg:w-[272px]", param ? "hidden" : "flex")} aria-label="Canais e mensagens diretas">
          <div className="flex items-center gap-2 px-4 pb-2 pt-4">
            <h1 className="m-0 flex-1 text-[15px] font-semibold">Conversas</h1>
            <IconButton label="Nova mensagem direta" onClick={() => setNewDm(true)}>
              <MessageSquarePlus />
            </IconButton>
          </div>
          <div className="px-3 pb-2">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar canal ou pessoa" />
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            {estado === "carregando" ? (
              <div className="space-y-2 px-2 pt-2" aria-busy="true" aria-label="Carregando canais">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : estado === "vazio" ? (
              <Empty framed={false} title="Você ainda não está em nenhum canal" hint="Comece uma conversa com alguém do time." action={<Button size="sm" variant="ghost" onClick={() => setNewDm(true)}>Nova mensagem</Button>} />
            ) : !filtered.length ? (
              <Empty framed={false} title={`Nada com “${q}”`} action={<Button size="sm" variant="ghost" onClick={() => setQ("")}>Limpar busca</Button>} />
            ) : (
              <>
                {channels.length > 0 && (
                  <>
                    <h2 className="m-0 px-2.5 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted">Canais</h2>
                    <ul className="m-0 list-none space-y-0.5 p-0">{channels.map(listItem)}</ul>
                  </>
                )}
                {dms.length > 0 && (
                  <>
                    <h2 className="m-0 px-2.5 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wide text-muted">Mensagens diretas</h2>
                    <ul className="m-0 list-none space-y-0.5 p-0">{dms.map(listItem)}</ul>
                  </>
                )}
              </>
            )}
          </nav>
        </aside>

        {/* Conversa */}
        <main className={cn("min-w-0 flex-1 flex-col lg:flex", param ? "flex" : "hidden")} aria-label="Conversa">
          {estado === "erro" ? (
            <div className="grid flex-1 place-items-center p-6">
              <LoadError what="a conversa" />
            </div>
          ) : estado === "carregando" || estado === "vazio" || !active ? (
            <div className="flex-1 space-y-4 p-6" aria-busy={estado === "carregando"}>
              {estado === "carregando" ? (
                Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))
              ) : (
                <Empty title="Nenhuma conversa aberta" hint="Escolha um canal ou comece uma mensagem direta." icon={<MessagesSquare />} />
              )}
            </div>
          ) : (
            <>
              <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
                <IconButton label="Voltar para as conversas" className="lg:hidden" onClick={() => setFrameQuery({ canal: undefined, fio: undefined })}>
                  <ArrowLeft />
                </IconButton>
                <span className="flex w-5 justify-center">
                  <ChannelIcon c={active} />
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <h2 className="m-0 truncate text-[14px] font-semibold">{active.name}</h2>
                  <p className="m-0 truncate text-[12px] text-muted">
                    {active.kind === "dm" ? `${personById(active.withId!).role} · ${cityById(personById(active.withId!).city).label}` : active.topic}
                  </p>
                </div>
                {active.kind === "canal" && <AvatarGroup className="hidden sm:flex" people={active.memberIds.map(personById)} total={active.members} max={3} stacked />}
                <IconButton label="Detalhes da conversa" onClick={() => (setInfo((v) => !v), setFrameQuery({ fio: undefined }))} aria-pressed={info}>
                  <Info />
                </IconButton>
              </header>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
                {active.messages.length === 0 && (
                  <Empty framed={false} title={`Comece a conversa com ${active.name.split(" ")[0]}`} hint="Mensagens diretas ficam só entre vocês dois." />
                )}
                {active.messages.map((m, i) => {
                  const author = personById(m.authorId);
                  const ann = m.announcementId ? announcementById(m.announcementId) : null;
                  return (
                    <div key={m.id} className="space-y-3">
                      {m.day && <DateSeparator>{m.day}</DateSeparator>}
                      {i === firstUnreadIdx && firstUnreadIdx > 0 && (
                        <Marker variant="separator" tone="info">
                          Novas mensagens
                        </Marker>
                      )}
                      <TeamMessage author={author} time={m.time} mine={m.authorId === me.id}>
                        <Rich text={m.text} />
                        {ann && (
                          <a href={frameHref("comms-announcement", ann.id)} className="mt-2 flex items-start gap-2.5 rounded-lg border border-line bg-soft p-3 no-underline! hover:border-line-strong [&_span]:no-underline!">
                            <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                            <span className="min-w-0">
                              <span className="block text-[11.5px] text-muted">Comunicado oficial · {ann.category}</span>
                              <span className="block text-[13px] font-medium text-ink">{ann.title}</span>
                            </span>
                          </a>
                        )}
                        {m.file && <FileCard className="mt-2" name={m.file.name} meta={m.file.size} onOpen={() => setFilePreview({ ...m.file!, author: author.name, time: m.time, day: m.day })} />}
                        {m.reactions && (
                          <ReactionRow
                            className="mt-2"
                            reactions={m.reactions}
                            onToggle={(e) => patchActive((c) => ({ ...c, messages: c.messages.map((x) => (x.id === m.id ? { ...x, reactions: toggleReaction(x.reactions ?? [], e) } : x)) }))}
                          />
                        )}
                        {m.thread && (
                          <button type="button" onClick={() => (setInfo(false), setFrameQuery({ fio: m.id }))} className="mt-2 inline-flex items-center gap-2 rounded-lg px-1 py-0.5 text-[12.5px] hover:bg-soft">
                            <AvatarGroup people={m.thread.peopleIds.map(personById)} max={3} size="xs" stacked />
                            <span className="font-medium text-info">{plural(m.thread.count, "resposta")}</span>
                            <span className="text-muted">· última {m.thread.last}</span>
                          </button>
                        )}
                      </TeamMessage>
                    </div>
                  );
                })}
                {typing && <TypingIndicator name={typing} />}
                <div ref={end} />
              </div>

              <div className="space-y-3 border-t border-line bg-surface p-3 sm:p-4">
                {askingFile && (
                  <ActionRequiredBanner
                    title="Envie o alcance por área do comunicado de home office"
                    description="Pedido por Beatriz Lacerda para a reunião de diretoria, hoje ao meio-dia."
                    accept=".pdf,.xlsx,.csv"
                    actionLabel="Enviar arquivo"
                    done={uploaded ? `${uploaded} enviado para Beatriz` : undefined}
                    onFiles={(f) => {
                      const name = f[0].name;
                      setUploaded(name);
                      push({ authorId: me.id, text: "Segue o alcance por área, atualizado agora.", file: { name, size: `${formatNumber(Math.max(1, Math.round(f[0].size / 1024)))} KB` } });
                      notify(`${name} enviado`);
                      someoneAnswers(active.id, "Recebi, obrigada. Vou levar a Diretoria como o principal ponto de atenção.");
                    }}
                  />
                )}
                <TeamComposer value={draft} onChange={setDraft} onSend={send} placeholder={active.kind === "canal" ? `Mensagem em #${active.name}` : `Mensagem para ${active.name.split(" ")[0]}`} onAttach={(f) => push({ authorId: me.id, text: plural(f.length, "arquivo enviado", "arquivos enviados"), file: { name: f[0].name, size: `${formatNumber(Math.max(1, Math.round(f[0].size / 1024)))} KB` } })} />
              </div>
            </>
          )}
        </main>

        {/* Fio de respostas ou detalhes */}
        {threadMsg &&
          panel(
            `Fio em ${active.kind === "canal" ? `#${active.name}` : active.name}`,
            () => setFrameQuery({ fio: undefined }),
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
                <TeamMessage author={personById(threadMsg.authorId)} time={threadMsg.time} mine={threadMsg.authorId === me.id}>
                  <Rich text={threadMsg.text} />
                </TeamMessage>
                <Marker variant="separator">{plural((replies[threadMsg.id] ?? []).length, "resposta")}</Marker>
                {(replies[threadMsg.id] ?? []).map((r, i) => (
                  <TeamMessage key={i} author={personById(r.authorId)} time={r.time} mine={r.authorId === me.id}>
                    <Rich text={r.text} />
                  </TeamMessage>
                ))}
              </div>
              <div className="border-t border-line p-3">
                <TeamComposer value={threadDraft} onChange={setThreadDraft} onSend={sendThread} placeholder="Responder no fio" />
              </div>
            </>,
          )}
        {!threadMsg &&
          info &&
          active &&
          panel(
            "Detalhes",
            () => setInfo(false),
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-[13px]">
              {active.topic && (
                <section>
                  <h3 className="m-0 text-[12px] font-medium text-muted">Sobre</h3>
                  <p className="m-0 mt-1">{active.topic}</p>
                </section>
              )}
              <section>
                <h3 className="m-0 text-[12px] font-medium text-muted">{active.kind === "canal" ? `${formatNumber(active.members)} participantes` : "Participantes"}</h3>
                <ul className="m-0 mt-2 list-none space-y-1 p-0">
                  {active.memberIds.map(personById).map((p) => (
                    <li key={p.id}>
                      <a href={frameHref("comms-people", { pessoa: p.id })} className="-mx-1 flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-soft">
                        <Avatar initials={p.initials} tint={p.tint} name={p.name} size="sm" status={p.status} />
                        <span className="min-w-0 flex-1 truncate">{p.name}</span>
                        {p.id === me.id && <Badge>Você</Badge>}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
              {pinned.length > 0 && (
                <section>
                  <h3 className="m-0 flex items-center gap-1.5 text-[12px] font-medium text-muted">
                    <Pin className="h-3 w-3" aria-hidden /> Comunicados compartilhados
                  </h3>
                  <ul className="m-0 mt-2 list-none space-y-1 p-0">
                    {pinned.map((m) => (
                      <li key={m.id}>
                        <a href={frameHref("comms-announcement", m.announcementId!)} className="block rounded-lg px-1 py-1 hover:bg-soft">
                          {announcementById(m.announcementId!).title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section>
                <h3 className="m-0 text-[12px] font-medium text-muted">Arquivos</h3>
                {files.length ? (
                  <div className="mt-2 space-y-2">
                    {files.map((m) => (
                      <FileCard key={m.id} name={m.file!.name} meta={`${m.file!.size} · ${personById(m.authorId).name.split(" ")[0]}`} />
                    ))}
                  </div>
                ) : (
                  <p className="m-0 mt-1 text-muted">Nenhum arquivo nesta conversa.</p>
                )}
              </section>
            </div>,
          )}
      </div>

      <Modal
        open={newDm}
        onClose={() => setNewDm(false)}
        size="sm"
        title="Nova mensagem direta"
        description="Mensagens diretas ficam só entre vocês dois."
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewDm(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!dmPerson}
              disabledReason="Escolha uma pessoa."
              onClick={() => {
                setNewDm(false);
                open(`dm-${dmPerson}`);
                setDmPerson("");
              }}
            >
              Abrir conversa
            </Button>
          </>
        }
      >
        <Combobox label="Para" value={dmPerson} onValueChange={(v: string) => setDmPerson(v)} options={people.filter((p) => p.id !== me.id).map((p) => ({ value: p.id, label: p.name, description: `${p.role} · ${cityById(p.city).label}` }))} placeholder="Buscar pessoa…" />
      </Modal>
      {/* Arquivo do canal: metadados + download (gerado no navegador neste exemplo). */}
      <Modal
        open={!!filePreview}
        onClose={() => setFilePreview(null)}
        kicker="Arquivo do canal"
        title={filePreview?.name ?? "Arquivo"}
        description={filePreview ? `Enviado por ${filePreview.author}${filePreview.day ? ` · ${filePreview.day.toLowerCase()}` : ""} às ${filePreview.time}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFilePreview(null)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                if (!filePreview) return;
                const saved = saveSample(filePreview.name, [filePreview.name, `Compartilhado por ${filePreview.author} às ${filePreview.time}`, `Tamanho original: ${filePreview.size}`]);
                notify(`${saved} baixado`);
                setFilePreview(null);
              }}
            >
              <Download /> Baixar
            </Button>
          </>
        }
      >
        {filePreview && <FileCard name={filePreview.name} meta={`${filePreview.size} · ${filePreview.author}`} />}
      </Modal>
    </CommsShell>
  );
}
