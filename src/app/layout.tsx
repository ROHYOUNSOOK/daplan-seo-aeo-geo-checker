import type { Metadata } from "next";

const TITLE = "AI검색 노출 무료 진단 | 우리 사이트, AI검색에 잘 노출되고있을까요? - 동안기획";
const DESCRIPTION =
  "ChatGPT, 퍼플렉시티, 클로드, 제미나이 등 AI 답변엔진이 우리 사이트를 잘 읽고 인용할 수 있는 준비가 되어있는지 11가지 핵심요소를 기준으로 무료로 확인해드립니다. AEO·GEO 기술 진단, 동안기획.";
const KEYWORDS = [
  "SEO",
  "AEO",
  "GEO",
  "AI검색최적화",
  "AI답변엔진최적화",
  "생성형엔진최적화",
  "ChatGPT노출",
  "퍼플렉시티노출",
  "구글AI개요",
  "제미나이",
  "무료진단",
  "동안기획",
  "온라인마케팅",
];
const SITE_URL = "https://daplan-aeo-geo-checker.vercel.app";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: "동안기획", url: "https://daplan.com" }],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "동안기획 AI검색 노출 무료 진단",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
