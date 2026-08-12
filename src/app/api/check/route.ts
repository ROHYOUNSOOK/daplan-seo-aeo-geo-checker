import { NextRequest, NextResponse } from "next/server";
import { runCheck, validateTargetUrl } from "@/lib/checkTarget";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rateResult = checkRateLimit(ip);
  if (rateResult.blocked) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. 약 ${rateResult.remainingMin}분 후에 다시 시도해주세요.` },
      { status: 429 }
    );
  }

  const target = req.nextUrl.searchParams.get("url") || "";
  const validated = validateTargetUrl(target);

  if (!validated.ok) {
    return NextResponse.json({ error: validated.reason }, { status: 400 });
  }

  try {
    const result = await runCheck(validated.url);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: "진단 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
