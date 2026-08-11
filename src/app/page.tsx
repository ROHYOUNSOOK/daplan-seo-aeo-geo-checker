"use client";

import { useState } from "react";
import type { CheckResult, ScoreItem } from "@/lib/checkTarget";

const NAVY = "#1a3a5c";

function ScoreCard({ item }: { item: ScoreItem }) {
  const ok = item.earned >= item.max;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e2e2",
        borderRadius: 10,
        padding: "20px 22px",
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: NAVY }}>{item.label}</h3>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: 999,
            background: ok ? "#e3eee9" : item.earned > 0 ? "#f3e6d3" : "#f4e0da",
            color: ok ? "#164f46" : item.earned > 0 ? "#a1662b" : "#a3392c",
          }}
        >
          {item.earned}/{item.max}점
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: item.recommendation ? 10 : 0 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#888",
            minWidth: 40,
            paddingTop: 2,
            flexShrink: 0,
          }}
        >
          상태
        </span>
        <p style={{ fontSize: 14, color: "#333", margin: 0, lineHeight: 1.6 }}>{item.status}</p>
      </div>

      {item.recommendation && (
        <div style={{ display: "flex", gap: 10, paddingTop: 10, borderTop: "1px dashed #e5e5e5" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#a1662b",
              minWidth: 40,
              paddingTop: 2,
              flexShrink: 0,
            }}
          >
            권장
          </span>
          <p style={{ fontSize: 14, color: "#a1662b", margin: 0, lineHeight: 1.6 }}>{item.recommendation}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/check?url=${encodeURIComponent(url)}`);
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
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "56px 20px 80px",
        color: "#222",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: NAVY,
            textTransform: "uppercase",
            margin: "0 0 10px 0",
          }}
        >
          AEO · GEO Technical Check
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 12px 0" }}>
          우리 사이트, AI검색에 잘 노출되고있을까요?
        </h1>
        <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7, margin: 0 }}>
          ChatGPT, 퍼플렉시티, 구글AI, 제미나이 등 AI 답변엔진이 우리 사이트를 잘 읽고 인용할 수 있는 준비가
          되어있는지 핵심요소를 기준으로 무료로 확인해드립니다.
        </p>
      </div>

      <form onSubmit={handleCheck} style={{ display: "flex", gap: 10, marginBottom: 32 }}>
        <input
          type="text"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          style={{
            flex: 1,
            padding: "14px 16px",
            fontSize: 15,
            border: "1px solid #ccc",
            borderRadius: 8,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "14px 24px",
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            background: loading ? "#7a8a99" : NAVY,
            border: "none",
            borderRadius: 8,
            cursor: loading ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "확인 중..." : "무료로 확인하기"}
        </button>
      </form>

      {error && (
        <div
          style={{
            background: "#f4e0da",
            color: "#a3392c",
            padding: "14px 18px",
            borderRadius: 8,
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div>
          <div
            style={{
              textAlign: "center",
              background: NAVY,
              color: "#fff",
              borderRadius: 12,
              padding: "28px 20px",
              marginBottom: 24,
            }}
          >
            <p style={{ margin: "0 0 6px 0", fontSize: 13, opacity: 0.85 }}>{result.targetUrl}</p>
            <p style={{ margin: "0 0 4px 0", fontSize: 36, fontWeight: 800 }}>{result.score.total}점</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>종합 등급: {result.score.grade}</p>
          </div>

          <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px 0", textAlign: "center" }}>
            아래 {result.score.breakdown.length}개 항목의 배점 합계가 총점입니다. 각 항목의 &quot;상태&quot;는 지금 확인된 사실이고,
            &quot;권장&quot;은 만점이 아닐 때만 표시되는 개선 방법입니다.
          </p>

          {result.score.breakdown.map((item) => (
            <ScoreCard key={item.key} item={item} />
          ))}

          {result.errors.length > 0 && (
            <p style={{ fontSize: 13, color: "#a1662b", marginTop: 8 }}>참고: {result.errors.join(" / ")}</p>
          )}

          <div
            style={{
              marginTop: 32,
              padding: "24px",
              background: "#f8f9fa",
              borderRadius: 10,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px 0" }}>
              이 진단은 기술적 체크리스트 {result.score.breakdown.length}가지만 확인한 결과입니다.
            </p>
            <p style={{ fontSize: 14, color: "#666", margin: "0 0 16px 0", lineHeight: 1.7 }}>
              실제로 ChatGPT·Perplexity 등에서 우리 브랜드가 얼마나 언급되는지, 경쟁사 대비 노출도는 어떤지까지 확인하려면 전문가
              진단이 필요합니다.
            </p>
            <a
              href="https://daplan.com/inquiry"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: NAVY,
                color: "#fff",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              동안기획에 전체 진단 문의하기
            </a>
          </div>
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: 12, color: "#999", marginTop: 48 }}>
        본 도구는 daplan.com(동안기획)에서 제공하는 무료 기술 체크 도구입니다.
      </p>
    </main>
  );
}
