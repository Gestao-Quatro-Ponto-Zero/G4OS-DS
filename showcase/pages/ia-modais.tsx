import { PartyPopper, Wand2 } from "lucide-react";
import { useState } from "react";
import { AnimatedModal, Button, InputModal, notify } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { sphereImages } from "./_ia-data";

export const meta: PageMeta = {
  title: "Modais interativos",
  group: "IA e interação",
  order: 40,
  description: "InputModal para uma pergunta só (criar com IA, renomear, colar link) e AnimatedModal para momentos de marca (boas-vindas, novidade, conquista).",
};

export default function Page() {
  const [input, setInput] = useState(false);
  const [multi, setMulti] = useState(false);
  const [anim, setAnim] = useState(false);
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="InputModal" rule="Um campo grande, Enter envia, Esc fecha. Sugestões preenchem o campo. Multilinha envia com ⌘↵.">
        <Demo
          code={`<InputModal
  open={aberto} onClose={fechar}
  title="Criar tarefas com IA"
  description="Descreva o que precisa acontecer; eu separo em tarefas."
  suggestions={["Onboarding do cliente Aurora", "Fechamento contábil de setembro"]}
  submitLabel="Gerar tarefas"
  onSubmit={(texto) => gerar(texto)}
/>`}
        >
          <Button onClick={() => setInput(true)}>
            <Wand2 /> Criar tarefas com IA
          </Button>
          <Button variant="ghost" onClick={() => setMulti(true)}>
            Multilinha
          </Button>
          <InputModal
            open={input}
            onClose={() => setInput(false)}
            title="Criar tarefas com IA"
            description="Descreva o que precisa acontecer; eu separo em tarefas com responsável e prazo."
            suggestions={["Onboarding do cliente Aurora", "Fechamento contábil de setembro", "Processo seletivo de SDR"]}
            submitLabel="Gerar tarefas"
            onSubmit={(v) => notify(`Gerando tarefas para “${v}”`, undefined, "info")}
          />
          <InputModal open={multi} onClose={() => setMulti(false)} multiline title="Colar a transcrição da reunião" description="Eu extraio decisões, responsáveis e prazos." placeholder="Cole aqui…" submitLabel="Extrair" onSubmit={() => notify("Transcrição recebida")} />
        </Demo>
        <PropsTable
          rows={[
            ["title · description", "string · ReactNode", "—", "Pergunta clara no título."],
            ["onSubmit", "(valor: string) => void", "—", "Chamado com o texto aparado; o modal fecha."],
            ["suggestions", "string[]", "—", "Chips que preenchem o campo."],
            ["multiline", "boolean", "false", "Textarea; envia com ⌘↵."],
            ["submitLabel · icon", "string · ReactNode", "“Continuar”", "Verbo no botão."],
          ]}
        />
      </DocSection>
      <DocSection title="AnimatedModal" rule="Entrada coreografada: sobe e ganha nitidez, conteúdo em cascata. Sem animação com movimento reduzido. Só para momentos de marca; decisões do dia a dia usam Modal.">
        <Demo code={`<AnimatedModal open={aberto} onClose={fechar} media={<img src={capa} />} title="Bem-vindo ao Nexo ERP" description="…" footer={<Button>Começar</Button>} />`}>
          <Button variant="ghost" onClick={() => setAnim(true)}>
            <PartyPopper /> Abrir boas-vindas
          </Button>
          <AnimatedModal
            open={anim}
            onClose={() => setAnim(false)}
            media={<img src={sphereImages[3].src} alt="" className="h-44 w-full object-cover" />}
            title="Bem-vindo ao Nexo ERP"
            description="Sua empresa está configurada. Em 3 passos você emite a primeira nota fiscal."
            footer={
              <>
                <Button variant="ghost" size="sm" onClick={() => setAnim(false)}>
                  Depois
                </Button>
                <Button size="sm" onClick={() => setAnim(false)}>
                  Começar agora
                </Button>
              </>
            }
          >
            <ul className="list-disc space-y-1 pl-5 text-[13.5px] text-ink-soft">
              <li>Importar produtos e clientes</li>
              <li>Conectar o certificado digital</li>
              <li>Emitir a primeira NF-e</li>
            </ul>
          </AnimatedModal>
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Um modal animado por sessão, no máximo.", dont: "Animar todo modal de confirmação." }, { do: "InputModal quando a resposta cabe numa frase.", dont: "InputModal com 5 campos (use Drawer)." }]} />
      </DocSection>
    </DocPage>
  );
}
