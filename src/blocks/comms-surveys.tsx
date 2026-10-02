import { BellRing, Eye, Lock, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Badge,
  BarList,
  Button,
  ChartCard,
  ChoiceCards,
  ConfirmDialog,
  DataTable,
  DatePicker,
  Drawer,
  Empty,
  IconButton,
  KpiCard,
  KpiGrid,
  Meter,
  MiniBarChart,
  MultiSelect,
  NpsChart,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  Questionnaire,
  Switch,
  Tabs,
  TextField,
  formatDate,
  formatNumber,
  formatPercent,
  notify,
  plural,
  useOperation,
  type Column,
  type QuestionnaireQuestion,
} from "@g4ai/ds";
import { areas, enpsByArea, enpsPrevious, enpsScores, enpsTrend, homePoll, iso, participationByArea, personById, surveyComments, surveyKind, surveys as seed, todayIso, type Survey, type SurveyKind, type SurveyStatus } from "./data/comms";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";
import { CommsShell, useListState } from "./shells/comms-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Mural · pesquisas e clima",
  description: "eNPS do trimestre com distribuição de notas, evolução e eNPS por área, participação por área, temas dos comentários, lista de pesquisas com resultado em gaveta e criação de pesquisa com pré-visualização de como a pessoa responde.",
  category: "Comunicação",
  order: 6,
  height: 1500,
  concept: {
    goal: "Ouvir o time com frequência e mostrar o resultado de forma honesta: quanto recomendam, quem respondeu e o que pedem.",
    patterns: [
      "Anatomia A · Lista com resultado no topo: KPIs + NpsChart antes da lista de pesquisas",
      "Participação por área (BarList) e eNPS por área: onde a amostra é fraca, o número vale menos",
      "Resultado e ações da pesquisa em Drawer (?id=); criar em Drawer (?novo=1) com pré-visualização em Questionnaire",
      "Anonimato visível em todo lugar onde aparece um resultado",
      "Cinco estados na lista: ?estado=carregando|vazio|erro simula; aba sem itens oferece Ver todas",
    ],
    adapt: [
      "NPS de clientes (SaaS), pesquisa de satisfação de alunos, avaliação de fornecedores",
    ],
    avoid: [
      "Mostrar resultado de grupo com menos de 5 respostas (quebra o anonimato)",
      "eNPS sem a base de comparação (trimestre anterior)",
    ],
  },
} as const;

const statusInfo: Record<SurveyStatus, { label: string; tone: "ok" | "neutral" | "info" }> = {
  aberta: { label: "Aberta", tone: "ok" },
  encerrada: { label: "Encerrada", tone: "neutral" },
  rascunho: { label: "Rascunho", tone: "info" },
};
const enps = (() => {
  const total = enpsScores.reduce((s, n) => s + n, 0);
  const pro = enpsScores[9] + enpsScores[10];
  const det = enpsScores.slice(0, 7).reduce((s, n) => s + n, 0);
  return Math.round(((pro - det) / total) * 100);
})();
const totalResponses = enpsScores.reduce((s, n) => s + n, 0);

export default function CommsSurveys() {
  const estado = useListState();
  const id = useFrameParam("id");
  const novo = useFrameParam("novo");
  const [rows, setRows] = useState(seed);
  const [tab, setTab] = useState<"todas" | SurveyStatus>("todas");
  const [closing, setClosing] = useState(false);
  const [creating, setCreating] = useState(!!novo);
  useEffect(() => {
    if (novo) setCreating(true);
  }, [novo]);
  const closeCreate = () => {
    setCreating(false);
    setFrameQuery({ novo: undefined });
  };

  // formulário de criação
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<SurveyKind>("pulso");
  const [aud, setAud] = useState<string[]>([]);
  const [start, setStart] = useState(iso(1));
  const [end, setEnd] = useState(iso(8));
  const [anon, setAnon] = useState(true);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", ""]);
  const [preview, setPreview] = useState(false);
  const [tried, setTried] = useState(false);
  const create = useOperation({ busyLabel: "Publicando…" });
  const remind = useOperation({ busyLabel: "Enviando…" });

  const selected = id ? rows.find((s) => s.id === id) ?? null : null;
  const shown = tab === "todas" ? rows : rows.filter((s) => s.status === tab);
  const open = rows.filter((s) => s.status === "aberta");

  const questions: QuestionnaireQuestion[] =
    kind === "enps"
      ? [
          { name: "nota", prompt: "De 0 a 10, quanto você recomendaria a Vértice como lugar para trabalhar?", required: true, choices: Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) })) },
          { name: "porque", prompt: "O que mais pesou na sua nota?", input: { multiline: true, placeholder: "Escreva com liberdade. A resposta é anônima." } },
        ]
      : [
          {
            name: "q1",
            prompt: question || "Sua pergunta aparece aqui",
            required: true,
            choices: options.filter(Boolean).length ? options.filter(Boolean).map((o, i) => ({ value: `o${i}`, label: o })) : [{ value: "a", label: "Opção 1" }, { value: "b", label: "Opção 2" }],
          },
          { name: "q2", prompt: "Quer comentar algo?", input: { multiline: true } },
        ];

  const errors = {
    title: !title.trim() ? "Dê um nome à pesquisa." : undefined,
    question: kind !== "enps" && !question.trim() ? "Escreva a pergunta." : undefined,
    options: kind !== "enps" && options.filter((o) => o.trim()).length < 2 ? "Informe ao menos duas opções." : undefined,
    end: end <= start ? "O fim precisa ser depois do início." : undefined,
  };
  const invalid = Object.values(errors).some(Boolean);
  const submit = () => {
    setTried(true);
    if (invalid) return;
    const s: Survey = { id: `s${Date.now()}`, title: title.trim(), kind, status: start <= todayIso ? "aberta" : "rascunho", start, end, audienceLabel: aud.length ? aud.map((a) => areas.find((x) => x.id === a)?.label).join(", ") : "Toda a empresa", audienceSize: aud.length ? areas.filter((a) => aud.includes(a.id)).reduce((t, a) => t + a.headcount, 0) : 1214, responses: 0, anonymous: anon, ownerId: "carla" };
    void create.run(
      () =>
        new Promise((r) => setTimeout(r, 700)).then(() => {
          setRows((all) => [s, ...all]);
          closeCreate();
          setTitle("");
          setQuestion("");
          setOptions(["", "", ""]);
          setTried(false);
          setPreview(false);
        }),
      start <= todayIso ? "Pesquisa publicada" : `Pesquisa agendada para ${formatDate(start)}`,
    );
  };

  const columns: Column<Survey>[] = [
    {
      key: "title",
      header: "Pesquisa",
      primary: true,
      cell: (s) => (
        <span className="block min-w-0 leading-tight">
          <span className="block truncate font-medium">{s.title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            {surveyKind[s.kind]} · {s.audienceLabel}
            {s.anonymous && <Lock className="h-3 w-3" aria-label="Anônima" />}
          </span>
        </span>
      ),
    },
    { key: "status", header: "Situação", nowrap: true, cell: (s) => <Badge tone={statusInfo[s.status].tone}>{statusInfo[s.status].label}</Badge> },
    {
      key: "part",
      header: "Participação",
      width: 200,
      cell: (s) =>
        s.status === "rascunho" ? (
          <span className="text-muted">—</span>
        ) : (
          <span className="block">
            <span className="mb-1 flex justify-between text-[12px] tabular-nums">
              <span>{formatPercent(s.responses / s.audienceSize, 0)}</span>
              <span className="text-muted">
                {formatNumber(s.responses)}/{formatNumber(s.audienceSize)}
              </span>
            </span>
            <Meter value={(s.responses / s.audienceSize) * 100} tone={s.responses / s.audienceSize < 0.5 ? "warn" : "ink"} />
          </span>
        ),
    },
    { key: "period", header: "Período", nowrap: true, mobileHidden: true, cell: (s) => <span className="text-ink-soft">{formatDate(s.start, { short: true })} – {formatDate(s.end, { short: true })}</span> },
    { key: "owner", header: "Responsável", nowrap: true, mobileHidden: true, cell: (s) => personById(s.ownerId).name },
  ];

  const statusCount = (st: SurveyStatus) => rows.filter((s) => s.status === st).length;

  return (
    <CommsShell section="pesquisas">
      <Page>
        <PageHeading
          title="Pesquisas e clima"
          description="eNPS trimestral, pesquisas de pulso e enquetes rápidas. Resultados por área só com 5 ou mais respostas."
          actions={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Criar pesquisa
            </Button>
          }
        />

        <div className="space-y-6">
          <KpiGrid>
            <KpiCard label="eNPS do 3º trimestre" value={formatNumber(enps)} hint={`+${enps - enpsPrevious} pontos vs. 2º trimestre (${enpsPrevious})`} />
            <KpiCard label="Participação no eNPS" value={formatPercent(totalResponses / 1214, 0)} hint={`pesquisa aberta · no 2º trimestre fechou em ${formatPercent(862 / 1196, 0)}`} />
            <KpiCard label="Pesquisas abertas" value={formatNumber(open.length)} hint={`a próxima encerra em ${formatDate(open.map((s) => s.end).sort()[0] ?? iso(0), { short: true })}`} />
            <KpiCard label="Comentários a ler" value={formatNumber(surveyComments.reduce((s, c) => s + c.count, 0))} hint="agrupados em 4 temas" />
          </KpiGrid>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <ChartCard
              title="Quanto as pessoas recomendam a Vértice para trabalhar?"
              description={`eNPS do 3º trimestre · ${formatNumber(totalResponses)} respostas anônimas · encerra ${formatDate(seed[0].end, { short: true })}`}
              footer={<MiniBarChart framed={false} label="O eNPS está melhorando?" caption="eNPS por trimestre, do 4º de 2025 ao 3º de 2026" data={enpsTrend.map((t) => ({ label: t.tri, value: t.enps }))} format={(n) => formatNumber(n)} height={72} />}
            >
              <NpsChart scores={enpsScores} previous={enpsPrevious} />
            </ChartCard>
            <ChartCard title="Onde o eNPS é mais baixo?" description="eNPS por área no trimestre, do menor para o maior">
              <BarList items={enpsByArea.slice().sort((a, b) => a.value - b.value).map((a) => ({ label: a.label, value: a.value }))} sort={false} format={(n) => formatNumber(n)} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Quais áreas responderam?" description="Participação no eNPS por área · abaixo de 60 % o resultado da área é menos confiável">
              <BarList items={participationByArea.map((a) => ({ label: a.label, value: Math.round((a.responded / a.total) * 100) }))} format={(n) => formatPercent(n / 100, 0)} />
            </ChartCard>
            <ChartCard title="Sobre o que as pessoas mais escrevem?" description="Temas dos comentários abertos, agrupados pela Comunicação">
              <ul className="m-0 list-none space-y-3 p-0">
                {surveyComments.map((c) => (
                  <li key={c.theme} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                    <p className="m-0 flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="font-medium">{c.theme}</span>
                      <span className="tabular-nums text-muted">{plural(c.count, "comentário")}</span>
                    </p>
                    <p className="m-0 mt-1 text-[12.5px] italic text-ink-soft">“{c.sample}”</p>
                  </li>
                ))}
              </ul>
            </ChartCard>
          </div>

          <section aria-labelledby="lista-pesquisas">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 id="lista-pesquisas" className="m-0 text-[15px] font-semibold">
                Todas as pesquisas
              </h2>
              <Tabs
                label="Situação das pesquisas"
                value={tab}
                onChange={(v) => setTab(v as typeof tab)}
                items={[
                  { id: "todas", label: "Todas" },
                  { id: "aberta", label: "Abertas" },
                  { id: "rascunho", label: "Rascunhos", count: statusCount("rascunho") },
                  { id: "encerrada", label: "Encerradas" },
                ]}
              />
            </div>
            <DataTable
              label="Pesquisas"
              rows={estado === "vazio" ? [] : shown}
              columns={columns}
              rowKey={(s) => s.id}
              rowLabel={(s) => s.title}
              onRowClick={(s) => setFrameQuery({ id: s.id })}
              loading={estado === "carregando"}
              error={estado === "erro" ? { message: "Não foi possível carregar as pesquisas. Nada do que você fez foi perdido.", onRetry: () => setFrameQuery({ estado: undefined }) } : undefined}
              empty={
                estado === "vazio" ? (
                  <Empty framed={false} title="Nenhuma pesquisa criada ainda" hint="Comece com um eNPS: duas perguntas, anônimo, e o resultado sai na hora." action={<Button onClick={() => setCreating(true)}><Plus /> Criar pesquisa</Button>} />
                ) : (
                  <Empty framed={false} title={`Nenhuma pesquisa ${statusInfo[tab as SurveyStatus]?.label.toLowerCase() ?? ""}`} hint="Troque a situação para ver as outras." action={<Button variant="ghost" onClick={() => setTab("todas")}>Ver todas</Button>} />
                )
              }
            />
          </section>
        </div>
      </Page>

      {/* Resultado da pesquisa */}
      <Drawer
        open={!!selected && !creating}
        onClose={() => setFrameQuery({ id: undefined })}
        title={selected?.title ?? "Pesquisa"}
        kicker={selected ? `${surveyKind[selected.kind]} · ${statusInfo[selected.status].label}` : undefined}
        width={560}
        footer={
          selected?.status === "aberta" ? (
            <>
              <Button variant="ghost" onClick={() => setClosing(true)}>
                Encerrar pesquisa
              </Button>
              <OperationButton operation={remind} onClick={() => void remind.run(() => new Promise((r) => setTimeout(r, 600)), `Lembrete enviado para ${formatNumber(selected.audienceSize - selected.responses)} pessoas`)}>
                <BellRing /> Lembrar quem não respondeu
              </OperationButton>
            </>
          ) : selected?.status === "rascunho" ? (
            <Button
              onClick={() => {
                setRows((all) => all.map((s) => (s.id === selected.id ? { ...s, status: "aberta", start: todayIso } : s)));
                notify("Pesquisa publicada");
              }}
            >
              Publicar agora
            </Button>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6">
            <OperationFeedback operation={remind} />
            <PropertyList
              items={[
                { label: "Público", value: selected.audienceLabel, hint: `${formatNumber(selected.audienceSize)} pessoas` },
                { label: "Período", value: `${formatDate(selected.start)} a ${formatDate(selected.end)}` },
                { label: "Respostas", value: selected.status === "rascunho" ? "—" : `${formatNumber(selected.responses)} · ${formatPercent(selected.responses / selected.audienceSize, 0)}` },
                { label: "Identificação", value: selected.anonymous ? "Anônima: ninguém vê quem respondeu o quê" : "Identificada" },
                { label: "Responsável", value: personById(selected.ownerId).name },
              ]}
            />
            {selected.kind === "enps" && selected.status !== "rascunho" && (
              <section>
                <h3 className="m-0 mb-3 text-[13px] font-medium">Distribuição das notas</h3>
                <NpsChart scores={selected.id === "s1" ? enpsScores : enpsScores.map((n) => Math.round(n * 1.07))} previous={selected.id === "s1" ? enpsPrevious : 24} />
              </section>
            )}
            {selected.id === homePoll.surveyId && (
              <section>
                <h3 className="m-0 mb-3 text-[13px] font-medium">{homePoll.question}</h3>
                <BarList items={homePoll.options.map((o) => ({ label: o.label, value: o.votes }))} showShare />
              </section>
            )}
            {selected.status !== "rascunho" && (
              <section>
                <h3 className="m-0 mb-3 text-[13px] font-medium">Participação por área</h3>
                <BarList items={participationByArea.slice(0, 6).map((a) => ({ label: a.label, value: Math.round((a.responded / a.total) * (selected.responses / 803) * 100) }))} format={(n) => formatPercent(n / 100, 0)} />
              </section>
            )}
            {selected.status === "rascunho" && <Empty framed={false} title="Ainda sem respostas" hint={`Rascunho de ${personById(selected.ownerId).name}. Publique para começar a receber respostas.`} />}
          </div>
        )}
      </Drawer>

      {/* Criar pesquisa */}
      <Drawer
        open={creating}
        onClose={closeCreate}
        title="Criar pesquisa"
        kicker="Pesquisas e clima"
        width={560}
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>
              Cancelar
            </Button>
            <OperationButton operation={create} onClick={submit}>
              {start <= todayIso ? "Publicar pesquisa" : "Agendar pesquisa"}
            </OperationButton>
          </>
        }
      >
        <div className="space-y-5">
          <OperationFeedback operation={create} />
          <ChoiceCards
            label="Tipo"
            value={kind}
            onChange={(v: SurveyKind) => setKind(v)}
            columns={2}
            options={[
              { value: "enps", label: "eNPS", description: "Nota de 0 a 10 + porquê" },
              { value: "pulso", label: "Pulso", description: "Uma pergunta rápida, anônima" },
              { value: "enquete", label: "Enquete", description: "Votação com resultado aberto" },
              { value: "clima", label: "Clima", description: "Questionário completo, anual" },
            ]}
          />
          <TextField label="Nome da pesquisa" value={title} onChange={setTitle} placeholder="Ex.: Pulso de outubro: carga de trabalho" error={tried ? errors.title : undefined} />
          {kind !== "enps" && (
            <div className="space-y-3">
              <TextField label="Pergunta" value={question} onChange={setQuestion} placeholder="Ex.: Como está sua carga de trabalho este mês?" error={tried ? errors.question : undefined} />
              <fieldset className="m-0 space-y-2 border-0 p-0">
                <legend className="mb-1.5 text-[12.5px] font-medium">Opções</legend>
                {options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <TextField label={`Opção ${i + 1}`} hideLabel className="flex-1" value={o} onChange={(v) => setOptions((all) => all.map((x, j) => (j === i ? v : x)))} placeholder={`Opção ${i + 1}`} />
                    <IconButton label={`Remover opção ${i + 1}`} onClick={() => setOptions((all) => all.filter((_, j) => j !== i))} disabled={options.length <= 2}>
                      <Trash2 />
                    </IconButton>
                  </div>
                ))}
                {tried && errors.options && <p className="m-0 text-[12px] text-rose">{errors.options}</p>}
                <Button size="sm" variant="quiet" onClick={() => setOptions((all) => [...all, ""])} disabled={options.length >= 6} disabledReason="Até 6 opções.">
                  <Plus /> Adicionar opção
                </Button>
              </fieldset>
            </div>
          )}
          <MultiSelect label="Público" value={aud} onValueChange={setAud} options={areas.map((a) => ({ value: a.id, label: a.label, description: `${formatNumber(a.headcount)} pessoas` }))} placeholder="Toda a empresa" hint="Sem seleção, vai para toda a empresa." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker label="Início" value={start} onValueChange={setStart} min={todayIso} now={todayIso} />
            <DatePicker label="Fim" value={end} onValueChange={setEnd} min={start} now={todayIso} error={tried ? errors.end : undefined} />
          </div>
          <Switch label="Respostas anônimas" checked={anon} onCheckedChange={setAnon} />
          <p className="m-0 -mt-3 text-[12px] text-muted">{anon ? "Ninguém, nem a Comunicação, vê quem respondeu o quê. Resultados por área só com 5 ou mais respostas." : "O nome de quem respondeu aparece no resultado."}</p>
          <div className="rounded-xl border border-line bg-soft p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 text-[13px] font-medium">Como a pessoa responde</p>
              <Button size="sm" variant="ghost" onClick={() => setPreview((v) => !v)}>
                <Eye /> {preview ? "Esconder" : "Pré-visualizar"}
              </Button>
            </div>
            {preview && (
              <div className="mt-3 rounded-lg border border-line bg-surface p-3">
                <Questionnaire key={`${kind}-${question}-${options.join("|")}`} title={title || "Sua pesquisa"} items={questions} submitLabel="Enviar resposta" onSubmit={() => notify("Pré-visualização: nada foi enviado", undefined, "info")} />
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={closing}
        onClose={() => setClosing(false)}
        title="Encerrar a pesquisa agora?"
        description={selected ? `${selected.title} para de receber respostas. ${formatNumber(selected.audienceSize - selected.responses)} pessoas ainda não responderam.` : undefined}
        confirmLabel="Encerrar pesquisa"
        tone="danger"
        onConfirm={() => {
          if (!selected) return;
          const before = rows;
          setRows((all) => all.map((s) => (s.id === selected.id ? { ...s, status: "encerrada", end: todayIso } : s)));
          setClosing(false);
          notify("Pesquisa encerrada", () => setRows(before));
        }}
      />
    </CommsShell>
  );
}
