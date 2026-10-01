import { Bell, BellOff, Mail, MessageSquare, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button, Checkbox, RadioGroup, Select, Switch, cn, notify, SettingsSection } from "@g4os/ds";
import { frameHref } from "./shells/frame-route";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Notificações",
  description: "Matriz evento × canal (e-mail, push, Slack) agrupada por módulo, resumo diário, horário de silêncio e pausa geral. Salva sozinho.",
  category: "Configurações",
  order: 3,
  height: 960,
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Channel = "email" | "push" | "slack";
const channels: { id: Channel; label: string; icon: typeof Mail }[] = [
  { id: "email", label: "E-mail", icon: Mail },
  { id: "push", label: "Celular", icon: Smartphone },
  { id: "slack", label: "Slack", icon: MessageSquare },
];
type Event = { id: string; label: string; hint: string };
const groups: { title: string; events: Event[] }[] = [
  {
    title: "Vendas",
    events: [
      { id: "deal-assigned", label: "Negócio atribuído a mim", hint: "Quando alguém coloca você como responsável." },
      { id: "deal-stalled", label: "Negócio parado", hint: "Sem atividade há mais de 14 dias." },
      { id: "deal-won", label: "Negócio ganho no time", hint: "Qualquer fechamento do seu time." },
    ],
  },
  {
    title: "Recrutamento",
    events: [
      { id: "candidate-new", label: "Nova candidatura", hint: "Em vagas onde você é recrutador." },
      { id: "scorecard-due", label: "Scorecard pendente", hint: "24 h depois de uma entrevista sem avaliação." },
    ],
  },
  {
    title: "Geral",
    events: [
      { id: "mention", label: "Menções", hint: "Quando alguém escreve @você em um comentário." },
      { id: "task-due", label: "Tarefas vencendo", hint: "No dia do prazo, às 9h." },
    ],
  },
];
const initialPrefs: Record<string, Channel[]> = {
  "deal-assigned": ["email", "push"],
  "deal-stalled": ["email"],
  "deal-won": ["slack"],
  "candidate-new": [],
  "scorecard-due": ["email", "push"],
  mention: ["email", "push", "slack"],
  "task-due": ["push"],
};
const hours = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:00` }));

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function SettingsNotificationsBlock() {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [paused, setPaused] = useState(false);
  const [digest, setDigest] = useState<"off" | "daily" | "weekly" | null>("daily");
  const [quiet, setQuiet] = useState(true);
  const [from, setFrom] = useState("20");
  const [to, setTo] = useState("8");

  const toggle = (ev: string, ch: Channel) => {
    setPrefs((p) => {
      const cur = p[ev] ?? [];
      return { ...p, [ev]: cur.includes(ch) ? cur.filter((c) => c !== ch) : [...cur, ch] };
    });
    notify("Preferência salva");
  };

  return (
    <SettingsShell slug="settings-notifications" title="Notificações" description="Escolha o que chega até você e por onde. As mudanças são salvas na hora.">
      <div className={cn("mb-6 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3", paused ? "border-amber/25 bg-amber-soft/40" : "border-line bg-surface")}>
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", paused ? "bg-amber-soft text-amber" : "bg-soft text-ink-soft")}>
          {paused ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[13.5px] font-medium">{paused ? "Notificações pausadas" : "Notificações ativas"}</p>
          <p className="m-0 text-[12.5px] text-muted">{paused ? "Nada chega até você, exceto segurança da conta." : "Pause tudo durante férias ou foco."}</p>
        </div>
        <Switch label="Pausar tudo" checked={paused} onCheckedChange={setPaused} hideLabel />
      </div>

      <fieldset disabled={paused} className={cn("m-0 min-w-0 border-0 p-0 transition-opacity", paused && "pointer-events-none opacity-45")}>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[520px] text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Evento</th>
                {channels.map((c) => (
                  <th key={c.id} className="w-24 px-2 py-2.5 text-center font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <c.icon className="h-3.5 w-3.5" /> {c.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g.title} className="border-b border-line last:border-0">
                <tr>
                  <th colSpan={4} scope="colgroup" className="bg-soft/30 px-4 pb-1.5 pt-3 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted">
                    {g.title}
                  </th>
                </tr>
                {g.events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-soft/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{ev.label}</div>
                      <div className="mt-0.5 text-[12px] text-muted">{ev.hint}</div>
                    </td>
                    {channels.map((c) => (
                      <td key={c.id} className="px-2 py-3 text-center">
                        <span className="inline-flex">
                          <Checkbox label={`${ev.label} por ${c.label}`} checked={(prefs[ev.id] ?? []).includes(c.id)} onCheckedChange={() => toggle(ev.id, c.id)} />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>

        <SettingsSection title="Resumo por e-mail" description="Um e-mail com o que aconteceu, em vez de um por evento.">
          <RadioGroup
            value={digest}
            onChange={(v) => {
              setDigest(v);
              notify("Preferência salva");
            }}
            options={[
              { value: "daily", label: "Diário", description: "Todo dia útil às 8h." },
              { value: "weekly", label: "Semanal", description: "Segunda-feira às 8h." },
              { value: "off", label: "Não enviar" },
            ]}
          />
        </SettingsSection>

        <SettingsSection title="Horário de silêncio" description="Notificações de celular esperam até o fim do período. E-mails não são afetados.">
          <Switch label="Ativar horário de silêncio" checked={quiet} onCheckedChange={setQuiet} />
          {quiet && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
              Das
              <Select label="Início do silêncio" size="compact" options={hours} value={from} onValueChange={setFrom} />
              às
              <Select label="Fim do silêncio" size="compact" options={hours} value={to} onValueChange={setTo} />
              <span>(horário de Brasília)</span>
            </div>
          )}
        </SettingsSection>
      </fieldset>

      <SettingsSection title="Slack" description="Conectado ao espaço acme.slack.com como @joana.">
        <Button size="sm" variant="ghost" href={frameHref("settings-integrations", { id: "slack" })}>
          Gerenciar no Slack
        </Button>
      </SettingsSection>
    </SettingsShell>
  );
}
