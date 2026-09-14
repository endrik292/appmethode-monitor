const TELEGRAM_API_BASE = "https://api.telegram.org";

export function requireTelegramEnv() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error(
      "Telegram secrets fehlen. Bitte TELEGRAM_BOT_TOKEN und TELEGRAM_CHAT_ID setzen."
    );
  }

  return { token, chatId };
}

export async function sendTelegramMessage(text) {
  const { token, chatId } = requireTelegramEnv();
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  if (!response.ok) {
    let reason = `HTTP ${response.status}`;

    try {
      const data = await response.json();
      if (typeof data.description === "string") {
        reason = `${reason}: ${data.description}`;
      }
    } catch {
      // Keep the generic HTTP error when Telegram does not return JSON.
    }

    throw new Error(`Telegram API Fehler: ${reason}`);
  }
}
