import { ArrowLeft, ArrowRight, Briefcase, Check, FileSpreadsheet, HandCoins, Landmark, Plug, Sparkles, Users, X } from "lucide-react";
import { useState } from "react";
import {
  Button,
  ChoiceCards,
  FileDropzone,
  ProductMark,
  Select,
  TagInput,
  TextField,
  cn,
  type UploadItem,
} from "@g4ai/ds";
import { org } from "./data/workspace";
import { frameHref } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Assistente de configuração",
  description: "Onboarding em 4 passos (espaço → módulos → equipe → dados) com trilha lateral, rodapé fixo, pular etapa e tela de conclusão.",
  category: "Onboarding",
  order: 1,
  height: 820,
  concept: {
    goal: "Configurar o espaço de trabalho em poucos passos guiados, com a opção de pular.",
    patterns: [
      "Anatomia H · Fluxo focado: trilha lateral de passos + rodapé fixo Voltar/Continuar",
      "Um assunto por passo (espaço, módulos, equipe, dados)",
      "Pular etapa sempre disponível; tela de conclusão leva ao checklist",
    ],
    adapt: [
      "Implantação de módulo, importação de dados, configuração de integração",
    ],
    avoid: [
      "Mais de 5 passos ou passos obrigatórios que podiam ser depois",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const product = org.product;
const steps = [
  { id: "espaco", label: "Espaço de trabalho", hint: "Nome e endereço" },
  { id: "modulos", label: "Módulos", hint: "O que você vai usar" },
  { id: "equipe", label: "Equipe", hint: "Convide quem trabalha junto" },
  { id: "dados", label: "Dados", hint: "Traga o que já existe" },
] as const;
type Module = "crm" | "ats" | "financeiro" | "compras";
const roles = [
  { value: "admin", label: "Administrador" },
  { value: "membro", label: "Membro" },
  { value: "leitor", label: "Somente leitura" },
];
const integrations = [
  { id: "sheets", name: "Google Planilhas", icon: FileSpreadsheet },
  { id: "rd", name: "RD Station", icon: Plug },
  { id: "omie", name: "Omie", icon: Landmark },
];
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function OnboardingWizardBlock() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.name.toLowerCase());
  const [slugTouched, setSlugTouched] = useState(false);
  const [mods, setMods] = useState<Module[]>(["crm"]);
  const [emails, setEmails] = useState<string[]>(["ana@acme.com.br", "diego@acme.com.br"]);
  const [role, setRole] = useState("membro");
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [connected, setConnected] = useState<string[]>([]);
  const [tried, setTried] = useState(false);

  const errors = [
    !name.trim() ? "Dê um nome ao espaço." : slug.length < 3 ? "Use pelo menos 3 caracteres no endereço." : null,
    mods.length === 0 ? "Escolha pelo menos um módulo." : null,
    null,
    null,
  ];
  const next = () => {
    setTried(true);
    if (errors[i]) return;
    setTried(false);
    if (i === steps.length - 1) setDone(true);
    else setI(i + 1);
  };

  if (done)
    return (
      <div className="grid h-dvh place-items-center overflow-y-auto bg-soft/60 px-5">
        <div className="enter w-full max-w-[460px] rounded-2xl border border-line bg-surface p-8 text-center shadow-raised">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent-deep">
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.03em]">{name} está pronto</h1>
          <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
            {mods.length} {mods.length === 1 ? "módulo ativo" : "módulos ativos"} · {emails.length} {emails.length === 1 ? "convite enviado" : "convites enviados"}. Deixamos uma lista de primeiros passos na sua página inicial.
          </p>
          <Button href={frameHref("onboarding-checklist", { bemvindo: 1 })} className="mt-6 w-full">
            Ir para o início <ArrowRight />
          </Button>
        </div>
      </div>
    );

  return (
    <div className="flex h-dvh flex-col bg-page">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 sm:px-6">
        <ProductMark size={26} />
        <span className="text-[14px] font-semibold tracking-tight">{product}</span>
        <span className="ml-2 hidden text-[12.5px] text-muted sm:inline">Configuração inicial</span>
        <span className="ml-auto text-[12px] tabular-nums text-muted">
          Passo {i + 1} de {steps.length}
        </span>
        <a href={frameHref("onboarding-checklist")} aria-label="Sair da configuração" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink">
          <X className="h-4 w-4" />
        </a>
      </header>
      <div className="h-0.5 shrink-0 bg-line md:hidden" aria-hidden>
        <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[280px] shrink-0 border-r border-line bg-rail px-6 py-8 md:block">
          <ol className="m-0 list-none space-y-1 p-0" aria-label="Etapas">
            {steps.map((s, k) => {
              const state = k < i ? "done" : k === i ? "current" : "upcoming";
              return (
                <li key={s.id} aria-current={state === "current" ? "step" : undefined}>
                  <button
                    type="button"
                    disabled={k > i}
                    onClick={() => setI(k)}
                    className={cn("flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left", state === "current" ? "bg-surface ring-1 ring-line" : k < i ? "hover:bg-soft" : "")}
                  >
                    <span
                      className={cn(
                        "mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums",
                        state === "done" ? "bg-primary text-on-primary" : state === "current" ? "bg-accent-soft text-accent-deep ring-1 ring-accent/50" : "bg-soft text-muted ring-1 ring-line",
                      )}
                    >
                      {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : k + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-[13px]", state === "upcoming" ? "text-muted" : "font-medium text-ink")}>{s.label}</span>
                      <span className="block text-[12px] text-muted">{s.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div key={i} className="enter mx-auto max-w-[640px] px-5 py-8 sm:px-8 sm:py-12">
            <p className="m-0 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{steps[i].label}</p>
            {i === 0 && (
              <>
                <h1 className="m-0 mt-2 text-[25px] font-semibold tracking-[-0.035em]">Como vamos chamar o seu espaço?</h1>
                <p className="m-0 mb-8 mt-2 text-[13.5px] text-muted">Normalmente é o nome da empresa. Dá para mudar depois.</p>
                <TextField
                  label="Nome do espaço"
                  value={name}
                  onChange={(v) => {
                    setName(v);
                    if (!slugTouched) setSlug(slugify(v));
                  }}
                  error={tried && !name.trim() ? errors[0] : undefined}
                />
                <TextField
                  label="Endereço"
                  prefix="acme.app/"
                  value={slug}
                  onChange={(v) => {
                    setSlugTouched(true);
                    setSlug(slugify(v));
                  }}
                  hint="Só letras minúsculas, números e hífen."
                  error={tried && name.trim() && slug.length < 3 ? errors[0] : undefined}
                />
              </>
            )}
            {i === 1 && (
              <>
                <h1 className="m-0 mt-2 text-[25px] font-semibold tracking-[-0.035em]">O que você quer organizar primeiro?</h1>
                <p className="m-0 mb-8 mt-2 text-[13.5px] text-muted">Ativamos só o que você escolher. Os outros ficam disponíveis em Configurações.</p>
                <ChoiceCards<Module>
                  multiple
                  columns={2}
                  value={mods}
                  onChange={setMods}
                  error={tried ? errors[1] : undefined}
                  options={[
                    { value: "crm", label: "Vendas", description: "Pipeline, contatos, propostas e metas.", icon: <HandCoins /> },
                    { value: "ats", label: "Recrutamento", description: "Vagas, candidatos, entrevistas e scorecards.", icon: <Briefcase /> },
                    { value: "financeiro", label: "Financeiro", description: "Contas a pagar e receber, fluxo de caixa.", icon: <Landmark /> },
                    { value: "compras", label: "Compras e estoque", description: "Pedidos, fornecedores e inventário.", icon: <FileSpreadsheet /> },
                  ]}
                />
              </>
            )}
            {i === 2 && (
              <>
                <h1 className="m-0 mt-2 text-[25px] font-semibold tracking-[-0.035em]">Quem trabalha com você?</h1>
                <p className="m-0 mb-8 mt-2 text-[13.5px] text-muted">Convites valem por 7 dias. Cada pessoa escolhe a própria senha.</p>
                <TagInput
                  label="E-mails"
                  value={emails}
                  onChange={setEmails}
                  placeholder="nome@empresa.com, separe com vírgula"
                  validate={(t) => (/.+@.+\..+/.test(t) ? null : `“${t}” não é um e-mail.`)}
                  hint="Cole uma lista inteira: separamos por vírgula."
                />
                <div className="mb-5 max-w-[260px]">
                  <p className="m-0 mb-1.5 text-[12.5px] text-muted">Papel</p>
                  <Select label="Papel dos convidados" options={roles} value={role} onValueChange={setRole} />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-line bg-soft/50 px-4 py-3 text-[12.5px] text-muted">
                  <Users className="h-4 w-4 shrink-0" /> Administradores podem convidar pessoas e mudar o plano; membros só trabalham nos módulos.
                </div>
              </>
            )}
            {i === 3 && (
              <>
                <h1 className="m-0 mt-2 text-[25px] font-semibold tracking-[-0.035em]">Traga o que você já tem</h1>
                <p className="m-0 mb-8 mt-2 text-[13.5px] text-muted">Importe uma planilha ou conecte uma ferramenta. Você também pode começar do zero.</p>
                <FileDropzone
                  label="Planilha (CSV ou XLSX)"
                  accept=".csv,.xlsx"
                  maxSize={20 * 1024 * 1024}
                  maxFiles={3}
                  items={files}
                  onRemove={(id) => setFiles((xs) => xs.filter((x) => x.id !== id))}
                  onFiles={(fs) => setFiles((xs) => [...xs, ...fs.map((f) => ({ id: f.name + Date.now(), name: f.name, size: f.size }))])}
                />
                <p className="m-0 mb-2 text-[12.5px] text-muted">Ou conecte</p>
                <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
                  {integrations.map((it) => {
                    const on = connected.includes(it.id);
                    return (
                      <li key={it.id}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => setConnected((c) => (on ? c.filter((x) => x !== it.id) : [...c, it.id]))}
                          className={cn("flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13px]", on ? "border-ok/30 bg-ok-soft/40" : "border-line bg-surface hover:border-line-strong")}
                        >
                          <it.icon className="h-4 w-4 text-muted" />
                          <span className="flex-1 font-medium">{it.name}</span>
                          {on ? <Check className="h-4 w-4 text-ok" /> : <span className="text-[12px] text-muted">Conectar</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </main>
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-line bg-surface px-4 py-3 sm:px-6">
        {i > 0 && (
          <Button variant="ghost" onClick={() => setI(i - 1)}>
            <ArrowLeft /> Voltar
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {i >= 2 && (
            <Button variant="quiet" onClick={() => (i === steps.length - 1 ? setDone(true) : setI(i + 1))}>
              Pular
            </Button>
          )}
          <Button onClick={next}>
            {i === steps.length - 1 ? "Concluir" : "Continuar"} <ArrowRight />
          </Button>
        </div>
      </footer>
    </div>
  );
}
