import { notFound } from "next/navigation";
import { isDemoAuthEnabled } from "@/lib/auth/demo-mode";
import LegacyDashboardShell from "./legacy-shell";

/**
 * The legacy prototype contains localStorage-only mock people, workflows and
 * integration success messages. It must NEVER render on any deployment.
 * Only explicit local development fixtures may enter this route group.
 */
export default function LegacyDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isDemoAuthEnabled()) notFound();
  return <LegacyDashboardShell>{children}</LegacyDashboardShell>;
}
