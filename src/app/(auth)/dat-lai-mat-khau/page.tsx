import { PasswordRecoveryForm } from "@/features/auth/components/password-recovery-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  // Only a fresh, single-use Supabase Auth code is accepted by the server action.
  // Merely being logged in is never sufficient to change the password here.
  const token = typeof code === "string" && code.length >= 10 && code.length <= 4096
    ? code : null;
  return <main className="flex min-h-screen items-center justify-center bg-[#edf4f4] px-4 py-8">
    <PasswordRecoveryForm code={token}/>
  </main>;
}
