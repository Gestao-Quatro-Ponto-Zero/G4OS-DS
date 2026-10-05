import { useState } from "react";
import { Button, CallDetectedPrompt, notify } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Call detectada",
  group: "IA e interação",
  order: 71,
  description: "CallDetectedPrompt: quando outro app (Zoom, Meet, Teams) começa a usar o microfone, o app pergunta se quer gravar notas. Nunca grava sozinho.",
};

export default function Page() {
  const [open, setOpen] = useState(true);
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Cartão" rule="No topo da página de reuniões, enquanto a call dura. 'Agora não' some com o aviso; 'Não perguntar' desliga para aquele app.">
        <Demo
          code={`<CallDetectedPrompt
  app="Google Meet"
  host="Chrome"
  onRecord={comecarGravacao}
  onDismiss={fechar}
  onNever={naoPerguntarParaEsteApp}
/>`}
        >
          {open ? (
            <CallDetectedPrompt app="Google Meet" host="Chrome" onRecord={() => notify("Gravação iniciada")} onDismiss={() => setOpen(false)} onNever={() => setOpen(false)} />
          ) : (
            <Button variant="ghost" onClick={() => setOpen(true)}>
              Mostrar de novo
            </Button>
          )}
        </Demo>
      </DocSection>
      <DocSection title="Notificação" rule="variant='toast' flutua no canto (sombra) quando a pessoa está em outra tela.">
        <Demo code={`<CallDetectedPrompt variant="toast" app="Zoom" onRecord={gravar} onDismiss={fechar} />`}>
          <CallDetectedPrompt variant="toast" app="Zoom" onRecord={() => notify("Gravação iniciada")} onDismiss={() => {}} />
        </Demo>
        <PropsTable
          rows={[
            ["app", "string", "—", "App que abriu o microfone."],
            ["host", "string", "—", "Onde roda (\"Chrome\")."],
            ["icon", "ReactNode", "câmera", "Logo do app."],
            ["variant", '"card" | "toast"', '"card"', "No fluxo ou flutuando."],
            ["onRecord", "() => void", "—", "Começa a gravar notas."],
            ["onDismiss / onNever", "() => void", "—", "Fechar agora / não perguntar mais para o app."],
            ["labels", "Partial<CallDetectedLabels>", "callDetectedLabels", "Textos."],
          ]}
        />
        <Rules items={[{ do: "Perguntar e deixar a pessoa decidir.", dont: "Começar a gravar ao detectar a call." }]} />
      </DocSection>
    </DocPage>
  );
}
