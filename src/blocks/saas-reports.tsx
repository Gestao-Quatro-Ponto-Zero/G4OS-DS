import { CalendarClock, FileSpreadsheet, FileText, LayoutDashboard, Play, Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActionMenu,
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  FieldBlock,
  FieldGrid,
  Modal,
  Page,
  PageHeading,
  Select,
  Sparkline,
  TagInput,
  TextField,
  formatDate,
  notify,
  type Column,
} from "@g4ai/ds";
import { me, personById, reports as baseReports, today, useFrameParam, type Report } from "./data/saas";
import { SaasShell } from "./shells/saas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Relatórios",
  description: "Modelos prontos, relatórios salvos com agendamento, execução manual e criação com destinatários.",
  category: "SaaS",
  order: 7,
  height: 980,
  concept: {
    goal: "Gerar e agendar relatórios recorrentes para quem precisa receber números sem entrar no app.",
    patterns: [
      "Anatomia A · Lista: modelos prontos + relatórios salvos",
      "Agendamento e execução manual",
      "Criação com destinatários em modal",
    ],
    adapt: [
      "Relatórios do financeiro, do recrutamento, de operações",
    ],
    avoid: [
      "Relatório sem dono nem próxima execução visível",
    ],
  },
} as const;

const here = "#/frame/saas-reports";
const formatIcon: Record<Report["format"], ReactNode> = { PDF: <FileText />, CSV: <FileSpreadsheet />, Painel: <LayoutDashboard /> };
const templates = [
  { name: "Receita e churn", description: "MRR, novos, expansão e churn por mês.", spark: [31, 33, 32, 35, 36, 38, 41] },
  { name: "Saúde da base", description: "Contas por faixa de uso e risco.", spark: [50, 48, 47, 49, 52, 55, 54] },
  { name: "Aquisição", description: "Funil de visitas a assinaturas por origem.", spark: [12, 14, 13, 17, 16, 19, 22] },
  { name: "Suporte", description: "Volume, SLA e satisfação por canal.", spark: [30, 28, 26, 27, 24, 22, 21] },
];
const frequencies = ["Diário", "Toda segunda", "Todo dia 1", "Sob demanda"];

export default function SaasReports() {
  const [reports, setReports] = useState(baseReports);
  const [editing, setEditing] = useState<Partial<Report> | null>(null);
  const [freq, setFreq] = useState(frequencies[1]);
  const [time, setTime] = useState("08:00");
  const [to, setTo] = useState<string[]>(["diretoria@pulso.com.br"]);
  const novo = useFrameParam("novo");
  useEffect(() => {
    if (novo) setEditing({ name: "", format: "PDF" });
  }, [novo]);

  const run = (r: Report) => {
    setReports((all) => all.map((x) => (x.id === r.id ? { ...x, lastRun: today.toISOString().slice(0, 10) } : x)));
    notify(`“${r.name}” gerado · ${r.format === "Painel" ? "painel atualizado" : `${r.format} enviado por e-mail`}`);
  };
  const save = () => {
    if (!editing?.name?.trim()) return;
    const schedule = freq === "Sob demanda" ? undefined : `${freq} · ${time}`;
    if (editing.id) {
      setReports((all) => all.map((x) => (x.id === editing.id ? { ...x, ...editing, schedule } as Report : x)));
      notify("Relatório atualizado");
    } else {
      const r: Report = { id: `r${Date.now()}`, name: editing.name.trim(), description: editing.description ?? "Relatório personalizado.", owner: me, schedule, lastRun: "—", format: editing.format ?? "PDF" };
      setReports((all) => [r, ...all]);
      notify(`“${r.name}” criado${schedule ? ` · ${schedule}` : ""}`, () => setReports((all) => all.filter((x) => x.id !== r.id)));
    }
    setEditing(null);
  };

  const columns: Column<Report>[] = [
    {
      key: "name",
      header: "Relatório",
      primary: true,
      cell: (r) => (
        <span className="flex items-center gap-2.5">
          <span className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-soft text-muted [&_svg]:h-4 [&_svg]:w-4">{formatIcon[r.format]}</span>
          <span className="min-w-0">
            <span className="block truncate">{r.name}</span>
            <span className="block truncate text-[12px] font-normal text-muted">{r.description}</span>
          </span>
        </span>
      ),
    },
    { key: "schedule", header: "Agendamento", cell: (r) => (r.schedule ? <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-muted" />{r.schedule}</span> : <span className="text-muted">Sob demanda</span>) },
    { key: "owner", header: "Dono", mobileHidden: true, cell: (r) => <Avatar {...personById(r.owner)} size="sm" name={personById(r.owner).name} /> },
    { key: "last", header: "Última execução", nowrap: true, cell: (r) => <span className="text-muted">{r.lastRun === "—" ? "Nunca" : formatDate(r.lastRun)}</span> },
    { key: "format", header: "Formato", mobileHidden: true, cell: (r) => <Badge>{r.format}</Badge> },
    {
      key: "actions",
      header: "",
      action: true,
      cell: (r) => (
        <span className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => run(r)}>
            <Play /> Executar
          </Button>
          <ActionMenu
            actions={[
              {
                label: "Editar agendamento",
                onSelect: () => {
                  setEditing(r);
                  setFreq(r.schedule?.split(" · ")[0] ?? "Sob demanda");
                },
              },
              { label: "Duplicar", onSelect: () => (setReports((all) => [{ ...r, id: `r${Date.now()}`, name: `${r.name} (cópia)` }, ...all]), notify("Relatório duplicado")) },
              {
                label: "Excluir",
                tone: "danger",
                separator: true,
                onSelect: () => {
                  setReports((all) => all.filter((x) => x.id !== r.id));
                  notify(`“${r.name}” excluído`, () => setReports((all) => [r, ...all]));
                },
              },
            ]}
          />
        </span>
      ),
    },
  ];

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="Relatórios"
          description="Relatórios salvos pelo time e modelos prontos. Agendados chegam por e-mail no horário escolhido."
          actions={
            <Button onClick={() => setEditing({ name: "", format: "PDF" })}>
              <Plus /> Novo relatório
            </Button>
          }
        />
        <section className="mt-6">
          <h2 className="m-0 mb-3 text-[14px] font-medium">Comece de um modelo</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {templates.map((t) => (
              <Card key={t.name} onClick={() => setEditing({ name: t.name, description: t.description, format: "PDF" })}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium">{t.name}</div>
                    <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">{t.description}</p>
                  </div>
                  <Sparkline values={t.spark} width={64} height={24} />
                </div>
              </Card>
            ))}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="m-0 mb-3 text-[14px] font-medium">Salvos · {reports.length}</h2>
          <DataTable rows={reports} columns={columns} rowKey={(r) => r.id} />
        </section>
      </Page>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Editar relatório" : "Novo relatório"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!editing?.name?.trim()}>
              {editing?.id ? "Salvar" : "Criar relatório"}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <TextField label="Nome" value={editing.name ?? ""} onChange={(v) => setEditing((e) => ({ ...e, name: v }))} autoFocus />
            <FieldGrid>
              <FieldBlock label="Formato">
                <Select label="Formato" value={editing.format ?? "PDF"} onValueChange={(v) => setEditing((e) => ({ ...e, format: v as Report["format"] }))} options={["PDF", "CSV", "Painel"].map((f) => ({ value: f, label: f }))} />
              </FieldBlock>
              <FieldBlock label="Frequência">
                <Select label="Frequência" value={freq} onValueChange={setFreq} options={frequencies.map((f) => ({ value: f, label: f }))} />
              </FieldBlock>
            </FieldGrid>
            {freq !== "Sob demanda" && (
              <>
                <TextField label="Horário" type="time" value={time} onChange={setTime} className="max-w-[160px]" />
                <TagInput label="Enviar para" value={to} onChange={setTo} placeholder="e-mail e Enter" />
              </>
            )}
          </div>
        )}
      </Modal>
    </SaasShell>
  );
}
