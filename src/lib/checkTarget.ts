// 서버에서만 실행되는 실제 진단 로직.
// AI 크롤러 차단 여부, 구조화 데이터, FAQ 구조, sitemap, canonical, 메타 품질,
// 콘텐츠 최신성, 이미지 alt, 모바일 뷰포트, HTTPS까지 실제로 가져와서 확인한다.

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "cohere-ai",
  "Diffbot",
  "Bytespider",
  "Amazonbot",
] as const;

const RELEVANT_SCHEMA_TYPES = [
  "Article",
  "FAQPage",
  "Organization",
  "BreadcrumbList",
  "WebSite",
  "LocalBusiness",
];

export interface ScoreItem {
  key: string;
  label: string;
  earned: number;
  max: number;
  status: string; // 현재 상태 한 줄
  recommendation: string | null; // 개선 권장사항, 이미 만점이면 null
}

export interface CheckResult {
  targetUrl: string;
  fetchedAt: string;
  robots: {
    checked: boolean;
    robotsTxtFound: boolean;
    blockedBots: string[];
    blockedByWildcard: boolean;
    note: string;
  };
  schema: {
    checked: boolean;
    foundTypes: string[];
    missingRecommended: string[];
    rawBlockCount: number;
  };
  content: {
    checked: boolean;
    h2Count: number;
    h3Count: number;
    questionHeadingCount: number;
    hasFaqSchema: boolean;
    looksLikeFaq: boolean;
    directAnswerCount: number;
  };
  sitemap: {
    checked: boolean;
    found: boolean;
    url: string | null;
  };
  canonical: {
    checked: boolean;
    found: boolean;
    value: string | null;
  };
  metaQuality: {
    checked: boolean;
    title: string | null;
    titleLength: number;
    titleOk: boolean;
    descriptionFound: boolean;
    descriptionLength: number;
    descriptionOk: boolean;
  };
  freshness: {
    checked: boolean;
    found: boolean;
    datePublished: string | null;
    dateModified: string | null;
  };
  imageAlt: {
    checked: boolean;
    totalImages: number;
    imagesWithAlt: number;
    ratio: number;
  };
  mobile: {
    checked: boolean;
    hasViewport: boolean;
  };
  https: {
    checked: boolean;
    isHttps: boolean;
  };
  score: {
    total: number;
    grade: "양호" | "보통" | "취약";
    breakdown: ScoreItem[];
  };
  errors: string[];
}

function isPrivateOrLoopbackHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0" || h === "::1") return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [parseInt(ipv4[1], 10), parseInt(ipv4[2], 10)];
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
  }
  return false;
}

export function validateTargetUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "올바른 URL 형식이 아닙니다. (예: https://example.com)" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "http 또는 https 주소만 확인할 수 있습니다." };
  }
  if (isPrivateOrLoopbackHostname(url.hostname)) {
    return { ok: false, reason: "내부·사설 네트워크 주소는 확인할 수 없습니다." };
  }
  return { ok: true, url };
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "DaplanAEOGEOChecker/1.0 (+https://daplan.com)",
      },
    });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseRobotsTxt(text: string): { blockedBots: string[]; blockedByWildcard: boolean; sitemapUrls: string[] } {
  const lines = text.split(/\r?\n/);
  const groups: { agents: string[]; disallowAll: boolean }[] = [];
  const sitemapUrls: string[] = [];
  let currentAgents: string[] = [];
  let currentDisallowAll = false;
  let inGroup = false;

  const flush = () => {
    if (currentAgents.length > 0) {
      groups.push({ agents: currentAgents, disallowAll: currentDisallowAll });
    }
    currentAgents = [];
    currentDisallowAll = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const [keyRaw, ...rest] = line.split(":");
    const key = keyRaw.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      if (inGroup) flush();
      currentAgents.push(value);
      inGroup = true;
    } else if (key === "disallow") {
      if (value === "/") currentDisallowAll = true;
    } else if (key === "allow") {
      if (value === "/") currentDisallowAll = false;
    } else if (key === "sitemap") {
      if (value) sitemapUrls.push(value);
    }
  }
  flush();

  const blockedBots: string[] = [];
  let blockedByWildcard = false;

  for (const bot of AI_BOTS) {
    const specificGroup = groups.find((g) => g.agents.some((a) => a.toLowerCase() === bot.toLowerCase()));
    if (specificGroup) {
      if (specificGroup.disallowAll) blockedBots.push(bot);
      continue;
    }
    const wildcardGroup = groups.find((g) => g.agents.includes("*"));
    if (wildcardGroup?.disallowAll) {
      blockedBots.push(bot);
      blockedByWildcard = true;
    }
  }

  return { blockedBots, blockedByWildcard, sitemapUrls };
}

function extractJsonLd(html: string): { types: string[]; blockCount: number; datePublished: string | null; dateModified: string | null } {
  const types = new Set<string>();
  let datePublished: string | null = null;
  let dateModified: string | null = null;
  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of blocks) {
    const jsonText = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(jsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const graph = item["@graph"] ? item["@graph"] : [item];
        for (const g of graph) {
          const t = g?.["@type"];
          if (t) {
            if (Array.isArray(t)) t.forEach((x) => types.add(String(x)));
            else types.add(String(t));
          }
          if (!datePublished && g?.datePublished) datePublished = String(g.datePublished);
          if (!dateModified && g?.dateModified) dateModified = String(g.dateModified);
        }
      }
    } catch {
      // 파싱 실패 블록 무시
    }
  }
  return { types: Array.from(types), blockCount: blocks.length, datePublished, dateModified };
}

function analyzeContentStructure(html: string, schemaTypes: string[]) {
  const h2Matches = html.match(/<h2[\s>]/gi) || [];
  const h3Matches = html.match(/<h3[\s>]/gi) || [];

  const headingWithFollowing = Array.from(
    html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>([\s\S]{0,600}?)(?=<h[23][\s>]|$)/gi)
  );

  let questionHeadingCount = 0;
  let directAnswerCount = 0;

  for (const match of headingWithFollowing) {
    const headingText = match[1].replace(/<[^>]+>/g, "").trim();
    const isQuestion = headingText.includes("?") || headingText.includes("？");
    if (isQuestion) {
      questionHeadingCount++;
      const followingText = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (followingText.length >= 15 && followingText.length <= 300) {
        directAnswerCount++;
      }
    }
  }

  const hasFaqSchema = schemaTypes.includes("FAQPage");

  return {
    h2Count: h2Matches.length,
    h3Count: h3Matches.length,
    questionHeadingCount,
    hasFaqSchema,
    looksLikeFaq: hasFaqSchema || questionHeadingCount >= 3,
    directAnswerCount,
  };
}

function checkCanonical(html: string): { found: boolean; value: string | null } {
  const m =
    html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  return { found: !!m, value: m ? m[1] : null };
}

function checkMetaQuality(html: string): {
  title: string | null;
  titleLength: number;
  titleOk: boolean;
  descriptionFound: boolean;
  descriptionLength: number;
  descriptionOk: boolean;
} {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : null;
  const titleLength = title ? title.length : 0;
  const titleOk = titleLength >= 10 && titleLength <= 60;

  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  const description = descMatch ? descMatch[1].trim() : null;
  const descriptionFound = !!description;
  const descriptionLength = description ? description.length : 0;
  const descriptionOk = descriptionLength >= 50 && descriptionLength <= 160;

  return { title, titleLength, titleOk, descriptionFound, descriptionLength, descriptionOk };
}

function checkMobileViewport(html: string): boolean {
  return /<meta[^>]+name=["']viewport["']/i.test(html);
}

function checkImageAlt(html: string): { totalImages: number; imagesWithAlt: number; ratio: number } {
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  let withAlt = 0;
  for (const tag of imgTags) {
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    if (altMatch && altMatch[1].trim().length > 0) withAlt++;
  }
  const total = imgTags.length;
  return { totalImages: total, imagesWithAlt: withAlt, ratio: total > 0 ? withAlt / total : 1 };
}

export async function runCheck(targetUrl: URL): Promise<CheckResult> {
  const errors: string[] = [];
  const origin = `${targetUrl.protocol}//${targetUrl.host}`;

  const robotsRes = await fetchWithTimeout(`${origin}/robots.txt`, 8000);
  let robotsTxtFound = false;
  let blockedBots: string[] = [];
  let blockedByWildcard = false;
  let sitemapFromRobots: string[] = [];
  if (robotsRes && robotsRes.ok) {
    robotsTxtFound = true;
    const text = await robotsRes.text();
    const parsed = parseRobotsTxt(text.slice(0, 50000));
    blockedBots = parsed.blockedBots;
    blockedByWildcard = parsed.blockedByWildcard;
    sitemapFromRobots = parsed.sitemapUrls;
  } else if (!robotsRes) {
    errors.push("robots.txt에 접속할 수 없었습니다 (사이트가 응답하지 않음).");
  }

  const sitemapCandidate = sitemapFromRobots[0] || `${origin}/sitemap.xml`;
  const sitemapRes = await fetchWithTimeout(sitemapCandidate, 8000);
  const sitemapFound = !!(sitemapRes && sitemapRes.ok);

  const pageRes = await fetchWithTimeout(targetUrl.toString(), 10000);
  let schemaTypes: string[] = [];
  let rawBlockCount = 0;
  let datePublished: string | null = null;
  let dateModified: string | null = null;
  let content = {
    h2Count: 0,
    h3Count: 0,
    questionHeadingCount: 0,
    hasFaqSchema: false,
    looksLikeFaq: false,
    directAnswerCount: 0,
  };
  let canonical = { found: false, value: null as string | null };
  let metaQuality = {
    title: null as string | null,
    titleLength: 0,
    titleOk: false,
    descriptionFound: false,
    descriptionLength: 0,
    descriptionOk: false,
  };
  let hasViewport = false;
  let imageAlt = { totalImages: 0, imagesWithAlt: 0, ratio: 1 };
  let pageFetched = false;

  if (pageRes && pageRes.ok) {
    pageFetched = true;
    const html = (await pageRes.text()).slice(0, 800000);
    const extracted = extractJsonLd(html);
    schemaTypes = extracted.types;
    rawBlockCount = extracted.blockCount;
    datePublished = extracted.datePublished;
    dateModified = extracted.dateModified;
    content = analyzeContentStructure(html, schemaTypes);
    canonical = checkCanonical(html);
    metaQuality = checkMetaQuality(html);
    hasViewport = checkMobileViewport(html);
    imageAlt = checkImageAlt(html);
  } else {
    errors.push("대상 페이지에 접속할 수 없었습니다. URL을 다시 확인해주세요.");
  }

  const missingRecommended = RELEVANT_SCHEMA_TYPES.filter((t) => !schemaTypes.includes(t));
  const isHttps = targetUrl.protocol === "https:";

  // ---- 항목별 점수 + 상태 + 권장사항 (합계 100점) ----
  const breakdown: ScoreItem[] = [];

  {
    const max = 20;
    let earned = 0;
    let status: string;
    let recommendation: string | null = null;
    if (robotsTxtFound && blockedBots.length === 0) {
      earned = 20;
      status = "AI 크롤러를 차단하고 있지 않습니다.";
    } else if (robotsTxtFound && blockedBots.length > 0) {
      earned = 6;
      status = `${blockedBots.join(", ")} 크롤러가 차단되어 있습니다.`;
      recommendation = "robots.txt에서 해당 AI 크롤러의 Disallow 규칙을 제거하면 AI 답변엔진이 콘텐츠를 읽을 수 있게 됩니다.";
    } else {
      earned = 12;
      status = "robots.txt 파일 자체가 없습니다 (차단은 없는 상태).";
      recommendation = "robots.txt를 만들어 크롤러 정책을 명시적으로 관리하는 것을 권장합니다.";
    }
    breakdown.push({ key: "robots", label: "AI 크롤러 접근성", earned, max, status, recommendation });
  }

  {
    const max = 15;
    const earned = pageFetched ? Math.min(15, schemaTypes.length * 4) : 0;
    const status = schemaTypes.length > 0 ? `${schemaTypes.join(", ")} 발견됨` : "구조화 데이터가 없습니다.";
    const recommendation =
      earned >= max
        ? null
        : `${missingRecommended.slice(0, 3).join(", ")} 같은 Schema.org 마크업을 추가하면 점수가 올라갑니다.`;
    breakdown.push({ key: "schema", label: "구조화 데이터(Schema.org)", earned, max, status, recommendation });
  }

  {
    const max = 15;
    const earned = !pageFetched ? 0 : content.looksLikeFaq ? 15 : content.questionHeadingCount > 0 ? 6 : 0;
    const status = content.looksLikeFaq
      ? "FAQ 형태의 콘텐츠 구조가 확인됩니다."
      : content.questionHeadingCount > 0
        ? `질문형 제목이 ${content.questionHeadingCount}개 있지만 FAQ 구조로 보기엔 부족합니다.`
        : "질문형 제목이나 FAQ 구조가 확인되지 않습니다.";
    const recommendation =
      earned >= max ? null : "질문형 소제목(H2/H3)을 3개 이상 만들고, 각 질문 바로 아래 짧은 답변 문단을 배치하세요.";
    breakdown.push({ key: "faq", label: "FAQ / 콘텐츠 구조", earned, max, status, recommendation });
  }

  {
    const max = 5;
    const earned = pageFetched ? Math.min(5, content.directAnswerCount * 2) : 0;
    const status = `질문형 제목 중 ${content.directAnswerCount}곳에 바로 뒤따르는 짧은 답변 문단이 있습니다.`;
    const recommendation = earned >= max ? null : "각 질문 제목 바로 다음 문장을 15~300자의 완결된 답변으로 작성하면 AI가 그대로 인용하기 쉬워집니다.";
    breakdown.push({ key: "directAnswer", label: "직접 답변형 문단", earned, max, status, recommendation });
  }

  {
    const max = 5;
    const earned = sitemapFound ? 5 : 0;
    const status = sitemapFound ? "sitemap.xml이 존재합니다." : "sitemap.xml을 찾을 수 없습니다.";
    const recommendation = sitemapFound ? null : "sitemap.xml을 생성하고 robots.txt에 위치를 명시하면 크롤러가 전체 페이지를 더 빠르게 발견합니다.";
    breakdown.push({ key: "sitemap", label: "sitemap.xml", earned, max, status, recommendation });
  }

  {
    const max = 5;
    const earned = canonical.found ? 5 : 0;
    const status = canonical.found ? `canonical 태그가 설정되어 있습니다. (${canonical.value})` : "canonical 태그가 없습니다.";
    const recommendation = canonical.found ? null : "각 페이지에 자기 자신을 가리키는 canonical 태그를 추가하세요.";
    breakdown.push({ key: "canonical", label: "Canonical 태그", earned, max, status, recommendation });
  }

  {
    const max = 5;
    const earned = metaQuality.titleOk ? 5 : metaQuality.title ? 2 : 0;
    const status = metaQuality.title ? `타이틀 ${metaQuality.titleLength}자` : "타이틀이 없습니다.";
    const recommendation = metaQuality.titleOk ? null : "타이틀을 10~60자 사이로 조정하면 검색·AI 요약에서 잘리지 않고 노출됩니다.";
    breakdown.push({ key: "title", label: "메타 타이틀 길이", earned, max, status, recommendation });
  }

  {
    const max = 5;
    const earned = metaQuality.descriptionOk ? 5 : metaQuality.descriptionFound ? 2 : 0;
    const status = metaQuality.descriptionFound ? `메타 설명 ${metaQuality.descriptionLength}자` : "메타 설명이 없습니다.";
    const recommendation = metaQuality.descriptionOk
      ? null
      : "메타 설명을 50~160자 사이로 조정하세요. 너무 길면 잘리고, 너무 짧으면 정보가 부족합니다.";
    breakdown.push({ key: "description", label: "메타 설명 길이", earned, max, status, recommendation });
  }

  {
    const max = 5;
    const earned = datePublished || dateModified ? 5 : 0;
    const status =
      datePublished || dateModified
        ? `발행일 ${datePublished ?? "-"} / 수정일 ${dateModified ?? "-"}`
        : "발행일·수정일 정보가 없습니다.";
    const recommendation = earned >= max ? null : "Schema에 datePublished/dateModified를 추가하면 AI가 정보의 최신성을 판단하는 데 도움이 됩니다.";
    breakdown.push({ key: "freshness", label: "콘텐츠 최신성", earned, max, status, recommendation });
  }

  {
    const max = 5;
    const earned = Math.round(imageAlt.ratio * 5);
    const status = `이미지 ${imageAlt.totalImages}개 중 ${imageAlt.imagesWithAlt}개에 alt 텍스트 있음 (${Math.round(imageAlt.ratio * 100)}%)`;
    const recommendation = earned >= max ? null : "모든 이미지에 내용을 설명하는 alt 텍스트를 추가하세요.";
    breakdown.push({ key: "imageAlt", label: "이미지 alt 텍스트", earned, max, status, recommendation });
  }

  {
    const max = 5;
    const earned = hasViewport ? 5 : 0;
    const status = hasViewport ? "모바일 viewport가 설정되어 있습니다." : "viewport 메타 태그가 없습니다.";
    const recommendation = hasViewport ? null : '<meta name="viewport" content="width=device-width, initial-scale=1"> 태그를 추가하세요.';
    breakdown.push({ key: "mobile", label: "모바일 뷰포트", earned, max, status, recommendation });
  }

  {
    const max = 5;
    const earned = isHttps ? 5 : 0;
    const status = isHttps ? "HTTPS가 적용되어 있습니다." : "HTTPS가 적용되어 있지 않습니다.";
    const recommendation = isHttps ? null : "SSL 인증서를 적용해 HTTPS로 전환하세요.";
    breakdown.push({ key: "https", label: "HTTPS 적용", earned, max, status, recommendation });
  }

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(breakdown.reduce((sum, item) => sum + item.earned, 0))
    )
  );
  const grade: CheckResult["score"]["grade"] = score >= 70 ? "양호" : score >= 40 ? "보통" : "취약";

  return {
    targetUrl: targetUrl.toString(),
    fetchedAt: new Date().toISOString(),
    robots: {
      checked: true,
      robotsTxtFound,
      blockedBots,
      blockedByWildcard,
      note: robotsTxtFound
        ? blockedBots.length > 0
          ? `${blockedBots.length}개의 AI 크롤러가 차단되어 있습니다.`
          : "확인된 AI 크롤러 차단이 없습니다."
        : "robots.txt가 없습니다 (차단 없음으로 간주됨).",
    },
    schema: {
      checked: pageFetched,
      foundTypes: schemaTypes,
      missingRecommended,
      rawBlockCount,
    },
    content: {
      checked: pageFetched,
      ...content,
    },
    sitemap: {
      checked: true,
      found: sitemapFound,
      url: sitemapFound ? sitemapCandidate : null,
    },
    canonical: {
      checked: pageFetched,
      ...canonical,
    },
    metaQuality: {
      checked: pageFetched,
      ...metaQuality,
    },
    freshness: {
      checked: pageFetched,
      found: !!(datePublished || dateModified),
      datePublished,
      dateModified,
    },
    imageAlt: {
      checked: pageFetched,
      ...imageAlt,
    },
    mobile: {
      checked: pageFetched,
      hasViewport,
    },
    https: {
      checked: true,
      isHttps,
    },
    score: { total: score, grade, breakdown },
    errors,
  };
}
