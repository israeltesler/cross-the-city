import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUTPUT = resolve(ROOT, "public/instagram-feed.json");
const HANDLE = "cross.the.city";
const PROFILE_URL = "https://www.instagram.com/cross.the.city/";
const MAX_POSTS = 12;
const GRAPH_VERSION = "v22.0";

function loadEnvFile() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function readExistingFeed() {
  if (!existsSync(OUTPUT)) return null;
  try {
    return JSON.parse(readFileSync(OUTPUT, "utf8"));
  } catch {
    return null;
  }
}

function writeFeed(payload) {
  writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function normalizeGraphPost(item) {
  const imageUrl =
    item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url;

  if (!imageUrl || !item.permalink) return null;

  const caption = (item.caption || "").replace(/\s+/g, " ").trim();

  return {
    id: item.id,
    permalink: item.permalink,
    imageUrl,
    alt: caption.slice(0, 140) || "פוסט באינסטגרם מ-Cross The City",
    mediaType: item.media_type,
    timestamp: item.timestamp,
  };
}

function normalizeStellaPost(item) {
  if (!item?.mediaUrl || !item.permalink || String(item.mediaUrl).startsWith("data:")) {
    return null;
  }

  const caption = (item.caption || "").replace(/\s+/g, " ").trim();

  return {
    id: item.id,
    permalink: item.permalink,
    imageUrl: item.mediaUrl,
    alt: caption.slice(0, 140) || "פוסט באינסטגרם מ-Cross The City",
    mediaType: item.mediaType || "IMAGE",
    timestamp: item.timestamp,
  };
}

async function fetchStellaFrameFeed(widgetId) {
  const response = await fetch(
    `https://stellaframe.com/api/widgets/${encodeURIComponent(widgetId)}/data`,
  );
  if (!response.ok) throw new Error("StellaFrame API error");

  const data = await response.json();
  const posts = (data.posts || [])
    .map(normalizeStellaPost)
    .filter(Boolean)
    .slice(0, MAX_POSTS);

  return {
    handle: data.account?.username || HANDLE,
    profileUrl: data.account?.profileUrl || PROFILE_URL,
    posts,
  };
}

async function fetchInstagramMedia(token, userId = "me") {
  const fields =
    "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";
  const posts = [];
  let url = `https://graph.instagram.com/${GRAPH_VERSION}/${userId}/media?fields=${fields}&limit=25&access_token=${encodeURIComponent(token)}`;

  while (url && posts.length < MAX_POSTS) {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Instagram API error");
    }

    for (const item of data.data || []) {
      const post = normalizeGraphPost(item);
      if (!post) continue;
      posts.push(post);
      if (posts.length >= MAX_POSTS) break;
    }

    url = posts.length >= MAX_POSTS ? null : data.paging?.next || null;
  }

  return posts;
}

loadEnvFile();

const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const userId = process.env.INSTAGRAM_USER_ID || "me";
const stellaWidgetId = process.env.STELLAFRAME_WIDGET_ID;
const existing = readExistingFeed();

async function writeFeedPayload(payload) {
  writeFeed({
    handle: payload.handle || HANDLE,
    profileUrl: payload.profileUrl || PROFILE_URL,
    updatedAt: new Date().toISOString(),
    posts: payload.posts || [],
  });
  console.log(
    `Instagram: נשמרו ${payload.posts?.length || 0} פוסטים ל-public/instagram-feed.json`,
  );
}

if (stellaWidgetId) {
  try {
    const payload = await fetchStellaFrameFeed(stellaWidgetId);
    await writeFeedPayload(payload);
    process.exit(0);
  } catch (error) {
    console.error(`Instagram (StellaFrame): ${error.message}`);
  }
}

if (!token) {
  console.warn(
    "Instagram: אין INSTAGRAM_ACCESS_TOKEN / STELLAFRAME_WIDGET_ID — משאיר feed קיים (או ריק).",
  );
  if (!existing) {
    writeFeed({
      handle: HANDLE,
      profileUrl: PROFILE_URL,
      updatedAt: null,
      posts: [],
    });
  }
  process.exit(0);
}

try {
  const posts = await fetchInstagramMedia(token, userId);
  await writeFeedPayload({ handle: HANDLE, profileUrl: PROFILE_URL, posts });
} catch (error) {
  console.error(`Instagram: ${error.message}`);
  if (existing?.posts?.length) {
    console.warn("Instagram: נשאר עם הנתונים הקודמים.");
    process.exit(0);
  }
  process.exit(1);
}
