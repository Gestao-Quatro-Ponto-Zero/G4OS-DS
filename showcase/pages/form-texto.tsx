import { AtSign, Globe, Search } from "lucide-react";
import { useState } from "react";
import { TextField, TextareaField } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Campos de texto", group: "Formulários", order: 20, description: "TextField e TextareaField: rótulo sempre visível, ajuda e erro abaixo, prefixo/sufixo, ícone, limpar e contador." };

export default function Page() {
  const [name, setName] = useState("Mariana Couto");
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("g4educacao.com");
  const [q, setQ] = useState("proposta");
  const [bio, setBio] = useState("Head de vendas B2B com 8 anos em SaaS.");
  const [weight, setWeight] = useState("12");
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Básico" rule="Rótulo curto (substantivo), placeholder como exemplo real. Ajuda explica formato ou uso; erro diz como corrigir.">
        <Demo
          title="Rótulo, ajuda e erro"
          className="grid gap-x-6 sm:grid-cols-2"
          code={`<TextField label="Nome completo" value={name} onChange={setName} />
<TextField label="E-mail" type="email" value={email} onChange={setEmail}
  hint="Usamos para enviar a proposta."
  error={email && !email.includes("@") ? "Informe um e-mail válido, como nome@empresa.com." : undefined} />`}
        >
          <TextField label="Nome completo" value={name} onChange={setName} autoComplete="name" />
          <TextField
            label="E-mail"
            type="email"
            icon={<AtSign />}
            placeholder="nome@empresa.com"
            value={email}
            onChange={setEmail}
            hint="Usamos para enviar a proposta."
            error={email && !email.includes("@") ? "Informe um e-mail válido, como nome@empresa.com." : undefined}
          />
          <TextField label="Site" prefix="https://" value={site} onChange={setSite} optional />
          <TextField label="Peso" suffix="kg" inputMode="decimal" value={weight} onChange={setWeight} />
        </Demo>
        <Demo title="Ícone, limpar, contador e tamanhos" className="grid gap-x-6 sm:grid-cols-3" code={`<TextField label="Buscar" icon={<Search />} clearable value={q} onChange={setQ} size="sm" />
<TextField label="Título do negócio" maxLength={60} counter value={v} onChange={setV} />
<TextField label="Domínio" loading value={v} onChange={setV} hint="Verificando disponibilidade…" size="lg" />`}>
          <TextField label="Buscar (sm)" size="sm" icon={<Search />} clearable value={q} onChange={setQ} />
          <TextField label="Título do negócio" maxLength={60} counter value={name} onChange={setName} />
          <TextField label="Domínio (lg)" size="lg" icon={<Globe />} loading value={site} onChange={setSite} hint="Verificando disponibilidade…" />
        </Demo>
      </DocSection>
      <DocSection title="Texto longo" rule="Cresce com o conteúdo até maxRows e então rola. Contador só quando há limite real (ex.: SMS, bio pública).">
        <Demo code={`<TextareaField label="Resumo" value={bio} onChange={setBio} maxLength={280} counter minRows={3} maxRows={8} />`} className="block">
          <TextareaField label="Resumo profissional" value={bio} onChange={setBio} maxLength={280} counter hint="Aparece no topo do perfil do candidato." />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Rótulo acima, sempre visível, em 12.5px muted.", dont: "Usar o placeholder como rótulo — ele some ao digitar." },
            { do: "Erro que ensina: “Informe um e-mail válido, como nome@empresa.com.”", dont: "“Campo inválido.” ou mensagem em vermelho só no rótulo." },
            { do: "Validar no blur ou no envio; limpar o erro assim que o valor ficar válido.", dont: "Mostrar erro enquanto a pessoa ainda está digitando o primeiro caractere." },
            { do: "`autoComplete` e `type` corretos (email, tel, name, organization) — o celular agradece.", dont: "type=\"text\" para tudo." },
          ]}
        />
      </DocSection>
      <DocSection title="Props · TextField">
        <PropsTable
          rows={[
            ["label", "string", "—", "Rótulo visível acima do campo."],
            ["value / onChange", "string / (v) => void", "—", "Controlado. onChange recebe o texto, não o evento."],
            ["hint / error", "ReactNode", "—", "Ajuda ou erro abaixo; erro substitui a ajuda e liga aria-invalid."],
            ["prefix / suffix", "ReactNode", "—", "Texto fixo com divisória (https://, kg, %)."],
            ["icon", "ReactNode", "—", "Ícone lucide à esquerda."],
            ["clearable", "boolean", "false", "Botão × quando há valor."],
            ["maxLength + counter", "number + boolean", "—", "Contador 12/60 no canto do rótulo; âmbar ao atingir."],
            ["size", '"sm" | "md" | "lg"', '"md"', "32 / 40 / 48px de altura."],
            ["loading", "boolean", "false", "Spinner à direita para validação assíncrona."],
            ["optional", "boolean", "false", "Acrescenta “(opcional)” ao rótulo."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
