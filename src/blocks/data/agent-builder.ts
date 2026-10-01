/*
 * Dados do construtor de agentes (Agente G4). Troque pela sua API: agente,
 * gatilhos, ferramentas, saídas e instruções (HTML do editor).
 */

// ds-audit-ignore-start hex-color: cores de marca dos apps (identidade de terceiros)
export const apps = {
  slack: { name: "Slack", color: "#4a154b" },
  linear: { name: "Linear", color: "#5e6ad2" },
  reddit: { name: "Reddit", color: "#ff4500" },
  firecrawl: { name: "Firecrawl", color: "#f97316" },
  linkedin: { name: "LinkedIn", color: "#0a66c2" },
  gdrive: { name: "Google Drive", color: "#1fa463" },
  notion: { name: "Notion", color: "#37352f" },
  hubspot: { name: "HubSpot", color: "#ff7a59" },
  sheets: { name: "Planilhas", color: "#188038" },
  g4crm: { name: "Acme CRM", color: "#184560" },
} as const;
// ds-audit-ignore-end
export type AppId = keyof typeof apps;

export type Trigger = { id: string; app: AppId; text: string };
export type Prop = { id: string; app?: AppId; label: string };

export const agent = {
  id: "social-posts",
  name: "Criador automático de posts",
  description: "Publique um artigo no blog e receba rascunhos de LinkedIn, X e Reddit prontos para revisão.",
  status: "rascunho" as const,
};

export const initialTriggers: Trigger[] = [
  { id: "t1", app: "slack", text: "Qualquer mensagem de qualquer pessoa em #blog-publicado" },
  { id: "t2", app: "linear", text: "Nova issue criada com o rótulo “post”" },
];

export const triggerOptions: Trigger[] = [
  { id: "t3", app: "notion", text: "Página publicada no banco “Blog”" },
  { id: "t4", app: "gdrive", text: "Novo arquivo na pasta “Artigos aprovados”" },
  { id: "t5", app: "hubspot", text: "Post do blog publicado no HubSpot" },
];

export const initialTools: Prop[] = [
  { id: "reddit", app: "reddit", label: "Reddit" },
  { id: "firecrawl", app: "firecrawl", label: "Firecrawl" },
];
export const toolOptions: Prop[] = [
  { id: "linkedin", app: "linkedin", label: "LinkedIn" },
  { id: "notion", app: "notion", label: "Notion" },
  { id: "g4crm", app: "g4crm", label: "Acme CRM" },
];
export const initialOutputs: Prop[] = [{ id: "draft", label: "Rascunho de posts" }];
export const outputOptions: Prop[] = [
  { id: "sheet", app: "sheets", label: "Planilha de calendário" },
  { id: "slack-msg", app: "slack", label: "Mensagem no #marketing" },
];
export const initialInputs: Prop[] = [{ id: "url", label: "URL do artigo" }];
export const initialChecks: Prop[] = [{ id: "tone", label: "Tom da marca (guia de voz)" }];

export const initialInstructions = `<h2>Passos</h2>
<ol>
<li>Ingerir o novo post:
<ol>
<li>Buscar o artigo completo: título, corpo, autor, data, imagem de capa e link canônico.</li>
<li>Extrair as 3 ideias principais e 1 dado que surpreende.</li>
</ol>
</li>
<li>Escrever um rascunho por rede:
<ul>
<li><strong>LinkedIn</strong>: até 1.300 caracteres, abre com o dado, fecha com pergunta.</li>
<li><strong>X</strong>: fio de 4 posts, sem hashtag no meio do texto.</li>
<li><strong>Reddit</strong>: tom de conversa; só em comunidades onde o tema é permitido.</li>
</ul>
</li>
<li>Verificar o tom contra o guia de voz e marcar o que precisa de revisão humana.</li>
</ol>
<ul data-checklist="">
<li data-checked="">Nunca publicar sem aprovação.</li>
<li>Citar a fonte com link em todo post.</li>
</ul>`;

export const enhancedInstructions = `${initialInstructions}
<h2>Critérios de qualidade</h2>
<ul>
<li>Cada rascunho cita pelo menos um número do artigo.</li>
<li>Nada de promessas (“o melhor”, “garantido”).</li>
<li>Se o artigo tiver menos de 400 palavras, avisar em vez de escrever.</li>
</ul>`;

export const chatIntro = {
  user: "Quero um agente que, sempre que publicarmos um artigo no blog, gere rascunhos para LinkedIn, X e Reddit no tom da marca e me peça aprovação antes de publicar.",
  answer: [
    "O agente está pronto como rascunho. Montei assim:",
    "Ele roda quando alguém posta em #blog-publicado no Slack ou quando uma issue com o rótulo “post” é criada no Linear. Usa Firecrawl para ler o artigo e Reddit para conferir as regras de cada comunidade.",
    "A saída é um documento “Rascunho de posts” com uma versão por rede, já checada contra o guia de voz. Nada é publicado sem a sua aprovação.",
    "Quer que eu ajuste o tom, troque alguma rede ou teste com o último artigo publicado?",
  ],
};
