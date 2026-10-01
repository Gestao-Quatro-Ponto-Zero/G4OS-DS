import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { Button, Checkbox, Callout, PasswordField, TextField } from "@g4ai/ds";
import { me } from "./data/workspace";
import { AuthSplit, OrDivider, SsoButtons, authRoutes } from "./shells/auth-shell";
import { goTo } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Entrar",
  description: "Login com e-mail e senha, SSO Google/Microsoft, link mágico e painel de marca navy à direita (some no celular).",
  category: "Autenticação",
  order: 1,
  height: 820,
  concept: {
    goal: "Entrar rápido pelo caminho que a pessoa já usa: senha, SSO ou link mágico.",
    patterns: [
      "Anatomia H · Fluxo focado: formulário à esquerda, painel de marca navy à direita (some no celular)",
      "SSO Google/Microsoft e link mágico além da senha",
      "Erro no lugar do campo, sem limpar o que foi digitado",
    ],
    adapt: [
      "Portal do cliente, app interno, área de parceiros",
    ],
    avoid: [
      "Painel de marca ocupando a tela no celular",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

// Senha de exemplo que entra; qualquer outra mostra o erro.
const demoPassword = "acme2026";

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function LoginBlock() {
  const [email, setEmail] = useState(me.email);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [state, setState] = useState<"idle" | "loading" | "error" | "sent">("idle");
  const [touched, setTouched] = useState(false);
  const emailError = touched && !/.+@.+\..+/.test(email) ? "Informe um e-mail válido, como nome@empresa.com." : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!/.+@.+\..+/.test(email) || (mode === "password" && !password)) return;
    setState("loading");
    setTimeout(() => {
      if (mode === "magic") return setState("sent");
      if (password !== demoPassword) return setState("error");
      // Senha certa → segunda etapa (código) → início do produto.
      goTo(authRoutes.otp("entrar", email));
    }, 900);
  };

  return (
    <AuthSplit>
      <h1 className="m-0 text-[25px] font-semibold tracking-[-0.035em]">Entrar</h1>
      <p className="m-0 mt-1.5 text-[13.5px] text-muted">
        Novo por aqui? <a href={authRoutes.signup} className="font-medium text-blue hover:underline">Crie uma conta</a>
      </p>

      <div className="mt-7">
        <SsoButtons />
      </div>
      <OrDivider />

      {state === "sent" ? (
        <Callout
          tone="ok"
          title="Link enviado"
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => goTo(authRoutes.home)}>
                Abrir o link
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setState("idle")}>
                Voltar
              </Button>
            </div>
          }
        >
          Abra o e-mail em <strong className="font-medium text-ink">{email}</strong> e clique no link. Ele vale por 15 minutos.
        </Callout>
      ) : (
        <form noValidate onSubmit={submit}>
          {state === "error" && (
            <div className="mb-5">
              <Callout tone="bad" title="E-mail ou senha incorretos">
                Confira e tente de novo, ou <a href={authRoutes.forgot} className="underline">redefina a senha</a>.
              </Callout>
            </div>
          )}
          <TextField
            label="E-mail de trabalho"
            type="email"
            icon={<Mail />}
            autoComplete="email"
            value={email}
            onChange={setEmail}
            onBlur={() => setTouched(true)}
            error={emailError}
          />
          {mode === "password" && (
            <PasswordField
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (state === "error") setState("idle");
              }}
              placeholder="Sua senha"
              error={touched && !password ? "Digite sua senha." : undefined}
              corner={<a href={authRoutes.forgot} className="text-blue hover:underline">Esqueci a senha</a>}
            />
          )}
          {mode === "password" && (
            <div className="mb-5 -mt-1">
              <Checkbox label="Manter conectado" checked={remember} onCheckedChange={setRemember}>
                Manter conectado por 30 dias
              </Checkbox>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={state === "loading"}>
            {state === "loading" ? "Entrando…" : mode === "magic" ? "Enviar link de acesso" : "Entrar"}
            {state !== "loading" && <ArrowRight />}
          </Button>
          <button
            type="button"
            onClick={() => setMode((m) => (m === "password" ? "magic" : "password"))}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] text-muted hover:bg-soft hover:text-ink"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {mode === "password" ? "Entrar sem senha, com link por e-mail" : "Entrar com senha"}
          </button>
          <p className="m-0 mt-4 text-center text-[11.5px] text-muted">Dica do exemplo: a senha “acme2026” entra (e pede o código 123456); outra mostra o erro.</p>
        </form>
      )}
    </AuthSplit>
  );
}
