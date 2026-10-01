import { useEffect, useState } from "react";
import { FileDropzone, type UploadItem } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Upload de arquivos", group: "Formulários", order: 25, description: "FileDropzone: clicar ou arrastar, validação de tipo/tamanho/quantidade, lista com progresso, erro e remoção." };

export default function Page() {
  const [items, setItems] = useState<UploadItem[]>([
    { id: "a", name: "curriculo-mariana-couto.pdf", size: 284_000 },
    { id: "b", name: "portfolio-2026.pdf", size: 4_800_000, progress: 45 },
    { id: "c", name: "carta.docx", size: 12_000, error: "A conexão caiu. Tente de novo." },
  ]);
  useEffect(() => {
    const t = setInterval(() => setItems((xs) => xs.map((x) => (x.progress == null ? x : x.progress >= 100 ? { ...x, progress: undefined } : { ...x, progress: x.progress + 7 }))), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Anexos" rule="O componente valida e entrega os File aceitos; o envio (e o progresso) é do seu código. Diga os limites antes do erro, embaixo da área.">
        <Demo
          className="block"
          code={`<FileDropzone label="Anexos" accept=".pdf,.docx" maxSize={10 * 1024 * 1024} maxFiles={5}
  items={items} onRemove={(id) => remove(id)}
  onFiles={(files) => files.forEach(upload)} />`}
        >
          <FileDropzone
            label="Anexos do candidato"
            accept=".pdf,.docx"
            maxSize={10 * 1024 * 1024}
            maxFiles={5}
            items={items}
            onRemove={(id) => setItems((xs) => xs.filter((x) => x.id !== id))}
            onFiles={(files) => setItems((xs) => [...xs, ...files.map((f) => ({ id: `${f.name}-${Date.now()}`, name: f.name, size: f.size, progress: 0 }))])}
          />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Manter o arquivo com erro na lista, com o motivo e como tentar de novo.", dont: "Sumir com o arquivo que falhou (a pessoa não sabe o que faltou)." },
            { do: "Aceitar o formato que as pessoas têm (PDF, DOCX, imagens) e converter no servidor.", dont: "Limite de tamanho escondido que só aparece no erro." },
          ]}
        />
      </DocSection>
      <DocSection title="Props">
        <PropsTable
          rows={[
            ["accept", "string", "—", "Como o atributo HTML: .pdf,.docx,image/*"],
            ["maxSize", "number (bytes)", "—", "Arquivos maiores são recusados com mensagem."],
            ["maxFiles", "number", "—", "Conta com os itens já na lista."],
            ["onFiles", "(files: File[]) => void", "—", "Recebe só os arquivos aceitos."],
            ["items", "UploadItem[]", "[]", "{ id, name, size, progress?, error? } — progress 0–100 enquanto envia."],
            ["onRemove", "(id) => void", "—", "Mostra o × em cada item."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
