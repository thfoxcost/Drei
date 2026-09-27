import path from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const CLIENT_DIR = path.resolve(import.meta.dir, "dist/client");

const serverModule = await import("./dist/server/server.js");
const handler = serverModule.default?.fetch ?? serverModule.fetch;
if (typeof handler !== "function") {
  console.error("[FAIL] Could not find fetch handler in ./dist/server/server.js");
  process.exit(1);
}

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    // Serve static files directly; directories (e.g. "/") fall through
    // to the SSR handler so pages still render server-side.
    if (!url.pathname.endsWith("/")) {
      const filePath = path.join(CLIENT_DIR, decodeURIComponent(url.pathname));
      if (filePath.startsWith(CLIENT_DIR + path.sep)) {
        const file = Bun.file(filePath);
        if (await file.exists()) return new Response(file);
      }
    }
    return handler(req);
  },
});

console.log(`[OK] Client listening on :${PORT}`);
