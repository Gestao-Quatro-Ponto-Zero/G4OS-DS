import { Lock, Plus, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  ActionMenu,
  Badge,
  Button,
  Checkbox,
  CheckboxGroup,
  ConfirmDialog,
  DataTable,
  Drawer,
  OperationButton,
  OperationFeedback,
  Select,
  SettingsSection,
  TextField,
  TextareaField,
  Tooltip,
  notify,
  useOperation,
  type Column,
} from "@g4ai/ds";
import { initialRoles, permissions, type Permission, type RoleDef } from "./data/settings";
import { frameHref } from "./shells/frame-route";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Papéis e permissões",
  description: "Matriz de papéis × permissões por módulo, papéis de sistema bloqueados, criar, duplicar e editar papel em Drawer e pessoas por papel com link para a equipe.",
  category: "Configurações",
  order: 5.5,
  height: 980,
  concept: {
    goal: "Decidir o que cada papel pode fazer, vendo todos os papéis lado a lado, sem abrir um por um.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "Matriz com Checkbox por célula, agrupada por módulo",
      "Papéis de sistema visíveis mas bloqueados, com o motivo",
      "Criar e editar papel em Drawer (useOperation + OperationButton); barra de alterações não salvas para a matriz",
    ],
    adapt: ["Permissões de portal do cliente, perfis de acesso de ERP, alçadas de aprovação no financeiro"],
    avoid: ["Uma página por papel para comparar permissões", "Deixar editar o papel de administrador e perder o acesso"],
  },
} as const;

/* ------------------------------------------------------------------ */

const modules = Array.from(new Set(permissions.map((p) => p.module)));
const permissionOptions = permissions.map((p) => ({ value: p.id, label: `${p.module} · ${p.label}` }));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Draft = { id?: string; name: string; description: string; base: string; grants: string[] };
const emptyDraft: Draft = { name: "", description: "", base: "membro", grants: initialRoles.find((r) => r.id === "membro")?.grants ?? [] };

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

export default function SettingsRolesBlock() {
  const [saved, setSaved] = useState<RoleDef[]>(initialRoles);
  const [roles, setRoles] = useState<RoleDef[]>(initialRoles);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tried, setTried] = useState(false);
  const [removing, setRemoving] = useState<RoleDef | null>(null);
  const op = useOperation();

  const dirty = JSON.stringify(roles.map((r) => r.grants)) !== JSON.stringify(saved.map((r) => r.grants));
  const toggle = (roleId: string, perm: string, on: boolean) =>
    setRoles((rs) => rs.map((r) => (r.id === roleId ? { ...r, grants: on ? [...r.grants, perm] : r.grants.filter((g) => g !== perm) } : r)));

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(roles);
      notify("Permissões atualizadas. Valem no próximo acesso de cada pessoa.");
    }, 700);
  };

  const columns: Column<Permission>[] = [
    {
      key: "perm",
      header: "Permissão",
      primary: true,
      cell: (p) => (
        <span className="min-w-0">
          <span className="block">{p.label}</span>
          {p.description && <span className="block text-[12px] font-normal text-muted">{p.description}</span>}
        </span>
      ),
    },
    ...roles.map<Column<Permission>>((r) => ({
      key: r.id,
      header: r.name,
      align: "center",
      nowrap: true,
      cell: (p) =>
        r.system ? (
          <Tooltip content={`${r.name} é um papel de sistema e não pode ser alterado`}>
            <span className="inline-flex">
              <Checkbox label={`${r.name}: ${p.label}`} hideLabel checked={r.grants.includes(p.id)} onCheckedChange={() => undefined} disabled />
            </span>
          </Tooltip>
        ) : (
          <Checkbox label={`${r.name}: ${p.label}`} hideLabel checked={r.grants.includes(p.id)} onCheckedChange={(on) => toggle(r.id, p.id, on)} />
        ),
    })),
  ];

  const openNew = () => {
    op.reset();
    setTried(false);
    setDraft({ ...emptyDraft });
  };
  const nameError = tried && draft && !draft.name.trim() ? "Dê um nome ao papel." : tried && draft && roles.some((r) => r.id !== draft.id && r.name.toLowerCase() === draft.name.trim().toLowerCase()) ? "Já existe um papel com esse nome." : undefined;

  const submit = () => {
    if (!draft) return;
    setTried(true);
    const name = draft.name.trim();
    if (!name || roles.some((r) => r.id !== draft.id && r.name.toLowerCase() === name.toLowerCase())) return;
    const editing = Boolean(draft.id);
    void op
      .run(
        () => wait(700),
        editing ? `Papel “${name}” atualizado` : `Papel “${name}” criado`,
      )
      .then((err) => {
        if (err) return;
        const role: RoleDef = { id: draft.id ?? `r${Date.now()}`, name, description: draft.description.trim(), members: roles.find((r) => r.id === draft.id)?.members ?? 0, grants: draft.grants };
        const apply = (rs: RoleDef[]) => (editing ? rs.map((r) => (r.id === role.id ? role : r)) : [...rs, role]);
        setRoles(apply);
        setSaved(apply);
        setDraft(null);
      });
  };

  return (
    <SettingsShell
      slug="settings-roles"
      title="Papéis e permissões"
      description="O que cada papel pode fazer no workspace. Pessoas recebem um papel em Equipe."
      actions={
        <Button onClick={openNew}>
          <Plus /> Criar papel
        </Button>
      }
    >
      <SettingsSection title="Papéis" description="Administrador e Leitor são papéis de sistema: não podem ser alterados nem excluídos.">
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {roles.map((r) => (
            <li key={r.id} className="flex min-w-0 flex-col gap-2 rounded-xl border border-line bg-surface px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium">
                    {r.name}
                    {r.system && (
                      <Badge icon={<Lock />}>Sistema</Badge>
                    )}
                  </div>
                  <p className="m-0 mt-0.5 text-[12.5px] text-muted">{r.description || "Sem descrição"}</p>
                </div>
                {!r.system && (
                  <ActionMenu
                    label={`Ações para ${r.name}`}
                    actions={[
                      { label: "Editar papel", onSelect: () => { op.reset(); setTried(false); setDraft({ id: r.id, name: r.name, description: r.description, base: "", grants: r.grants }); } },
                      { label: "Duplicar", onSelect: () => { op.reset(); setTried(false); setDraft({ name: `${r.name} (cópia)`, description: r.description, base: r.id, grants: r.grants }); } },
                      { label: "Excluir papel", tone: "danger" as const, separator: true, onSelect: () => setRemoving(r) },
                    ]}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
                <span className="tabular-nums">
                  {r.grants.length} de {permissions.length} permissões
                </span>
                <a href={frameHref("settings-team", { papel: r.id })} className="inline-flex items-center gap-1 font-medium text-ink hover:underline">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {r.members === 1 ? "1 pessoa" : `${r.members} pessoas`}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </SettingsSection>

      <WideSection title="Permissões por módulo" description="Marque o que cada papel pode fazer. As mudanças valem para todas as pessoas do papel no próximo acesso.">
        <div className="flex flex-col gap-5">
          {modules.map((m) => {
            const rows = permissions.filter((p) => p.module === m);
            return (
              <div key={m}>
                <h3 className="m-0 mb-2 text-[12.5px] font-medium text-ink-soft">{m}</h3>
                <DataTable label={`Permissões de ${m}`} rows={rows} columns={columns} rowKey={(p) => p.id} density="compact" />
              </div>
            );
          })}
        </div>
      </WideSection>

      {dirty && (
        <div role="region" aria-label="Alterações não salvas" className="enter sticky bottom-4 z-[15] mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-toast">
          <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />
          <span className="flex-1 text-[13px]">Permissões alteradas</span>
          <Button size="sm" variant="ghost" onClick={() => setRoles(saved)}>
            Descartar
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar permissões"}
          </Button>
        </div>
      )}

      <Drawer
        open={draft !== null}
        onClose={() => !op.busy && setDraft(null)}
        title={draft?.id ? "Editar papel" : "Criar papel"}
        kicker="Papéis e permissões"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)} disabled={op.busy}>
              Cancelar
            </Button>
            <OperationButton operation={op} onClick={submit}>
              {draft?.id ? "Salvar papel" : "Criar papel"}
            </OperationButton>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col">
            <OperationFeedback operation={op} className="mb-4" />
            <TextField label="Nome do papel" placeholder="Ex.: Gestor comercial" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} error={nameError} autoFocus />
            <TextareaField label="Descrição" optional placeholder="Ex.: Lidera o time e aprova descontos." value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} minRows={2} maxLength={140} counter />
            {!draft.id && (
              <div className="mb-5">
                <Select
                  label="Começar a partir de"
                  options={roles.map((r) => ({ value: r.id, label: r.name }))}
                  value={draft.base}
                  onValueChange={(v) => setDraft({ ...draft, base: v, grants: roles.find((r) => r.id === v)?.grants ?? [] })}
                  hint="Copia as permissões do papel escolhido. Você ajusta abaixo."
                />
              </div>
            )}
            <CheckboxGroup label="Permissões" options={permissionOptions} value={draft.grants} onValueChange={(v) => setDraft({ ...draft, grants: v })} selectAll="Todas as permissões" />
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        tone="danger"
        title={`Excluir o papel “${removing?.name ?? ""}”?`}
        description={removing?.members ? `${removing.members === 1 ? "A pessoa com esse papel passa" : `As ${removing.members} pessoas com esse papel passam`} a ser Membro.` : "Nenhuma pessoa usa esse papel."}
        confirmLabel="Excluir papel"
        onConfirm={() => {
          const before = { roles, saved };
          const drop = (rs: RoleDef[]) => rs.filter((r) => r.id !== removing?.id);
          setRoles(drop);
          setSaved(drop);
          notify(`Papel “${removing?.name}” excluído`, () => { setRoles(before.roles); setSaved(before.saved); });
          setRemoving(null);
        }}
      />
    </SettingsShell>
  );
}
