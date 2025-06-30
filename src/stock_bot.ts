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
      { command: "start", description: "See the welcome message" },
      { command: "alert", description: "Set a new stock price alert" },
      { command: "list", description: "List all alerts" },
      { command: "remove", description: "Remove an existing alert" },
      { command: "removeall", description: "Remove all alerts" },
    ]);

    this.onCmdStart();
    this.onCmdAlert();
    this.onCmdList();
    this.onCmdRemove();
    this.onCmdRemoveAll();
  }

  processUpdate(update: TelegramBot.Update) {
    this.bot.processUpdate(update);
  }

  private onCmdStart = async () => {
    this.bot.onText(/^\/start$/, async (msg) => {
      const chatId = String(msg.chat.id);

      const message = `
      👋 Welcome to Stock Alert Bot!

Get notified when your favorite stocks hit specific price targets on the B3 (Brasil Bolsa Balcão).

📌 Here's what you can do:
• /alert – Set a new price alert  
• /list – View your active alerts  
• /remove – Remove a specific alert
• /removeall – Remove all alerts

⚡️ Example:  
/alert PETR4 above 37.50

You’ll receive a notification when the condition is met.

Ready to set your first alert? 🚀
`;

      await this.bot.sendMessage(chatId, message);
    });
  };

  private onCmdAlert = async () => {
    this.bot.onText(/^\/alert(?:\s+(.*))?$/, async (msg, match) => {
      const chatId = String(msg.chat.id);
      const params = match?.[1]?.toUpperCase().trim();

      if (!params) {
        await this.bot.sendMessage(
          chatId,
          "🚨 Creates an alert for a stock price.\n\nUsage:\n\t\t/alert TICKER CONDITION TARGET\n\nExamples:\n\t\t/alert PETR4 above 37.50\n\t\t/alert BBAS3 below 30"
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
        if (direction !== "ABOVE" && direction !== "BELOW") {
          await this.bot.sendMessage(
            chatId,
            `Invalid direction. Use ABOVE or BELOW.`
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
            `Alert set for ${ticker} ${
              direction === "ABOVE" ? `📈` : `📉`
            }. You will be notified when the price changes.`
          );
        } else {
          // update the existing alarm
          await this.prisma.alarm.update({
            where: { id: existingAlarm.id },
            data: { direction, target, createdAt: new Date() },
          });

          await this.bot.sendMessage(
            chatId,
            `Alert updated for ${ticker} ${
              direction === "ABOVE" ? `📈` : `📉`
            }. You will be notified when the price changes.`
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

  private onCmdList = async () => {
    this.bot.onText(/^\/list$/, async (msg) => {
      const chatId = String(msg.chat.id);
      const alarms = await this.prisma.alarm.findMany({
        where: { chatId },
      });

      if (alarms.length === 0) {
        await this.bot.sendMessage(chatId, "You have no active alerts.");
        return;
      }

      const response = alarms
        .sort((a, b) => a.ticker.localeCompare(b.ticker))
        .map(
          (alarm) =>
            `🔔 ${alarm.ticker} - ${alarm.direction} R$ ${alarm.target.toFixed(
              2
            )}`
        )
        .join("\n");

      await this.bot.sendMessage(chatId, `Your alerts:\n${response}`);
    });
  };

  private onCmdRemove = async () => {
    this.bot.onText(/^\/remove(?:\s+(.*))?$/, async (msg, match) => {
      const chatId = String(msg.chat.id);
      const ticker = match?.[1]?.toUpperCase().trim();
      if (!ticker) {
        await this.bot.sendMessage(
          chatId,
          `🧹 Remove an existing alert.\n\nUsage:\n\t\t/remove TICKER\n\nExample:\n\t\t/remove PETR4`
        );
        return;
      }

      const result = await this.prisma.alarm.deleteMany({
        where: { chatId, ticker },
      });

      if (result.count > 0) {
        await this.bot.sendMessage(
          chatId,
          `Alert for ${ticker} has been removed.`
        );
      } else {
        await this.bot.sendMessage(
          chatId,
          `No alert found for ticker ${ticker}.`
        );
      }
    });
  };

  private onCmdRemoveAll = async () => {
    this.bot.onText(/^\/removeall$/, async (msg) => {
      const chatId = String(msg.chat.id);
      await this.prisma.alarm.deleteMany({
        where: { chatId },
      });

      await this.bot.sendMessage(chatId, "All alerts have been removed.");
    });
  };
}
