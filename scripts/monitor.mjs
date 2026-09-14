import { sendTelegramMessage } from "./telegram.mjs";

const TARGET_URL = "https://appmethode.com/";
const EXPECTED_BODY = "-";
const TIMEOUT_MS = 10_000;
const PREVIEW_LIMIT = 200;

function formatUtc(date) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(date);
}

function previewBody(body) {
  return body.slice(0, PREVIEW_LIMIT);
}

function getErrorMessage(error) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Request timed out after 10 seconds";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Fetch error";
}

async function checkTarget() {
  const controller = new AbortController();
  const startedAt = performance.now();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(TARGET_URL, {
      redirect: "follow",
      signal: controller.signal
    });
    const body = await response.text();
    const responseTimeMs = Math.round(performance.now() - startedAt);
    const healthy = response.status === 200 && body.trim() === EXPECTED_BODY;

    return {
      healthy,
      httpStatus: response.status,
      responseTimeMs,
      checkedAt: new Date(),
      bodyPreview: previewBody(body)
    };
  } catch (error) {
    return {
      healthy: false,
      httpStatus: null,
      responseTimeMs: Math.min(Math.round(performance.now() - startedAt), TIMEOUT_MS),
      checkedAt: new Date(),
      bodyPreview: "",
      error: getErrorMessage(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildAlertMessage(result) {
  const receivedBody = result.bodyPreview
    ? `Body: "${result.bodyPreview}"`
    : "Body: \"\"";

  const received = result.error
    ? `Error:\n${result.error}`
    : `HTTP: ${result.httpStatus}\n${receivedBody}`;

  return [
    "🚨 APPMETHODE ALERT",
    "",
    "🔴 Website funktioniert nicht korrekt",
    "",
    "URL:",
    TARGET_URL,
    "",
    "Expected:",
    "HTTP 200",
    'Body "-"',
    "",
    "Received:",
    received,
    "",
    "Response time:",
    `${result.responseTimeMs} ms`,
    "",
    "Checked:",
    `${formatUtc(result.checkedAt)} UTC`
  ].join("\n");
}

async function sendForceAlertTest() {
  await sendTelegramMessage(
    "🧪 AppMethode Monitor\nTelegram Benachrichtigungen funktionieren."
  );
  console.log("Manuelle Telegram Testnachricht erfolgreich gesendet.");
}

if (process.env.FORCE_ALERT === "true") {
  try {
    await sendForceAlertTest();
    process.exit(0);
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Manuelle Telegram Testnachricht fehlgeschlagen."
    );
    process.exit(1);
  }
}

const result = await checkTarget();

if (result.healthy) {
  console.log("✅ appmethode.com ONLINE");
  console.log(`HTTP: ${result.httpStatus}`);
  console.log(`Body: "${result.bodyPreview}"`);
  console.log(`Response time: ${result.responseTimeMs}ms`);
  process.exit(0);
}

console.error("🔴 appmethode.com DOWN oder unerwartete Antwort");
console.error(`HTTP: ${result.httpStatus ?? "nicht verfuegbar"}`);
if (result.error) {
  console.error(`Error: ${result.error}`);
} else {
  console.error(`Body: "${result.bodyPreview}"`);
}
console.error(`Response time: ${result.responseTimeMs}ms`);

try {
  await sendTelegramMessage(buildAlertMessage(result));
  console.error("Telegram Alert erfolgreich gesendet.");
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Telegram Alert fehlgeschlagen."
  );
}

process.exit(1);
