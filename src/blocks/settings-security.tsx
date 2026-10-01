import { KeyRound, Laptop, Plus, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  CopyButton,
  DataTable,
  Modal,
  OtpInput,
  PasswordField,
  SettingsSection,
  TextField,
  notify,
  type Column,
} from "@g4os/ds";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Segurança",
  description: "Senha, verificação em duas etapas com código, sessões ativas com encerramento e chaves de API mostradas uma única vez.",
  category: "Configurações",
  order: 4,
  height: 900,
  concept: {
    goal: "Proteger a conta: senha, 2FA, sessões e chaves de API.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "2FA com código em modal (OtpInput)",
      "Sessões ativas com encerramento",
      "Chave de API mostrada uma única vez",
    ],
    adapt: [
      "Segurança de portal do cliente, acesso de parceiros",
    ],
    avoid: [
      "Mostrar a chave de API de novo depois de criada",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Session = { id: string; device: string; place: string; last: string; current?: boolean; mobile?: boolean };
const initialSessions: Session[] = [
  { id: "s1", device: "Chrome · macOS", place: "São Paulo, SP", last: "agora", current: true },
  { id: "s2", device: "App Atlas · iPhone 15", place: "São Paulo, SP", last: "há 3 h", mobile: true },
  { id: "s3", device: "Edge · Windows", place: "Campinas, SP", last: "há 4 dias" },
  { id: "s4", device: "Safari · iPad", place: "Belo Horizonte, MG", last: "há 12 dias", mobile: true },
];

type ApiKey = { id: string; name: string; prefix: string; created: string; lastUsed: string; scope: "leitura" | "escrita" };
const initialKeys: ApiKey[] = [
  { id: "k1", name: "Integração ERP", prefix: "atl_live_7f2c", created: "12/03/2026", lastUsed: "há 8 min", scope: "escrita" },
  { id: "k2", name: "Painel do BI", prefix: "atl_live_19ab", created: "02/06/2026", lastUsed: "ontem", scope: "leitura" },
];

const randomKey = () => `atl_live_${Array.from({ length: 28 }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join("")}`;

/* ------------------------------------------------------------------ */

export default function SettingsSecurityBlock() {
  const [pw, setPw] = useState({ current: "", next: "" });
  const [twoFactor, setTwoFactor] = useState(false);
  const [setup, setSetup] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [sessions, setSessions] = useState(initialSessions);
  const [revoke, setRevoke] = useState<Session | "all" | null>(null);
  const [keys, setKeys] = useState(initialKeys);
  const [newKey, setNewKey] = useState<{ open: boolean; name: string; secret?: string }>({ open: false, name: "" });
  const [deleteKey, setDeleteKey] = useState<ApiKey | null>(null);

  const savePassword = () => {
    if (pw.next.length < 8) return notify("A nova senha precisa de pelo menos 8 caracteres", undefined, "bad");
    setPw({ current: "", next: "" });
    notify("Senha alterada. Outras sessões continuam ativas.");
  };

  const verify = (v: string) => {
    if (v === "000000") {
      setCodeError("Código incorreto. Confira no app autenticador.");
      return;
    }
    setTwoFactor(true);
    setSetup(false);
    setCode("");
    notify("Verificação em duas etapas ativada");
  };

  const keyCols: Column<ApiKey>[] = [
    { key: "nome", header: "Nome", primary: true, cell: (k) => k.name },
    { key: "chave", header: "Chave", cell: (k) => <code className="font-mono text-[12px] text-ink-soft">{k.prefix}…</code> },
    { key: "escopo", header: "Escopo", cell: (k) => <Badge tone={k.scope === "escrita" ? "warn" : "neutral"}>{k.scope === "escrita" ? "Leitura e escrita" : "Só leitura"}</Badge> },
    { key: "uso", header: "Último uso", cell: (k) => k.lastUsed, nowrap: true, mobileHidden: true },
    {
      key: "acao",
      header: "",
      action: true,
      align: "right",
      cell: (k) => (
        <Button size="sm" variant="quiet" aria-label={`Revogar ${k.name}`} onClick={() => setDeleteKey(k)}>
          <Trash2 /> Revogar
        </Button>
      ),
    },
  ];

  return (
    <SettingsShell slug="settings-security" title="Segurança" description="Proteja o acesso ao workspace. Administradores podem exigir duas etapas para todo o time.">
      <SettingsSection title="Senha" description="Mínimo de 8 caracteres. Evite reaproveitar senhas de outros serviços.">
        <PasswordField label="Senha atual" value={pw.current} onChange={(v) => setPw((p) => ({ ...p, current: v }))} />
        <PasswordField label="Nova senha" value={pw.next} onChange={(v) => setPw((p) => ({ ...p, next: v }))} strength autoComplete="new-password" />
        <Button size="sm" onClick={savePassword} disabled={!pw.current || !pw.next}>
          Alterar senha
        </Button>
      </SettingsSection>

      <SettingsSection title="Verificação em duas etapas" description="Além da senha, pedimos um código do app autenticador ao entrar em um dispositivo novo.">
        {twoFactor ? (
          <Callout
            tone="ok"
            title="Ativada com app autenticador"
            action={
              <Button size="sm" variant="ghost" onClick={() => { setTwoFactor(false); notify("Verificação em duas etapas desativada", () => setTwoFactor(true), "info"); }}>
                Desativar
              </Button>
            }
          >
            Guarde os códigos de recuperação em um lugar seguro.
          </Callout>
        ) : (
          <Callout
            tone="warn"
            title="Desativada"
            action={
              <Button size="sm" onClick={() => setSetup(true)}>
                <ShieldCheck /> Ativar
              </Button>
            }
          >
            Contas com duas etapas têm 99 % menos acessos indevidos.
          </Callout>
        )}
      </SettingsSection>

      <SettingsSection title="Sessões ativas" description="Onde sua conta está conectada agora. Encerre o que você não reconhece.">
        <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-soft text-muted">{s.mobile ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium">
                  {s.device} {s.current && <Badge tone="ok">Esta sessão</Badge>}
                </div>
                <div className="text-[12px] text-muted">
                  {s.place} · {s.last}
                </div>
              </div>
              {!s.current && (
                <Button size="sm" variant="quiet" onClick={() => setRevoke(s)}>
                  Encerrar
                </Button>
              )}
            </li>
          ))}
        </ul>
        {sessions.length > 1 && (
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => setRevoke("all")}>
            Encerrar todas as outras
          </Button>
        )}
      </SettingsSection>

      <SettingsSection title="Chaves de API" description="Para integrações próprias. A chave completa aparece uma única vez, na criação.">
        <DataTable rows={keys} columns={keyCols} rowKey={(k) => k.id} empty={<p className="m-0 text-[13px] text-muted">Nenhuma chave. Crie uma para integrar seus sistemas.</p>} />
        <Button size="sm" variant="ghost" className="mt-3" onClick={() => setNewKey({ open: true, name: "" })}>
          <Plus /> Nova chave
        </Button>
      </SettingsSection>

      <Modal
        open={setup}
        onClose={() => { setSetup(false); setCode(""); setCodeError(undefined); }}
        title="Ativar verificação em duas etapas"
        description="Escaneie o código no Google Authenticator, 1Password ou Authy e digite os 6 dígitos."
        size="sm"
      >
        <div className="flex flex-col items-center gap-4">
          <div aria-label="QR code de exemplo" role="img" className="grid grid-cols-8 gap-0.5 rounded-lg border border-line bg-surface p-3">
            {Array.from({ length: 64 }, (_, i) => (
              <span key={i} className={(i * 7 + (i % 5) * 3) % 3 === 0 ? "h-3 w-3 bg-ink" : "h-3 w-3"} />
            ))}
          </div>
          <OtpInput value={code} onChange={(v) => { setCode(v); setCodeError(undefined); }} onComplete={verify} error={codeError} autoFocus groupAt={3} />
          <p className="m-0 text-center text-[12px] text-muted">Dica: qualquer código diferente de 000000 funciona nesta demonstração.</p>
        </div>
      </Modal>

      <Modal
        open={newKey.open}
        onClose={() => setNewKey({ open: false, name: "" })}
        title={newKey.secret ? "Copie sua chave agora" : "Nova chave de API"}
        description={newKey.secret ? "Por segurança, não mostramos a chave completa de novo." : "Dê um nome que diga onde ela será usada."}
        size="sm"
        footer={
          newKey.secret ? (
            <Button onClick={() => setNewKey({ open: false, name: "" })}>Pronto, copiei</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setNewKey({ open: false, name: "" })}>
                Cancelar
              </Button>
              <Button
                disabled={!newKey.name.trim()}
                onClick={() => {
                  const secret = randomKey();
                  setKeys((ks) => [...ks, { id: String(Date.now()), name: newKey.name.trim(), prefix: secret.slice(0, 13), created: "hoje", lastUsed: "nunca", scope: "leitura" }]);
                  setNewKey((k) => ({ ...k, secret }));
                }}
              >
                <KeyRound /> Criar chave
              </Button>
            </>
          )
        }
      >
        {newKey.secret ? (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-soft px-3 py-2">
            <code className="min-w-0 flex-1 break-all font-mono text-[12.5px]">{newKey.secret}</code>
            <CopyButton value={newKey.secret} iconOnly />
          </div>
        ) : (
          <TextField label="Nome da chave" placeholder="Ex.: Integração com o BI" value={newKey.name} onChange={(v) => setNewKey((k) => ({ ...k, name: v }))} autoFocus />
        )}
      </Modal>

      <ConfirmDialog
        open={revoke !== null}
        onClose={() => setRevoke(null)}
        onConfirm={() => {
          const before = sessions;
          setSessions((ss) => (revoke === "all" ? ss.filter((s) => s.current) : ss.filter((s) => s !== revoke)));
          setRevoke(null);
          notify(revoke === "all" ? "Outras sessões encerradas" : "Sessão encerrada", () => setSessions(before));
        }}
        tone="danger"
        title={revoke === "all" ? "Encerrar todas as outras sessões?" : `Encerrar a sessão em ${revoke?.device ?? ""}?`}
        description="Quem estiver usando esse dispositivo vai precisar entrar de novo."
        confirmLabel={revoke === "all" ? "Encerrar todas" : "Encerrar sessão"}
      />
      <ConfirmDialog
        open={deleteKey !== null}
        onClose={() => setDeleteKey(null)}
        onConfirm={() => {
          setKeys((ks) => ks.filter((k) => k !== deleteKey));
          notify(`Chave “${deleteKey?.name}” revogada`);
          setDeleteKey(null);
        }}
        tone="danger"
        title={`Revogar a chave “${deleteKey?.name ?? ""}”?`}
        description="Integrações que usam esta chave param de funcionar na hora."
        confirmLabel="Revogar chave"
      />
    </SettingsShell>
  );
}
