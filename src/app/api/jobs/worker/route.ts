import { NextRequest, NextResponse } from "next/server";
import { jobWorker } from "@/lib/jobs/job-worker";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  // In production, CRON_SECRET is mandatory; fail-closed if missing.
  // In test/development, allow fallback to test secret only when in test or dev.
  const expectedSecret =
    process.env.CRON_SECRET ||
    (!isProduction ? process.env.TEST_CRON_SECRET || "demo-cron-secret-2026" : undefined);

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Server Configuration Error: CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or invalid CRON_SECRET authorization header" },
      { status: 401 }
    );
  }

  const result = await jobWorker.processNextJob("api-worker-endpoint");
  return NextResponse.json({ success: true, result });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
