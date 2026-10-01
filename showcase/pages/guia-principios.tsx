import { Download, MoreHorizontal, Plus } from "lucide-react";
import { Badge, Button, Callout, Delta, Dot, Empty, IconButton, KpiCard, StatusLabel, formatCurrency } from "@g4os/ds";
import { DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Princípios e regras",
  group: "Começar",
  order: 1,
  description: "As decisões que fazem um CRM, um ATS e um ERP parecerem da mesma família. Valem para qualquer tela nova.",
};

function Frame({ children, tone }: { children: React.ReactNode; tone: "do" | "dont" }) {
  return (
    <div className={tone === "do" ? "rounded-xl border border-ok/20 p-1" : "rounded-xl border border-rose/20 p-1"}>
      <div className="flex min-h-[92px] flex-wrap items-center gap-3 rounded-lg bg-surface p-4">{children}</div>
      <p className={tone === "do" ? "m-0 px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ok" : "m-0 px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-rose"}>
        {tone === "do" ? "Faça" : "Evite"}
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="1. Branco, gelo e tinta" rule="A interface é neutra. A ação principal e a seleção usam tinta escura (ink), não cor de marca. Cor aparece só quando carrega significado.">
        <div className="grid gap-3 md:grid-cols-2">
          <Frame tone="do">
            <Button>
              <Plus /> Novo negócio
            </Button>
            <Button variant="ghost">
              <Download /> Exportar
            </Button>
            <IconButton label="Mais ações">
              <MoreHorizontal />
            </IconButton>
          </Frame>
          <Frame tone="dont">
            <button type="button" className="rounded-full bg-accent px-4 py-2 text-[13.5px] font-medium text-on-ink">Novo negócio</button>
            <button type="button" className="rounded-full bg-blue px-4 py-2 text-[13.5px] font-medium text-on-ink">Exportar</button>
            <button type="button" className="rounded-full bg-clay px-4 py-2 text-[13.5px] font-medium text-white">Mais</button>
          </Frame>
        </div>
      </DocSection>

      <DocSection title="2. Um primário por área" rule="Cada área (cabeçalho, card, modal, formulário) tem no máximo uma ação primária. O resto é ghost ou vai para o menu ⋯. Destrutivo só dentro de uma confirmação.">
        <Rules
          items={[
            { do: "“Criar vaga” em ink; “Importar” em ghost; “Arquivar”, “Duplicar” e “Excluir” no menu ⋯.", dont: "Três botões pretos lado a lado, ou um botão vermelho “Excluir” solto na tela." },
          ]}
        />
      </DocSection>

      <DocSection title="3. Cor sempre com palavra" rule="Status é ponto + texto. Badge neutro é o padrão; tom só na exceção que pede leitura. Número bom não grita.">
        <div className="grid gap-3 md:grid-cols-2">
          <Frame tone="do">
            <StatusLabel status="active" label="Em negociação" />
            <StatusLabel status="done" label="Ganho" />
            <Badge tone="bad">Vencida há 3 d</Badge>
            <Badge>Rascunho</Badge>
          </Frame>
          <Frame tone="dont">
            <Dot tone="ok" />
            <Dot tone="warn" />
            <Dot tone="bad" />
            <Badge tone="ok">Ativo</Badge>
            <Badge tone="ok">Ativo</Badge>
            <Badge tone="ok">Ativo</Badge>
          </Frame>
        </div>
      </DocSection>

      <DocSection title="4. Número com contexto" rule="Todo indicador tem unidade, comparação e período. O delta sabe se subir é bom (custo, churn e prazo sobem = ruim).">
        <div className="grid gap-3 md:grid-cols-2">
          <Frame tone="do">
            <div className="w-full">
              <KpiCard label="Tempo até contratação" value="31 dias" delta={0.12} goodWhen="down" period="vs. trimestre anterior" />
            </div>
          </Frame>
          <Frame tone="dont">
            <div className="w-full rounded-xl border border-line px-4 py-3">
              <div className="text-[12.5px] text-muted">Tempo</div>
              <div className="text-[24px] font-semibold text-ok">31 ↑12%</div>
            </div>
          </Frame>
        </div>
      </DocSection>

      <DocSection title="5. Controle só quando há o que controlar" rule="Busca a partir de 12 itens, filtros a partir de 8, alternador de visualização a partir de 8. Abaixo disso, a lista é a lista.">
        <Rules items={[{ do: "Lista de 5 contatos sem toolbar; lista de 300 com busca, filtros, paginação.", dont: "Busca, 3 filtros, alternador e densidade em cima de uma lista de 4 itens." }]} />
      </DocSection>

      <DocSection title="6. Superfície certa para cada tarefa" rule="Página para entidade com identidade; drawer para editar sem perder a lista; modal para decisão curta; confirmação para o irreversível; menu ⋯ para ações secundárias; inline para um campo.">
        <Rules
          items={[
            { do: "Clicar num candidato abre a página dele; “Agendar entrevista” abre um drawer; “Reprovar” abre um modal com motivo.", dont: "Drawer que abre outro drawer; window.confirm; select nativo; formulário longo em modal com rolagem." },
          ]}
        />
      </DocSection>

      <DocSection title="7. Todo dado tem cinco estados" rule="Carregando (esqueleto com a forma final), vazio de verdade (próxima ação), vazio por filtro (limpar), erro (com saída) e com dados.">
        <div className="grid gap-3 md:grid-cols-2">
          <Empty title="Nenhuma vaga aberta" hint="Crie a primeira vaga ou importe de outro ATS." action={<Button size="sm"><Plus /> Criar vaga</Button>} />
          <Callout tone="bad" title="Não foi possível carregar as faturas" action={<Button size="sm" variant="ghost">Tentar de novo</Button>}>
            O banco não respondeu. Seus filtros foram mantidos.
          </Callout>
        </div>
      </DocSection>

      <DocSection title="8. Feedback depois, não antes" rule="Enquanto executa, o botão informa (“Salvando…”). Toast só quando terminou, com “Desfazer” se for reversível. Prefira desfazer a confirmar.">
        <Rules items={[{ do: "“Fatura marcada como paga · Desfazer”.", dont: "“Tem certeza?” antes de uma ação reversível, ou “Salvo com sucesso!” no clique, antes do servidor responder." }]} />
      </DocSection>

      <DocSection title="9. Uma camada, uma pergunta" rule="A trilha mostra só ancestrais; a página de registro não herda o cabeçalho do pai; cada informação tem uma casa. Conteúdo útil começa cedo na tela.">
        <Rules items={[{ do: "Negócio: barra “Acme › Negócios” + título + etapa. Empresa, abas e equipe ficam na página da empresa.", dont: "Nome da empresa na trilha, no título e no subtítulo; abas da empresa repetidas dentro do negócio." }]} />
      </DocSection>

      <DocSection title="10. Português claro e números brasileiros" rule="Verbo + objeto nos botões, sem exclamação, sem jargão. Moeda, data e porcentagem pelo lib/format.">
        <div className="grid gap-3 md:grid-cols-2">
          <Frame tone="do">
            <Button size="sm">Emitir nota fiscal</Button>
            <span className="text-[13.5px] tabular-nums">{formatCurrency(1234.5)}</span>
            <Delta value={-0.021} />
          </Frame>
          <Frame tone="dont">
            <Button size="sm">OK</Button>
            <span className="text-[13.5px]">R$1234.5</span>
            <span className="text-[13.5px]">-2.1%</span>
          </Frame>
        </div>
      </DocSection>
    </DocPage>
  );
}
