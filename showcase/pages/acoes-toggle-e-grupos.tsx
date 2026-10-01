import { useState } from "react";
import { Bold, ChevronDown, ChevronLeft, ChevronRight, Italic, Minus, Pin, Plus, Star, Underline } from "lucide-react";
import { ActionMenu, Button, ButtonGroup, ButtonGroupText, IconButton, Toggle, formatPercent } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Toggle e grupo de botões",
  group: "Ações e exibição",
  order: 12,
  description: "Toggle é um botão liga/desliga isolado (fixar, favoritar, negrito). ButtonGroup cola botões que formam uma ação composta: anterior | próximo, zoom, salvar | mais opções.",
};

export default function Page() {
  const [pin, setPin] = useState(true);
  const [fav, setFav] = useState(false);
  const [fmt, setFmt] = useState({ b: true, i: false, u: false });
  const [zoom, setZoom] = useState(1);
  const [rec, setRec] = useState(3);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Toggle" rule="outline (padrão): ligado em primary, como o ToggleGroup. quiet: sem borda, ligado em gelo, para barras de ferramenta densas. Só ícone exige label. Vários relacionados com estado próprio: ToggleGroup; preferência com rótulo longo: Switch.">
        <Demo
          className="flex flex-wrap items-center gap-6"
          code={`<Toggle pressed={pin} onPressedChange={setPin}><Pin /> Fixado</Toggle>
<Toggle pressed={fav} onPressedChange={setFav} label="Favoritar"><Star /></Toggle>
<Toggle variant="quiet" pressed={bold} onPressedChange={setBold} label="Negrito"><Bold /></Toggle>`}
        >
          <Toggle pressed={pin} onPressedChange={setPin}>
            <Pin aria-hidden /> {pin ? "Fixado" : "Fixar"}
          </Toggle>
          <Toggle pressed={fav} onPressedChange={setFav} label="Favoritar">
            <Star aria-hidden />
          </Toggle>
          <div className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5">
            <Toggle variant="quiet" size="sm" pressed={fmt.b} onPressedChange={(b) => setFmt({ ...fmt, b })} label="Negrito">
              <Bold aria-hidden />
            </Toggle>
            <Toggle variant="quiet" size="sm" pressed={fmt.i} onPressedChange={(i) => setFmt({ ...fmt, i })} label="Itálico">
              <Italic aria-hidden />
            </Toggle>
            <Toggle variant="quiet" size="sm" pressed={fmt.u} onPressedChange={(u) => setFmt({ ...fmt, u })} label="Sublinhado">
              <Underline aria-hidden />
            </Toggle>
          </div>
          <Toggle pressed={false} onPressedChange={() => undefined} disabled>
            Desativado
          </Toggle>
        </Demo>
      </DocSection>

      <DocSection title="ButtonGroup" rule="Filhos colados com uma borda só. Aceita Button, IconButton e ButtonGroupText. Dê um label ao grupo. Escolher um entre vários (Lista | Quadro): SegmentedControl; ação principal + variações: SplitButton.">
        <Demo
          className="flex flex-wrap items-center gap-6"
          code={`<ButtonGroup label="Navegar entre registros">
  <IconButton label="Anterior"><ChevronLeft /></IconButton>
  <ButtonGroupText>3 de 48</ButtonGroupText>
  <IconButton label="Próximo"><ChevronRight /></IconButton>
</ButtonGroup>

<ButtonGroup label="Zoom">
  <Button variant="ghost" size="sm" onClick={menos}><Minus /></Button>
  <ButtonGroupText>{formatPercent(zoom)}</ButtonGroupText>
  <Button variant="ghost" size="sm" onClick={mais}><Plus /></Button>
</ButtonGroup>`}
        >
          <ButtonGroup label="Navegar entre registros">
            <IconButton label="Registro anterior" disabled={rec <= 1} onClick={() => setRec((r) => r - 1)}>
              <ChevronLeft />
            </IconButton>
            <ButtonGroupText>{rec} de 48</ButtonGroupText>
            <IconButton label="Próximo registro" disabled={rec >= 48} onClick={() => setRec((r) => r + 1)}>
              <ChevronRight />
            </IconButton>
          </ButtonGroup>
          <ButtonGroup label="Zoom">
            <Button variant="ghost" size="sm" aria-label="Diminuir zoom" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
              <Minus />
            </Button>
            <ButtonGroupText>{formatPercent(zoom)}</ButtonGroupText>
            <Button variant="ghost" size="sm" aria-label="Aumentar zoom" disabled={zoom >= 2} onClick={() => setZoom((z) => Math.min(2, z + 0.25))}>
              <Plus />
            </Button>
          </ButtonGroup>
          <ButtonGroup label="Período">
            <Button variant="ghost" size="sm">
              Hoje
            </Button>
            <Button variant="ghost" size="sm">
              7 dias
            </Button>
            <Button variant="ghost" size="sm">
              30 dias
            </Button>
          </ButtonGroup>
          <ButtonGroup label="Salvar">
            <Button size="sm">Salvar rascunho</Button>
            <ActionMenu
              label="Mais opções de salvar"
              variant="primary"
              className="border-l border-on-primary/25 px-2"
              actions={[
                { label: "Salvar e enviar para aprovação", onSelect: () => undefined },
                { label: "Salvar como modelo", onSelect: () => undefined },
              ]}
              trigger={<ChevronDown aria-hidden className="h-4 w-4" />}
            />
          </ButtonGroup>
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Toggle mostra o estado (aria-pressed) e, com texto, troca a palavra (Fixar → Fixado).", dont: "Toggle para disparar uma ação (isso é Button)." },
            { do: "ButtonGroup para ações que andam juntas, no máximo 4 segmentos.", dont: "ButtonGroup como abas ou filtro de visualização (SegmentedControl)." },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["Toggle · pressed / onPressedChange", "boolean / (p) => void", "—", "Estado controlado."],
            ["Toggle · variant", '"outline" | "quiet"', '"outline"', "Com borda (primary ligado) ou sem borda (gelo ligado)."],
            ["Toggle · label", "string", "—", "Obrigatório quando só ícone."],
            ["ButtonGroup · label", "string", "—", "Nome acessível do grupo."],
            ["ButtonGroup · orientation", '"horizontal" | "vertical"', '"horizontal"', "Empilha na vertical."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
