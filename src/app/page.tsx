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
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTMzIiBoZWlnaHQ9IjI2IiB2aWV3Qm94PSIwIDAgMTMzIDI2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZyBpZD0ibG9nbyAxIiBjbGlwLXBhdGg9InVybCgjY2xpcDBfNzE4Xzg1NjEpIj4KPGcgaWQ9IiYjMjM1OyYjMTYwOyYjMTM2OyYjMjM2OyYjMTU3OyYjMTgwOyYjMjM2OyYjMTUwOyYjMTgwOyAxIj4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTE2LjU4ODUgMEg1Ljg2NTM0TDUuNjgxMzggMS4yMzYwM0gxNC40NjI5QzE4LjEyNDkgMS4yMzYwMyAxOC4zNzkzIDMuODMxMjQgMTcuMTEwMiAxMS4zMDY4QzE2LjE5OSAxNi42NzI2IDE1LjM1OTcgMTkuNTA4MyAxMy42MDQ4IDIwLjY4MDZMOS40NTY5OSAxMC40NTkxTDYuNTIyMTYgMTAuNDg1Mkg0LjEyMTk4TDAgMjIuNTgxN0gxMS4zODU4TDEyLjc1OTcgMjZMMTUuNzUzNSAyNS45NzM5TDE0LjMzMzUgMjIuNDczMUMxOC45NDI3IDIxLjgxMDggMjAuNzUwOCAxOC4wNTc4IDIxLjg5NzcgMTEuMzA1NEMyMy4xNjUzIDMuODI5NzkgMjIuMzgwNiAwIDE2LjU4ODUgMFpNMTAuMTY4NCAyMS4zNDU3SDUuMDcxOTlMNy43NDA5MyAxMy41MTM3TDEwLjg4OTkgMjEuMzQ1N0gxMC4xNjk5SDEwLjE2ODRaIiBmaWxsPSJ3aGl0ZSIvPgo8ZyBpZD0iR3JvdXAiPgo8cGF0aCBpZD0iVmVjdG9yXzIiIGQ9Ik0zMy45Nzc1IDE5LjcyNzFIMjguMDU3NlY3LjU2MTA2QzI4LjA1NzYgNy4xMzc5NSAyNy45MjI1IDYuOTE2MjQgMjcuNDU1NCA2LjkxNjI0SDI3LjIyOTdWNi4yNzE0MkgzMy45NzlDMzcuNjIzOCA2LjI3MTQyIDM4LjUyNzggOC41NTM2NSAzOC41Mjc4IDEzLjAwOEMzOC41Mjc4IDE3LjQ2MjMgMzcuNjIzOCAxOS43MjU3IDMzLjk3OSAxOS43MjU3TDMzLjk3NzUgMTkuNzI3MVpNMzEuMDcgNy4wMDg5OFYxOC45OTFIMzIuNzcxN0MzNS4wNzcgMTguOTkxIDM1LjUxMzkgMTcuNDYzOCAzNS41MTM5IDEzLjAwOTRDMzUuNTEzOSA4LjU1NTEgMzUuMDc3IDcuMDA4OTggMzIuNzcxNyA3LjAwODk4SDMxLjA3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggaWQ9IlZlY3Rvcl8zIiBkPSJNNDQuMDIzOCAyMC4wMjEzQzQxLjAyNTcgMjAuMDIxMyAzOS40MjkgMTcuOTU5MyAzOS40MjkgMTQuOTk3NUMzOS40MjkgMTIuMDM1NyA0MS4wMjU3IDkuOTkxMDkgNDQuMDIzOCA5Ljk5MTA5QzQ3LjAyMTkgOS45OTEwOSA0OC42MTg2IDEyLjAzNDIgNDguNjE4NiAxNC45OTc1QzQ4LjYxODYgMTcuOTYwOCA0Ny4wMjE5IDIwLjAyMTMgNDQuMDIzOCAyMC4wMjEzWk00NC4wMjM4IDEwLjcyNzJDNDIuNjgyOCAxMC43MjcyIDQyLjQ0MjggMTIuNTEyNCA0Mi40NDI4IDE0Ljk5NzVDNDIuNDQyOCAxNy40ODI2IDQyLjY4NDMgMTkuMjg1MiA0NC4wMjM4IDE5LjI4NTJDNDUuMzYzMyAxOS4yODUyIDQ1LjYwNjIgMTcuNDgxMSA0NS42MDYyIDE0Ljk5NzVDNDUuNjA2MiAxMi41MTM5IDQ1LjM2NDcgMTAuNzI3MiA0NC4wMjM4IDEwLjcyNzJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBpZD0iVmVjdG9yXzQiIGQ9Ik01MC4wNDg2IDE5LjcyNzJWMTEuNjQ3M0M1MC4wNDg2IDExLjIyNDIgNDkuOTEzNCAxMS4wMDI1IDQ5LjQ0NjMgMTEuMDAyNUg0OS4yMjA3VjEwLjM1NzdINTMuMDYyNFYxMS4wNTc2QzUzLjc4NTQgMTAuMzc2NSA1NC43Nzk5IDkuOTg5NjUgNTYuMzAwNSA5Ljk4OTY1QzU4LjM2NDQgOS45ODk2NSA1OC44NjE3IDExLjAzODggNTguODYxNyAxMi45NzE4VjE5LjcyNTdINTUuODQ5MlYxMi41NjZDNTUuODQ5MiAxMS43MzcyIDU1LjY5ODMgMTEuMjIyOCA1NC43MzM5IDExLjIyMjhDNTQuMDg1NyAxMS4yMjI4IDUzLjU4ODUgMTEuMzg4IDUzLjA2MjQgMTEuODQ4OFYxOS43MjU3SDUwLjA1TDUwLjA0ODYgMTkuNzI3MloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGlkPSJWZWN0b3JfNSIgZD0iTTY0LjEzMzUgOS45OTEwOUM2NS4wMjE3IDkuOTkxMDkgNjUuNjg1NyAxMC4xMzg5IDY2LjE2NzIgMTAuODc1VjEwLjM1OTFINjkuMTc5NlYyMC4wNDAxQzY5LjE3OTYgMjIuMzk2MyA2OC4xMjQ3IDIzLjU5MTcgNjQuODEwNCAyMy41OTE3QzYxLjQ5NjIgMjMuNTkxNyA2MC40NDEyIDIyLjM3NzQgNjAuNDQxMiAyMC4yMDUzVjIwLjAyMTNINjMuNDUzN1YyMC43NzYyQzYzLjQ1MzcgMjIuMDA5NCA2My42MDQ2IDIyLjg1NTYgNjQuODA5IDIyLjg1NTZDNjYuMDEzNCAyMi44NTU2IDY2LjE2NDMgMjIuMDA5NCA2Ni4xNjQzIDIwLjc3NjJWMTguMTQ0OEM2NS42ODI4IDE4Ljg2MjEgNjUuMDIwMiAxOS4wMDk5IDY0LjEzMDYgMTkuMDA5OUM2MS45NjE4IDE5LjAwOTkgNjAuMDYzMiAxNy43NDA1IDYwLjA2MzIgMTQuNTAwNUM2MC4wNjMyIDExLjI2MDQgNjEuOTYxOCA5Ljk5MTA5IDY0LjEzMDYgOS45OTEwOUg2NC4xMzM1Wk02Ni4xNjcyIDE1LjE5ODlWMTQuMTEzNkM2Ni4xNjcyIDEyLjAzNDIgNjUuNzE1OSAxMC43MjcyIDY0LjQ2NTUgMTAuNzI3MkM2My4zOTYyIDEwLjcyNzIgNjMuMDggMTIuMTk5NCA2My4wOCAxNC41MDA1QzYzLjA4IDE2LjgwMTUgNjMuMzk2MiAxOC4yNzM4IDY0LjQ2NTUgMTguMjczOEM2NS42NTU1IDE4LjI3MzggNjYuMTIyNiAxNy4wOTU3IDY2LjE2NzIgMTUuMjAwNFYxNS4xOTg5WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggaWQ9IlZlY3Rvcl82IiBkPSJNNzAuMDgzNyAxOS43MjcxTDc0LjMwMiA2LjI3Mjg2SDc3LjQ2NTRMODEuMjMwOSAxOS43MjcxSDc4LjA2NzZMNzYuNzcyNiAxNS4xMDc2SDcyLjI4NDFMNzAuODM4MyAxOS43MjcxSDcwLjA0NTJINzAuMDgzN1pNNzIuNTA4MyAxNC4zNzE1SDc2LjU2MTNMNzQuNjQ4NCA3LjU0MzY2TDcyLjUwOTggMTQuMzcxNUg3Mi41MDgzWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggaWQ9IlZlY3Rvcl83IiBkPSJNODIuMzU5MSAxOS43MjcyVjExLjY0NzNDODIuMzU5MSAxMS4yMjQyIDgyLjIyNCAxMS4wMDI1IDgxLjc1NjkgMTEuMDAyNUg4MS41MzEyVjEwLjM1NzdIODUuMzczVjExLjA1NzZDODYuMDk1OSAxMC4zNzY1IDg3LjA5MDUgOS45ODk2NSA4OC42MTI1IDkuOTg5NjVDOTAuNjc2NCA5Ljk4OTY1IDkxLjE3MzYgMTEuMDM4OCA5MS4xNzM2IDEyLjk3MThWMTkuNzI1N0g4OC4xNjEyVjEyLjU2NkM4OC4xNjEyIDExLjczNzIgODguMDEwMyAxMS4yMjI4IDg3LjA0NTkgMTEuMjIyOEM4Ni4zOTc3IDExLjIyMjggODUuOTAwNCAxMS4zODggODUuMzc0NCAxMS44NDg4VjE5LjcyNTdIODIuMzYyTDgyLjM1OTEgMTkuNzI3MloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGlkPSJWZWN0b3JfOCIgZD0iTTk3LjQyMjggMTkuNzI3MVY3LjU2MTA2Qzk3LjQyMjggNy4xMzc5NSA5Ny4yODc3IDYuOTE2MjQgOTYuODIwNiA2LjkxNjI0SDk2LjU5NVY2LjI3MTQySDEwMy42NDVDMTA2Ljg1NCA2LjI3MTQyIDEwNy41OTEgOC4zMzM0IDEwNy41OTEgMTAuMjI4N0MxMDcuNTkxIDEyLjEyNDEgMTA2Ljg1MiAxNC4xODYgMTAzLjY0NSAxNC4xODZIMTAwLjQzNVYxOS43MjU3SDk3LjQyMjhWMTkuNzI3MVpNMTAwLjQzNSA3LjAwODk4VjEzLjQ0OTlIMTAyLjU5QzEwNC4wNTEgMTMuNDQ5OSAxMDQuNzI4IDEyLjM0NTggMTA0LjcyOCAxMC4yMjg3QzEwNC43MjggOC4xMTE3IDEwNC4wNSA3LjAwNzUzIDEwMi41OSA3LjAwNzUzSDEwMC40MzVWNy4wMDg5OFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGlkPSJWZWN0b3JfOSIgZD0iTTExMS44MzcgMTcuMzE1OUMxMTEuODM3IDE4LjU2NzkgMTExLjk0MiAxOC45OTEgMTEyLjY2NSAxOC45OTFIMTEyLjg5VjE5LjcyNzFIMTExLjE3M0MxMDkuMTM5IDE5LjcyNzEgMTA4Ljc5MyAxOC45NTQ4IDEwOC43OTMgMTcuMjk3MVY2LjI3Mjg2SDExMS44MzVWMTcuMzE1OUgxMTEuODM3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggaWQ9IlZlY3Rvcl8xMCIgZD0iTTExOS40NDQgMTAuODU2MlYxMC4zNTkxSDEyMi40NTZWMTguNzg4MkMxMjIuNDU2IDE5LjA4MjMgMTIyLjM4MiAxOS4xNzUxIDEyMi4xMjQgMTkuMTc1MUgxMjEuMjA2QzEyMC42NzkgMTkuMTc1MSAxMjAuNDM3IDE5LjIxMTMgMTIwLjEwNyAxOS4zNzc5TDExOS42NyAxOS41OTgyQzExOS4wNTIgMTkuOTExMiAxMTguNzM1IDIwLjAyMTMgMTE3LjQ4NSAyMC4wMjEzQzExNS4zOTEgMjAuMDIxMyAxMTMuNDkyIDE4LjMyNzQgMTEzLjQ5MiAxNC45OTc1QzExMy40OTIgMTEuNjY3NiAxMTUuMzkxIDkuOTkxMDkgMTE3LjQ4NSA5Ljk5MTA5QzExOC4zMjkgOS45OTEwOSAxMTguOTc3IDEwLjEzODkgMTE5LjQ0MyAxMC44NTYySDExOS40NDRaTTExOS40NDQgMTcuODMxOFYxNC4xMTM2QzExOS40NDQgMTIuMDM0MiAxMTguOTkzIDEwLjcyNzIgMTE3LjgxNyAxMC43MjcyQzExNi44MjMgMTAuNzI3MiAxMTYuNTA2IDEyLjUxMjQgMTE2LjUwNiAxNC45OTc1QzExNi41MDYgMTguMDM0NyAxMTYuODIzIDE5LjI4NTIgMTE3LjgxNyAxOS4yODUyQzExOC45OTEgMTkuMjg1MiAxMTkuNDQ0IDE4Ljc1MTkgMTE5LjQ0NCAxNy44MzE4WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggaWQ9IlZlY3Rvcl8xMSIgZD0iTTEyNC4xODggMTkuNzI3MlYxMS42NDczQzEyNC4xODggMTEuMjI0MiAxMjQuMDUzIDExLjAwMjUgMTIzLjU4NiAxMS4wMDI1SDEyMy4zNlYxMC4zNTc3SDEyNy4yMDJWMTEuMDU3NkMxMjcuOTI1IDEwLjM3NjUgMTI4LjkyIDkuOTg5NjUgMTMwLjQ0IDkuOTg5NjVDMTMyLjUwNCA5Ljk4OTY1IDEzMy4wMDEgMTEuMDM4OCAxMzMuMDAxIDEyLjk3MThWMTkuNzI1N0gxMjkuOTg5VjEyLjU2NkMxMjkuOTg5IDExLjczNzIgMTI5LjgzOCAxMS4yMjI4IDEyOC44NzQgMTEuMjIyOEMxMjguMjI1IDExLjIyMjggMTI3LjcyOCAxMS4zODggMTI3LjIwMiAxMS44NDg4VjE5LjcyNTdIMTI0LjE5TDEyNC4xODggMTkuNzI3MloiIGZpbGw9IndoaXRlIi8+CjwvZz4KPC9nPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzcxOF84NTYxIj4KPHJlY3Qgd2lkdGg9IjEzMyIgaGVpZ2h0PSIyNiIgZmlsbD0id2hpdGUiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4KCg=="
          alt="동안기획 로고"
          style={{ height: 26, display: "block" }}
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
                href="https://daplan-homepage.vercel.app/contact.html"
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
