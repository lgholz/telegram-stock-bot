import prismaPkg from "@prisma/client";
import yahooFinance from "yahoo-finance2";
import { formatDate, formatTime, sendTelegramMessage } from "./util.ts";

type Alarm = prismaPkg.alarm;
const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

let isRunning = false; // avoid concurrent executions

type Quote = {
  price: number;
  timestamp?: Date;
  high?: number;
  low?: number;
};

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

  const prices: Record<string, Quote> = {};
  for (const quote of quotes) {
    if (quote.regularMarketPrice) {
      const ticker = quote.symbol.replace(".SA", "");
      prices[ticker] = {
        price: quote.regularMarketPrice,
        timestamp: quote.regularMarketTime,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
      };
    }
  }

  return prices;
}

async function checkAlarm(alarm: Alarm, prices: Record<string, Quote>) {
  const quote = prices[alarm.ticker];

  if (!quote) {
    console.warn(`No price found for ticker ${alarm.ticker}`);
    return;
  }

  if (
    (alarm.direction === "ABOVE" && quote.price >= alarm.target) ||
    (alarm.direction === "BELOW" && quote.price <= alarm.target)
  ) {
    const message = `
🚨 Price Alert Triggered!

Ticker: ${alarm.ticker} R$ ${quote.price.toFixed(2)}
Condition: ${
      alarm.direction === "ABOVE" ? "Above" : "Below"
    } R$ ${alarm.target.toFixed(2)}
`;

    await sendTelegramMessage(alarm.chatId, message);

    // remove the alarm after triggering
    // await prisma.alarm.delete({ where: { id: alarm.id } });
  }
}
