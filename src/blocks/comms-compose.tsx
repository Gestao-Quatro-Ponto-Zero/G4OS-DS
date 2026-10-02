import { Bell, Mail, MessageCircle, Monitor, Send, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  CheckboxGroup,
  Combobox,
  DatePicker,
  DateTimePicker,
  MultiSelect,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  RadioGroup,
  RichTextEditor,
  RichTextView,
  SegmentedControl,
  Select,
  SplitLayout,
  Stepper,
  Switch,
  TextField,
  TextareaField,
  cn,
  formatDate,
  formatNumber,
  useOperation,
  type Step,
} from "@g4ai/ds";
import { announcementById, areas, categories, channelLabel, cities, jobLevels, me, org, personById, people, todayIso, type AreaId, type Category, type Channel, type CityId } from "./data/comms";
import { frameHref, useFrameParam } from "./shells/frame-route";
import { CommsShell } from "./shells/comms-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Mural · publicar comunicado",
  description: "Criar comunicado oficial: editor de texto rico, público por área, cidade e cargo com estimativa de alcance, canais (app, e-mail, WhatsApp), leitura obrigatória com prazo, agendamento, pré-visualização no computador e no celular e aprovação antes de publicar.",
  category: "Comunicação",
  order: 3,
  height: 1500,
  concept: {
    goal: "Escrever um comunicado oficial que chega a quem precisa, pelo canal certo, e só sai depois de aprovado.",
    patterns: [
      "Anatomia C · Registro em edição: trilha + título + Salvar rascunho / Enviar para aprovação fixos; pré-visualização fixa à direita",
      "Stepper do ciclo (rascunho → aprovação → agendado → publicado) logo abaixo do cabeçalho",
      "Público por MultiSelect (áreas, cidades, cargos) com estimativa de alcance ao vivo",
      "Leitura obrigatória com prazo; agendamento com DateTimePicker (fuso visível)",
      "Pré-visualização computador/celular com notificação e o que chega em cada canal",
      "Envio com useOperation: botão informa, erro em bloco, rascunho nunca se perde",
    ],
    adapt: [
      "Campanha de e-mail para clientes, aviso a franqueados, comunicado a fornecedores",
    ],
    avoid: [
      "Publicar direto sem aprovação quando o público é a empresa toda",
      "WhatsApp como canal padrão: só para quem não tem e-mail corporativo ou para urgências",
    ],
  },
} as const;

const levelWeight: Record<string, number> = { diretoria: 0.03, lideranca: 0.09, administrativo: 0.27, operacao: 0.55, estagio: 0.06 };
const approvers = people.filter((p) => p.area === "diretoria");
const strip = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim();

const sampleBody =
  "<h2>O que muda</h2><p>Escreva aqui o que muda, para quem e a partir de quando. Prefira frases curtas e uma ideia por parágrafo.</p><ul><li>O que a pessoa precisa fazer</li><li>Até quando</li><li>Onde tirar dúvidas</li></ul>";

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[28px] border border-line-strong bg-page p-2.5 shadow-surface">
      <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-line" aria-hidden />
      <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-[20px]">{children}</div>
    </div>
  );
}

export default function CommsCompose() {
  const editId = useFrameParam("id");
  const preTitle = useFrameParam("titulo");
  const editing = editId ? announcementById(editId) : null;

  const [title, setTitle] = useState(editing?.title ?? preTitle ?? "");
  const [category, setCategory] = useState<Category>(editing?.category ?? "Institucional");
  const [summary, setSummary] = useState(editing?.summary ?? "");
  const [body, setBody] = useState(editing ? editing.body.map((b) => `${b.h ? `<h2>${b.h}</h2>` : ""}${b.p.map((p) => `<p>${p}</p>`).join("")}`).join("") : sampleBody);
  const [scope, setScope] = useState<"todos" | "segmento">(editing && editing.audience.areas !== "todas" ? "segmento" : "todos");
  const [selAreas, setSelAreas] = useState<string[]>(editing && editing.audience.areas !== "todas" ? editing.audience.areas : []);
  const [selCities, setSelCities] = useState<string[]>(editing && editing.audience.cities !== "todas" ? editing.audience.cities : []);
  const [selLevels, setSelLevels] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>(editing?.channels ?? ["app", "email"]);
  const [mandatory, setMandatory] = useState(!!editing?.mandatory);
  const [due, setDue] = useState(editing?.mandatory?.due ?? "");
  const [pin, setPin] = useState(false);
  const [when, setWhen] = useState<"aprovacao" | "agendar">(editing?.status === "agendado" ? "agendar" : "aprovacao");
  const [schedule, setSchedule] = useState(editing ? editing.publishedAt : "2026-10-02T08:00");
  const [approver, setApprover] = useState("beatriz");
  const [device, setDevice] = useState<"desktop" | "celular">("desktop");
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(editing?.status === "aprovacao");
  const send = useOperation({ busyLabel: "Enviando…", fallback: "Não foi possível enviar para aprovação. O rascunho continua salvo." });
  const draft = useOperation({ busyLabel: "Salvando…" });

  // ⌘K "Publicar comunicado “…”" com a tela já aberta: preenche o título.
  useEffect(() => {
    if (preTitle) setTitle(preTitle);
  }, [preTitle]);

  const reach = useMemo(() => {
    if (scope === "todos") return org.headcount;
    const areaSum = (selAreas.length ? areas.filter((a) => selAreas.includes(a.id)) : areas).reduce((s, a) => s + a.headcount, 0);
    const cityShare = selCities.length ? cities.filter((c) => selCities.includes(c.id)).reduce((s, c) => s + c.headcount, 0) / org.headcount : 1;
    const levelShare = selLevels.length ? selLevels.reduce((s, l) => s + levelWeight[l], 0) : 1;
    return Math.max(1, Math.round(areaSum * cityShare * levelShare));
  }, [scope, selAreas, selCities, selLevels]);

  const audienceLabel =
    scope === "todos"
      ? "Toda a empresa"
      : [selAreas.length ? selAreas.map((a) => areas.find((x) => x.id === (a as AreaId))?.label).join(", ") : "Todas as áreas", selCities.length ? selCities.map((c) => cities.find((x) => x.id === (c as CityId))?.label).join(", ") : null]
          .filter(Boolean)
          .join(" · ");

  const errors = {
    title: !title.trim() ? "Dê um título ao comunicado." : undefined,
    summary: !summary.trim() ? "Escreva o resumo que aparece no feed e na notificação." : undefined,
    body: !strip(body) ? "Escreva o texto do comunicado." : undefined,
    audience: scope === "segmento" && !selAreas.length && !selCities.length && !selLevels.length ? "Escolha ao menos uma área, cidade ou cargo." : undefined,
    channels: !channels.length ? "Escolha ao menos um canal." : undefined,
    due: mandatory && !due ? "Defina até quando a leitura deve ser confirmada." : undefined,
    schedule: when === "agendar" && schedule.slice(0, 10) < todayIso ? "Escolha uma data a partir de hoje." : undefined,
  };
  const invalid = Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);
  const boss = personById(approver);

  const steps: Step[] = [
    { id: "rascunho", label: "Rascunho", state: sent ? "done" : "current" },
    { id: "aprovacao", label: "Aprovação", hint: boss.name, state: sent ? "current" : "upcoming" },
    { id: "agendado", label: when === "agendar" ? "Agendado" : "Publicação", hint: when === "agendar" ? formatDate(schedule) : "logo após aprovar", state: "upcoming" },
    { id: "publicado", label: "Publicado", state: "upcoming" },
  ];

  const submit = () => {
    setTried(true);
    if (invalid) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    void send.run(() => new Promise((r) => setTimeout(r, 900)).then(() => setSent(true)), `Comunicado enviado para aprovação de ${boss.name}`);
  };

  const plain = strip(body);
  const post = (
    <article className="rounded-xl border border-line bg-surface p-4">
      <header className="flex items-center gap-2.5">
        <Avatar initials={me.initials} tint={me.tint} name={me.name} size="sm" />
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[12.5px] font-medium">{me.name}</span>
          <span className="block truncate text-[11.5px] text-muted">agora · para {audienceLabel}</span>
        </span>
      </header>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge>{category}</Badge>
        {mandatory && <Badge tone="warn">Leitura obrigatória{due ? ` até ${formatDate(due, { short: true })}` : ""}</Badge>}
      </div>
      <h3 className="m-0 mt-2 text-[15px] font-semibold leading-snug">{title || "Título do comunicado"}</h3>
      <p className="m-0 mt-1 text-[13px] text-ink-soft">{summary || "O resumo aparece aqui, no feed e na notificação."}</p>
      <RichTextView value={body} className="mt-3 border-t border-line pt-3" />
    </article>
  );

  return (
    <CommsShell section="publicar">
      <Page>
        <PageHeading
          crumbs={[{ label: "Início", href: frameHref("comms-home") }]}
          title={editing ? "Editar comunicado" : "Novo comunicado"}
          description={`Comunicado oficial da ${org.name}. Sai no Mural e nos canais escolhidos depois da aprovação.`}
          actions={
            sent ? (
              <Button variant="ghost" href={frameHref("comms-home")}>
                Voltar ao início
              </Button>
            ) : (
              <>
                <OperationButton operation={draft} variant="ghost" onClick={() => void draft.run(() => new Promise((r) => setTimeout(r, 500)), "Rascunho salvo")}>
                  Salvar rascunho
                </OperationButton>
                <OperationButton operation={send} onClick={submit}>
                  <Send /> Enviar para aprovação
                </OperationButton>
              </>
            )
          }
        />

        <Stepper steps={steps} label="Ciclo do comunicado" />

        <div className="mt-6">
          <SplitLayout
            asideWidth={380}
            main={
              <div className="space-y-6">
                <OperationFeedback operation={send} />
                {sent && (
                  <Callout tone="info" title={`Aguardando aprovação de ${boss.name}`} action={<Button size="sm" variant="ghost" onClick={() => setSent(false)}>Editar e reenviar</Button>}>
                    {when === "agendar" ? `Depois de aprovado, sai em ${formatDate(schedule)} às ${schedule.slice(11, 16)}.` : "Depois de aprovado, sai na hora."} Você recebe uma notificação quando houver resposta.
                  </Callout>
                )}

                <section className="rounded-xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="s-conteudo">
                  <h2 id="s-conteudo" className="m-0 text-[14px] font-semibold">
                    Conteúdo
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <TextField label="Título" value={title} onChange={setTitle} placeholder="Ex.: Nova política de home office a partir de 1º de novembro" counter maxLength={90} error={show("title")} />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
                      <Select label="Categoria" value={category} onValueChange={(v) => setCategory(v as Category)} options={categories.map((c) => ({ value: c, label: c }))} />
                      <TextareaField label="Resumo" value={summary} onChange={setSummary} placeholder="Uma ou duas frases: o que muda e o que a pessoa precisa fazer." hint="Aparece no feed, na notificação e no WhatsApp." counter maxLength={180} minRows={2} error={show("summary")} />
                    </div>
                    <div>
                      <RichTextEditor label="Texto do comunicado" value={body} onChange={setBody} minHeight={220} tools={[["heading", "bold", "italic", "highlight"], ["bullet", "ordered", "checklist", "quote"], ["link", "image", "table"]]} />
                      {show("body") && <p className="m-0 mt-1.5 text-[12px] text-rose">{show("body")}</p>}
                      <p className="m-0 mt-1.5 text-[12px] text-muted">
                        {formatNumber(plain.split(/\s+/).filter(Boolean).length)} palavras · cerca de {Math.max(1, Math.round(plain.split(/\s+/).length / 200))} min de leitura
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="s-publico">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 id="s-publico" className="m-0 text-[14px] font-semibold">
                      Público
                    </h2>
                    <span className="rounded-full bg-soft px-2.5 py-1 text-[12px] tabular-nums" aria-live="polite">
                      Alcança cerca de <strong className="font-semibold">{formatNumber(reach)}</strong> pessoas
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <RadioGroup
                      label="Quem recebe"
                      value={scope}
                      onChange={setScope}
                      orientation="horizontal"
                      options={[
                        { value: "todos", label: "Toda a empresa", description: `${formatNumber(org.headcount)} pessoas` },
                        { value: "segmento", label: "Um recorte", description: "Por área, cidade ou cargo" },
                      ]}
                    />
                    {scope === "segmento" && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <MultiSelect label="Áreas" value={selAreas} onValueChange={setSelAreas} options={areas.map((a) => ({ value: a.id, label: a.label, description: `${formatNumber(a.headcount)} pessoas` }))} placeholder="Todas as áreas" error={show("audience")} />
                        <MultiSelect label="Cidades" value={selCities} onValueChange={setSelCities} options={cities.map((c) => ({ value: c.id, label: c.label, description: c.site }))} placeholder="Todas as cidades" />
                        <MultiSelect label="Cargos" value={selLevels} onValueChange={setSelLevels} options={jobLevels} placeholder="Todos os cargos" />
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="s-entrega">
                  <h2 id="s-entrega" className="m-0 text-[14px] font-semibold">
                    Entrega
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-5">
                    <CheckboxGroup
                      label="Canais"
                      value={channels}
                      onValueChange={setChannels}
                      columns={3}
                      error={show("channels")}
                      options={[
                        { value: "app", label: channelLabel.app, description: "Feed e notificação no celular" },
                        { value: "email", label: channelLabel.email, description: "Quem tem e-mail corporativo (472)" },
                        { value: "whatsapp", label: channelLabel.whatsapp, description: "Resumo + link; para quem não usa e-mail" },
                      ]}
                    />
                    <div className="grid grid-cols-1 gap-3 rounded-lg border border-line p-3">
                      <Switch label="Leitura obrigatória" checked={mandatory} onCheckedChange={setMandatory} />
                      <p className="m-0 -mt-1 text-[12px] text-muted">Cada pessoa precisa confirmar que leu. A confirmação fica registrada para o RH.</p>
                      {mandatory && <DatePicker label="Confirmar até" value={due} onValueChange={setDue} min={todayIso} businessDaysOnly error={show("due")} />}
                    </div>
                    <Switch label="Fixar no topo do Início por 7 dias" checked={pin} onCheckedChange={setPin} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <RadioGroup
                        label="Quando publicar"
                        value={when}
                        onChange={setWhen}
                        options={[
                          { value: "aprovacao", label: "Assim que for aprovado" },
                          { value: "agendar", label: "Agendar data e hora" },
                        ]}
                      />
                      {when === "agendar" && (
                        <div>
                          <DateTimePicker label="Publicar em" value={schedule} onChange={setSchedule} min={todayIso} now={todayIso} step={15} />
                          {show("schedule") && <p className="m-0 mt-1.5 text-[12px] text-rose">{show("schedule")}</p>}
                          <p className="m-0 mt-1.5 text-[12px] text-muted">Turnos de CD começam às 6h, 14h e 22h: 6h alcança mais gente na operação.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="s-aprovacao">
                  <h2 id="s-aprovacao" className="m-0 text-[14px] font-semibold">
                    Aprovação
                  </h2>
                  <p className="m-0 mt-1 text-[12.5px] text-muted">Comunicados para mais de 200 pessoas passam pela diretoria responsável antes de sair.</p>
                  <div className="mt-4 max-w-[420px]">
                    <Combobox label="Quem aprova" value={approver} onValueChange={(v: string) => setApprover(v)} options={approvers.map((p) => ({ value: p.id, label: p.name, description: p.role }))} />
                  </div>
                </section>
              </div>
            }
            aside={
              <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="s-previa">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="s-previa" className="m-0 text-[13px] font-medium">
                    Pré-visualização
                  </h2>
                  <SegmentedControl
                    label="Dispositivo da pré-visualização"
                    value={device}
                    onChange={setDevice}
                    options={[
                      { value: "desktop", label: "Computador", icon: <Monitor /> },
                      { value: "celular", label: "Celular", icon: <Smartphone /> },
                    ]}
                  />
                </div>
                <div className="mt-4">
                  {device === "desktop" ? (
                    <div className="max-h-[560px] overflow-y-auto rounded-xl bg-page p-3">{post}</div>
                  ) : (
                    <PhoneFrame>
                      {channels.includes("app") && (
                        <div className="rounded-xl border border-line bg-popover p-3 shadow-surface">
                          <p className="m-0 flex items-center gap-1.5 text-[11px] text-muted">
                            <Bell className="h-3 w-3" aria-hidden /> Mural · agora
                          </p>
                          <p className="m-0 mt-1 line-clamp-1 text-[12.5px] font-semibold">{title || "Título do comunicado"}</p>
                          <p className="m-0 line-clamp-2 text-[12px] text-ink-soft">{summary || "Resumo do comunicado"}</p>
                        </div>
                      )}
                      {post}
                    </PhoneFrame>
                  )}
                </div>
                <h3 className="m-0 mt-5 text-[12.5px] font-medium">Como chega em cada canal</h3>
                <ul className="m-0 mt-2 list-none space-y-2 p-0 text-[12.5px]">
                  {(["app", "email", "whatsapp"] as Channel[]).map((c) => {
                    const on = channels.includes(c);
                    const Icon = c === "app" ? Smartphone : c === "email" ? Mail : MessageCircle;
                    return (
                      <li key={c} className={cn("flex gap-2.5", !on && "text-muted")}>
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="min-w-0">
                          <span className="font-medium">{channelLabel[c]}</span> · {on ? (c === "app" ? "notificação + post no Início" : c === "email" ? `assunto “${title || "título"}”` : "resumo + link para ler no Mural") : "desligado"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            }
          />
        </div>
      </Page>
    </CommsShell>
  );
}

