import { NextRequest, NextResponse } from "next/server";
import { runCheck, validateTargetUrl } from "@/lib/checkTarget";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
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
