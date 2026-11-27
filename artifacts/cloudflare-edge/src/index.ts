/**
 * Cloudflare edge for ABC Bank. Static assets serve the SPA; only `/api/*`
 * reaches this Worker, which implements the same API as artifacts/api-server
 * (Express, used for local/Replit dev) using the shared PDF module.
 */
import {
  buildStatementPdf,
  MAX_PAYLOAD_LENGTH,
  parseStatementPayload,
  statementFileName,
} from "../../api-server/src/lib/statement-pdf";

const json = (body: unknown, status = 200) => Response.json(body, { status });

/** The app posts a classic form (urlencoded `payload` field); JSON is accepted too, like Express. */
async function readPayloadField(request: Request): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_PAYLOAD_LENGTH * 4) return undefined;
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await request.json()) as { payload?: unknown } | null;
    return body?.payload;
  }
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    return (await request.formData()).get("payload") ?? undefined;
  }
  return undefined;
}

async function statementPdf(request: Request): Promise<Response> {
  try {
    const payload = parseStatementPayload(await readPayloadField(request));
    if (!payload) return json({ error: "Invalid statement data" }, 400);
    const pdf = buildStatementPdf(payload);
    return new Response(pdf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${statementFileName(payload)}"`,
        "content-length": String(pdf.byteLength),
      },
    });
  } catch (error) {
    console.error("Failed to generate statement PDF", error);
    return json({ error: "Could not generate statement PDF" }, 400);
  }
}

export default {
  async fetch(request): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/healthz" && request.method === "GET") return json({ status: "ok" });
    if (pathname === "/api/statements/pdf" && request.method === "POST") return statementPdf(request);
    return json({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler;
