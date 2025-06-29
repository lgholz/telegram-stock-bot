import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import express from "express";
import { startAlarmsCheck } from "./alarms.ts";
import { StockBot } from "./stock_bot.ts";

const prisma = new PrismaClient();

async function main() {
  const port = Number(process.env.PORT) || 3000;
  const bot = new StockBot();
  await bot.init();

  const app = express();
  app.use(express.json());

  app.post(`/bot`, (req, res) => {
    console.log(`Received update: ${JSON.stringify(req.body)}`);

    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  app.get("/", (req, res) => {
    res.send("Bot is running via webhook!");
  });

  app.listen(port, () => {
    console.log(`🚀 Express server listening on port ${port}`);

    startAlarmsCheck();
  });
}

main().catch(console.error);
