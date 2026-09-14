import { sendTelegramMessage } from "./telegram.mjs";

try {
  await sendTelegramMessage("✅ AppMethode Monitor Telegram Test erfolgreich");
  console.log("Telegram Test erfolgreich gesendet.");
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Telegram Test fehlgeschlagen."
  );
  process.exit(1);
}
