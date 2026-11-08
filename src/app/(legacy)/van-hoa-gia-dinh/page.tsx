import { redirect } from "next/navigation";

/**
 * DECOMMISSIONED: Legacy 1727-line culture page is replaced by (app)/van-hoa/gia-dinh-van-hoa.
 * Authoritative Sources: ORIGINAL_REQUEST.md §R4, S3-04, Gate G3
 */
export default function LegacyVanHoaGiaDinhPage() {
  redirect("/van-hoa/gia-dinh-van-hoa");
}
