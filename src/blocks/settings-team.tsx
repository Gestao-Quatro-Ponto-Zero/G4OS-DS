import { Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ActionMenu,
  Avatar,
  Badge,
  Button,
  ChoiceCards,
  ConfirmDialog,
  DataTable,
  Empty,
  Meter,
  Modal,
  InlineSelect,
  Select,
  TableToolbar,
  TagInput,
  cn,
  normalize,
  notify,
  type Column } from "@g4ai/ds";
import { org, people, roleLabel, type Person, type Role } from "./data/workspace";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Equipe e permissões",
  description: "Membros com papel editável na linha, convites pendentes, uso de licenças, modal de convite em massa e remoção com confirmação.",
  category: "Configurações",
  order: 5,
  height: 900,
  concept: {
    goal: "Gerenciar quem tem acesso e com qual papel, dentro do limite de licenças.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "Papel editável na linha",
      "Convites pendentes e uso de licenças visíveis",
      "Convite em massa em modal; remoção com confirmação",
    ],
    adapt: [
      "Equipes de qualquer produto; usuários de cliente no portal",
    ],
    avoid: [
      "Remover membro sem confirmação",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Member = Pick<Person, "id" | "name" | "email" | "role" | "status" | "lastSeen" | "tint">;
const seats = org.seats;
const roleOptions: { value: Role; label: string }[] = (Object.keys(roleLabel) as Role[]).map((value) => ({ value, label: roleLabel[value] }));
const initialMembers: Member[] = people;
const initialsOf = (n: string) => (n.includes("@") ? n[0].toUpperCase() : n.split(" ").map((w) => w[0]).slice(0, 2).join(""));

/** Uso contra um limite do plano (não é meta: perto do limite = âmbar). */
function UsageMeter({ label, value, limit, format = (n: number) => n.toLocaleString("pt-BR") }: { label: string; value: number; limit: number; format?: (n: number) => string }) {
  const pct = limit ? value / limit : 0;
  const warn = pct >= 0.9;
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="truncate text-[13px] font-medium">{label}</span>
        <span className="shrink-0 text-[12px] tabular-nums text-muted">
          <span className="font-medium text-ink">{format(value)}</span> de {format(limit)}
        </span>
      </div>
      <Meter value={pct * 100} thick tone={warn ? "warn" : "ink"} label={label} />
      <p className={cn("m-0 mt-1.5 text-[11.5px] tabular-nums", warn ? "font-medium text-amber" : "text-muted")}>
        {warn ? `Perto do limite · ${format(Math.max(0, limit - value))} restantes` : `${format(limit - value)} disponíveis`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function SettingsTeamBlock() {
  // ?estado=carregando|vazio|erro simula os estados da lista.
  const estado = useFrameParam("estado");
  const [members, setMembers] = useState(() => (estado === "vazio" ? initialMembers.filter((m) => m.id === "joana") : initialMembers));
  // ?papel=<id> chega de Papéis e permissões ("ver pessoas").
  const papelParam = useFrameParam("papel");
  const papel = papelParam && papelParam in roleLabel ? (papelParam as Role) : null;
  const [transferring, setTransferring] = useState<Member | null>(null);
  const [transferTo, setTransferTo] = useState("");
  const [q, setQ] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [inviteRole, setInviteRole] = useState<Role | null>("membro");
  const [removing, setRemoving] = useState<Member | null>(null);
  const [inviteTried, setInviteTried] = useState(false);

  const shown = useMemo(() => members.filter((m) => (!q || normalize(`${m.name} ${m.email}`).includes(normalize(q))) && (!papel || m.role === papel)), [members, q, papel]);
  const used = members.filter((m) => m.role !== "leitor").length; // leitor não conta licença
  const admins = members.filter((m) => m.role === "admin").length;

  const columns: Column<Member>[] = [
    {
      key: "pessoa",
      header: "Pessoa",
      primary: true,
      cell: (m) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar initials={initialsOf(m.name)} tint={m.tint} size="sm" name={m.name} />
          <span className="min-w-0">
            <span className="block truncate font-medium">{m.status === "convidado" ? m.email : m.name}</span>
            {m.status === "ativo" && <span className="block truncate text-[12px] font-normal text-muted">{m.email}</span>}
          </span>
        </span>
      ),
    },
    {
      key: "papel",
      header: "Papel",
      cell: (m) => (
        <InlineSelect
          label={`Papel de ${m.name}`}
          options={roleOptions}
          value={m.role}
          disabledReason={m.role === "admin" && admins === 1 ? "Único administrador: promova outra pessoa antes" : undefined}
          onValueChange={(v) => {
            setMembers((xs) => xs.map((x) => (x.id === m.id ? { ...x, role: v as Role } : x)));
            notify(`${m.name.split(" ")[0]} agora é ${roleOptions.find((r) => r.value === v)?.label.toLowerCase()}`);
          }}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      nowrap: true,
      cell: (m) => (m.status === "ativo" ? <Badge tone="ok">Ativo</Badge> : <Badge tone="warn" icon={<Mail />}>Convite pendente</Badge>),
    },
    { key: "acesso", header: "Último acesso", nowrap: true, cell: (m) => <span className="text-muted">{m.lastSeen}</span> },
    {
      key: "acoes",
      header: "",
      action: true,
      align: "right",
      cell: (m) => (
        <ActionMenu
          label={`Ações para ${m.name}`}
          actions={[
            ...(m.status === "convidado" ? [{ label: "Reenviar convite", onSelect: () => notify(`Convite reenviado para ${m.email}`) }] : [{ label: "Ver atividade", onSelect: () => go("settings-audit-log", { pessoa: m.id }) }]),
            ...(m.status === "ativo" ? [{ label: "Transferir registros…", onSelect: () => { setTransferTo(""); setTransferring(m); } }] : []),
            { label: m.status === "convidado" ? "Cancelar convite" : "Remover do espaço", tone: "danger" as const, separator: true, onSelect: () => setRemoving(m), disabled: m.role === "admin" && admins === 1 },
          ]}
        />
      ),
    },
  ];

  const cost = inviteRole === "leitor" ? 0 : emails.length;
  const over = used + cost > seats;

  const sendInvites = () => {
    setInviteTried(true);
    if (!emails.length || !inviteRole) return;
    if (over) return;
    setMembers((xs) => [
      ...xs,
      ...emails.map((e, k) => ({ id: `n${Date.now()}${k}`, name: e, email: e, role: inviteRole, status: "convidado" as const, lastSeen: "convite agora", tint: "#a3a7b0" })),
    ]);
    notify(`${emails.length} ${emails.length === 1 ? "convite enviado" : "convites enviados"}`);
    setEmails([]);
    setInviteTried(false);
    setInviteOpen(false);
  };

  return (
    <SettingsShell slug="settings-team" title="Equipe" description={`Quem acessa o workspace da ${org.name} e o que cada pessoa pode fazer.`}>
      <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <UsageMeter label="Licenças em uso" value={used} limit={seats} />
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus /> Convidar pessoas
        </Button>
      </div>

      <div className="mb-3">
        <TableToolbar
          query={q}
          onQuery={setQ}
          placeholder="Buscar por nome ou e-mail"
          shown={shown.length}
          total={members.length}
          noun="pessoa"
          dirty={!!q || !!papel}
          onClear={() => {
            setQ("");
            setFrameQuery({ papel: undefined });
          }}
          hideSearch={false}
        />
        {papel && (
          <p className="m-0 mt-2 text-[12.5px] text-muted">
            Mostrando só quem é <span className="font-medium text-ink">{roleLabel[papel].toLowerCase()}</span>.{" "}
            <button type="button" className="font-medium text-ink underline underline-offset-2" onClick={() => setFrameQuery({ papel: undefined })}>
              Ver todos
            </button>
          </p>
        )}
      </div>
      <DataTable
        rows={estado === "carregando" || estado === "erro" ? [] : shown}
        columns={columns}
        rowKey={(m) => m.id}
        label="Membros do workspace"
        loading={estado === "carregando"}
        error={estado === "erro" ? { message: "Não foi possível carregar a equipe.", onRetry: () => setFrameQuery({ estado: undefined }) } : undefined}
        empty={
          <Empty
            framed={false}
            title="Ninguém com esse recorte"
            hint={q ? `Nenhuma pessoa com “${q}” no nome ou e-mail${papel ? ` e papel ${roleLabel[papel].toLowerCase()}` : ""}.` : `Ninguém tem o papel ${papel ? roleLabel[papel].toLowerCase() : ""} ainda.`}
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQ("");
                  setFrameQuery({ papel: undefined });
                }}
              >
                Limpar busca e filtros
              </Button>
            }
          />
        }
      />
      {/* Vazio: o workspace sempre tem quem o criou; o estado vazio é "só você". */}
      {members.length <= 1 && !q && !papel && estado !== "carregando" && estado !== "erro" && (
        <div className="mt-3">
          <Empty icon={<Users />} title="Só você por aqui" hint="Convide quem trabalha com você para dividir registros e tarefas. O convite vale por 7 dias." />
        </div>
      )}

      <div className="mt-8 rounded-xl border border-line bg-soft/40 px-4 py-4">
        <h3 className="m-0 flex items-center gap-2 text-[13.5px] font-medium">
          <ShieldCheck className="h-4 w-4 text-muted" /> O que cada papel pode fazer
        </h3>
        <dl className="m-0 mt-3 grid gap-3 text-[12.5px] sm:grid-cols-3">
          {[
            ["Administrador", "Tudo, inclusive convidar pessoas, mudar papéis e cobrança."],
            ["Membro", "Cria e edita registros nos módulos ativos. Não vê cobrança."],
            ["Leitor", "Vê painéis e registros. Não edita nada. Não conta como licença."],
          ].map(([t, d]) => (
            <div key={t}>
              <dt className="font-medium text-ink">{t}</dt>
              <dd className="m-0 mt-0.5 leading-relaxed text-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Convidar pessoas"
        description="Cada pessoa recebe um e-mail para entrar. O convite vale por 7 dias."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={sendInvites} disabled={over}>
              {emails.length > 1 ? `Enviar ${emails.length} convites` : "Enviar convite"}
            </Button>
          </>
        }
      >
        <TagInput
          label="E-mails"
          value={emails}
          onChange={setEmails}
          placeholder="nome@empresa.com"
          validate={(t) => (/.+@.+\..+/.test(t) ? (members.some((m) => m.email === t) ? `${t} já faz parte do espaço.` : null) : `“${t}” não é um e-mail.`)}
          error={inviteTried && !emails.length ? "Adicione pelo menos um e-mail." : over ? `Você tem ${seats - used} licenças livres. Remova ${used + cost - seats}, convide como leitor ou aumente o plano.` : undefined}
          hint="Cole vários separados por vírgula."
        />
        <ChoiceCards<Role>
          label="Papel"
          columns={3}
          value={inviteRole}
          onChange={setInviteRole}
          options={[
            { value: "admin", label: "Administrador", description: "Acesso total" },
            { value: "membro", label: "Membro", description: "Trabalha nos módulos" },
            { value: "leitor", label: "Leitor", description: "Só visualiza" },
          ]}
        />
      </Modal>

      <Modal
        open={!!transferring}
        onClose={() => setTransferring(null)}
        title={`Transferir registros de ${transferring?.name ?? ""}`}
        description="Negócios, tarefas e documentos dessa pessoa passam para quem você escolher. O histórico continua com o nome original."
        footer={
          <>
            <Button variant="ghost" onClick={() => setTransferring(null)}>
              Cancelar
            </Button>
            <Button
              disabledReason={!transferTo ? "Escolha quem vai receber os registros" : undefined}
              onClick={() => {
                const to = members.find((x) => x.id === transferTo);
                notify(`Registros de ${transferring?.name.split(" ")[0]} transferidos para ${to?.name}`);
                setTransferring(null);
              }}
            >
              Transferir registros
            </Button>
          </>
        }
      >
        <Select
          label="Transferir para"
          value={transferTo}
          onValueChange={setTransferTo}
          placeholder="Escolha uma pessoa"
          options={members.filter((x) => x.status === "ativo" && x.id !== transferring?.id && x.role !== "leitor").map((x) => ({ value: x.id, label: x.name }))}
        />
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        tone="danger"
        title={removing?.status === "convidado" ? `Cancelar o convite de ${removing?.email}?` : `Remover ${removing?.name} do espaço?`}
        description={removing?.status === "convidado" ? "O link do convite para de funcionar." : "A pessoa perde o acesso na hora. Os registros dela continuam e podem ser transferidos."}
        confirmLabel={removing?.status === "convidado" ? "Cancelar convite" : "Remover pessoa"}
        onConfirm={() => {
          setMembers((xs) => xs.filter((x) => x.id !== removing?.id));
          notify(removing?.status === "convidado" ? "Convite cancelado" : `${removing?.name} removido`);
          setRemoving(null);
        }}
      />
    </SettingsShell>
  );
}
