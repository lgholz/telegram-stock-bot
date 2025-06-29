import prismaPkg from "@prisma/client";
import yahooFinance from "yahoo-finance2";
import { sendTelegramMessage } from "./util.ts";

type Alarm = prismaPkg.alarm;
const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

let isRunning = false; // avoid concurrent executions

export const startAlarmsCheck = async () => {
  yahooFinance.suppressNotices(["yahooSurvey"]);
  yahooFinance.setGlobalConfig({
    logger: {
      info: () => {},
      warn: () => {},
      debug: () => {},
      error: (...args: any[]) => {
        console.error(...args);
      },
    }, // disable all logs except errors
  });

  runCheckAlarms(); // run immediately on startup
  setInterval(runCheckAlarms, 60 * 1000); // check time to time
};

const runCheckAlarms = async () => {
  try {
    if (isRunning) {
      return;
    }

    isRunning = true;
    await checkAlarms();
    console.log("Alarms checked successfully");
  } catch (err) {
    console.error("Error checking alarms:", err);
  }

  isRunning = false;
};

async function checkAlarms() {
  console.log();

  const alarms = await prisma.alarm.findMany();
  const prices = await getPrices(alarms);

  console.log(`Obtained prices: ${JSON.stringify(prices)}`);

  for (const alarm of alarms) {
    await checkAlarm(alarm, prices);
  }
}

async function getPrices(alarms: { ticker: string }[]) {
  if (alarms.length === 0) {
    return {};
  }

  const tickers = alarms.map((alarm) => alarm.ticker + ".SA"); // append .SA for B3  brazilian stocks
  const quotes = await yahooFinance.quote(tickers);

  const prices: Record<string, number> = {};
  for (const quote of quotes) {
    if (quote.regularMarketPrice) {
      const ticker = quote.symbol.replace(".SA", "");
      prices[ticker] = quote.regularMarketPrice;
    }
  }

  return prices;
}

async function checkAlarm(alarm: Alarm, prices: Record<string, number>) {
  const currentPrice = prices[alarm.ticker];

  if (!currentPrice) {
    console.warn(`No price found for ticker ${alarm.ticker}`);
    return;
  }

  if (
    (alarm.direction === "UP" && currentPrice >= alarm.target) ||
    (alarm.direction === "DOWN" && currentPrice <= alarm.target)
  ) {
    await sendTelegramMessage(
      alarm.chatId,
      `🚨 Alarm trigger for ${alarm.ticker}!
       Current price: R$ ${currentPrice.toFixed(2)} |
       Direction: ${alarm.direction} | Target: R$ ${alarm.target.toFixed(2)}`
    );

    // remove the alarm after triggering
    // await prisma.alarm.delete({ where: { id: alarm.id } });
  }
}
