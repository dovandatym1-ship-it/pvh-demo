import { redirect } from "next/navigation";

/**
 * DECOMMISSIONED: Legacy work items page is replaced by production (app)/cong-viec.
 * Authoritative Sources: ORIGINAL_REQUEST.md §R3, D-02, S2-06, Gate G2
 */
export default function LegacyKeHoachCongViecPage() {
  redirect("/cong-viec");
}
