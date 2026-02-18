import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";

export async function registerRoutes(app: Express): Promise<Server> {
  app.all("/api/subsonic/:endpoint", async (req: Request, res: Response) => {
    try {
      const subPath = req.params.endpoint;
      const serverUrl = req.query.serverUrl as string;

      if (!serverUrl) {
        return res.status(400).json({ error: "Missing serverUrl parameter" });
      }

      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(req.query)) {
        if (key !== "serverUrl" && typeof value === "string") {
          queryParams.set(key, value);
        }
      }

      const targetUrl = `${serverUrl}/rest/${subPath}?${queryParams.toString()}`;

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          "Accept": "application/json",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("image") || contentType.includes("audio") || contentType.includes("octet-stream")) {
        res.setHeader("Content-Type", contentType);
        const buffer = Buffer.from(await response.arrayBuffer());
        return res.send(buffer);
      }

      const data = await response.text();
      res.setHeader("Content-Type", contentType || "application/json");
      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("Subsonic proxy error:", error?.message);
      res.status(502).json({ error: "Failed to connect to Subsonic server" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
