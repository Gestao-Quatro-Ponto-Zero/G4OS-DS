# Notas de reunião com IA

- Arquivo: `src/blocks/app-meeting-notes.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-meeting-notes` (`?theme=dark` para o escuro)

Reunião como página do G4 OS: aviso de call detectada, gravação com saúde do áudio (Você · Outros), notas escritas pela pessoa e aprimoradas pela IA com citação do momento, transcrição sincronizada com o áudio e perguntas sobre a reunião.

## Conceito

**Objetivo:** Deixar a pessoa prestar atenção na conversa: ela anota pouco, o app grava com o áudio sob controle e, ao final, a IA completa as notas com a transcrição, sempre mostrando o que foi a pessoa e o que foi a IA, e de onde veio cada frase.

**Padrões aplicados**

- Anatomia G · App de altura total: documento à esquerda, transcrição e áudio à direita (ResizableSplit; no celular a transcrição abre por cima)
- Notas primeiro: durante a call só o editor e a pílula de gravação; nada de transcrição rolando por padrão
- Gravação mostra saúde, não só 'gravando': nível real por faixa e aviso com a ação ('verifique a saída de som')
- Autoria visível: texto da pessoa em tinta, texto da IA em tom suave com marcador dourado e citação '12:04' que leva ao momento
- Sem agenda: gravar começa pela call detectada, por 'Nova reunião' ou dentro de uma página existente

**Quando usar e o que adaptar**

- Entrevistas (ATS): modelo 'Entrevista' e notas por critério
- Discovery de vendas (CRM): modelo 'Vendas' e próximos passos viram tarefas no negócio
- Atendimento e 1:1 de gestão: mesmo fluxo, outro modelo

**Evite**

- Gravar sozinho ao detectar a call (sempre pergunte)
- Misturar texto da IA com o da pessoa sem distinção
- Bullet da IA sem citação do momento
- Pílula de gravação sem nível de áudio (a pessoa só descobre o silêncio no fim)

## Componentes usados

`AiMark`, `AiNotes`, `AiNotesToggle`, `ArtifactCard`, `Button`, `CallDetectedPrompt`, `ChatComposer`, `FilterChip`, `IconButton`, `LiveRecordingIndicator`, `MeetingCard`, `MeetingHeader`, `MeetingPerson`, `MeetingStatus`, `MomentCitation`, `NoteSection`, `Page`, `PageHeading`, `RecordingState`, `ResizableSplit`, `SegmentedControl`, `TemplatePicker`, `TranscriptSpeaker`, `TranscriptTurn`, `TranscriptView`, `findTurnAt`, `notify`
