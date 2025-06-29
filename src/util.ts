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
// format to dd/MM/yyyy hh:mm:ss
export const formatDate = (
  date?: Date | number | string
): string | undefined => {
  if (!date) {
    return undefined;
  }

  const d = new Date(date);

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// format to hh:mm:ss
export const formatTime = (
  date?: Date | number | string
): string | undefined => {
  if (!date) {
    return undefined;
  }

  const d = new Date(date);

  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};
