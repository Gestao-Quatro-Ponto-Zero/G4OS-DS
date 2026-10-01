import { ArrowLeft, Check, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { Button, PasswordField, TextField } from "@g4os/ds";
import { AuthBrand, authRoutes } from "./shells/auth-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Redefinir senha",
  description: "Fluxo completo em uma tela: pedir link → conferir e-mail → nova senha com confirmação → pronto. Mensagem neutra que não revela se o e-mail existe.",
  category: "Autenticação",
  order: 4,
  height: 720,
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Step = "request" | "sent" | "reset" | "done";

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function ForgotPasswordBlock() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  const wait = (next: Step) => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setTried(false);
      setStep(next);
    }, 700);
  };

  const icon = { request: KeyRound, sent: Mail, reset: KeyRound, done: Check }[step];
  const Icon = icon;

  return (
    <div className="h-dvh overflow-y-auto bg-soft/60">
      <div className="mx-auto flex min-h-full max-w-[420px] flex-col justify-center px-5 py-10">
        <AuthBrand className="mx-auto mb-8" />
        <main key={step} className="enter rounded-2xl border border-line bg-surface p-6 shadow-raised sm:p-8">
          <span className={`mb-4 grid h-11 w-11 place-items-center rounded-xl border ${step === "done" ? "border-ok/20 bg-ok-soft text-ok" : "border-line bg-soft text-ink-soft"}`}>
            <Icon className="h-5 w-5" strokeWidth={1.7} />
          </span>

          {step === "request" && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setTried(true);
                if (/.+@.+\..+/.test(email)) wait("sent");
              }}
            >
              <h1 className="m-0 text-[20px] font-semibold tracking-tight">Esqueceu a senha?</h1>
              <p className="m-0 mb-6 mt-1.5 text-[13.5px] leading-relaxed text-muted">Informe o e-mail da conta e enviaremos um link para criar uma nova.</p>
              <TextField
                label="E-mail"
                type="email"
                icon={<Mail />}
                autoComplete="email"
                value={email}
                onChange={setEmail}
                error={tried && !/.+@.+\..+/.test(email) ? "Informe um e-mail válido, como nome@empresa.com." : undefined}
              />
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Enviando…" : "Enviar link"}
              </Button>
            </form>
          )}

          {step === "sent" && (
            <>
              <h1 className="m-0 text-[20px] font-semibold tracking-tight">Confira seu e-mail</h1>
              <p className="m-0 mt-1.5 text-[13.5px] leading-relaxed text-muted">
                Se existir uma conta com <strong className="font-medium text-ink">{email}</strong>, você vai receber um link em alguns minutos. Ele vale por 1 hora.
              </p>
              <div className="mt-6 grid gap-2">
                <Button onClick={() => setStep("reset")}>Abrir link (simular)</Button>
                <Button variant="ghost" onClick={() => setStep("request")}>
                  Usar outro e-mail
                </Button>
              </div>
            </>
          )}

          {step === "reset" && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setTried(true);
                if (pw.length >= 8 && pw === pw2) wait("done");
              }}
            >
              <h1 className="m-0 text-[20px] font-semibold tracking-tight">Crie uma nova senha</h1>
              <p className="m-0 mb-6 mt-1.5 text-[13.5px] text-muted">Depois disso, você sai de todos os outros dispositivos.</p>
              <PasswordField label="Nova senha" value={pw} onChange={setPw} strength autoComplete="new-password" error={tried && pw.length < 8 ? "Use pelo menos 8 caracteres." : undefined} />
              <PasswordField
                label="Repita a nova senha"
                value={pw2}
                onChange={setPw2}
                autoComplete="new-password"
                error={tried && pw !== pw2 ? "As senhas não são iguais." : undefined}
              />
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </form>
          )}

          {step === "done" && (
            <>
              <h1 className="m-0 text-[20px] font-semibold tracking-tight">Senha alterada</h1>
              <p className="m-0 mt-1.5 text-[13.5px] text-muted">Use a nova senha para entrar.</p>
              <Button href={authRoutes.login} className="mt-6 w-full">
                Ir para o login
              </Button>
            </>
          )}
        </main>
        {step !== "done" && (
          <a href={authRoutes.login} className="mx-auto mt-6 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
          </a>
        )}
      </div>
    </div>
  );
}
