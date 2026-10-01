import { ArrowLeft, ArrowRight, Building2, Mail, User } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Checkbox, PasswordField, Select, Stepper, TextField } from "@g4ai/ds";
import { planById } from "./data/plans";
import { AuthBrand, OrDivider, SsoButtons, authRoutes } from "./shells/auth-shell";
import { useFrameQuery } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Criar conta",
  description: "Cadastro em duas etapas (você → empresa), senha com força visível, aceite de termos e SSO. Coluna única centrada.",
  category: "Autenticação",
  order: 2,
  height: 860,
  concept: {
    goal: "Criar a conta com o mínimo de campos e sem dúvida sobre a senha.",
    patterns: [
      "Anatomia H · Fluxo focado: coluna única centrada em duas etapas (você → empresa)",
      "Stepper discreto; senha com força visível",
      "Plano vindo da página de preços (?plan=) aparece como selo",
    ],
    adapt: [
      "Cadastro de parceiro, convite de cliente para portal",
    ],
    avoid: [
      "Pedir dados de cobrança no cadastro",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const sizes = [
  { value: "1-10", label: "1 a 10 pessoas" },
  { value: "11-50", label: "11 a 50 pessoas" },
  { value: "51-200", label: "51 a 200 pessoas" },
  { value: "201-1000", label: "201 a 1.000 pessoas" },
  { value: "1000+", label: "Mais de 1.000" },
];
const uses = [
  { value: "crm", label: "Vendas (CRM)" },
  { value: "ats", label: "Recrutamento (ATS)" },
  { value: "erp", label: "Financeiro e operações (ERP)" },
  { value: "outro", label: "Outro" },
];

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function SignupBlock() {
  // Vindo da página de preços: #/frame/auth-signup?plan=business
  const plan = planById(useFrameQuery().get("plan"))?.name;
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [company, setCompany] = useState("");
  const [size, setSize] = useState("");
  const [use, setUse] = useState("crm");
  const [terms, setTerms] = useState(false);
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);

  const e1 = {
    name: !name.trim() ? "Informe seu nome." : undefined,
    email: !/.+@.+\..+/.test(email) ? "Informe um e-mail válido, como nome@empresa.com." : undefined,
    pw: pw.length < 8 ? "Use pelo menos 8 caracteres." : undefined,
  };
  const e2 = { company: !company.trim() ? "Informe o nome da empresa." : undefined, size: !size ? "Escolha o tamanho do time." : undefined, terms: !terms ? "Aceite os termos para continuar." : undefined };

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (step === 1 && !Object.values(e1).some(Boolean)) {
      setStep(2);
      setTried(false);
    } else if (step === 2 && !Object.values(e2).some(Boolean)) setDone(true);
  };

  return (
    <div className="h-dvh overflow-y-auto bg-soft/60">
      <div className="mx-auto flex min-h-full max-w-[440px] flex-col px-5 py-8">
        <AuthBrand className="mx-auto" />
        <main className="enter mt-8 rounded-2xl border border-line bg-surface p-6 shadow-raised sm:p-8">
          {done ? (
            <div className="py-6 text-center">
              <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-ok-soft text-ok">
                <Mail className="h-5 w-5" />
              </span>
              <h1 className="m-0 text-[20px] font-semibold tracking-tight">Confirme seu e-mail</h1>
              <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
                Enviamos um código para <strong className="font-medium text-ink">{email}</strong>. Digite-o na próxima tela para ativar a conta.
              </p>
              <Button href={authRoutes.otp("cadastro", email)} className="mt-6 w-full">
                Digitar código <ArrowRight />
              </Button>
            </div>
          ) : (
            <form noValidate onSubmit={next}>
              <div className="mb-6">
                <Stepper
                  label="Etapas do cadastro"
                  steps={[
                    { id: "voce", label: "Você", state: step === 1 ? "current" : "done" },
                    { id: "empresa", label: "Empresa", state: step === 2 ? "current" : "upcoming" },
                  ]}
                />
              </div>
              <h1 className="m-0 text-[22px] font-semibold tracking-[-0.03em]">{step === 1 ? "Crie sua conta" : "Sobre a sua empresa"}</h1>
              <p className="m-0 mb-6 mt-1.5 flex flex-wrap items-center gap-2 text-[13.5px] text-muted">
                {step === 1 ? "14 dias grátis, sem cartão." : "Usamos isso para preparar o seu espaço de trabalho."}
                {plan && (
                  <Badge tone="accent">
                    Plano {plan} · <a href={authRoutes.pricing} className="underline underline-offset-2">trocar</a>
                  </Badge>
                )}
              </p>
              {step === 1 && (
                <>
                  <SsoButtons next={authRoutes.wizard} />
                  <OrDivider />
                </>
              )}
              {step === 1 ? (
                <>
                  <TextField label="Nome completo" icon={<User />} autoComplete="name" value={name} onChange={setName} error={tried ? e1.name : undefined} />
                  <TextField label="E-mail de trabalho" type="email" icon={<Mail />} autoComplete="email" value={email} onChange={setEmail} error={tried ? e1.email : undefined} />
                  <PasswordField label="Senha" value={pw} onChange={setPw} strength autoComplete="new-password" error={tried ? e1.pw : undefined} />
                </>
              ) : (
                <>
                  <TextField label="Empresa" icon={<Building2 />} autoComplete="organization" value={company} onChange={setCompany} error={tried ? e2.company : undefined} />
                  <div className="mb-5">
                    <p className="m-0 mb-1.5 text-[12.5px] text-muted">Tamanho do time</p>
                    <Select label="Tamanho do time" options={sizes} value={size} onValueChange={setSize} placeholder="Selecione…" />
                    {tried && e2.size && <p className="m-0 mt-1.5 text-[12px] text-rose">{e2.size}</p>}
                  </div>
                  <div className="mb-5">
                    <p className="m-0 mb-1.5 text-[12.5px] text-muted">Vai usar principalmente para</p>
                    <Select label="Uso principal" options={uses} value={use} onValueChange={setUse} />
                  </div>
                  <div className="mb-6">
                    <Checkbox label="Aceito os termos" checked={terms} onCheckedChange={setTerms}>
                      Li e aceito os <a href={authRoutes.landing} className="text-blue underline-offset-2 hover:underline">Termos de uso</a>
                    </Checkbox>
                    {tried && e2.terms && <p className="m-0 mt-1.5 text-[12px] text-rose">{e2.terms}</p>}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                {step === 2 && (
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft /> Voltar
                  </Button>
                )}
                <Button type="submit" className="flex-1">
                  {step === 1 ? "Continuar" : "Criar conta"} <ArrowRight />
                </Button>
              </div>
            </form>
          )}
        </main>
        <p className="mt-6 text-center text-[13px] text-muted">
          Já tem conta? <a href={authRoutes.login} className="font-medium text-blue hover:underline">Entrar</a>
        </p>
      </div>
    </div>
  );
}
