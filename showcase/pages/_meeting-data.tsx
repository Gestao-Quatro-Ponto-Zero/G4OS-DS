import { useEffect, useState } from "react";
import type { MeetingPerson, NoteSection, TranscriptSpeaker, TranscriptTurn } from "@g4ai/ds";

/* Dados de exemplo das páginas de Reuniões (uma 1:1 de pipeline de vendas). */

export const me: TranscriptSpeaker = { name: "Você", initials: "JV", kind: "me" };
export const ana: TranscriptSpeaker = { name: "Ana Ribeiro", tint: "#8a5a2b", kind: "other" };
export const bruno: TranscriptSpeaker = { name: "Bruno Carvalho", tint: "#2f5d8a", kind: "other" };
export const camila: TranscriptSpeaker = { name: "Camila Duarte", tint: "#5b4a8a", kind: "other" };
export const people: MeetingPerson[] = [{ name: "João Vitor", initials: "JV" }, ana, bruno, camila];

export const turns: TranscriptTurn[] = [
  { id: "t1", speaker: me, start: 12, text: "A ideia hoje é passar o pipeline do Q4 negócio a negócio e sair com o que precisa destravar." },
  { id: "t2", speaker: ana, start: 31, text: "Temos 2,1 milhões em aberto, 38 negócios. Três estão parados no jurídico há mais de duas semanas." },
  { id: "t3", speaker: camila, start: 80, text: "Os três esbarram na mesma cláusula de multa por rescisão. Padronizando, destrava tudo." },
  { id: "t4", speaker: me, start: 125, text: "Quem puxa isso com o jurídico essa semana?" },
  { id: "t5", speaker: camila, start: 132, text: "Eu falo com a Dra. Paula até quinta." },
  { id: "t6", speaker: bruno, start: 570, text: "O Grupo Vila pediu 18% de desconto para fechar em outubro." },
  { id: "t7", speaker: ana, start: 605, text: "Dá para chegar em 15 se assinarem por 24 meses." },
  { id: "t8", speaker: me, start: 724, text: "Fechado: 15% com contrato de 24 meses. Bruno, você leva a proposta?" },
  { id: "t9", speaker: bruno, start: 740, text: "Levo. Mando até amanhã à tarde." },
];

export const notes: NoteSection[] = [
  {
    id: "pipeline",
    title: "Pipeline do Q4",
    items: [
      { id: "n1", author: "me", text: "2,1 mi em aberto" },
      { id: "n2", author: "ai", text: "38 negócios; três parados no jurídico há mais de duas semanas.", citations: [{ t: 31, turnId: "t2" }] },
      {
        id: "n3",
        author: "me",
        text: "3 travados no jurídico",
        children: [{ id: "n3a", author: "ai", text: "Todos esbarram na cláusula de multa por rescisão: padronizar destrava os três.", citations: [{ t: 80, turnId: "t3" }] }],
      },
    ],
  },
  {
    id: "decisoes",
    title: "Decisões",
    author: "ai",
    items: [{ id: "n4", author: "ai", text: "Grupo Vila: 15 % de desconto com contrato de 24 meses.", citations: [{ t: 724, turnId: "t8" }] }],
  },
  {
    id: "passos",
    title: "Próximos passos",
    author: "ai",
    items: [
      { id: "p1", author: "ai", text: "Padronizar a cláusula de multa", task: { done: false, owner: "Camila · até qui." }, citations: [{ t: 132, turnId: "t5" }] },
      { id: "p2", author: "ai", text: "Enviar a proposta ao Grupo Vila", task: { done: true, owner: "Bruno" }, citations: [{ t: 740, turnId: "t9" }] },
    ],
  },
];

/** WAV mudo de `seconds` (o showcase não carrega áudio real); 4 kHz, 8 bits. */
export function useSilentAudio(seconds: number) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const rate = 4000;
    const n = rate * seconds;
    const buf = new Uint8Array(44 + n).fill(128);
    const v = new DataView(buf.buffer);
    const w = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF");
    v.setUint32(4, 36 + n, true);
    w(8, "WAVEfmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, rate, true);
    v.setUint32(28, rate, true);
    v.setUint16(32, 1, true);
    v.setUint16(34, 8, true);
    w(36, "data");
    v.setUint32(40, n, true);
    const u = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [seconds]);
  return url;
}
