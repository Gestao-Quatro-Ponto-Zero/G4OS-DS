import { Bell, Building2, CreditCard, Database, History, KeyRound, Palette, Plug, ShieldCheck, User, Users, Webhook } from "lucide-react";
import type { ReactNode } from "react";
import { Page, SettingsLayout, type SettingsNavItem } from "@g4ai/ds";
import { AtlasShell, atlasRoutes } from "./atlas-shell";
import { frameHref } from "./frame-route";

/*
 * Configurações do Atlas: casca do produto + SettingsLayout com as 12 seções.
 * Cada seção é uma tela (bloco) própria.
 */

export const settingsNav: SettingsNavItem[] = [
  { href: frameHref("settings-profile"), label: "Perfil", icon: User },
  { href: frameHref("settings-organization"), label: "Organização", icon: Building2 },
  { href: frameHref("settings-appearance"), label: "Aparência", icon: Palette },
  { href: frameHref("settings-notifications"), label: "Notificações", icon: Bell },
  { href: frameHref("settings-security"), label: "Segurança", icon: KeyRound },
  { href: frameHref("settings-team"), label: "Equipe", icon: Users },
  { href: frameHref("settings-roles"), label: "Papéis e permissões", icon: ShieldCheck },
  { href: frameHref("settings-billing"), label: "Plano e cobrança", icon: CreditCard },
  { href: frameHref("settings-integrations"), label: "Integrações", icon: Plug },
  { href: frameHref("settings-webhooks"), label: "Webhooks", icon: Webhook },
  { href: frameHref("settings-data"), label: "Dados e privacidade", icon: Database },
  { href: frameHref("settings-audit-log"), label: "Auditoria", icon: History },
];

export function SettingsShell({
  slug,
  title,
  description,
  actions,
  children,
}: {
  /** slug do bloco atual (ex.: "settings-team"). */
  slug: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AtlasShell current={atlasRoutes.settings}>
      <Page>
        <SettingsLayout nav={settingsNav} current={frameHref(slug)} title={title} description={description} actions={actions}>
          {children}
        </SettingsLayout>
      </Page>
    </AtlasShell>
  );
}
