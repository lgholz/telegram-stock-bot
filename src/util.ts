import axios from "axios";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function sendTelegramMessage(chat_id: string, message: string) {
  if (!TELEGRAM_TOKEN || !chat_id) return;

  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      chat_id: chat_id,
      text: message,
    }
  );
}
