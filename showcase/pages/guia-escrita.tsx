import { Plus } from "lucide-react";
import { Button, ConfirmDialog, Empty, notify } from "@g4ai/ds";
import { useState } from "react";
import { DocPage, DocSection, Rules, type PageMeta } from "../kit";
import { GuideTable } from "./_guia-table";

export const meta: PageMeta = {
  title: "Escrita de interface",
  group: "Começar",
  order: 5,
  description: "A interface fala como um colega competente: direta, específica, em português claro, sem exclamação e sem jargão de sistema.",
};

export default function Page() {
  const [open, setOpen] = useState(false);
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Botões: verbo + objeto" rule="O botão diz o que vai acontecer. O mesmo verbo segue no toast e no desfazer.">
        <GuideTable
          head={["Escreva", "Em vez de", "Por quê"]}
          mono={[]}
          rows={[
            ["Criar negócio", "Salvar / OK / Enviar", "Verbo no infinitivo com o objeto."],
            ["Salvando…", "Aguarde…", "Gerúndio enquanto executa (OperationButton)."],
            ["Negócio criado", "Salvo com sucesso!", "Particípio + objeto no toast. Sem “com sucesso”."],
            ["Excluir 3 contatos", "Excluir", "Destrutivo nomeia o objeto e a quantidade."],
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => notify("Negócio criado", () => notify("Criação desfeita", undefined, "info"))}>
            <Plus /> Criar negócio
          </Button>
          <Button variant="ghost" onClick={() => setOpen(true)}>
            Excluir vaga
          </Button>
        </div>
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => notify("Vaga excluída")}
          title="Excluir a vaga Designer Sênior?"
          description="Os 42 candidatos continuam no banco de talentos. Esta ação não pode ser desfeita."
          confirmLabel="Excluir vaga"
          tone="danger"
        />
      </DocSection>

      <DocSection title="Confirmação" rule="Título = pergunta com o objeto. Descrição = consequência concreta. Botão = o verbo. Se for reversível, não confirme: faça e ofereça Desfazer.">
        <Rules items={[{ do: "“Excluir a vaga Designer Sênior?” · “Excluir vaga” / “Cancelar”.", dont: "“Tem certeza?” · “Sim” / “Não”." }]} />
      </DocSection>

      <DocSection title="Estados vazios" rule="O que falta + a próxima ação. Com filtro ativo, o vazio é outro.">
        <div className="grid gap-3 md:grid-cols-2">
          <Empty title="Nenhum negócio neste funil" hint="Crie um negócio ou importe uma planilha de oportunidades." action={<Button size="sm"><Plus /> Criar negócio</Button>} />
          <Empty title="Nenhum contato com esses filtros" hint="Tente outros filtros ou limpe todos." action={<Button size="sm" variant="ghost">Limpar filtros</Button>} />
        </div>
      </DocSection>

      <DocSection title="Erros" rule="O que aconteceu, por quê (se souber) e o que fazer. Sem culpa, sem código técnico sozinho.">
        <Rules
          items={[
            { do: "“Informe um e-mail válido, como nome@empresa.com.”", dont: "“Campo inválido.”" },
            { do: "“Não foi possível emitir a nota. A prefeitura não respondeu. Tente de novo em alguns minutos.”", dont: "“Erro 504: Gateway Timeout.”" },
            { do: "“Não sabemos se o pagamento foi registrado. Confira o extrato antes de tentar de novo.”", dont: "Repetir a operação automaticamente depois de um timeout." },
          ]}
        />
      </DocSection>

      <DocSection title="Rótulos e maiúsculas" rule="Só a primeira letra maiúscula. Rótulo é substantivo sem dois-pontos. Marque o opcional, não o obrigatório. Placeholder é exemplo.">
        <Rules
          items={[
            { do: "“Nova fatura”, “E-mail do contato”, “Telefone (opcional)”, placeholder “Ex.: Diretor comercial”.", dont: "“Nova Fatura”, “E-MAIL:”, “Telefone*”, placeholder no lugar do rótulo." },
          ]}
        />
      </DocSection>

      <DocSection title="Números e datas" rule="Sempre pelo lib/format: R$ 1.234,50 · 12,5 % · +12,5 % · há 5 min · 12 set · 12/09/2026. Plural com plural(n, “tarefa”).">
        <Rules items={[{ do: "“3 faturas vencem esta semana · R$ 12,4 mil”.", dont: "“3 fatura(s) vencem · R$12400.00”." }]} />
      </DocSection>
    </DocPage>
  );
}
