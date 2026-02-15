import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import type { Env } from "./types";
import { submitRoute } from "./routes/submit";
import { pagesRoute } from "./routes/pages";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", secureHeaders());

// Web pages
app.route("/", pagesRoute);

// API routes
app.route("/api", submitRoute);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // For static assets (CSS, JS, images), serve from ASSETS first
    const url = new URL(request.url);
    const staticExtensions = [
      ".css",
      ".js",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".webp",
      ".ico",
    ];

    if (staticExtensions.some((ext) => url.pathname.endsWith(ext))) {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      } catch (error) {
        console.error("Assets fetch error:", error);
      }
    }

    // Otherwise, handle with Hono app
    return app.fetch(request, env, ctx);
  },
};
