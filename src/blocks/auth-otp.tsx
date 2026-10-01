import { ArrowLeft, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, OtpInput, Spinner } from "@g4os/ds";
import { me } from "./data/workspace";
import { AuthCard, authRoutes } from "./shells/auth-shell";
import { goTo, useFrameQuery } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Verificar código",
  description: "Confirmação por código de 6 dígitos: colar o código inteiro, verificação automática, erro com tentativas restantes e reenvio com contagem.",
  category: "Autenticação",
  order: 3,
  height: 700,
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const validCode = "123456";
const resendAfter = 45;

const maskEmail = (e: string) => e.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${"•".repeat(Math.min(6, b.length))}${c}`);

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function OtpBlock() {
  // ?next=entrar (login com 2 etapas) ou ?next=cadastro (confirmar e-mail); ?email=…
  const query = useFrameQuery();
  const isLogin = query.get("next") === "entrar";
  const sentTo = query.get("email") || me.email;
  const [spamTip, setSpamTip] = useState(false);
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "error" | "ok">("idle");
  const [attempts, setAttempts] = useState(3);
  const [wait, setWait] = useState(resendAfter);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = (c: string) => {
    setState("checking");
    setTimeout(() => {
      if (c === validCode) {
        setState("ok");
        // Login: entra direto. Cadastro: mostra a confirmação e segue para a configuração.
        if (isLogin) setTimeout(() => goTo(authRoutes.home), 500);
      } else {
        setState("error");
        setAttempts((a) => a - 1);
      }
    }, 700);
  };

  return (
    <AuthCard
      width={460}
      center
      below={
        <>
          <a href={isLogin ? authRoutes.login : authRoutes.signup} className="mx-auto mt-6 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Usar outro e-mail
          </a>
          <p className="mt-2 text-center text-[11.5px] text-muted">Dica do exemplo: 123456 confirma.</p>
        </>
      }
    >
          <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl border border-line bg-soft text-ink-soft">
            <MailCheck className="h-5 w-5" strokeWidth={1.6} />
          </span>
          {state === "ok" ? (
            <>
              <h1 className="m-0 text-[20px] font-semibold tracking-tight">{isLogin ? "Código confirmado" : "E-mail confirmado"}</h1>
              <p className="m-0 mt-2 text-[13.5px] text-muted">{isLogin ? "Entrando no seu espaço de trabalho…" : "Tudo pronto. Vamos configurar seu espaço de trabalho."}</p>
              <Button href={isLogin ? authRoutes.home : authRoutes.wizard} className="mt-6 w-full">
                {isLogin ? "Ir para o início" : "Continuar"}
              </Button>
            </>
          ) : (
            <>
              <h1 className="m-0 text-[20px] font-semibold tracking-tight">{isLogin ? "Verificação em duas etapas" : "Digite o código"}</h1>
              <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
                Enviamos 6 dígitos para <strong className="font-medium text-ink">{maskEmail(sentTo)}</strong>. Ele expira em 10 minutos.
              </p>
              <div className="mt-6 flex justify-center">
                <OtpInput
                  value={code}
                  autoFocus
                  disabled={state === "checking" || attempts <= 0}
                  onChange={(v) => {
                    setCode(v);
                    if (state === "error") setState("idle");
                  }}
                  onComplete={verify}
                  error={
                    attempts <= 0
                      ? "Muitas tentativas. Peça um novo código."
                      : state === "error"
                        ? `Código incorreto. ${attempts} ${attempts === 1 ? "tentativa restante" : "tentativas restantes"}.`
                        : undefined
                  }
                />
              </div>
              <div className="mt-4 h-5 text-[12.5px] text-muted" aria-live="polite">
                {state === "checking" && (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" /> Verificando…
                  </span>
                )}
              </div>
              <div className="mt-4 border-t border-line pt-4 text-[13px] text-muted">
                Não recebeu?{" "}
                {wait > 0 ? (
                  <span className="tabular-nums">Reenviar em 0:{String(wait).padStart(2, "0")}</span>
                ) : (
                  <button
                    type="button"
                    className="font-medium text-blue hover:underline"
                    onClick={() => {
                      setWait(resendAfter);
                      setAttempts(3);
                      setCode("");
                      setState("idle");
                    }}
                  >
                    Reenviar código
                  </button>
                )}
                <span className="mx-1.5 text-line-strong">·</span>
                <button type="button" className="hover:text-ink" aria-expanded={spamTip} onClick={() => setSpamTip((v) => !v)}>
                  Não chegou?
                </button>
                {spamTip && <p className="m-0 mt-2 text-[12.5px] leading-relaxed">Confira a pasta de spam ou promoções e procure por “Código do Atlas”. E-mails corporativos podem levar até 2 minutos.</p>}
              </div>
            </>
          )}
    </AuthCard>
  );
}
