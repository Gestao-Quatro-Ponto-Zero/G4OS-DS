import { ArrowRight, Check, ChevronDown, Gauge, Import, Mail, Palette, PartyPopper, PlayCircle, Plug, Sparkles, UserPlus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Callout, Page, PageHeading, ProgressRing, cn } from "@g4os/ds";
import { me, org } from "./data/workspace";
import { AtlasShell, atlasRoutes } from "./shells/atlas-shell";
import { frameHref, goTo, useFrameQuery } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Primeiros passos",
  description: "Página inicial de conta nova: checklist com progresso, um passo aberto por vez com a ação direta, recursos de ajuda e opção de dispensar.",
  category: "Onboarding",
  order: 2,
  height: 860,
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Task = { id: string; title: string; body: string; cta: string; href: string; minutes: number; icon: typeof Gauge };
// Cada passo leva a uma tela real do produto.
const tasks: Task[] = [
  { id: "perfil", title: "Complete seu perfil", body: "Foto, cargo e telefone ajudam o time a saber quem é quem.", cta: "Editar perfil", href: frameHref("settings-profile"), minutes: 1, icon: Users },
  { id: "marca", title: "Aplique a marca da empresa", body: "Cores, cantos e tipografia do workspace — clientes veem a mesma marca no portal.", cta: "Abrir aparência", href: frameHref("settings-appearance"), minutes: 2, icon: Palette },
  { id: "importar", title: "Importe seus contatos", body: "Traga uma planilha CSV ou conecte o Google. Detectamos duplicados antes de salvar.", cta: "Importar contatos", href: frameHref("crm-contacts"), minutes: 3, icon: Import },
  { id: "time", title: "Convide o time", body: "Quem vende, quem aprova e quem acompanha. Você escolhe o papel de cada um.", cta: "Convidar pessoas", href: frameHref("settings-team"), minutes: 2, icon: UserPlus },
  { id: "integracoes", title: "Conecte e-mail e agenda", body: "Google Workspace ou Microsoft 365: reuniões e e-mails aparecem no histórico de cada cliente.", cta: "Ver integrações", href: frameHref("settings-integrations"), minutes: 2, icon: Plug },
  { id: "painel", title: "Veja o primeiro painel", body: "Com 10 negócios cadastrados o painel de vendas já mostra funil e previsão.", cta: "Abrir painel", href: frameHref("crm-sales-dashboard"), minutes: 1, icon: Gauge },
];
const resources = [
  { title: "Tour de 4 minutos", hint: "Apresentação", icon: PlayCircle, href: frameHref("app-presentation") },
  { title: "Perguntar ao Assistente G4", hint: "IA", icon: Sparkles, href: frameHref("ai-chat") },
  { title: "Falar com um especialista", hint: "E-mail", icon: Mail, href: "mailto:sucesso@atlas.app" },
];
const STORE = "atlas-primeiros-passos";

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function OnboardingChecklistBlock() {
  // Progresso lembrado entre telas (no seu app: salve no servidor).
  const [done, setDone] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORE) ?? "") as string[];
    } catch {
      return ["perfil"];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(done));
    } catch {
      /* navegação privada */
    }
  }, [done]);
  const fromWizard = useFrameQuery().get("bemvindo") === "1";
  const [open, setOpen] = useState<string | null>("importar");
  const [hidden, setHidden] = useState(false);
  const pct = Math.round((done.length / tasks.length) * 100);
  const toggle = (id: string) => setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  const start = (t: Task) => {
    setDone((d) => (d.includes(t.id) ? d : [...d, t.id]));
    goTo(t.href);
  };

  return (
    <AtlasShell current={atlasRoutes.home}>
      <Page>
        <div className="mx-auto max-w-[880px]">
          <PageHeading kicker="Quarta · 30/09" title={`Boas-vindas, ${me.name.split(" ")[0]}`} description={`Alguns passos para o ${org.product} ficar com a cara da ${org.name}.`} sticky={false} />
          {fromWizard && (
            <div className="mt-6">
              <Callout tone="ok" title="Workspace criado">
                <span className="inline-flex items-center gap-1.5">
                  <PartyPopper className="h-3.5 w-3.5" /> Tudo pronto para começar. Os convites já foram enviados.
                </span>
              </Callout>
            </div>
          )}

          {!hidden ? (
            <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface" aria-labelledby="primeiros-passos">
              <header className="flex items-center gap-4 border-b border-line px-5 py-4">
                <ProgressRing value={pct} size={48} tone={pct === 100 ? "ok" : "accent"} label="Progresso dos primeiros passos" />
                <div className="min-w-0 flex-1">
                  <h2 id="primeiros-passos" className="m-0 text-[15px] font-semibold tracking-tight">
                    Primeiros passos
                  </h2>
                  <p className="m-0 mt-0.5 text-[12.5px] text-muted">
                    {done.length} de {tasks.length} concluídos · cerca de {tasks.filter((t) => !done.includes(t.id)).reduce((s, t) => s + t.minutes, 0)} min restantes
                  </p>
                </div>
                <button type="button" onClick={() => setHidden(true)} aria-label="Dispensar lista" title="Dispensar" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              </header>
              <ol className="m-0 list-none divide-y divide-line p-0">
                {tasks.map((t) => {
                  const isDone = done.includes(t.id);
                  const isOpen = open === t.id;
                  return (
                    <li key={t.id} className={cn(isOpen && "bg-soft/40")}>
                      <div className="flex items-center gap-3 px-5 py-3.5">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isDone}
                          aria-label={`Marcar “${t.title}” como ${isDone ? "pendente" : "concluído"}`}
                          onClick={() => toggle(t.id)}
                          className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors", isDone ? "border-ok bg-ok text-on-ink" : "border-line-strong bg-surface hover:border-ink")}
                        >
                          {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
                        </button>
                        <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", isDone ? "text-muted line-through decoration-line-strong" : "font-medium text-ink")}>{t.title}</span>
                          <span className="shrink-0 text-[12px] tabular-nums text-muted">{t.minutes} min</span>
                          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", isOpen && "rotate-180")} />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="enter flex flex-wrap items-center gap-4 px-5 pb-4 pl-[52px]">
                          <p className="m-0 min-w-[220px] flex-1 text-[13px] leading-relaxed text-ink-soft">{t.body}</p>
                          <Button size="sm" onClick={() => start(t)} variant={isDone ? "ghost" : "primary"}>
                            <t.icon /> {t.cta}
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : (
            <div className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-dashed border-line px-4 py-3 text-[13px] text-muted">
              Lista de primeiros passos dispensada.
              <Button size="sm" variant="quiet" onClick={() => setHidden(false)}>
                Mostrar de novo
              </Button>
            </div>
          )}

          <h2 className="m-0 mb-3 mt-10 text-[14px] font-medium">Precisa de ajuda?</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {resources.map((r) => (
              <a key={r.title} href={r.href} className="surface-card surface-interactive group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-soft text-ink-soft">
                  <r.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium">{r.title}</span>
                  <span className="block text-[12px] text-muted">{r.hint}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
              </a>
            ))}
          </div>
        </div>
      </Page>
    </AtlasShell>
  );
}
