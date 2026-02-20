import type { Express, Request } from "express";
import { createServer, type Server } from "node:http";

function normalizeServerUrl(url: string): string {
  return url.trim().replace(/\/+$/, "").replace(/\/rest$/i, "");
}

function appendForwardedQueryParams(searchParams: URLSearchParams, query: Request["query"]) {
  for (const [key, value] of Object.entries(query)) {
    if (key === "serverUrl" || value == null) continue;

    if (typeof value === "string") {
      searchParams.append(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          searchParams.append(key, item);
        }
      }
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.all("/api/subsonic/:endpoint", async (req, res) => {
    try {
      const endpoint = req.params.endpoint;
      const serverUrlQuery = req.query.serverUrl;
      const serverUrl = Array.isArray(serverUrlQuery) ? serverUrlQuery[0] : serverUrlQuery;

      if (typeof serverUrl !== "string" || !serverUrl.trim()) {
        return res.status(400).json({ error: "Missing serverUrl parameter" });
      }

      const searchParams = new URLSearchParams();
      appendForwardedQueryParams(searchParams, req.query);

      const targetUrl = `${normalizeServerUrl(serverUrl)}/rest/${endpoint}?${searchParams.toString()}`;
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          Accept: req.headers.accept ?? "*/*",
        },
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      if (
        contentType.includes("image") ||
        contentType.includes("audio") ||
        contentType.includes("octet-stream")
      ) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return res.status(response.status).send(buffer);
      }

      const text = await response.text();
      return res.status(response.status).send(text);
    } catch (error: any) {
      console.error("Subsonic proxy error:", error?.message);
      return res.status(502).json({ error: "Failed to connect to Subsonic server" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
