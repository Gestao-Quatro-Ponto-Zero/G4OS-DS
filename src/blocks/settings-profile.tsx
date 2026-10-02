import { Camera, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Button,
  Callout,
  ConfirmDialog,
  MaskedField,
  Modal,
  Select,
  TextField,
  TextareaField,
  masks,
  notify,
  SettingsSection } from "@g4ai/ds";
import { me, org } from "./data/workspace";
import { frameHref, goTo } from "./shells/frame-route";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Perfil",
  description: "Configurações com subnavegação lateral (vira abas roláveis no celular), seções rótulo-à-esquerda, barra de alterações não salvas e zona de perigo.",
  category: "Configurações",
  order: 1,
  height: 900,
  concept: {
    goal: "Manter os dados da pessoa e da conta com segurança e sem perder alterações.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "Seções rótulo-à-esquerda",
      "Barra de alterações não salvas no rodapé",
      "Zona de perigo separada no fim",
    ],
    adapt: [
      "Perfil de empresa, dados fiscais",
    ],
    avoid: [
      "Ação destrutiva no meio do formulário",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const initial = {
  name: me.name,
  email: me.email,
  title: me.title,
  phone: "(11) 98765-4321",
  bio: "",
  language: "pt-BR",
  timezone: "America/Sao_Paulo",
};
const languages = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];
const timezones = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT−3)" },
  { value: "America/Manaus", label: "Manaus (GMT−4)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT−2)" },
];

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function SettingsProfileBlock() {
  const [saved, setSaved] = useState(initial);
  const [form, setForm] = useState(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailTried, setEmailTried] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const emailError = !/.+@.+\..+/.test(newEmail) ? "Escreva um e-mail válido." : newEmail === form.email ? "Esse já é o seu e-mail." : undefined;
  const requestEmail = () => {
    setEmailTried(true);
    if (emailError) return;
    setPendingEmail(newEmail);
    setEmailOpen(false);
    setEmailTried(false);
    notify(`Link de confirmação enviado para ${newEmail}`);
  };
  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const nameError = !form.name.trim() ? "Informe seu nome." : undefined;

  const save = () => {
    if (nameError) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(form);
      notify("Perfil atualizado");
    }, 700);
  };

  return (
    <SettingsShell slug="settings-profile" title="Perfil" description="Como você aparece para o time e para clientes em e-mails e propostas.">
      <SettingsSection title="Foto" description="Quadrada, pelo menos 256 px. Sem foto, usamos suas iniciais.">
        <div className="flex items-center gap-4">
          <Avatar initials={me.initials} tint={me.tint} src={photo ?? undefined} size="lg" name={form.name} />
          <label className="ui-button inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[13px] font-medium text-ink ring-1 ring-line hover:bg-soft [&_svg]:h-4 [&_svg]:w-4">
            <Camera /> Enviar foto
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setPhoto(URL.createObjectURL(file));
                notify(`Foto “${file.name}” enviada`);
              }}
            />
          </label>
          <Button
            size="sm"
            variant="quiet"
            disabled={!photo}
            disabledReason="Você ainda não enviou uma foto"
            onClick={() => {
              const before = photo;
              setPhoto(null);
              notify("Foto removida; usando suas iniciais", () => setPhoto(before));
            }}
          >
            Remover
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Informações pessoais">
        <TextField label="Nome completo" value={form.name} onChange={set("name")} autoComplete="name" error={nameError} />
        <TextField
          label="E-mail"
          value={form.email}
          onChange={set("email")}
          readOnly
          corner={
            <button type="button" className="text-blue hover:underline" onClick={() => {
                setNewEmail("");
                setEmailOpen(true);
              }}
            >
              Alterar
            </button>
          }
          hint="Para trocar o e-mail, confirmamos pelo endereço novo."
        />
        {pendingEmail && (
          <div className="mb-5">
            <Callout
              tone="warn"
              title="Confirmação pendente"
              action={
                <Button size="sm" variant="ghost" onClick={() => { setPendingEmail(null); notify("Troca de e-mail cancelada"); }}>
                  Cancelar troca
                </Button>
              }
            >
              Abra o link que enviamos para {pendingEmail}. Até lá, você continua entrando com {form.email}.
            </Callout>
          </div>
        )}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField label="Cargo" value={form.title} onChange={set("title")} optional />
          <MaskedField label="Celular" mask={masks.phone} value={form.phone} onChange={(m) => set("phone")(m)} type="tel" optional />
        </div>
        <TextareaField label="Sobre você" value={form.bio} onChange={set("bio")} maxLength={200} counter optional placeholder="Ex.: Cuido das contas enterprise do Sudeste." minRows={2} />
      </SettingsSection>

      <SettingsSection title="Região" description="Datas, horários e números aparecem neste formato.">
        <div className="grid gap-x-4 sm:grid-cols-2">
          <div className="mb-5">
            <Select label="Idioma" options={languages} value={form.language} onValueChange={set("language")} />
          </div>
          <div className="mb-5">
            <Select label="Fuso horário" options={timezones} value={form.timezone} onValueChange={set("timezone")} />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Excluir conta" description="Remove seu acesso e seus dados pessoais. Registros que você criou continuam com o time.">
        <div className="rounded-xl border border-rose/20 bg-rose-soft/30 px-4 py-3">
          <p className="m-0 text-[13px] text-ink-soft">Esta ação não pode ser desfeita.</p>
          <Button size="sm" variant="ghost" className="mt-3 text-rose" onClick={() => setConfirmDelete(true)}>
            <Trash2 /> Excluir minha conta
          </Button>
        </div>
      </SettingsSection>

      {dirty && (
        <div role="region" aria-label="Alterações não salvas" className="enter sticky bottom-4 z-[15] mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-toast">
          <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />
          <span className="flex-1 text-[13px]">Alterações não salvas</span>
          <Button size="sm" variant="ghost" onClick={() => setForm(saved)}>
            Descartar
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      )}

      <Modal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        title="Alterar e-mail"
        description="Enviamos um link para o endereço novo. A troca só vale depois que você confirmar."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEmailOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={requestEmail}>Enviar link de confirmação</Button>
          </>
        }
      >
        <TextField label="Novo e-mail" type="email" value={newEmail} onChange={setNewEmail} placeholder={`nome@${org.domain}`} autoComplete="email" error={emailTried ? emailError : undefined} />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          notify("Conta excluída. Seus dados pessoais são apagados em até 30 dias.");
          goTo(frameHref("auth-login"));
        }}
        tone="danger"
        title="Excluir sua conta?"
        description={`Você perde o acesso ao workspace da ${org.name} imediatamente. Negócios e contatos que você criou continuam com o time.`}
        confirmLabel="Excluir conta"
      />
    </SettingsShell>
  );
}
