const TARGET_URL = "https://appmethode.com/";
const EXPECTED_BODY = "-";
const TIMEOUT_MS = 10_000;
const PREVIEW_LIMIT = 200;

type CheckResponse = {
  healthy: boolean;
  httpStatus: number | null;
  responseTimeMs: number;
  checkedAt: string;
  expectedBody: string;
  bodyPreview?: string;
  error?: string;
};

export const dynamic = "force-dynamic";

function previewBody(body: string) {
  return body.slice(0, PREVIEW_LIMIT);
}

function getErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Timeout";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Fetch error";
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(TARGET_URL, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });
    const body = await response.text();
    const responseTimeMs = Math.round(performance.now() - startedAt);
    const bodyPreview = previewBody(body);
    const healthy = response.status === 200 && body.trim() === EXPECTED_BODY;

    const payload: CheckResponse = {
      healthy,
      httpStatus: response.status,
      responseTimeMs,
      checkedAt,
      expectedBody: EXPECTED_BODY,
      bodyPreview
    };

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const responseTimeMs = Math.min(
      Math.round(performance.now() - startedAt),
      TIMEOUT_MS
    );

    const payload: CheckResponse = {
      healthy: false,
      httpStatus: null,
      responseTimeMs,
      checkedAt,
      expectedBody: EXPECTED_BODY,
      error: getErrorMessage(error)
    };

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}
