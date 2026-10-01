import { ArrowLeft, ArrowRight, Briefcase, CheckCircle2, MapPin, Search } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  FileDropzone,
  Highlight,
  ProductMark,
  Sheet,
  TextField,
  cn,
  formatCurrency,
  matchesQuery,
  notify,
  type UploadItem,
} from "@g4os/ds";
import { areas, company, jobById, jobs, openDays, type Job } from "./data/ats";
import { go, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Página de carreiras",
  description: "Site público de vagas, pensado primeiro para o celular: busca, filtro por área e modelo, detalhe da vaga e candidatura com currículo em uma folha. Sem casca de app.",
  category: "ATS",
  order: 9,
  height: 900,
  concept: {
    goal: "Atrair candidatos com uma página pública de vagas pensada primeiro para o celular.",
    patterns: [
      "Anatomia I · Público: rolagem do documento, cabeçalho do site fixo, sem casca de app",
      "Busca e filtros por área e modelo",
      "Candidatura em folha com currículo; botão fixo no celular",
    ],
    adapt: [
      "Portal do cliente, página de parceiros, catálogo público de produtos",
    ],
    avoid: [
      "Usar a navegação do app interno numa página pública",
    ],
  },
} as const;

const published = jobs.filter((j) => j.status === "aberta");

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[960px] items-center gap-3 px-4">
        <ProductMark size={26} />
        <span className="text-[14px] font-semibold tracking-tight">Carreiras · {company.name}</span>
        <a href="#/frame/ats-jobs" className="ml-auto text-[12.5px] text-muted hover:text-ink">
          Área do recrutador →
        </a>
      </div>
    </header>
  );
}

export default function AtsCareers() {
  const id = useFrameParam("id");
  return <div className="h-dvh overflow-y-auto bg-page">{id ? <JobPage key={id} job={jobById(id)} /> : <Board />}</div>;
}

function Board() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string | null>(null);
  const [mode, setMode] = useState<Job["mode"] | null>(null);
  const list = published.filter((j) => matchesQuery(q, [j.title, j.area, j.location]) && (!area || j.area === area) && (!mode || j.mode === mode));
  const chip = (on: boolean) => cn("h-9 shrink-0 rounded-full px-3.5 text-[13px] ring-1 transition-colors", on ? "bg-primary text-on-primary ring-primary" : "bg-surface text-ink-soft ring-line hover:bg-soft");
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[960px] px-4 pb-16">
        <section className="py-10 sm:py-14">
          <h1 className="m-0 font-display text-[32px] font-semibold leading-tight tracking-[-0.03em] sm:text-[42px]">Construa com a gente o ERP que o Brasil usa todo dia.</h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-muted">
            {published.length} vagas abertas em tecnologia, comercial, produto e operações. Processo seletivo com retorno em até 7 dias em cada etapa.
          </p>
          <label className="focus-field mt-6 flex h-12 max-w-[560px] items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5">
            <Search className="h-4 w-4 text-muted" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cargo, área ou cidade" aria-label="Buscar vagas" className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
          </label>
        </section>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="group" aria-label="Filtrar por área">
          <button type="button" className={chip(!area)} onClick={() => setArea(null)} aria-pressed={!area}>
            Todas as áreas
          </button>
          {areas.filter((a) => published.some((j) => j.area === a)).map((a) => (
            <button key={a} type="button" className={chip(area === a)} onClick={() => setArea(area === a ? null : a)} aria-pressed={area === a}>
              {a}
            </button>
          ))}
          <span aria-hidden className="mx-1 w-px shrink-0 bg-line" />
          {(["Remoto", "Híbrido", "Presencial"] as const).map((m) => (
            <button key={m} type="button" className={chip(mode === m)} onClick={() => setMode(mode === m ? null : m)} aria-pressed={mode === m}>
              {m}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="mb-3 mt-4 text-[12.5px] text-muted">
          {list.length} {list.length === 1 ? "vaga" : "vagas"}
        </p>
        <ul className="list-none space-y-2.5 p-0">
          {list.map((j) => (
            <li key={j.id}>
              <button type="button" onClick={() => go("ats-careers", j.id)} className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-4 text-left transition-colors hover:border-line-strong sm:px-5">
                <span className="min-w-0 flex-1">
                  <Highlight text={j.title} query={q} className="block text-[15px] font-medium" />
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" aria-hidden /> {j.area} · {j.level}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden /> {j.location === "Remoto" ? "Remoto" : `${j.location} · ${j.mode}`}
                    </span>
                  </span>
                </span>
                {openDays(j) < 10 && <Badge tone="accent">Nova</Badge>}
                <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
              </button>
            </li>
          ))}
          {!list.length && (
            <li className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-[13.5px] text-muted">
              Nenhuma vaga com esses filtros.{" "}
              <button type="button" className="font-medium text-blue hover:underline" onClick={() => { setQ(""); setArea(null); setMode(null); }}>
                Ver todas
              </button>
            </li>
          )}
        </ul>
      </main>
    </>
  );
}

function JobPage({ job }: { job: Job }) {
  const [apply, setApply] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [consent, setConsent] = useState(false);
  const valid = name.trim() && /.+@.+\..+/.test(email) && files.length > 0 && consent;
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[760px] px-4 pb-28 sm:pb-16">
        <button type="button" onClick={() => go("ats-careers")} className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Todas as vagas
        </button>
        <h1 className="m-0 mt-4 font-display text-[28px] font-semibold leading-tight tracking-[-0.025em] sm:text-[34px]">{job.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{job.area}</Badge>
          <Badge>{job.location === "Remoto" ? "Remoto" : `${job.location} · ${job.mode}`}</Badge>
          <Badge tone="info">
            {formatCurrency(job.salary[0], { cents: false })} – {formatCurrency(job.salary[1], { cents: false })}
          </Badge>
        </div>
        <section className="mt-8 space-y-6 text-[15px] leading-relaxed">
          <div>
            <h2 className="m-0 text-[17px] font-semibold">O desafio</h2>
            <p className="mt-2 text-ink-soft">{job.summary}</p>
          </div>
          <div>
            <h2 className="m-0 text-[17px] font-semibold">O que esperamos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
              {job.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="m-0 text-[17px] font-semibold">Como é o processo</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-soft">
              <li>Triagem do currículo (até 7 dias)</li>
              <li>Conversa com Recrutamento (45 min)</li>
              <li>Case técnico ou prático</li>
              <li>Entrevista final com liderança</li>
            </ol>
          </div>
        </section>
        <div className="mt-10 hidden sm:block">
          <Button onClick={() => setApply(true)} disabled={done}>
            {done ? "Candidatura enviada" : "Candidatar-se"}
          </Button>
        </div>
      </main>
      {/* No celular, a ação principal fica fixa embaixo, ao alcance do polegar. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-page/95 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <Button className="w-full" onClick={() => setApply(true)} disabled={done}>
          {done ? "Candidatura enviada" : "Candidatar-se"}
        </Button>
      </div>
      <Sheet
        open={apply}
        onClose={() => setApply(false)}
        title={done ? "Candidatura enviada" : "Candidatar-se"}
        description={job.title}
        width={480}
        footer={
          done ? (
            <Button onClick={() => { setApply(false); go("ats-careers"); }}>Ver outras vagas</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setApply(false)}>
                Cancelar
              </Button>
              <Button
                disabled={!valid}
                onClick={() => {
                  setDone(true);
                  notify("Recebemos sua candidatura. Você terá retorno em até 7 dias.");
                }}
              >
                Enviar candidatura
              </Button>
            </>
          )
        }
      >
        {done ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-ok" aria-hidden />
            <p className="m-0 mt-3 text-[15px] font-medium">Obrigado, {name.split(" ")[0]}!</p>
            <p className="m-0 mt-1 max-w-[320px] text-[13.5px] leading-relaxed text-muted">Enviamos a confirmação para {email}. Você acompanha cada etapa pelo mesmo e-mail.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <TextField label="Nome completo" value={name} onChange={setName} />
            <TextField label="E-mail" value={email} onChange={setEmail} placeholder="nome@email.com" error={email && !/.+@.+\..+/.test(email) ? "Confira o e-mail: falta o @ ou o domínio." : undefined} />
            <TextField label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/…" optional />
            <FileDropzone
              label="Currículo"
              hint="PDF ou DOCX até 5 MB"
              accept=".pdf,.docx"
              maxSize={5_000_000}
              multiple={false}
              items={files}
              onFiles={(f) => setFiles(f.slice(0, 1).map((x) => ({ id: x.name, name: x.name, size: x.size })))}
              onRemove={() => setFiles([])}
            />
            <Checkbox label="Consentimento LGPD" checked={consent} onCheckedChange={setConsent}>
              Autorizo a {company.name} a usar meus dados neste e em futuros processos seletivos (LGPD).
            </Checkbox>
          </div>
        )}
      </Sheet>
    </>
  );
}
