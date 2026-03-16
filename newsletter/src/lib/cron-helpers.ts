import { prisma } from "./prisma";
import { generateNewsletter, generateWeeklyDigest, PastNewsletter, SectionData } from "./gemini";
import { assembleFullEmailHtml } from "./mailer";
import { ingestNews } from "./news-ingester";
import { sendBulkEmails } from "./mailer";
import { TopicSlug } from "./topics";

export async function runDailyCron() {
  // Step 1: Ingest real news from RSS feeds (all 5 categories)
  console.log("Ingesting news from RSS feeds...");
  const news = await ingestNews();
  console.log(
    `Ingested: ${news.techAI.length} tech/AI, ${news.devTools.length} dev, ${news.frontend.length} frontend, ${news.backend.length} backend, ${news.startups.length} startups`
  );

  // Step 2: Get past newsletters to avoid repetition
  const pastNewsletters: PastNewsletter[] = await prisma.newsletter.findMany({
    where: { type: "daily" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { subject: true, createdAt: true },
  });

  // Step 3: Generate newsletter with Gemini (single call, 5 sections)
  console.log("Generating daily newsletter with Gemini (5 sections)...");
  const generated = await generateNewsletter(news, pastNewsletters);

  // Step 4: Save to database with sections JSON
  const htmlContent = assembleFullEmailHtml(generated.sections);
  const newsletter = await prisma.newsletter.create({
    data: {
      subject: generated.subject,
      content: generated.content,
      htmlContent,
      sections: JSON.stringify(generated.sections),
      type: "daily",
    },
  });

  // Step 5: Send to daily subscribers with personalized topic filtering
  const subscribers = await prisma.subscriber.findMany({
    where: { active: true, confirmed: true, frequency: "daily" },
    select: { email: true, token: true, topics: true },
  });

  if (subscribers.length === 0) {
    return {
      message: "Newsletter diario generado pero no hay suscriptores diarios",
      newsletterId: newsletter.id,
      subscribersSent: 0,
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

  // Parse topics from JSON string for each subscriber
  const subscribersWithTopics = subscribers.map((sub) => ({
    email: sub.email,
    token: sub.token,
    topics: parseSafeTopics(sub.topics),
  }));

  console.log(`Sending daily to ${subscribers.length} subscribers (personalized by topics)...`);
  const results = await sendBulkEmails(
    subscribersWithTopics,
    newsletter.subject,
    generated.sections,
    appUrl
  );

  await prisma.newsletter.update({
    where: { id: newsletter.id },
    data: { sentAt: new Date() },
  });

  const sent = results.filter((r) => r.status === "sent").length;

  return {
    message: `Newsletter diario generado y enviado a ${sent} suscriptores`,
    newsletterId: newsletter.id,
    subscribersSent: sent,
    newsIngested: {
      techAI: news.techAI.length,
      devTools: news.devTools.length,
      frontend: news.frontend.length,
      backend: news.backend.length,
      startups: news.startups.length,
    },
  };
}

export async function runWeeklyCron() {
  // Step 1: Get daily newsletters from the past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dailyNewsletters = await prisma.newsletter.findMany({
    where: {
      type: "daily",
      createdAt: { gte: sevenDaysAgo },
    },
    orderBy: { createdAt: "asc" },
    select: { subject: true, content: true, sections: true, createdAt: true },
  });

  let generated;

  if (dailyNewsletters.length === 0) {
    // Fallback: generate from RSS directly if no dailies exist
    console.log("No daily newsletters found, generating weekly from RSS...");
    const news = await ingestNews();
    generated = await generateNewsletter(news);
  } else {
    // Step 2: Generate weekly digest from daily content
    console.log(`Compiling weekly digest from ${dailyNewsletters.length} daily editions...`);
    generated = await generateWeeklyDigest(dailyNewsletters);
  }

  // Step 3: Save to database
  const htmlContent = assembleFullEmailHtml(generated.sections, "Resumen Semanal");
  const newsletter = await prisma.newsletter.create({
    data: {
      subject: generated.subject,
      content: generated.content,
      htmlContent,
      sections: JSON.stringify(generated.sections),
      type: "weekly",
    },
  });

  // Step 4: Send to weekly subscribers with personalized topic filtering
  const subscribers = await prisma.subscriber.findMany({
    where: { active: true, confirmed: true, frequency: "weekly" },
    select: { email: true, token: true, topics: true },
  });

  if (subscribers.length === 0) {
    return {
      message: "Digest semanal generado pero no hay suscriptores semanales",
      newsletterId: newsletter.id,
      subscribersSent: 0,
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

  const subscribersWithTopics = subscribers.map((sub) => ({
    email: sub.email,
    token: sub.token,
    topics: parseSafeTopics(sub.topics),
  }));

  console.log(`Sending weekly digest to ${subscribers.length} subscribers (personalized by topics)...`);
  const results = await sendBulkEmails(
    subscribersWithTopics,
    newsletter.subject,
    generated.sections,
    appUrl
  );

  await prisma.newsletter.update({
    where: { id: newsletter.id },
    data: { sentAt: new Date() },
  });

  const sent = results.filter((r) => r.status === "sent").length;

  return {
    message: `Digest semanal generado y enviado a ${sent} suscriptores`,
    newsletterId: newsletter.id,
    subscribersSent: sent,
    dailyEditionsUsed: dailyNewsletters.length,
  };
}

function parseSafeTopics(topicsJson: string): string[] {
  try {
    const parsed = JSON.parse(topicsJson);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fallback
  }
  return ["techAI", "devTips", "startups"];
}
