export const TOPIC_SLUGS = ["techAI", "frontend", "backend", "startups", "devTips"] as const;

export type TopicSlug = (typeof TOPIC_SLUGS)[number];

export interface TopicDefinition {
  slug: TopicSlug;
  label: string;
  description: string;
  emoji: string;
}

export const TOPICS: TopicDefinition[] = [
  {
    slug: "techAI",
    label: "AI & Machine Learning",
    description: "Noticias de IA y tecnologia",
    emoji: "🤖",
  },
  {
    slug: "frontend",
    label: "Frontend & Web Dev",
    description: "Frameworks, CSS, browsers, UX",
    emoji: "🎨",
  },
  {
    slug: "backend",
    label: "Backend & Cloud",
    description: "Infra, databases, DevOps, APIs",
    emoji: "⚙️",
  },
  {
    slug: "startups",
    label: "Startups MX & SV",
    description: "Fondeos, lanzamientos, ecosistema",
    emoji: "🚀",
  },
  {
    slug: "devTips",
    label: "Tips & Herramientas",
    description: "Productividad dev, tools, snippets",
    emoji: "💡",
  },
];

export const DEFAULT_TOPICS: TopicSlug[] = ["techAI", "devTips", "startups"];

export function isValidTopicSlug(slug: string): slug is TopicSlug {
  return (TOPIC_SLUGS as readonly string[]).includes(slug);
}

export function validateTopics(topics: unknown): TopicSlug[] | null {
  if (!Array.isArray(topics) || topics.length === 0) return null;
  const valid = topics.filter(isValidTopicSlug);
  return valid.length > 0 ? valid : null;
}
