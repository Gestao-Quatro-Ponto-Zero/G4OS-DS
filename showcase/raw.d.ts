declare module "*?raw" {
  const source: string;
  export default source;
}

/** Versão do pacote, injetada por showcase/build.mjs. */
declare const __DS_VERSION__: string;
