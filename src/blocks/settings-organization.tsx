import { Globe, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  ActionMenu,
  Badge,
  Button,
  Combobox,
  ConfirmDialog,
  CopyButton,
  EntityMark,
  FileDropzone,
  HealthDot,
  MaskedField,
  Modal,
  Select,
  SettingsSection,
  TextField,
  formatRelative,
  masks,
  notify,
  type UploadItem,
} from "@g4ai/ds";
import {
  currencyOptions,
  domainLabel,
  domainTone,
  languageOptions,
  monthOptions,
  orgDomains,
  organization,
  settingsNow,
  timezoneOptions,
  type OrgDomain,
} from "./data/settings";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Organização",
  description: "Dados da empresa e do workspace: nome, razão social, CNPJ, logo, domínios verificados, fuso, idioma, moeda e início do ano fiscal, com barra de alterações não salvas.",
  category: "Configurações",
  order: 1.5,
  height: 960,
  concept: {
    goal: "Manter num só lugar a identidade da empresa que aparece em documentos, e-mails e relatórios do workspace.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "Seções rótulo-à-esquerda; barra de alterações não salvas no rodapé",
      "Domínio com status por ponto + texto e verificação sob demanda",
      "Logo por FileDropzone com prévia",
    ],
    adapt: ["Dados fiscais do ERP, perfil da empresa no portal do cliente, conta de cliente no SaaS"],
    avoid: ["Salvar cada campo sozinho em formulário longo", "Domínio sem dizer o que falta para verificar"],
  },
} as const;

/* ------------------------------------------------------------------ */

type Form = typeof organization;

export default function SettingsOrganizationBlock() {
  const [saved, setSaved] = useState<Form>(organization);
  const [form, setForm] = useState<Form>(organization);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState<UploadItem[]>([]);
  const [domains, setDomains] = useState<OrgDomain[]>(orgDomains);
  const [adding, setAdding] = useState(false);
  const [newHost, setNewHost] = useState("");
  const [tried, setTried] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [removing, setRemoving] = useState<OrgDomain | null>(null);

  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const errors = {
    name: !form.name.trim() ? "Informe o nome da organização." : undefined,
    legalName: !form.legalName.trim() ? "Informe a razão social, como está no CNPJ." : undefined,
    workspaceUrl: !/^[a-z0-9-]{3,}$/.test(form.workspaceUrl) ? "Use ao menos 3 letras minúsculas, números ou hífen." : undefined,
  };
  const invalid = Object.values(errors).some(Boolean);

  const save = () => {
    if (invalid) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(form);
      notify("Dados da organização atualizados");
    }, 700);
  };

  const uploadLogo = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const id = String(Date.now());
    setLogo([{ id, name: f.name, size: f.size, progress: 10 }]);
    let p = 10;
    const t = setInterval(() => {
      p += 30;
      if (p >= 100) {
        clearInterval(t);
        setLogo([{ id, name: f.name, size: f.size }]);
        notify("Logo atualizado");
      } else setLogo([{ id, name: f.name, size: f.size, progress: p }]);
    }, 250);
  };

  const hostError = tried ? (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(newHost.trim()) ? "Informe um domínio, como acme.com.br." : domains.some((d) => d.host === newHost.trim().toLowerCase()) ? "Esse domínio já está na lista." : undefined) : undefined;
  const addDomain = () => {
    setTried(true);
    const host = newHost.trim().toLowerCase();
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) || domains.some((d) => d.host === host)) return;
    setDomains((ds) => [...ds, { id: `d${Date.now()}`, host, status: "pendente", checkedAt: settingsNow }]);
    setAdding(false);
    setNewHost("");
    setTried(false);
    notify(`Domínio ${host} adicionado. Configure o registro TXT para verificar.`);
  };

  const verify = (d: OrgDomain) => {
    setChecking(d.id);
    setTimeout(() => {
      setChecking(null);
      setDomains((ds) => ds.map((x) => (x.id === d.id ? { ...x, status: "verificado", checkedAt: settingsNow } : x)));
      notify(`Domínio ${d.host} verificado`);
    }, 900);
  };

  return (
    <SettingsShell slug="settings-organization" title="Organização" description="Como a empresa aparece em documentos, e-mails e relatórios do workspace.">
      <SettingsSection title="Logo" description="PNG ou SVG quadrado, até 2 MB. Aparece na barra lateral, em propostas e e-mails.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <EntityMark name={form.name || "Organização"} className="h-16 w-16 shrink-0 text-[20px]" />
          <FileDropzone
            className="min-w-0 flex-1"
            label="Arquivo do logo"
            hideLabel
            accept=".png,.svg"
            maxSize={2 * 1024 * 1024}
            multiple={false}
            items={logo}
            onFiles={uploadLogo}
            onRemove={() => setLogo([])}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Dados da empresa" description="Usados em notas, contratos e na cobrança. A razão social e o CNPJ precisam bater com a Receita.">
        <TextField label="Nome da organização" value={form.name} onChange={set("name")} error={errors.name} hint="Como o time chama a empresa no dia a dia." />
        <TextField label="Razão social" value={form.legalName} onChange={set("legalName")} error={errors.legalName} />
        <MaskedField label="CNPJ" mask={masks.cnpj} value={form.cnpj} onChange={(m) => set("cnpj")(m)} />
        <TextField
          label="Endereço do workspace"
          value={form.workspaceUrl}
          onChange={(v) => set("workspaceUrl")(v.toLowerCase())}
          suffix=".atlas.app"
          error={errors.workspaceUrl}
          hint="Mudar o endereço faz links antigos redirecionarem por 90 dias."
        />
      </SettingsSection>

      <SettingsSection title="Domínios" description="Pessoas com e-mail destes domínios entram sem convite, com o papel Membro. Verificamos por um registro TXT no DNS.">
        <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
          {domains.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-soft text-muted">
                <Globe className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium">
                  <span className="truncate">{d.host}</span>
                  {d.primary && <Badge>Principal</Badge>}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                  <HealthDot tone={domainTone[d.status]} label={domainLabel[d.status]} />
                  <span>Conferido {formatRelative(d.checkedAt, settingsNow)}</span>
                </div>
                {d.status !== "verificado" && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-soft px-3 py-2">
                    <code className="min-w-0 flex-1 break-all font-mono text-[12px] text-ink-soft">atlas-verify=7c2f91ad{d.id}</code>
                    <CopyButton value={`atlas-verify=7c2f91ad${d.id}`} iconOnly />
                  </div>
                )}
              </div>
              {d.status !== "verificado" && (
                <Button size="sm" variant="ghost" onClick={() => verify(d)} disabled={checking === d.id}>
                  <RefreshCw /> {checking === d.id ? "Verificando…" : "Verificar agora"}
                </Button>
              )}
              <ActionMenu
                label={`Ações para ${d.host}`}
                actions={[
                  {
                    label: "Tornar principal",
                    disabled: d.primary || d.status !== "verificado",
                    onSelect: () => {
                      setDomains((ds) => ds.map((x) => ({ ...x, primary: x.id === d.id })));
                      notify(`${d.host} agora é o domínio principal`);
                    },
                  },
                  { label: "Remover domínio", tone: "danger" as const, separator: true, disabled: d.primary, onSelect: () => setRemoving(d) },
                ]}
              />
            </li>
          ))}
        </ul>
        <Button size="sm" variant="ghost" className="mt-3" onClick={() => setAdding(true)}>
          <Plus /> Adicionar domínio
        </Button>
      </SettingsSection>

      <SettingsSection title="Região e formato" description="Padrão do workspace para datas, horários, números e relatórios. Cada pessoa pode mudar o próprio idioma no Perfil.">
        <div className="grid gap-x-4 sm:grid-cols-2">
          <div className="mb-5">
            <Combobox label="Fuso horário" options={timezoneOptions} value={form.timezone} onValueChange={(v: string) => set("timezone")(v)} hint="Define o fechamento do dia em relatórios." />
          </div>
          <div className="mb-5">
            <Select label="Idioma padrão" options={languageOptions} value={form.language} onValueChange={set("language")} />
          </div>
          <div className="mb-5">
            <Select label="Moeda" options={currencyOptions} value={form.currency} onValueChange={set("currency")} hint="Valores já lançados não são convertidos." />
          </div>
          <div className="mb-5">
            <Select label="Início do ano fiscal" options={monthOptions} value={form.fiscalYearStart} onValueChange={set("fiscalYearStart")} />
          </div>
        </div>
      </SettingsSection>

      {dirty && (
        <div role="region" aria-label="Alterações não salvas" className="enter sticky bottom-4 z-[15] mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-toast">
          <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />
          <span className="flex-1 text-[13px]">Alterações não salvas</span>
          <Button size="sm" variant="ghost" onClick={() => setForm(saved)}>
            Descartar
          </Button>
          <Button size="sm" onClick={save} disabled={saving || invalid} disabledReason={invalid ? "Corrija os campos destacados" : undefined}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => { setAdding(false); setNewHost(""); setTried(false); }}
        title="Adicionar domínio"
        description="Depois de adicionar, crie o registro TXT no seu provedor de DNS. A verificação leva até 48 h."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setAdding(false); setNewHost(""); setTried(false); }}>
              Cancelar
            </Button>
            <Button onClick={addDomain}>Adicionar domínio</Button>
          </>
        }
      >
        <TextField label="Domínio" placeholder="Ex.: acmeservicos.com.br" value={newHost} onChange={setNewHost} error={hostError} autoFocus />
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        tone="danger"
        title={`Remover o domínio ${removing?.host ?? ""}?`}
        description="Pessoas desse domínio deixam de entrar sem convite. Quem já está no workspace continua."
        confirmLabel="Remover domínio"
        onConfirm={() => {
          const before = domains;
          setDomains((ds) => ds.filter((d) => d.id !== removing?.id));
          notify(`Domínio ${removing?.host} removido`, () => setDomains(before));
          setRemoving(null);
        }}
      />
    </SettingsShell>
  );
}
