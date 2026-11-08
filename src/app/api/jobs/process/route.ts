import { NextRequest, NextResponse } from "next/server";
import { jobWorker } from "@/lib/jobs/job-worker";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET || "demo-cron-secret-2026";

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or invalid CRON_SECRET authorization header" },
      { status: 401 }
    );
  }

  const result = await jobWorker.processNextJob("api-cron-worker");
  return NextResponse.json({ success: true, result });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
