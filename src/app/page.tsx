import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/auth/request-context";
import { preferredLandingRoute } from "@/config/navigation";

export default async function Home() {
  let ctx: Awaited<ReturnType<typeof getRequestContext>>;
  try {
    ctx = await getRequestContext();
  } catch {
    redirect("/login");
  }
  redirect(preferredLandingRoute(ctx.permissions, ctx.roles));
}
