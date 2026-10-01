/*
 * Conversa do time + documento em revisão (adequação à LGPD). Troque pela sua API.
 */
import { people } from "./workspace";

const p = (id: string) => {
  const x = people.find((q) => q.id === id)!;
  return { id: x.id, name: x.name, initials: x.initials, tint: x.tint };
};
export const me = p("joana");
export const others = { rafael: p("rafael"), marina: p("marina"), elisa: p("elisa") };

export type TeamMsg = { id: string; author: ReturnType<typeof p>; time: string; text: string; link?: string; day?: string };

export const initialMessages: TeamMsg[] = [
  { id: "m1", day: "11 mar", author: others.rafael, time: "18:40", text: "Subi a primeira versão do documento de adequação. O próximo passo é alinhar as seções aos requisitos da ANPD." },
  { id: "m2", author: me, time: "19:32", text: "Ótimo. Vamos incluir também as bases legais por finalidade e as regras de transparência para o titular." },
  { id: "m3", day: "12 mar", author: me, time: "11:03", text: "Adicionei referências do guia da ANPD sobre agentes de tratamento. Precisamos conferir antes de fechar o documento.", link: "https://www.gov.br/anpd" },
  { id: "m4", author: others.marina, time: "11:04", text: "Parece bom. Vou revisar as seções de segurança e atualizar o processo de resposta a incidentes." },
];

export const replies = [
  "Combinado. Assim que o RIPD estiver anexado eu marco a revisão jurídica como concluída.",
  "Vi as mudanças na seção de bases legais — ficou bem mais claro.",
  "Só falta o registro das operações de tratamento atualizado (planilha de setembro).",
];

export const doc = {
  kicker: "Política interna · versão 0.3",
  title: "Adequação da Acme à LGPD",
  sections: [
    {
      h: "O que é a LGPD",
      body: [
        "A Lei Geral de Proteção de Dados (Lei 13.709/2018) estabelece regras para a coleta, o uso, o armazenamento e o compartilhamento de dados pessoais por empresas e órgãos públicos no Brasil.",
        "O objetivo é dar ao titular controle sobre os próprios dados, com transparência e segurança, e criar responsabilidades claras para quem trata esses dados.",
      ],
    },
    {
      h: "Escopo",
      body: ["A política se aplica a todos os dados pessoais tratados pela Acme, em especial:"],
      list: ["Clientes e contatos do CRM", "Candidatos em processos seletivos", "Colaboradores e prestadores", "Usuários do produto Atlas", "Fornecedores pessoa física"],
    },
    {
      h: "Requisitos de conformidade",
      body: ["Para operar dentro da LGPD, a Acme precisa manter:"],
      list: [
        "Base legal definida para cada finalidade de tratamento",
        "Aviso de privacidade claro e acessível",
        "Canal de atendimento ao titular com prazo de resposta de 15 dias",
        "Registro das operações de tratamento (ROPA)",
        "Relatório de impacto (RIPD) para tratamentos de alto risco",
        "Plano de resposta a incidentes com comunicação à ANPD",
      ],
    },
    {
      h: "Autoridade e fiscalização",
      body: [
        "A Autoridade Nacional de Proteção de Dados (ANPD) orienta, fiscaliza e aplica sanções. As multas podem chegar a 2 % do faturamento, limitadas a R$ 50 milhões por infração.",
        "Ser transparente e documentar decisões é a melhor defesa: a ANPD avalia boa-fé e medidas adotadas.",
      ],
    },
    {
      h: "Processo de adequação",
      body: ["O trabalho segue quatro etapas, com responsáveis definidos:"],
      list: ["Mapeamento dos dados (Operações)", "Revisão jurídica das bases legais (Jurídico)", "Ajustes de produto e segurança (Tecnologia)", "Treinamento e auditoria contínua (Auditoria interna)"],
    },
  ],
};
