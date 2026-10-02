import { Download, ShieldAlert, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Button,
  Callout,
  CheckboxGroup,
  ConfirmDialog,
  DataTable,
  Empty,
  HealthDot,
  OperationButton,
  OperationFeedback,
  RadioGroup,
  Select,
  SettingsSection,
  Switch,
  TextField,
  downloadCsv,
  formatBytes,
  formatDate,
  formatRelative,
  notify,
  useOperation,
  type Column,
} from "@g4ai/ds";
import { org } from "./data/workspace";
import { exportLabel, exportSets, exportTone, initialExports, retentionOptions, settingsNow, type DataExport } from "./data/settings";
import { frameHref } from "./shells/frame-route";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Dados e privacidade",
  description: "Exportação de dados (LGPD) com escolha de conjuntos e formato, histórico com download, retenção de registros e exclusão da organização com confirmação digitada e prazo para desistir.",
  category: "Configurações",
  order: 7.8,
  height: 980,
  concept: {
    goal: "Atender pedidos de portabilidade e exclusão da LGPD sem abrir chamado: o administrador exporta, define retenção e encerra a conta sozinho.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "Pedido assíncrono: o botão informa (useOperation) e o histórico mostra o andamento por ponto + texto",
      "Zona de perigo no fim, separada; nome digitado libera o botão e ConfirmDialog confirma",
      "Exclusão com prazo de 30 dias e saída para desistir",
    ],
    adapt: ["Portal do cliente (exportar meus dados), ERP (backup contábil), ATS (dados de candidatos)"],
    avoid: ["Excluir a organização com um clique", "Esconder quanto tempo o arquivo fica disponível"],
  },
} as const;

/* ------------------------------------------------------------------ */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const setLabel = (v: string) => exportSets.find((s) => s.value === v)?.label ?? v;
const DAY = 86_400_000;

/** Seção de largura total para tabelas largas (a SettingsSection deixa só a coluna da direita). */
function WideSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="m-0 text-[15px] font-medium">{title}</h2>
      {description && <p className="m-0 mt-1 max-w-[640px] text-[12.5px] leading-relaxed text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SettingsDataBlock() {
  const [exportsList, setExportsList] = useState<DataExport[]>(initialExports);
  const [sets, setSets] = useState<string[]>(["crm", "fin"]);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [triedExport, setTriedExport] = useState(false);
  const [retention, setRetention] = useState("24");
  const [anonymize, setAnonymize] = useState(true);
  const [typed, setTyped] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletionAt, setDeletionAt] = useState<Date | null>(null);
  const op = useOperation({ busyLabel: "Pedindo…" });

  const requestExport = () => {
    setTriedExport(true);
    if (!sets.length) return;
    const id = `exp-${105 + exportsList.length - initialExports.length}`;
    void op.run(() => wait(800), "Exportação pedida. Avisamos por e-mail quando estiver pronta.").then((err) => {
      if (err) return;
      setExportsList((xs) => [{ id, sets, format, requestedBy: "Joana Ribeiro", requestedAt: settingsNow, status: "gerando" }, ...xs]);
      setTriedExport(false);
      setTimeout(() => setExportsList((xs) => xs.map((x) => (x.id === id ? { ...x, status: "pronta", size: 12_400_000 } : x))), 4000);
    });
  };

  const download = (x: DataExport) => {
    const rows = [["conjunto", "registros", "gerado_em"], ...x.sets.map((s, i) => [setLabel(s), String(1200 + i * 431), formatDate(x.requestedAt)])];
    downloadCsv(`atlas-${x.id}`, rows.map((r) => r.join(";")).join("\n"));
  };

  const columns: Column<DataExport>[] = [
    {
      key: "conjuntos",
      header: "Conjuntos",
      primary: true,
      cell: (x) => (
        <span className="min-w-0">
          <span className="block">{x.sets.map(setLabel).join(", ")}</span>
          <span className="block text-[12px] font-normal text-muted">
            {x.id} · {x.format.toUpperCase()}
            {x.size ? ` · ${formatBytes(x.size)}` : ""}
          </span>
        </span>
      ),
    },
    { key: "quem", header: "Pedido por", nowrap: true, mobileHidden: true, cell: (x) => x.requestedBy },
    { key: "quando", header: "Quando", nowrap: true, cell: (x) => <span className="text-muted">{formatRelative(x.requestedAt, settingsNow)}</span> },
    { key: "status", header: "Status", nowrap: true, cell: (x) => <HealthDot tone={exportTone[x.status]} label={exportLabel[x.status]} /> },
    {
      key: "baixar",
      header: "",
      action: true,
      align: "right",
      cell: (x) =>
        x.status === "pronta" ? (
          <Button size="sm" variant="quiet" onClick={() => download(x)}>
            <Download /> Baixar
          </Button>
        ) : x.status === "expirada" ? (
          <Button size="sm" variant="quiet" onClick={() => { setSets(x.sets); setFormat(x.format); notify("Conjuntos copiados para um novo pedido", undefined, "info"); }}>
            Pedir de novo
          </Button>
        ) : null,
    },
  ];

  const nameMatches = typed.trim() === org.name;

  return (
    <SettingsShell slug="settings-data" title="Dados e privacidade" description="Exporte, guarde por quanto tempo precisar e exclua os dados da organização, conforme a LGPD.">
      {deletionAt && (
        <div className="mb-6">
        <Callout
          tone="bad"
          title={`Exclusão agendada para ${formatDate(deletionAt)}`}
          action={
            <Button size="sm" variant="ghost" onClick={() => { setDeletionAt(null); notify("Exclusão cancelada. Nada foi apagado."); }}>
              Cancelar exclusão
            </Button>
          }
        >
          Até lá, o workspace fica só leitura. Exporte o que precisar antes da data.
        </Callout>
        </div>
      )}

      <SettingsSection title="Exportar dados" description="Geramos um arquivo compactado com os conjuntos escolhidos. O link vale por 7 dias e só administradores baixam.">
        <CheckboxGroup label="O que exportar" options={exportSets} value={sets} onValueChange={setSets} columns={2} selectAll="Tudo" error={triedExport && !sets.length ? "Escolha pelo menos um conjunto." : undefined} />
        <div className="mt-5">
          <RadioGroup<"csv" | "json">
            label="Formato"
            orientation="horizontal"
            value={format}
            onChange={setFormat}
            options={[
              { value: "csv", label: "CSV", description: "Abre no Excel e no Google Planilhas" },
              { value: "json", label: "JSON", description: "Para importar em outro sistema" },
            ]}
          />
        </div>
        <OperationFeedback operation={op} className="mt-4" />
        <OperationButton operation={op} className="mt-5" onClick={requestExport}>
          <Download /> Pedir exportação
        </OperationButton>
      </SettingsSection>

      <WideSection title="Histórico de exportações" description="Quem pediu, quando e o que foi exportado fica registrado também na Auditoria.">
        <div className="mb-6 border-b border-line pb-8">
        <DataTable
          label="Histórico de exportações"
          rows={exportsList}
          columns={columns}
          rowKey={(x) => x.id}
          empty={<Empty framed={false} title="Nenhuma exportação ainda" hint="Peça a primeira acima. Avisamos por e-mail quando o arquivo estiver pronto." />}
        />
        <a href={frameHref("settings-audit-log")} className="mt-3 inline-block text-[12.5px] font-medium text-ink hover:underline">
          Ver na auditoria
        </a>
        </div>
      </WideSection>

      <SettingsSection title="Retenção" description="Registros excluídos ficam na lixeira por 30 dias. Depois, seguem esta regra.">
        <div className="max-w-[320px]">
          <Select
            label="Guardar registros encerrados por"
            options={retentionOptions}
            value={retention}
            onValueChange={(v) => {
              setRetention(v);
              notify(`Retenção alterada para ${retentionOptions.find((o) => o.value === v)?.label.toLowerCase()}`);
            }}
            hint="Notas fiscais seguem o prazo legal de 5 anos, independentemente desta escolha."
          />
        </div>
        <div className="mt-4">
          <Switch
            label="Anonimizar contatos inativos há mais de 24 meses"
            checked={anonymize}
            onCheckedChange={(v) => {
              setAnonymize(v);
              notify(v ? "Anonimização automática ativada" : "Anonimização automática desativada");
            }}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Excluir organização" description={`Apaga o workspace da ${org.name}, todas as pessoas, registros e arquivos. Você tem 30 dias para desistir.`}>
        <div className="rounded-xl border border-rose/20 bg-rose-soft/30 px-4 py-4">
          <p className="m-0 flex items-start gap-2 text-[13px] text-ink-soft">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose" aria-hidden />
            Depois de 30 dias, não dá para recuperar. A assinatura é cancelada e não há reembolso do período em curso.
          </p>
          <div className="mt-4 max-w-[320px]">
            <TextField label={`Digite ${org.name} para confirmar`} value={typed} onChange={setTyped} autoComplete="off" disabled={Boolean(deletionAt)} />
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-rose"
            disabled={!nameMatches || Boolean(deletionAt)}
            disabledReason={deletionAt ? "A exclusão já está agendada" : `Digite ${org.name} no campo acima`}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 /> Excluir organização
          </Button>
        </div>
      </SettingsSection>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        tone="danger"
        title={`Excluir a organização ${org.name}?`}
        description="Todas as pessoas perdem o acesso em 30 dias. Até lá, você pode cancelar a exclusão aqui."
        confirmLabel="Excluir organização"
        onConfirm={() => {
          setDeletionAt(new Date(settingsNow.getTime() + 30 * DAY));
          setTyped("");
          notify("Exclusão agendada. Enviamos a confirmação para os administradores.");
        }}
      />
    </SettingsShell>
  );
}
