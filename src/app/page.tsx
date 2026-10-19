"use client";

import { useState } from "react";
import type { CheckResult, ScoreItem } from "@/lib/checkTarget";

/* ── 동안기획 Design Tokens ── */
const C = {
  ink: "#171717",
  ink2: "#666B67",
  bg: "#FFFFFF",
  bgOff: "#F5F3EE",
  bgDark: "#232522",
  green: "#09BF41",
  greenDeep: "#067A21",
  line: "rgba(23,23,23,0.12)",
  line2: "rgba(23,23,23,0.22)",
  soft: "rgba(23,23,23,0.04)",
  white: "#FFFFFF",
  media: "#191B1E",
  veil: "rgba(20,21,20,0.58)",
};

const R = { sm: 8, md: 12, sheet: 18, pill: 999 };

const SERIF = "'Shippori Mincho B1', serif";

/* ── Score Card ── */
function ScoreCard({ item }: { item: ScoreItem }) {
  const ok = item.earned >= item.max;
  const partial = item.earned > 0 && !ok;

  const badgeBg = ok
    ? "rgba(9,191,65,0.10)"
    : partial
      ? "rgba(161,102,43,0.10)"
      : "rgba(163,57,44,0.08)";
  const badgeColor = ok ? C.greenDeep : partial ? "#8B6914" : "#a3392c";
  const badgeBorder = ok
    ? "rgba(9,191,65,0.20)"
    : partial
      ? "rgba(161,102,43,0.18)"
      : "rgba(163,57,44,0.15)";

  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.line}`,
        borderRadius: R.md,
        padding: "24px 26px",
        marginBottom: 16,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = C.line2;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = C.line;
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: C.ink,
            letterSpacing: "-0.01em",
          }}
        >
          {item.label}
        </h3>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            padding: "5px 12px",
            borderRadius: R.pill,
            background: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeBorder}`,
            letterSpacing: "0.02em",
          }}
        >
          {item.earned}/{item.max}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: item.recommendation ? 14 : 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.ink2,
            minWidth: 36,
            paddingTop: 2,
            flexShrink: 0,
            letterSpacing: "0.04em",
          }}
        >
          상태
        </span>
        <p
          style={{
            fontSize: 14,
            color: C.ink,
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          {item.status}
        </p>
      </div>

      {item.recommendation && (
        <div
          style={{
            display: "flex",
            gap: 12,
            paddingTop: 14,
            borderTop: `1px dashed ${C.line}`,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.greenDeep,
              minWidth: 36,
              paddingTop: 2,
              flexShrink: 0,
              letterSpacing: "0.04em",
            }}
          >
            권장
          </span>
          <p
            style={{
              fontSize: 14,
              color: C.ink2,
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            {item.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Grade Badge ── */
function GradeBadge({ grade }: { grade: string }) {
  const isGood = grade === "양호";
  const isMid = grade === "보통";
  const bg = isGood
    ? "rgba(9,191,65,0.15)"
    : isMid
      ? "rgba(255,200,50,0.18)"
      : "rgba(255,80,60,0.15)";
  const color = isGood ? "#09BF41" : isMid ? "#D4A017" : "#FF5040";
  const border = isGood
    ? "rgba(9,191,65,0.3)"
    : isMid
      ? "rgba(255,200,50,0.35)"
      : "rgba(255,80,60,0.3)";

  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 14,
        fontWeight: 800,
        padding: "6px 18px",
        borderRadius: R.pill,
        background: bg,
        color,
        border: `1px solid ${border}`,
        letterSpacing: "0.03em",
      }}
    >
      {grade}
    </span>
  );
}

/* ── Main Page ── */
export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [btnHover, setBtnHover] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let targetUrl = url.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
      }
      const res = await fetch(
        `/api/check?url=${encodeURIComponent(targetUrl)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "확인할 수 없습니다.");
      } else {
        setResult(data);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── GNB Header ── */}
      <header
        style={{
          width: "100%",
          background: C.bgDark,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "18px 0",
          borderBottom: `1px solid rgba(255,255,255,0.08)`,
        }}
      >
        <img
          src="https://cdn.imweb.me/thumbnail/20260812/b41d06dcd8e8a.png"
          alt="동안기획 로고"
          style={{ height: 36, display: "block" }}
        />
      </header>

      {/* ── Hero Section ── */}
      <section
        style={{
          background: C.bg,
          padding: "80px 20px 64px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Eyebrow bar + label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <span
              style={{
                display: "block",
                width: 56,
                height: 2,
                background: C.green,
                borderRadius: 1,
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: C.greenDeep,
                textTransform: "uppercase" as const,
              }}
            >
              AEO &middot; GEO Technical Check
            </span>
            <span
              style={{
                display: "block",
                width: 56,
                height: 2,
                background: C.green,
                borderRadius: 1,
              }}
            />
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 42px)",
              fontWeight: 800,
              margin: "0 0 18px 0",
              color: C.ink,
              lineHeight: 1.3,
              letterSpacing: "-0.025em",
            }}
          >
            우리 사이트,{" "}
            <span style={{ color: C.green }}>AI검색</span>에<br />
            잘 노출되고 있을까요?
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: "clamp(14px, 1.8vw, 18px)",
              color: C.ink2,
              lineHeight: 1.8,
              margin: "0 auto",
              maxWidth: 580,
            }}
          >
            ChatGPT, 퍼플렉시티, 구글AI, 제미나이 등
            <br />
            AI 답변엔진이 우리 사이트를 잘 읽고 인용할 수 있는 준비가
            <br />
            되어있는지 핵심요소를 기준으로{" "}
            <strong style={{ color: C.ink, fontWeight: 700 }}>
              무료로 확인
            </strong>
            해드립니다.
          </p>
        </div>
      </section>

      {/* ── Form Section ── */}
      <section
        style={{
          background: C.bgOff,
          padding: "48px 20px",
          borderTop: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <form
          onSubmit={handleCheck}
          style={{
            display: "flex",
            gap: 12,
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          <input
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
            style={{
              flex: 1,
              padding: "0 20px",
              height: 54,
              fontSize: 15,
              fontWeight: 500,
              border: `1px solid ${C.line2}`,
              borderRadius: R.sm,
              outline: "none",
              background: C.bg,
              color: C.ink,
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.green;
              e.currentTarget.style.boxShadow = `0 0 0 3px rgba(9,191,65,0.12)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.line2;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              height: 54,
              minWidth: 160,
              padding: "0 30px",
              fontSize: 14.5,
              fontWeight: 700,
              color: loading
                ? C.ink2
                : btnHover && !loading
                  ? C.ink
                  : C.white,
              background: loading
                ? C.soft
                : btnHover
                  ? C.green
                  : C.ink,
              border: "none",
              borderRadius: R.sm,
              cursor: loading ? "default" : "pointer",
              whiteSpace: "nowrap" as const,
              letterSpacing: "-0.01em",
              transition:
                "background 0.25s ease, color 0.25s ease, transform 0.15s ease",
              transform:
                btnHover && !loading ? "translateY(-1px)" : "translateY(0)",
            }}
          >
            {loading ? "확인 중..." : "무료로 확인하기"}
          </button>
        </form>
      </section>

      {/* ── Results ── */}
      <main
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "0 20px 80px",
          color: C.ink,
        }}
      >
        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(163,57,44,0.06)",
              color: "#a3392c",
              padding: "16px 20px",
              borderRadius: R.sm,
              marginTop: 32,
              fontSize: 14,
              border: "1px solid rgba(163,57,44,0.12)",
              lineHeight: 1.6,
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div style={{ paddingTop: 48 }}>
            {/* ── Score Summary Card ── */}
            <div
              style={{
                background: C.bgDark,
                borderRadius: R.sheet,
                padding: "44px 32px 40px",
                marginBottom: 36,
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative gradient */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 400,
                  height: 3,
                  background: `linear-gradient(90deg, transparent, ${C.green}, transparent)`,
                  borderRadius: "0 0 2px 2px",
                }}
              />

              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.02em",
                }}
              >
                {result.targetUrl}
              </p>

              <p
                style={{
                  margin: "0 0 2px 0",
                  fontSize: "clamp(40px, 6vw, 64px)",
                  fontWeight: 800,
                  color: C.white,
                  fontFamily: SERIF,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                {result.score.total}
                <span
                  style={{
                    fontSize: "clamp(18px, 2.5vw, 24px)",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.5)",
                    marginLeft: 4,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  / 100
                </span>
              </p>

              <div style={{ marginTop: 16 }}>
                <GradeBadge grade={result.score.grade} />
              </div>
            </div>

            {/* ── Breakdown Header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  display: "block",
                  width: 24,
                  height: 2,
                  background: C.green,
                  borderRadius: 1,
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.ink2,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                }}
              >
                항목별 진단 결과
              </span>
            </div>

            <p
              style={{
                fontSize: 14,
                color: C.ink2,
                margin: "0 0 24px 0",
                lineHeight: 1.7,
              }}
            >
              아래 {result.score.breakdown.length}개 항목의 배점 합계가
              총점입니다. 각 항목의 &ldquo;상태&rdquo;는 지금 확인된 사실이고,
              &ldquo;권장&rdquo;은 만점이 아닐 때만 표시되는 개선 방법입니다.
            </p>

            {/* ── Score Cards ── */}
            {result.score.breakdown.map((item) => (
              <ScoreCard key={item.key} item={item} />
            ))}

            {/* ── Warnings ── */}
            {result.errors.length > 0 && (
              <p
                style={{
                  fontSize: 13,
                  color: "#8B6914",
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                참고: {result.errors.join(" / ")}
              </p>
            )}

            {/* ── CTA Card ── */}
            <div
              style={{
                marginTop: 48,
                padding: "40px 32px",
                background: C.bgOff,
                borderRadius: R.sheet,
                textAlign: "center",
                border: `1px solid ${C.line}`,
              }}
            >
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  margin: "0 0 10px 0",
                  color: C.ink,
                  letterSpacing: "-0.02em",
                }}
              >
                이 진단은 기술적 체크리스트{" "}
                {result.score.breakdown.length}가지만 확인한 결과입니다.
              </p>
              <p
                style={{
                  fontSize: 15,
                  color: C.ink2,
                  margin: "0 0 28px 0",
                  lineHeight: 1.8,
                }}
              >
                실제로 ChatGPT·Perplexity 등에서 우리 브랜드가 얼마나
                언급되는지,
                <br />
                경쟁사 대비 노출도는 어떤지까지 확인하려면 전문가 진단이
                필요합니다.
              </p>
              <a
                href="https://daplan.com/inquiry"
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 54,
                  padding: "0 36px",
                  background: ctaHover ? C.green : C.ink,
                  color: ctaHover ? C.ink : C.white,
                  borderRadius: R.sm,
                  fontWeight: 700,
                  fontSize: 14.5,
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  transition:
                    "background 0.25s ease, color 0.25s ease, transform 0.15s ease",
                  transform: ctaHover
                    ? "translateY(-1px)"
                    : "translateY(0)",
                }}
              >
                동안기획에 전체 진단 문의하기
                <span style={{ fontSize: 18, lineHeight: 1 }}>&#8594;</span>
              </a>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div
          style={{
            textAlign: "center",
            marginTop: 64,
            paddingTop: 32,
            borderTop: `1px solid ${C.line}`,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: C.ink2,
              margin: 0,
              letterSpacing: "0.01em",
            }}
          >
            본 도구는{" "}
            <a
              href="https://daplan.com"
              style={{
                color: C.greenDeep,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              daplan.com
            </a>
            (동안기획)에서 제공하는 무료 기술 체크 도구입니다.
          </p>
        </div>
      </main>
    </>
  );
}
