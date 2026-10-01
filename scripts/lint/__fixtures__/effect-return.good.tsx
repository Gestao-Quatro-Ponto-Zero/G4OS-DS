import { useEffect, useState } from "react";
declare const store: { subscribe: (f: () => void) => () => void };
export function A({ name }: { name: string }) {
  const [draft, setDraft] = useState(name);
  useEffect(() => setDraft(name), [name]);
  useEffect(() => store.subscribe(() => {}), []);
  useEffect(() => {
    void fetch("/api");
  }, []);
  useEffect(() => () => console.log("limpa"), []);
  return draft;
}
