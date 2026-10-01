import type { NextConfig } from "next";

const config: NextConfig = {
  // O DS é publicado como TSX: o Next precisa compilar o pacote.
  transpilePackages: ["@g4os/ds"],
};

export default config;
