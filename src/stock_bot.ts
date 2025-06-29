import { PrismaClient } from "@prisma/client";
import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = (Number(process.env.PORT) ?? 3000) + 1; // +1 to avoid conflict with the webhook port

export class StockBot {
  private bot: TelegramBot;
  private prisma: PrismaClient;

  constructor() {
    if (!TELEGRAM_TOKEN) {
      throw new Error(
        "TELEGRAM_BOT_TOKEN is not defined in the environment variables."
      );
    }

    this.bot = new TelegramBot(TELEGRAM_TOKEN, { webHook: { port: PORT } });
    this.prisma = new PrismaClient();

    this.bot.setWebHook(`${process.env.WEBHOOK_URL}/bot`);
  }

  processUpdate(update: TelegramBot.Update) {
    this.bot.processUpdate(update);
  }
}
