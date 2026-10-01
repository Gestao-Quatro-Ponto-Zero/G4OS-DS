import { useState } from "react";
import { Button, OtpInput, PasswordField } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Senha e código (OTP)", group: "Formulários", order: 21, description: "PasswordField com mostrar/ocultar e régua de força; OtpInput para códigos de verificação por e-mail/SMS/app." };

export default function Page() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("Senha@2026");
  const [code, setCode] = useState("");
  const [code2, setCode2] = useState("482");
  const [status, setStatus] = useState<"idle" | "ok" | "bad">("idle");
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Senha" rule="No login, só mostrar/ocultar. No cadastro e troca de senha, `strength` mostra força e requisitos em tempo real — sem esconder regras até o erro.">
        <Demo
          className="grid gap-x-6 sm:grid-cols-2"
          code={`<PasswordField value={pw} onChange={setPw} corner={<a href="/esqueci">Esqueci a senha</a>} />
<PasswordField label="Nova senha" value={pw} onChange={setPw} strength autoComplete="new-password" />`}
        >
          <PasswordField value={pw2} onChange={setPw2} corner={<a href="#" className="text-blue hover:underline">Esqueci a senha</a>} />
          <PasswordField label="Nova senha" value={pw} onChange={setPw} strength autoComplete="new-password" placeholder="Crie uma senha" />
        </Demo>
      </DocSection>
      <DocSection title="Código de verificação" rule="Um quadrado por dígito, 48px de altura. Aceita colar o código inteiro e o preenchimento automático do SMS (autocomplete=one-time-code). Verifique sozinho ao completar — sem botão “Confirmar” obrigatório.">
        <Demo
          title="6 dígitos, verificação automática"
          className="flex flex-col items-start gap-4"
          code={`<OtpInput value={code} onChange={setCode} onComplete={(c) => verify(c)}
  error={status === "bad" ? "Código incorreto. Confira o e-mail mais recente." : undefined} />`}
        >
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setStatus("idle");
            }}
            onComplete={(c) => setStatus(c === "123456" ? "ok" : "bad")}
            error={status === "bad" ? "Código incorreto. Confira o e-mail mais recente." : undefined}
          />
          <p className="m-0 text-[12.5px] text-muted">
            {status === "ok" ? <span className="text-ok">Código confirmado.</span> : "Dica: 123456 confirma; qualquer outro mostra erro."}
          </p>
        </Demo>
        <Demo title="Agrupado 3-3 e desabilitado" className="flex flex-wrap items-center gap-8" code={`<OtpInput value={code} onChange={setCode} groupAt={3} />
<OtpInput value="" onChange={() => {}} length={4} disabled />`}>
          <OtpInput value={code2} onChange={setCode2} groupAt={3} />
          <OtpInput value="" onChange={() => {}} length={4} disabled />
          <Button variant="quiet" size="sm">Reenviar em 0:42</Button>
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mostrar os requisitos da senha antes do erro, marcando os cumpridos.", dont: "Revelar a regra só depois de um envio falho." },
            { do: "Diga para onde o código foi (“enviado para m•••@empresa.com”) e ofereça reenviar com contagem.", dont: "Apagar o código digitado quando ele está errado — deixe corrigir." },
          ]}
        />
      </DocSection>
      <DocSection title="Props · OtpInput">
        <PropsTable
          rows={[
            ["length", "number", "6", "Quantidade de dígitos."],
            ["value / onChange", "string", "—", "Somente dígitos, sem separador."],
            ["onComplete", "(code) => void", "—", "Dispara quando todos os dígitos foram preenchidos."],
            ["groupAt", "number", "—", "Separador visual após N dígitos."],
            ["error", "ReactNode", "—", "Borda rosa em todos os quadrados + mensagem (role=alert)."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
