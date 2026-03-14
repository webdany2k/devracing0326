import { prisma } from "./prisma";
import { generateNewsletter, generateWeeklyDigest, PastNewsletter } from "./gemini";
import { ingestNews } from "./news-ingester";
import { sendBulkEmails } from "./mailer";

export async function runDailyCron() {
  // Step 1: Ingest real news from RSS feeds
  console.log("Ingesting news from RSS feeds...");
  const news = await ingestNews();
  console.log(
    `Ingested: ${news.techAI.length} tech/AI, ${news.devTools.length} dev, ${news.startups.length} startups`
  );

  // Step 2: Get past newsletters to avoid repetition
  const pastNewsletters: PastNewsletter[] = await prisma.newsletter.findMany({
    where: { type: "daily" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { subject: true, createdAt: true },
  });

  // Step 3: Generate newsletter with Gemini
  console.log("Generating daily newsletter with Gemini...");
  const generated = await generateNewsletter(news, pastNewsletters);

  // Step 4: Save to database
  const newsletter = await prisma.newsletter.create({
    data: {
      subject: generated.subject,
      content: generated.content,
      htmlContent: generated.htmlContent,
      type: "daily",
    },
  });

  // Step 5: Send to daily subscribers only
  const subscribers = await prisma.subscriber.findMany({
    where: { active: true, confirmed: true, frequency: "daily" },
    select: { email: true, token: true },
  });

  if (subscribers.length === 0) {
    return {
      message: "Newsletter diario generado pero no hay suscriptores diarios",
      newsletterId: newsletter.id,
      subscribersSent: 0,
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

  console.log(`Sending daily to ${subscribers.length} subscribers...`);
  const results = await sendBulkEmails(
    subscribers,
    newsletter.subject,
    newsletter.htmlContent,
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
    select: { subject: true, content: true, createdAt: true },
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
  const newsletter = await prisma.newsletter.create({
    data: {
      subject: generated.subject,
      content: generated.content,
      htmlContent: generated.htmlContent,
      type: "weekly",
    },
  });

  // Step 4: Send to weekly subscribers only
  const subscribers = await prisma.subscriber.findMany({
    where: { active: true, confirmed: true, frequency: "weekly" },
    select: { email: true, token: true },
  });

  if (subscribers.length === 0) {
    return {
      message: "Digest semanal generado pero no hay suscriptores semanales",
      newsletterId: newsletter.id,
      subscribersSent: 0,
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

  console.log(`Sending weekly digest to ${subscribers.length} subscribers...`);
  const results = await sendBulkEmails(
    subscribers,
    newsletter.subject,
    newsletter.htmlContent,
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
