# Stock Alert Bot

A simple Telegram bot that monitors stock prices (B3/Bovespa supported) and sends real-time alerts when user-defined price thresholds are crossed. Ideal for traders or investors who want customizable notifications without checking charts all day.

- Set alerts via Telegram commands
- Supports "above" / "below" price triggers
- Built with Node.js, TypeScript, Prisma, PostgreSQL
- Uses Yahoo Finance (non-official API)
- Sends instant alerts through Telegram

## Example

/alarm PETR4 above 37.50

The bot will notify you if PETR4 crosses R$37.50.

## Tech Stack

- Node.js
- TypeScript
- Prisma
- PostgreSQL
- Yahoo Finance (unofficial)
- node-telegram-bot-api

## Todo

- [ ] Alert history
- [ ] Web UI (optional)

# How can be improved in case it have milions of alerts to manage

todo
