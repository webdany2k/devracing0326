export interface RawNewsItem {
  title: string;
  source: string;
  link: string;
  pubDate: string;
}

export interface IngestedNews {
  techAI: RawNewsItem[];
  devTools: RawNewsItem[];
  frontend: RawNewsItem[];
  backend: RawNewsItem[];
  startups: RawNewsItem[];
}

const RSS_FEEDS = {
  techAI: [
    "https://news.google.com/rss/search?q=artificial+intelligence+OR+AI+technology+2026&hl=es-419&gl=MX&ceid=MX:es-419",
    "https://news.google.com/rss/search?q=OpenAI+OR+Google+AI+OR+Meta+AI+OR+ChatGPT&hl=es-419&gl=MX&ceid=MX:es-419",
  ],
  devTools: [
    "https://news.google.com/rss/search?q=programming+developer+tools+software+engineering&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=JavaScript+TypeScript+Python+framework+2026&hl=en-US&gl=US&ceid=US:en",
  ],
  frontend: [
    "https://news.google.com/rss/search?q=React+Vue+Angular+CSS+frontend+web+development&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Next.js+Svelte+Tailwind+web+framework+2026&hl=en-US&gl=US&ceid=US:en",
  ],
  backend: [
    "https://news.google.com/rss/search?q=cloud+infrastructure+Kubernetes+Docker+backend+API&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=database+PostgreSQL+Redis+DevOps+serverless+2026&hl=en-US&gl=US&ceid=US:en",
  ],
  startups: [
    "https://news.google.com/rss/search?q=startups+Mexico+tecnologia+inversion&hl=es-419&gl=MX&ceid=MX:es-419",
    "https://news.google.com/rss/search?q=Silicon+Valley+startups+funding+2026&hl=en-US&gl=US&ceid=US:en",
  ],
};

function parseRSSItems(xml: string): RawNewsItem[] {
  const items: RawNewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] ??
      itemXml.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
    const link = itemXml.match(/<link>(.*?)<\/link>|<link\/>\s*(https?[^\s<]+)/)?.[1] ?? "";
    const source = itemXml.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? "";
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";

    if (title && !title.includes("Google News")) {
      items.push({
        title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
        source,
        link,
        pubDate,
      });
    }
  }

  return items;
}

async function fetchFeed(url: string): Promise<RawNewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "TechPulseMX-Newsletter/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];
    const xml = await response.text();
    return parseRSSItems(xml);
  } catch {
    console.warn(`Failed to fetch RSS feed: ${url}`);
    return [];
  }
}

export async function ingestNews(): Promise<IngestedNews> {
  const [techAI, devTools, frontend, backend, startups] = await Promise.all([
    Promise.all(RSS_FEEDS.techAI.map(fetchFeed)).then((results) => results.flat()),
    Promise.all(RSS_FEEDS.devTools.map(fetchFeed)).then((results) => results.flat()),
    Promise.all(RSS_FEEDS.frontend.map(fetchFeed)).then((results) => results.flat()),
    Promise.all(RSS_FEEDS.backend.map(fetchFeed)).then((results) => results.flat()),
    Promise.all(RSS_FEEDS.startups.map(fetchFeed)).then((results) => results.flat()),
  ]);

  // Deduplicate by title similarity and limit
  const dedup = (items: RawNewsItem[], limit: number) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = item.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
  };

  return {
    techAI: dedup(techAI, 10),
    devTools: dedup(devTools, 8),
    frontend: dedup(frontend, 8),
    backend: dedup(backend, 8),
    startups: dedup(startups, 10),
  };
}

export function formatNewsForPrompt(news: IngestedNews): string {
  const formatSection = (items: RawNewsItem[]) =>
    items.map((item, i) => `${i + 1}. "${item.title}" (Fuente: ${item.source || "N/A"})`).join("\n");

  return `## NOTICIAS REALES DE HOY (fuentes RSS)

### Tech & AI:
${formatSection(news.techAI)}

### Dev Tools & Programming:
${formatSection(news.devTools)}

### Frontend & Web Development:
${formatSection(news.frontend)}

### Backend & Cloud Infrastructure:
${formatSection(news.backend)}

### Startups Mexico & Silicon Valley:
${formatSection(news.startups)}`;
}
