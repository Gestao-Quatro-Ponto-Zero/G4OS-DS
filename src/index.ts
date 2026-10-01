/**
 * @g4ai/ds — Design system para construir qualquer produto G4 OS (CRM, ATS, ERP, financeiro, portais).
 * Importe os estilos uma vez: `@import "@g4ai/ds/styles.css";` no seu CSS global.
 */
export * from "./components/primitives";
export * from "./components/overlays";
export * from "./components/forms";
export * from "./components/navigation";
export * from "./components/collections";
export * from "./components/feedback";
export * from "./components/status";
export * from "./components/date-picker";
export * from "./components/layout";
export * from "./components/charts";
export * from "./components/dashboard";
export * from "./components/data";
export * from "./components/pipeline";
export { cn } from "./lib/cn";
export { usePortalContainer } from "./lib/portal";
export * from "./lib/text";
export * from "./lib/format";
export * from "./lib/theme";
export * from "./lib/color";
export * from "./components/theme";
export * as tokens from "./tokens";
export * from "./components/inputs";
export * from "./components/charts-advanced";
export * from "./components/states";
export * from "./components/overlays-extra";
export * from "./components/disclosure";
export * from "./components/media";
export * from "./components/ai";
export * from "./components/interactive";
export * from "./components/filters";
export * from "./components/search";
export * from "./components/charts-extra";
export * from "./components/charts-shapes";
export * from "./components/dates";
export * from "./lib/dates";
export * from "./components/data-grid";
export * from "./components/ai-workspace";
export * from "./components/ai-sessions";
export * from "./components/brand";
export * from "./components/connections";
export * from "./components/email-compose";
export * from "./components/tags";
export * from "./components/rich-text";
export * from "./components/agent-builder";
export * from "./components/tasks-ai";
export * from "./components/record-panel";
export * from "./components/collab";
export * from "./components/ai-layout";
// front W: paridade com shadcn/ui (Separator, ScrollArea, Label, FieldSet, Item, Table, Prose, Toggle, ButtonGroup, InputGroup, ColorPicker, NavigationMenu, SortableList, Questionnaire; Menubar fica em overlays-extra)
export * from "./components/structure";
export * from "./components/controls";
export * from "./components/navigation-extra";
export * from "./components/sortable";
export * from "./components/questionnaire";
// front X: visão de dados (useDataView, useUrlState)
export * from "./components/data-view";
// front Y
export { Announcement, AudioPlayer, FormWizard, InlineSelect, NotificationCenter, SaveBar, Tour, useTour } from "./components/flow";
export type { InlineOption, NotificationItem, TourStep, WizardStep } from "./components/flow";
export { effectiveBackground, surfaceTone, useReadableFills } from "./lib/readable";
// front AA: paridade de recursos com shadcn/ui base (Attachment, Command componível, Bubble, Marker, MessageScroller)
export * from "./components/attachment";
export * from "./components/command";
export * from "./components/conversation";
