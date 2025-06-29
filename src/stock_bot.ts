import { PrismaClient } from "@prisma/client";
import TelegramBot from "node-telegram-bot-api";
import yahooFinance from "yahoo-finance2";

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

    this.prisma = new PrismaClient();

    this.bot = new TelegramBot(TELEGRAM_TOKEN, { webHook: { port: PORT } });
    this.bot.setWebHook(`${process.env.WEBHOOK_URL}/bot`);
  }

  async init() {
    await this.bot.setMyCommands([
      { command: "alert", description: "Set a new stock price alert" },
      { command: "list", description: "List all alerts" },
      { command: "remove", description: "Remove an existing alert" },
      { command: "removeall", description: "Remove all alerts" },
    ]);

    this.onCmdAlert();
    this.onCmdList();
  }

  processUpdate(update: TelegramBot.Update) {
    this.bot.processUpdate(update);
  }

  private onCmdAlert = async () => {
    this.bot.onText(/^\/alert(?:\s+(.*))?$/, async (msg, match) => {
      const chatId = String(msg.chat.id);
      const params = match?.[1]?.toUpperCase().trim();

      if (!params) {
        await this.bot.sendMessage(
          chatId,
          "Creates an alert for a stock price.\nUsage: /alert TICKER DIRECTION TARGET\nExample: /alert petr4 UP 30.00"
        );

        return;
      }

      try {
        const ticker = params?.split(" ")[0].toUpperCase();
        const direction = params?.split(" ")[1]?.toUpperCase();
        const target = parseFloat(
          params?.split(" ")[2]?.replace(",", ".") ?? "0"
        );

        // check if is a valid ticker
        const quote = await yahooFinance.quote(ticker + ".SA");
        if (!quote || !quote.regularMarketPrice) {
          await this.bot.sendMessage(
            chatId,
            `Ticker ${ticker} not found. Please check the ticker symbol and try again.`
          );
          return;
        }

        // validate direction
        if (direction !== "UP" && direction !== "DOWN") {
          await this.bot.sendMessage(
            chatId,
            `Invalid direction. Use UP or DOWN.`
          );
          return;
        }

        // validate target
        if (isNaN(target) || target <= 0) {
          await this.bot.sendMessage(
            chatId,
            `Invalid target price. Please provide a valid number greater than 0.`
          );
          return;
        }

        // check if the ticker exists in the database
        const existingAlarm = await this.prisma.alarm.findFirst({
          where: { chatId, ticker },
        });

        if (!existingAlarm) {
          // create a new alarm
          await this.prisma.alarm.create({
            data: {
              chatId,
              ticker,
              direction,
              target,
            },
          });

          await this.bot.sendMessage(
            chatId,
            `Alert set for ${ticker}. You will be notified when the price changes.`
          );
        } else {
          // update the existing alarm
          await this.prisma.alarm.update({
            where: { id: existingAlarm.id },
            data: { direction, target },
          });

          await this.bot.sendMessage(
            chatId,
            `Alert updated for ${ticker}. You will be notified when the price changes.`
          );
        }
      } catch (error) {
        console.error("Error setting alert:", error);
        await this.bot.sendMessage(
          chatId,
          "An error occurred while setting the alert."
        );
      }
    });
  };
}
